import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { timingSafeEqual } from "crypto";

function checkSecret(req: Request) {
  const got = req.headers.get("x-bot-secret") || "";
  const want = process.env.BOT_SHARED_SECRET || "";
  if (!want || got.length !== want.length) return false;
  try { return timingSafeEqual(Buffer.from(got), Buffer.from(want)); } catch { return false; }
}

// POST /api/public/bot/cards-grant
// body: { discord_id, character_key, card_number, qty? }
export const Route = createFileRoute("/api/public/bot/cards-grant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!checkSecret(request)) return new Response("unauthorized", { status: 401 });
        let body: { discord_id?: string; character_key?: string; card_number?: string; qty?: number };
        try { body = await request.json(); } catch { return new Response("bad json", { status: 400 }); }

        const discordId = (body.discord_id || "").trim();
        const characterKey = (body.character_key || "").trim().toLowerCase();
        const cardNumber = (body.card_number || "").trim();
        const qty = Math.max(1, Math.min(50, Number(body.qty) || 1));
        if (!discordId || !characterKey || !cardNumber) return new Response("missing fields", { status: 400 });

        const { data: link } = await supabaseAdmin
          .from("discord_links").select("user_id")
          .eq("discord_id", discordId).not("verified_at", "is", null).maybeSingle();
        if (!link) return Response.json({ ok: false, error: "not_linked" }, { status: 404 });

        const { data: card } = await supabaseAdmin
          .from("cards").select("id")
          .eq("character_key", characterKey).eq("card_number", cardNumber).maybeSingle();
        if (!card) return Response.json({ ok: false, error: "card_not_found" }, { status: 404 });

        const { data: existing } = await supabaseAdmin
          .from("user_cards").select("id, quantity")
          .eq("user_id", link.user_id).eq("card_id", card.id).maybeSingle();

        if (existing) {
          await supabaseAdmin.from("user_cards")
            .update({ quantity: existing.quantity + qty }).eq("id", existing.id);
        } else {
          await supabaseAdmin.from("user_cards")
            .insert({ user_id: link.user_id, card_id: card.id, quantity: qty });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
