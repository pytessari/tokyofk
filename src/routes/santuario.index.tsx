import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IMAGES, img } from "@/lib/images";
import { ThornHeart } from "@/components/Sticker";

export const Route = createFileRoute("/santuario/")({
  head: () => ({
    meta: [
      { title: "TOKYO · O Santuário" },
      { name: "description", content: "Diretório dos membros da comunidade TOKYO." },
    ],
  }),
  component: SantuarioPage,
});

type Row = {
  id: string;
  display_name: string;
  slug: string | null;
  role: string | null;
  sign: string | null;
  avatar_url: string | null;
  banner_url: string | null;
};

function SantuarioPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, slug, role, sign, avatar_url, banner_url")
        .not("slug", "is", null)
        .order("display_name");
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">
            DIRETÓRIO · {rows.length} ALMAS
          </p>
          <h1 className="mt-1 font-display text-5xl text-ruby-gradient sm:text-6xl">O SANTUÁRIO</h1>
        </div>
        <ThornHeart className="hidden h-14 w-14 sm:block" />
      </div>

      {loading ? (
        <p className="text-white/60">Carregando…</p>
      ) : rows.length === 0 ? (
        <div className="glass-dark rounded-xl p-10 text-center text-white/70">
          Nenhum membro com perfil público ainda. <br />
          <Link to="/perfil" className="mt-3 inline-block font-display text-sm tracking-widest text-[color:var(--ruby)] underline">
            DEFINIR MEU SLUG →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {rows.map((m) => (
            <Link key={m.id} to="/santuario/$slug" params={{ slug: m.slug! }} className="group block">
              <div className="ruby-border rounded-2xl p-2 transition group-hover:shadow-[0_0_24px_#d9003680]">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
                  <img src={img(m.avatar_url ?? "", IMAGES.fallback.avatar)} alt={m.display_name}
                    className="h-full w-full object-cover" />
                </div>
                <div className="mt-2 px-1 pb-1">
                  <p className="font-display text-sm tracking-wider text-white group-hover:text-[color:var(--ruby)]">
                    {m.display_name.toUpperCase()}
                  </p>
                  <p className="text-[11px] tracking-widest text-white/50">
                    {m.role || "—"}{m.sign ? ` · ${m.sign}` : ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
