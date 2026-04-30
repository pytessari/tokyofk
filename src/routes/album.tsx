import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CardGrid, type CardRow } from "@/components/CardGrid";
import { StarSpike } from "@/components/Sticker";
import { LoggedOutGate } from "@/components/LoggedOutGate";

export const Route = createFileRoute("/album")({
  head: () => ({ meta: [{ title: "TOKYO · Meu Álbum" }] }),
  component: AlbumPage,
});

function AlbumPage() {
  const { user, loading } = useAuth();
  const [collected, setCollected] = useState<CardRow[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);

  const loadAlbum = useCallback(async (userId: string) => {
    setFetching(true);
    const [{ count }, ownedRes] = await Promise.all([
      supabase.from("cards").select("*", { count: "exact", head: true }),
      supabase
        .from("user_cards")
        .select("card:cards(*)")
        .eq("user_id", userId)
        .order("acquired_at", { ascending: false }),
    ]);
    setTotal(count ?? 0);
    const rows = ((ownedRes.data ?? []) as Array<{ card: CardRow | null }>)
      .map((r) => r.card)
      .filter((c): c is CardRow => !!c);
    setCollected(rows);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { setFetching(false); return; }
    void loadAlbum(user.id);
    const ch = supabase
      .channel(`album:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_cards", filter: `user_id=eq.${user.id}` },
        () => void loadAlbum(user.id),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, loading, loadAlbum]);

  if (loading || (user && fetching)) {
    return <div className="px-5 py-20 text-center font-display tracking-widest text-white/60">CARREGANDO…</div>;
  }
  if (!user) return <LoggedOutGate title="ÁLBUM PRIVADO" message="Entre pra ver suas cartas coletadas." />;

  const pct = total > 0 ? Math.round((collected.length / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">DASHBOARD PESSOAL</p>
          <h1 className="mt-1 font-display text-5xl text-ruby-gradient sm:text-6xl">MEU ÁLBUM</h1>
          <p className="mt-2 text-sm text-white/60">
            {collected.length} de {total} cartas · {pct}%
          </p>
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
