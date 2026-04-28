import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IMAGES, img } from "@/lib/images";

export const Route = createFileRoute("/revista/$id")({
  head: ({ params }) => ({ meta: [{ title: `Revista · TOKYO (${params.id})` }] }),
  component: MagazineViewer,
});

type Mag = { id: string; title: string; subtitle: string | null; cover_url: string | null; issue_number: number | null };
type Page = { id: string; page_number: number; title: string | null; body: string | null; image_url: string | null };

function MagazineViewer() {
  const { id } = Route.useParams();
  const [mag, setMag] = useState<Mag | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);          // current SPREAD index (pairs)
  const [flipping, setFlipping] = useState<"next" | "prev" | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: m }, { data: p }] = await Promise.all([
        supabase.from("magazines").select("id, title, subtitle, cover_url, issue_number").eq("id", id).maybeSingle(),
        supabase.from("magazine_pages").select("*").eq("magazine_id", id).order("page_number"),
      ]);
      setMag(m as Mag | null);
      setPages((p ?? []) as Page[]);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (loading) return <div className="px-5 py-20 text-center font-display tracking-widest text-white/60">CARREGANDO REVISTA…</div>;
  if (!mag) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-display text-4xl text-ruby-gradient">EDIÇÃO NÃO ENCONTRADA</h1>
        <Link to="/revista" className="mt-6 inline-block font-display text-sm tracking-widest text-white underline">
          ← VOLTAR À BANCA
        </Link>
      </div>
    );
  }

  // spread = cover + pages in pairs
  const cover: Page = { id: "cover", page_number: 0, title: mag.title, body: mag.subtitle, image_url: mag.cover_url };
  const allPages = [cover, ...pages];
  const spreads: [Page | null, Page | null][] = [];
  for (let i = 0; i < allPages.length; i += 2) {
    spreads.push([allPages[i] ?? null, allPages[i + 1] ?? null]);
  }
  const total = spreads.length;
  const safeIndex = Math.min(index, total - 1);
  const current = spreads[safeIndex];

  function next() {
    setIndex((i) => {
      if (i >= total - 1) return i;
      setFlipping("next");
      setTimeout(() => setFlipping(null), 700);
      return i + 1;
    });
  }
  function prev() {
    setIndex((i) => {
      if (i <= 0) return i;
      setFlipping("prev");
      setTimeout(() => setFlipping(null), 700);
      return i - 1;
    });
  }

  return (
    <div className="min-h-[80vh] px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <Link to="/revista" className="font-display text-xs tracking-widest text-white/60 hover:text-white">
              ← TODAS AS EDIÇÕES
            </Link>
            <h1 className="mt-1 font-display text-3xl text-ruby-gradient">
              {mag.issue_number != null ? `#${String(mag.issue_number).padStart(2, "0")} · ` : ""}{mag.title.toUpperCase()}
            </h1>
          </div>
          <span className="font-display text-xs tracking-widest text-white/50">
            PÁGINAS {safeIndex * 2 + 1}–{Math.min(safeIndex * 2 + 2, allPages.length)} / {allPages.length}
          </span>
        </div>

        <div className="relative">
          {/* stage */}
          <div
            className="mx-auto grid grid-cols-1 gap-2 sm:grid-cols-2"
            style={{ perspective: "2400px" }}
          >
            <MagPage p={current[0]} side="left" flipping={flipping} />
            <MagPage p={current[1]} side="right" flipping={flipping} />
          </div>

          {/* arrows */}
          <button
            onClick={prev} disabled={safeIndex === 0}
            aria-label="Página anterior"
            className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 rounded-full border border-[color:var(--ruby)]/60 bg-black/70 p-3 font-display text-white shadow-[0_0_20px_#d90036aa] transition hover:bg-[color:var(--ruby)]/20 disabled:opacity-30">
            ◀
          </button>
          <button
            onClick={next} disabled={safeIndex >= total - 1}
            aria-label="Próxima página"
            className="absolute right-0 top-1/2 translate-x-2 -translate-y-1/2 rounded-full border border-[color:var(--ruby)]/60 bg-black/70 p-3 font-display text-white shadow-[0_0_20px_#d90036aa] transition hover:bg-[color:var(--ruby)]/20 disabled:opacity-30">
            ▶
          </button>
        </div>

        {/* dots */}
        <div className="mt-6 flex justify-center gap-1.5">
          {spreads.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)}
              aria-label={`Ir para spread ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === safeIndex ? "w-8 bg-ruby-gradient" : "w-3 bg-white/20 hover:bg-white/40"}`} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes flip-next { 0%{transform:rotateY(0)} 100%{transform:rotateY(-180deg)} }
        @keyframes flip-prev { 0%{transform:rotateY(0)} 100%{transform:rotateY(180deg)} }
        .flip-next { animation: flip-next .7s ease; transform-origin: left center; }
        .flip-prev { animation: flip-prev .7s ease; transform-origin: right center; }
      `}</style>
    </div>
  );
}

function MagPage({ p, side, flipping }: { p: Page | null; side: "left" | "right"; flipping: "next" | "prev" | null }) {
  const anim =
    flipping === "next" && side === "right" ? "flip-next" :
    flipping === "prev" && side === "left"  ? "flip-prev" : "";

  return (
    <div className={`relative aspect-[3/4] w-full overflow-hidden rounded-lg ruby-border bg-black ${anim}`}
      style={{ backfaceVisibility: "hidden" }}>
      {!p ? (
        <div className="flex h-full w-full items-center justify-center text-white/30">— página em branco —</div>
      ) : (
        <>
          {p.image_url ? (
            <img src={img(p.image_url, IMAGES.fallback.banner)} alt={p.title ?? ""} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#2a0010] to-black" />
          )}
          {(p.title || p.body) && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5">
              {p.title && <h3 className="font-display text-2xl tracking-wider text-white">{p.title}</h3>}
              {p.body && <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{p.body}</p>}
            </div>
          )}
          {p.page_number > 0 && (
            <span className="absolute bottom-2 right-3 font-display text-[10px] tracking-widest text-white/50">
              {p.page_number}
            </span>
          )}
        </>
      )}
    </div>
  );
}
