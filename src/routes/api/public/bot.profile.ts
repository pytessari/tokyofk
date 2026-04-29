import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { timingSafeEqual } from "crypto";

function checkSecret(req: Request) {
  const got = req.headers.get("x-bot-secret") || "";
  const want = process.env.BOT_SHARED_SECRET || "";
  if (!want || got.length !== want.length) return false;
  try { return timingSafeEqual(Buffer.from(got), Buffer.from(want)); } catch { return false; }
}

// GET /api/public/bot/profile?discord_id=123456789
export const Route = createFileRoute("/api/public/bot/profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!checkSecret(request)) return new Response("unauthorized", { status: 401 });
        const url = new URL(request.url);
        const discordId = (url.searchParams.get("discord_id") || "").trim();
        if (!discordId) return new Response("missing discord_id", { status: 400 });

        const { data: link } = await supabaseAdmin
          .from("discord_links")
          .select("user_id, verified_at")
          .eq("discord_id", discordId)
          .not("verified_at", "is", null)
          .maybeSingle();
        if (!link) return Response.json({ ok: false, error: "not_linked" }, { status: 404 });

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, display_name, slug, role, sign, avatar_url")
          .eq("id", link.user_id)
          .maybeSingle();

        return Response.json({ ok: true, profile });
      },
    },
  },
});
