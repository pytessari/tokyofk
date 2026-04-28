import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CardGrid, type CardRow } from "@/components/CardGrid";
import { ThornHeart, StarSpike } from "@/components/Sticker";

export const Route = createFileRoute("/album")({
  head: () => ({ meta: [{ title: "TOKYO · Meu Álbum" }] }),
  component: AlbumPage,
});

function AlbumPage() {
  const { user, loading } = useAuth();
  const [collected, setCollected] = useState<CardRow[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ count }, ownedRes] = await Promise.all([
        supabase.from("cards").select("*", { count: "exact", head: true }),
        user ? supabase
          .from("user_cards")
          .select("card:cards(*)")
          .eq("user_id", user.id) : Promise.resolve({ data: [] as Array<{ card: CardRow }> }),
      ]);
      setTotal(count ?? 0);
      const rows = ((ownedRes.data ?? []) as Array<{ card: CardRow | null }>)
        .map((r) => r.card)
        .filter((c): c is CardRow => !!c);
      setCollected(rows);
      setFetching(false);
    })();
  }, [user]);

  if (loading || fetching) {
    return <div className="px-5 py-20 text-center font-display tracking-widest text-white/60">CARREGANDO…</div>;
  }

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

      {!user ? (
        <div className="glass-dark rounded-xl p-10 text-center">
          <ThornHeart className="mx-auto h-10 w-10" />
          <p className="mt-3 text-white/80">Entre para ver suas cartas coletadas.</p>
          <Link to="/login" className="mt-4 inline-block rounded-md bg-ruby-gradient px-5 py-2 font-display text-xs tracking-widest text-white">ENTRAR</Link>
        </div>
      ) : (
        <CardGrid cards={collected} empty="Você ainda não coletou nenhuma carta. Participe dos drops no Discord." />
      )}
    </div>
  );
}
