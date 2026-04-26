import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import cover from "@/assets/cover-s1.jpg";
import webtoon from "@/assets/webtoon-1.jpg";
import { ThornHeart, StarSpike } from "@/components/Sticker";

export const Route = createFileRoute("/banca")({
  head: () => ({
    meta: [
      { title: "TOKYO · A Banca" },
      { name: "description", content: "Revistas oficiais da TOKYO em formato flipbook + leitura webtoon." },
    ],
  }),
  component: BancaPage,
});

const issues = Array.from({ length: 6 }).map((_, i) => ({
  n: i + 1,
  title: ["Espinhos & Açúcar", "Beco Vermelho", "Coração de Cromo", "Festa Particular", "Garotas de Néon", "Última Página"][i],
}));

function BancaPage() {
  const [open, setOpen] = useState<number | null>(null);
  const [webtoonMode, setWebtoonMode] = useState(false);

  if (webtoonMode) return <WebtoonReader onExit={() => setWebtoonMode(false)} />;

  if (open !== null) {
    return (
      <FlipbookReader
        n={open}
        onClose={() => setOpen(null)}
        onWebtoon={() => setWebtoonMode(true)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">
            ARQUIVO OFICIAL · 7 EDIÇÕES
          </p>
          <h1 className="mt-1 font-display text-5xl text-ruby-gradient sm:text-6xl">A BANCA</h1>
        </div>
        <ThornHeart className="hidden h-14 w-14 sm:block" />
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {issues.map((it) => (
          <button
            key={it.n}
            onClick={() => setOpen(it.n)}
            className="group text-left"
          >
            <div className="chrome-frame transition group-hover:scale-[1.03]">
              <div className="relative">
                <img
                  src={cover}
                  alt={it.title}
                  className="aspect-[3/4] w-full object-cover"
                  style={{ filter: `hue-rotate(${it.n * 8}deg) saturate(1.1)` }}
                />
                <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 font-display text-[10px] tracking-widest text-white">
                  #{String(it.n).padStart(2, "0")}
                </span>
              </div>
            </div>
            <p className="mt-3 font-display text-sm tracking-widest text-white group-hover:text-[color:var(--ruby)]">
              {it.title.toUpperCase()}
            </p>
            <p className="text-[11px] tracking-widest text-white/50">EDIÇÃO #{String(it.n).padStart(2, "0")} · T1</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function FlipbookReader({ n, onClose, onWebtoon }: { n: number; onClose: () => void; onWebtoon: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onClose} className="font-display text-sm tracking-widest text-white/70 hover:text-white">
          ← VOLTAR PRA BANCA
        </button>
        <p className="font-display text-xs tracking-widest text-white/60">
          EDIÇÃO #{String(n).padStart(2, "0")} · MODO REVISTA
        </p>
      </div>

      <div className="relative mx-auto grid max-w-5xl grid-cols-2 overflow-hidden rounded-xl border border-[color:var(--ruby)]/40 shadow-[0_30px_80px_-20px_#d90036aa]">
        {/* Página esquerda */}
        <div className="relative bg-black">
          <img src={cover} alt="página esquerda" className="h-full w-full object-cover" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/80 to-transparent" />
        </div>
        {/* Página direita */}
        <div className="relative bg-[#0a0001] p-8">
          <p className="font-display text-xs tracking-[0.4em] text-[color:var(--chrome)]">
            EDITORIAL · PÁG. 02
          </p>
          <h2 className="mt-3 font-display text-4xl text-white">
            <span className="text-ruby-gradient">"NÃO É</span> SOBRE BRILHAR. É SOBRE ARDER."
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/75">
            Bem-vindo à edição #{String(n).padStart(2, "0")}. Nessa virada de temporada, abrimos
            os arquivos do beco, ouvimos quem estava lá quando tudo começou e, principalmente,
            servimos a primeira fatia de açúcar com espinho. Vire a página — ou pule pro
            quadrinho.
          </p>

          <div className="mt-6 flex items-center gap-4">
            <StarSpike className="h-6 w-6 sticker-star" />
            <p className="text-xs tracking-widest text-white/50">"AÇÚCAR DOI MAIS QUANDO É RUBI"</p>
          </div>

          <div className="mt-10 flex flex-col gap-3">
            <button
              onClick={onWebtoon}
              className="group relative overflow-hidden rounded-md bg-ruby-gradient px-6 py-3 font-display tracking-widest text-white shadow-[0_0_24px_#d9003680] transition hover:brightness-110"
            >
              LER QUADRINHOS DA TEMPORADA →
              <span className="absolute inset-0 -skew-x-12 bg-white/30 opacity-0 transition group-hover:translate-x-full group-hover:opacity-100" />
            </button>
            <p className="text-[11px] tracking-widest text-white/40">
              * a interface da revista vai 'rasgar' e a leitura vira webtoon vertical.
            </p>
          </div>
        </div>

        {/* Spine */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[color:var(--ruby)] to-transparent" />
      </div>
    </div>
  );
}

function WebtoonReader({ onExit }: { onExit: () => void }) {
  return (
    <div className="bg-black">
      {/* Tear-in animation */}
      <div className="sticky top-[64px] z-30 flex items-center justify-between bg-black/80 px-5 py-3 backdrop-blur">
        <button onClick={onExit} className="font-display text-sm tracking-widest text-white/70 hover:text-white">
          ← FECHAR QUADRINHO
        </button>
        <p className="font-display text-xs tracking-widest text-[color:var(--ruby)]">
          MODO WEBTOON · ROLE PRA BAIXO
        </p>
      </div>

      {/* "Rasgo" animation */}
      <div
        className="h-3 w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, #ff2a5c 20%, #800020 50%, #ff2a5c 80%, transparent)",
          clipPath:
            "polygon(0 0, 5% 100%, 10% 0, 18% 100%, 25% 0, 33% 100%, 40% 0, 48% 100%, 55% 0, 63% 100%, 70% 0, 78% 100%, 85% 0, 93% 100%, 100% 0)",
        }}
      />

      <div className="mx-auto flex max-w-2xl flex-col items-stretch">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-white/5">
            <img
              src={webtoon}
              alt={`painel ${i + 1}`}
              className="block w-full"
              style={{ filter: `hue-rotate(${i * 6}deg)` }}
            />
          </div>
        ))}
        <div className="px-6 py-12 text-center">
          <ThornHeart className="mx-auto h-12 w-12" />
          <p className="mt-3 font-display text-sm tracking-widest text-white/60">
            FIM DO CAPÍTULO · CONTINUA NA EDIÇÃO #02
          </p>
        </div>
      </div>
    </div>
  );
}
