import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { timingSafeEqual } from "crypto";

function checkSecret(req: Request) {
  const got = req.headers.get("x-bot-secret") || "";
  const want = process.env.BOT_SHARED_SECRET || "";
  if (!want || got.length !== want.length) return false;
  try { return timingSafeEqual(Buffer.from(got), Buffer.from(want)); } catch { return false; }
}

export const Route = createFileRoute("/api/public/bot/discord-link")({
  server: {
    handlers: {
      // Bot calls this with { code, discord_id } to confirm a link initiated by the user on the site.
      POST: async ({ request }) => {
        if (!checkSecret(request)) return new Response("unauthorized", { status: 401 });
        let body: { code?: string; discord_id?: string };
        try { body = await request.json(); } catch { return new Response("bad json", { status: 400 }); }
        const code = (body.code || "").trim().toUpperCase();
        const discordId = (body.discord_id || "").trim();
        if (!code || !discordId) return new Response("missing fields", { status: 400 });

        const { data: link } = await supabaseAdmin
          .from("discord_links")
          .select("*")
          .eq("verify_code", code)
          .maybeSingle();
        if (!link) return Response.json({ ok: false, error: "code_not_found" }, { status: 404 });
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
          return Response.json({ ok: false, error: "code_expired" }, { status: 410 });
        }

        // bind
        await supabaseAdmin.from("discord_links").update({
          discord_id: discordId,
          verified_at: new Date().toISOString(),
          verify_code: null,
          expires_at: null,
        }).eq("id", link.id);

        // mirror onto profile
        await supabaseAdmin.from("profiles").update({ discord_id: discordId }).eq("id", link.user_id);

        const { data: profile } = await supabaseAdmin
          .from("profiles").select("display_name, slug").eq("id", link.user_id).maybeSingle();

        return Response.json({
          ok: true,
          user_id: link.user_id,
          display_name: profile?.display_name ?? null,
          slug: profile?.slug ?? null,
        });
      },
    },
  },
});
