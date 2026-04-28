import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IMAGES, img } from "@/lib/images";
import cover from "@/assets/cover-s1.jpg";
import { ThornHeart, StarSpike } from "@/components/Sticker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TOKYO · Início" },
      { name: "description", content: "Portal da comunidade TOKYO — revistas, membros, cartas e mural." },
    ],
  }),
  component: HomePage,
});

type Mag = { id: string; title: string; subtitle: string | null; cover_url: string | null; issue_number: number | null };

function HomePage() {
  const [featured, setFeatured] = useState<Mag | null>(null);
  const [latest, setLatest] = useState<Mag[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("magazines")
        .select("id, title, subtitle, cover_url, issue_number")
        .eq("published", true)
        .order("issue_number", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(5);
      const list = (data ?? []) as Mag[];
      setFeatured(list[0] ?? null);
      setLatest(list);
    })();
  }, []);

  const coverUrl = img(featured?.cover_url ?? "", cover);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      {/* HERO */}
      <section className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl glass-dark p-6 sm:p-10">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[color:var(--ruby)] opacity-30 blur-3xl" />
          <StarSpike className="absolute right-6 top-6 h-8 w-8 sticker-star" />
          <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">
            {featured?.issue_number != null ? `EDIÇÃO #${String(featured.issue_number).padStart(2, "0")}` : "EDIÇÃO ESPECIAL"}
          </p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] text-white sm:text-7xl">
            <span className="text-ruby-gradient">{(featured?.title ?? "ESPINHOS").toUpperCase()}</span>
            {featured?.subtitle && <><br /><span className="text-white/90">{featured.subtitle.toUpperCase()}</span></>}
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/70">
            A comunidade TOKYO — revista, cartas, membros e mural. Abra a banca, folheie a última edição ou visite o santuário.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/revista" className="rounded-md bg-ruby-gradient px-5 py-3 font-display tracking-widest text-white shadow-[0_0_24px_#d9003680] transition hover:brightness-110">
              ABRIR A REVISTA
            </Link>
            <Link to="/santuario" className="rounded-md border border-[color:var(--ruby)] px-5 py-3 font-display tracking-widest text-white/90 transition hover:bg-[color:var(--ruby)]/15">
              CONHECER OS MEMBROS
            </Link>
          </div>

          {latest.length > 0 && (
            <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
              {latest.map((m, i) => (
                <Link key={m.id} to="/revista/$id" params={{ id: m.id }}
                  className={`relative h-24 w-20 shrink-0 overflow-hidden rounded-md border ${i === 0 ? "border-[color:var(--ruby)] shadow-[0_0_18px_#d90036aa]" : "border-white/10"}`}>
                  <img src={img(m.cover_url ?? "", cover)} alt={m.title} className="h-full w-full object-cover opacity-80" />
                  <span className="absolute bottom-1 left-1 font-display text-[10px] tracking-widest text-white">
                    #{String(m.issue_number ?? i + 1).padStart(2, "0")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Cover flip-style */}
        <div className="relative">
          {featured ? (
            <Link to="/revista/$id" params={{ id: featured.id }} className="group block">
              <div className="chrome-frame mx-auto w-fit -rotate-2 transition group-hover:rotate-0">
                <div className="relative">
                  <img src={coverUrl} alt={featured.title}
                    className="h-[520px] w-[390px] object-cover"
                    style={{ filter: "saturate(1.15) contrast(1.05)" }} />
                  <div className="pointer-events-none absolute inset-0"
                    style={{ background: "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.25) 50%, transparent 65%)" }} />
                </div>
              </div>
            </Link>
          ) : (
            <div className="chrome-frame mx-auto w-fit -rotate-2">
              <img src={cover} alt="Capa Temporada 1" className="h-[520px] w-[390px] object-cover" />
            </div>
          )}
          <ThornHeart className="absolute -right-2 -top-4 h-16 w-16 drop-shadow-[0_0_18px_#d90036]" />
          <p className="mt-3 text-center font-display text-xs tracking-[0.4em] text-white/60">
            CAPA · {featured ? "CLIQUE PRA FOLHEAR" : "EM BREVE"}
          </p>
        </div>
      </section>

      {/* Navegação rápida */}
      <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/revista", title: "A REVISTA", desc: "Todas as edições em modo flip" },
          { to: "/santuario", title: "O SANTUÁRIO", desc: "Fichas dos membros" },
          { to: "/album", title: "MEU ÁLBUM", desc: "Suas cartas coletadas" },
          { to: "/perfil", title: "MEU PERFIL", desc: "Editar avatar, bio e família" },
        ].map((l) => (
          <Link key={l.to} to={l.to} className="glass-dark group rounded-xl p-5 transition hover:border-[color:var(--ruby)]">
            <p className="font-display text-xs tracking-[0.4em] text-[color:var(--ruby)]">✦</p>
            <h3 className="mt-2 font-display text-xl tracking-widest text-white">{l.title}</h3>
            <p className="mt-1 text-xs text-white/60">{l.desc}</p>
            <p className="mt-3 font-display text-[10px] tracking-widest text-white/40 group-hover:text-[color:var(--ruby)]">ENTRAR →</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

// keep unused import silent
void IMAGES;
