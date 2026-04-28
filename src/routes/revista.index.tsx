import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ThornHeart, StarSpike } from "@/components/Sticker";
import { IMAGES, img } from "@/lib/images";

export const Route = createFileRoute("/revista/")({
  head: () => ({
    meta: [
      { title: "TOKYO · A Revista" },
      { name: "description", content: "Todas as edições da revista TOKYO em formato flip." },
    ],
  }),
  component: MagazineList,
});

type Magazine = {
  id: string;
  title: string;
  subtitle: string | null;
  cover_url: string | null;
  issue_number: number | null;
  published: boolean;
};

function MagazineList() {
  const [items, setItems] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("magazines")
        .select("id, title, subtitle, cover_url, issue_number, published")
        .eq("published", true)
        .order("issue_number", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      setItems((data ?? []) as Magazine[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">A BANCA · EDIÇÕES</p>
          <h1 className="mt-1 font-display text-5xl text-ruby-gradient sm:text-6xl">A REVISTA</h1>
        </div>
        <StarSpike className="hidden h-12 w-12 sticker-star sm:block" />
      </div>

      {loading ? (
        <p className="text-white/60">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="glass-dark rounded-xl p-10 text-center text-white/70">
          Nenhuma edição publicada ainda. Volte em breve.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {items.map((m) => (
            <Link key={m.id} to="/revista/$id" params={{ id: m.id }} className="group block">
              <div className="chrome-frame transition group-hover:rotate-0 -rotate-1">
                <div className="relative overflow-hidden">
                  <img src={img(m.cover_url ?? "", IMAGES.fallback.banner)} alt={m.title}
                    className="aspect-[3/4] w-full object-cover transition group-hover:scale-105" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    {m.issue_number != null && (
                      <p className="font-display text-[10px] tracking-widest text-[color:var(--ruby)]">
                        EDIÇÃO #{String(m.issue_number).padStart(2, "0")}
                      </p>
                    )}
                    <p className="font-display text-sm tracking-widest text-white">{m.title.toUpperCase()}</p>
                  </div>
                </div>
              </div>
              {m.subtitle && <p className="mt-2 text-center text-xs text-white/50">{m.subtitle}</p>}
            </Link>
          ))}
        </div>
      )}
      <ThornHeart className="mx-auto mt-16 h-10 w-10 opacity-70" />
    </div>
  );
}
