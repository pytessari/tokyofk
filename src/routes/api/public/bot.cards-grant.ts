import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { timingSafeEqual } from "crypto";

function checkSecret(req: Request) {
  const got = req.headers.get("x-bot-secret") || "";
  const want = process.env.BOT_SHARED_SECRET || "";
  if (!want || got.length !== want.length) return false;
  try { return timingSafeEqual(Buffer.from(got), Buffer.from(want)); } catch { return false; }
}

type GrantLog = {
  status: string;
  discord_id?: string | null;
  character_key?: string | null;
  card_number?: string | null;
  qty?: number | null;
  user_id?: string | null;
  card_id?: string | null;
  error?: string | null;
  ip?: string | null;
};

async function logGrant(entry: GrantLog) {
  try {
    await supabaseAdmin.from("card_grant_logs").insert(entry);
  } catch (e) {
    // Não derrubar a request se o log falhar
    console.error("[cards-grant] log insert failed", e);
  }
}

// POST /api/public/bot/cards-grant
// body: { discord_id, character_key, card_number, qty? }
export const Route = createFileRoute("/api/public/bot/cards-grant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          null;

        if (!checkSecret(request)) {
          await logGrant({ status: "unauthorized", ip, error: "invalid secret" });
          return new Response("unauthorized", { status: 401 });
        }

        let body: { discord_id?: string; character_key?: string; card_number?: string; qty?: number };
        try {
          body = await request.json();
        } catch {
          await logGrant({ status: "bad_json", ip, error: "JSON parse failed" });
          return new Response("bad json", { status: 400 });
        }

        const discordId = (body.discord_id || "").trim();
        const characterKey = (body.character_key || "").trim().toLowerCase();
        const cardNumber = (body.card_number || "").trim();
        const qty = Math.max(1, Math.min(50, Number(body.qty) || 1));

        const baseLog: GrantLog = {
          status: "ok",
          discord_id: discordId || null,
          character_key: characterKey || null,
          card_number: cardNumber || null,
          qty,
          ip,
        };

        if (!discordId || !characterKey || !cardNumber) {
          await logGrant({ ...baseLog, status: "missing_fields", error: "discord_id/character_key/card_number required" });
          return new Response("missing fields", { status: 400 });
        }

        const { data: link } = await supabaseAdmin
          .from("discord_links").select("user_id")
          .eq("discord_id", discordId).not("verified_at", "is", null).maybeSingle();
        if (!link) {
          await logGrant({ ...baseLog, status: "not_linked", error: `discord_id ${discordId} sem vínculo verificado` });
          return Response.json({ ok: false, error: "not_linked" }, { status: 404 });
        }

        const { data: card } = await supabaseAdmin
          .from("cards").select("id")
          .eq("character_key", characterKey).eq("card_number", cardNumber).maybeSingle();
        if (!card) {
          await logGrant({ ...baseLog, status: "card_not_found", user_id: link.user_id, error: `${characterKey}/${cardNumber} não existe no catálogo` });
          return Response.json({ ok: false, error: "card_not_found" }, { status: 404 });
        }

        const { data: existing } = await supabaseAdmin
          .from("user_cards").select("id, quantity")
          .eq("user_id", link.user_id).eq("card_id", card.id).maybeSingle();

        let dbErr: string | null = null;
        if (existing) {
          const { error } = await supabaseAdmin.from("user_cards")
            .update({ quantity: existing.quantity + qty }).eq("id", existing.id);
          if (error) dbErr = error.message;
        } else {
          const { error } = await supabaseAdmin.from("user_cards")
            .insert({ user_id: link.user_id, card_id: card.id, quantity: qty });
          if (error) dbErr = error.message;
        }

        if (dbErr) {
          await logGrant({ ...baseLog, status: "db_error", user_id: link.user_id, card_id: card.id, error: dbErr });
          return Response.json({ ok: false, error: "db_error" }, { status: 500 });
        }

        await logGrant({ ...baseLog, status: "ok", user_id: link.user_id, card_id: card.id });
        return Response.json({ ok: true });
      },
    },
  },
});
