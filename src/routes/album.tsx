import { createFileRoute } from "@tanstack/react-router";
import card1 from "@/assets/card-1.jpg";
import { ThornHeart, StarSpike } from "@/components/Sticker";

export const Route = createFileRoute("/album")({
  head: () => ({
    meta: [
      { title: "TOKYO · Meu Álbum" },
      { name: "description", content: "Seu álbum pessoal de cartas TOKYO — desbloqueadas e bloqueadas." },
    ],
  }),
  component: AlbumPage,
});

const TOTAL = 24;
const UNLOCKED = new Set([1, 2, 4, 7, 8, 11, 14, 17, 19, 22]);

function AlbumPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">
            DASHBOARD PESSOAL
          </p>
          <h1 className="mt-1 font-display text-5xl text-ruby-gradient sm:text-6xl">
            MERCADO NEGRO
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {UNLOCKED.size} de {TOTAL} cartas desbloqueadas · Temporada 1
          </p>
        </div>
        <StarSpike className="hidden h-12 w-12 sticker-star sm:block" />
      </div>

      {/* Progress */}
      <div className="mb-8 glass-dark rounded-2xl p-5">
        <div className="mb-2 flex items-center justify-between font-display text-xs tracking-widest text-white/70">
          <span>PROGRESSO DA COLEÇÃO</span>
          <span>{Math.round((UNLOCKED.size / TOTAL) * 100)}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-ruby-gradient shadow-[0_0_20px_#d90036]"
            style={{ width: `${(UNLOCKED.size / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: TOTAL }).map((_, i) => {
          const id = i + 1;
          const unlocked = UNLOCKED.has(id);
          return unlocked ? (
            <div key={id} className="tilt-card relative overflow-hidden rounded-xl ruby-border shimmer">
              <div className="relative">
                <img
                  src={card1}
                  alt={`carta ${id}`}
                  className="aspect-[3/4] w-full object-cover"
                  style={{ filter: `hue-rotate(${id * 14}deg) saturate(1.05)` }}
                />
                <div className="holo-shine" />
              </div>
              <div className="bg-black/80 p-2">
                <p className="font-display text-[11px] tracking-widest text-white">
                  #{String(id).padStart(3, "0")}
                </p>
                <p className="text-[10px] tracking-widest text-[color:var(--ruby)]">HOLO RUBY</p>
              </div>
            </div>
          ) : (
            <div
              key={id}
              className="pulse-neon relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border-2 border-[color:var(--ruby)] bg-black"
            >
              {/* Silhouette */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    "radial-gradient(60% 60% at 50% 40%, #1a0006 0%, #000 70%)",
                }}
              />
              <ThornHeart className="absolute inset-0 m-auto h-16 w-16 opacity-15" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <LockIcon />
                <p className="font-display text-xs tracking-[0.3em] text-white/80">BLOQUEADO</p>
                <p className="font-display text-[10px] tracking-widest text-white/40">
                  #{String(id).padStart(3, "0")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="url(#chrome)" strokeWidth="1.8">
      <defs>
        <linearGradient id="chrome" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#9a9aa3" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
