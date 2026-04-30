import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CardGrid, type CardRow } from "@/components/CardGrid";
import { StarSpike } from "@/components/Sticker";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { ReloadIcon } from "@radix-ui/react-icons";

export const Route = createFileRoute("/album")({
  head: () => ({ meta: [{ title: "TOKYO · Meu Álbum" }] }),
  component: AlbumPage,
});

function AlbumPage() {
  const { user, loading } = useAuth();
  const [collected, setCollected] = useState<CardRow[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const loadAlbum = useCallback(async (userId: string) => {
    // Evita corridas: se já há fetch em andamento, ignora.
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const [{ count }, ownedRes] = await Promise.all([
        supabase.from("cards").select("*", { count: "exact", head: true }),
        supabase
          .from("user_cards")
          .select("card:cards(*)")
          .eq("user_id", userId)
          .order("acquired_at", { ascending: false }),
      ]);
      if (!mountedRef.current) return;
      setTotal(count ?? 0);
      const rows = ((ownedRes.data ?? []) as Array<{ card: CardRow | null }>)
        .map((r) => r.card)
        .filter((c): c is CardRow => !!c);
      setCollected(rows);
      setSyncedAt(new Date());
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setFetching(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { setFetching(false); return; }
    const userId = user.id;
    setFetching(true);
    void loadAlbum(userId);

    // Realtime escopado ao próprio user_id — não interfere em outros usuários.
    const ch = supabase
      .channel(`album:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_cards", filter: `user_id=eq.${userId}` },
        () => void loadAlbum(userId),
      )
      .subscribe();

    // Resync ao voltar para a aba (cartas adquiridas via Discord enquanto fora).
    const onVisibility = () => {
      if (document.visibilityState === "visible") void loadAlbum(userId);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    // Resync periódico leve (60s) como rede de segurança.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadAlbum(userId);
    }, 60_000);

    return () => {
      supabase.removeChannel(ch);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      window.clearInterval(interval);
    };
  }, [user, loading, loadAlbum]);

  if (loading || (user && fetching && collected.length === 0)) {
    return <div className="px-5 py-20 text-center font-display tracking-widest text-white/60">CARREGANDO…</div>;
  }
  if (!user) return <LoggedOutGate title="ÁLBUM PRIVADO" message="Entre pra ver suas cartas coletadas." />;

  const pct = total > 0 ? Math.round((collected.length / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">DASHBOARD PESSOAL</p>
          <h1 className="mt-1 font-display text-5xl text-ruby-gradient sm:text-6xl">MEU ÁLBUM</h1>
          <p className="mt-2 text-sm text-white/60">
            {collected.length} de {total} cartas · {pct}%
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/40">
            <span>
              {syncedAt
                ? `Sincronizado ${syncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                : "Aguardando sincronização…"}
            </span>
            <button
              type="button"
              onClick={() => user && void loadAlbum(user.id)}
              className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-0.5 text-white/70 hover:border-white/30 hover:text-white disabled:opacity-50"
              disabled={fetching}
              aria-label="Atualizar álbum"
            >
              <ReloadIcon className={fetching ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>
        </div>
        <StarSpike className="hidden h-12 w-12 sticker-star sm:block" />
      </div>

      <div className="mb-8 glass-dark rounded-2xl p-5">
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full bg-ruby-gradient shadow-[0_0_20px_#d90036]" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <CardGrid cards={collected} empty="Você ainda não coletou nenhuma carta. Participe dos drops no Discord." />
    </div>
  );
}
