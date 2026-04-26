import { createFileRoute, Link } from "@tanstack/react-router";
import cover from "@/assets/cover-s1.jpg";
import { ThornHeart, StarSpike } from "@/components/Sticker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TOKYO · Início" },
      { name: "description", content: "Capa da Edição Especial Temporada 1, notícias e destaques da comunidade TOKYO." },
    ],
  }),
  component: HomePage,
});

const news = [
  { tag: "DROP", title: "Cartas Holográficas T1 esgotam em 4 horas", time: "agora" },
  { tag: "BANCA", title: "Edição #07 'Espinhos & Açúcar' já disponível", time: "2h" },
  { tag: "WEBTOON", title: "Capítulo 12: 'O Beco de Shibuya' foi lançado", time: "5h" },
  { tag: "MEMBRO", title: "Jerk Leblanc abre arquivo pessoal no Santuário", time: "ontem" },
  { tag: "EVENTO", title: "Encontro virtual no Mercado Negro · sexta 22h", time: "2d" },
];

function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      {/* HERO */}
      <section className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl glass-dark p-6 sm:p-10">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[color:var(--ruby)] opacity-30 blur-3xl" />
          <StarSpike className="absolute right-6 top-6 h-8 w-8 sticker-star" />
          <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">
            EDIÇÃO ESPECIAL · TEMPORADA 01
          </p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] text-white sm:text-7xl">
            <span className="text-ruby-gradient">ESPINHOS</span>
            <br />
            &amp; AÇÚCAR
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/70">
            A primeira temporada de TOKYO chegou. 26 membros, 7 revistas, 60 cartas holográficas e
            um beco inteiro pra explorar. Comece pela capa.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/banca"
              className="rounded-md bg-ruby-gradient px-5 py-3 font-display tracking-widest text-white shadow-[0_0_24px_#d9003680] transition hover:brightness-110"
            >
              ABRIR A REVISTA
            </Link>
            <Link
              to="/santuario"
              className="rounded-md border border-[color:var(--ruby)] px-5 py-3 font-display tracking-widest text-white/90 transition hover:bg-[color:var(--ruby)]/15"
            >
              CONHECER OS MEMBROS
            </Link>
          </div>

          {/* Carousel mock thumbs */}
          <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`relative h-24 w-20 shrink-0 overflow-hidden rounded-md border ${
                  i === 1 ? "border-[color:var(--ruby)] shadow-[0_0_18px_#d90036aa]" : "border-white/10"
                }`}
              >
                <img src={cover} alt={`thumb ${i}`} className="h-full w-full object-cover opacity-80" />
                <span className="absolute bottom-1 left-1 font-display text-[10px] tracking-widest text-white">
                  #0{i}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cover */}
        <div className="relative">
          <div className="chrome-frame mx-auto w-fit -rotate-2 transition hover:rotate-0">
            <div className="relative">
              <img
                src={cover}
                alt="Capa Temporada 1"
                width={420}
                height={560}
                className="h-[520px] w-[390px] object-cover"
                style={{
                  filter: "saturate(1.15) contrast(1.05)",
                }}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.25) 50%, transparent 65%)",
                }}
              />
            </div>
          </div>
          <ThornHeart className="absolute -right-2 -top-4 h-16 w-16 drop-shadow-[0_0_18px_#d90036]" />
          <p className="mt-3 text-center font-display text-xs tracking-[0.4em] text-white/60">
            CAPA OFICIAL · T1 · TIRAGEM LIMITADA
          </p>
        </div>
      </section>

      {/* NEWS + STICKERS */}
      <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-dark rounded-2xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-widest text-white">RÁDIO PEITO ❤︎</h2>
            <span className="font-display text-xs tracking-widest text-white/50">AO VIVO · COMUNIDADE</span>
          </div>
          <ul className="divide-y divide-white/5">
            {news.map((n) => (
              <li key={n.title} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-sm bg-ruby-gradient px-2 py-0.5 font-display text-[10px] tracking-widest text-white">
                    {n.tag}
                  </span>
                  <p className="text-sm text-white/85">{n.title}</p>
                </div>
                <span className="font-display text-[11px] tracking-widest text-white/40">{n.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-2xl glass-dark p-6">
          <h2 className="font-display text-2xl tracking-widest text-white">DIÁRIO DA SEMANA</h2>
          <div className="mt-4 -rotate-3 polaroid w-fit">
            <img src={cover} alt="polaroid" className="h-44 w-40 object-cover" />
            <p className="mt-2 text-center font-display text-xs tracking-widest text-black">
              "Tokyo nunca dorme."
            </p>
          </div>
          <StarSpike className="absolute -right-3 bottom-6 h-10 w-10 sticker-star rotate-12" />
          <ThornHeart className="absolute right-10 top-10 h-8 w-8 -rotate-12 opacity-80" />
        </div>
      </section>
    </div>
  );
}
