import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MEMBERS } from "@/lib/members";
import banner from "@/assets/jerk-banner.jpg";
import avatar from "@/assets/jerk-avatar.jpg";
import card1 from "@/assets/card-1.jpg";
import { ThornHeart, StarSpike } from "@/components/Sticker";

export const Route = createFileRoute("/santuario/$slug")({
  loader: ({ params }) => {
    const member = MEMBERS.find((m) => m.slug === params.slug);
    if (!member) throw notFound();
    return { member };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.member.name ?? "Membro"} · TOKYO` },
      { name: "description", content: `Ficha do membro ${loaderData?.member.name} no Santuário TOKYO.` },
    ],
  }),
  component: MemberPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      <h1 className="font-display text-4xl text-ruby-gradient">MEMBRO NÃO ENCONTRADO</h1>
      <Link to="/santuario" className="mt-6 inline-block font-display text-sm tracking-widest text-white underline">
        ← VOLTAR AO SANTUÁRIO
      </Link>
    </div>
  ),
});

const collection = [
  { id: "001", name: "Jerk · Espinho", rarity: "Holo Ruby" },
  { id: "002", name: "Jerk · Beco", rarity: "Foil" },
  { id: "003", name: "Jerk · Coroa", rarity: "Mirror" },
  { id: "004", name: "Jerk · Dueto", rarity: "Limited" },
  { id: "005", name: "Jerk · Capa T1", rarity: "Promo" },
];

function MemberPage() {
  const { member } = Route.useLoaderData();
  const isJerk = member.slug === "jerk-leblanc";

  return (
    <div>
      {/* Banner */}
      <div className="relative h-64 w-full overflow-hidden sm:h-80">
        <img
          src={banner}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-80"
          style={{ filter: `hue-rotate(${member.hue - 0}deg) saturate(1.1)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
        <StarSpike className="absolute right-10 top-8 h-10 w-10 sticker-star" />
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-16">
        {/* Header card */}
        <div className="relative -mt-20 flex flex-col items-start gap-6 sm:flex-row sm:items-end">
          <div className="chrome-frame rounded-full">
            <img
              src={avatar}
              alt={member.name}
              className="h-36 w-36 rounded-full object-cover sm:h-44 sm:w-44"
              style={{ filter: isJerk ? "none" : `hue-rotate(${member.hue}deg)` }}
            />
          </div>
          <div className="flex-1">
            <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">
              FICHA OFICIAL · TOKYO
            </p>
            <h1 className="font-display text-5xl text-white sm:text-6xl">
              {member.name.toUpperCase()}
            </h1>
            <p className="mt-1 text-sm tracking-widest text-[color:var(--ruby)]">
              {member.role.toUpperCase()}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-md bg-ruby-gradient px-5 py-2.5 font-display tracking-widest text-white shadow-[0_0_18px_#d9003680]">
              SEGUIR
            </button>
            <button className="rounded-md border border-[color:var(--ruby)] px-5 py-2.5 font-display tracking-widest text-white/90 hover:bg-[color:var(--ruby)]/15">
              MENSAGEM
            </button>
          </div>
        </div>

        {/* Bio + Quote */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Bio editorial */}
          <div className="relative glass-dark rounded-2xl p-6">
            <ThornHeart className="absolute -right-3 -top-3 h-12 w-12" />
            <h2 className="font-display text-xl tracking-widest text-white">FICHA RÁPIDA ✦</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <BioRow k="Signo" v={member.sign} />
              {isJerk ? (
                <>
                  <BioRow
                    k="Irmãos"
                    v={
                      <span className="space-x-2">
                        <Link
                          to="/santuario/$slug"
                          params={{ slug: "olivia-leblanc" }}
                          className="text-[color:var(--ruby)] underline-offset-2 hover:underline"
                        >
                          Olívia Leblanc
                        </Link>
                        <span className="text-white/40">·</span>
                        <Link
                          to="/santuario/$slug"
                          params={{ slug: "pierre-leblanc" }}
                          className="text-[color:var(--ruby)] underline-offset-2 hover:underline"
                        >
                          Pierre Leblanc
                        </Link>
                      </span>
                    }
                  />
                  <BioRow
                    k="Relacionamento"
                    v={
                      <span className="inline-flex items-center gap-1.5">
                        <ThornHeart className="h-4 w-4" />
                        Casado com{" "}
                        <Link
                          to="/santuario/$slug"
                          params={{ slug: "katrina-leblanc" }}
                          className="text-[color:var(--ruby)] underline-offset-2 hover:underline"
                        >
                          Katrina Leblanc
                        </Link>
                      </span>
                    }
                  />
                  <BioRow k="Filhos" v="0" />
                </>
              ) : (
                <>
                  <BioRow k="Função" v={member.role} />
                  <BioRow k="Status" v="Ativo na Temporada 1" />
                </>
              )}
              <BioRow k="Cartas na Coleção" v="5 / 60" />
            </dl>

            <div className="mt-6 flex items-center gap-2">
              {["#espinho", "#temporada01", "#leblanc"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[color:var(--ruby)]/50 bg-black/40 px-3 py-1 font-display text-[10px] tracking-widest text-white/80"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Quote / about */}
          <div className="relative glass-dark rounded-2xl p-8">
            <p className="font-display text-3xl leading-tight text-white sm:text-4xl">
              <span className="text-ruby-gradient">"Toda rosa</span> que floresce em TOKYO já nasce com espinho."
            </p>
            <p className="mt-6 text-sm leading-relaxed text-white/70">
              {isJerk
                ? "Jerk Leblanc é o caçula mais velho da família — rosto da Edição #03 e voz do beco. Costuma andar de coturno mesmo no verão, e diz que aprendeu a amar antes de aprender a falar. Casado com Katrina desde a Temporada 0."
                : `${member.name} é parte da Temporada 1 de TOKYO. Personagem em construção — aguarde novos capítulos.`}
            </p>
            <StarSpike className="absolute right-6 top-6 h-8 w-8 sticker-star" />
          </div>
        </div>

        {/* Coleção */}
        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">
                A COLEÇÃO
              </p>
              <h2 className="font-display text-4xl text-ruby-gradient">CARTAS · TEMPORADA 1</h2>
            </div>
            <Link to="/album" className="font-display text-xs tracking-widest text-white/70 hover:text-white">
              VER ÁLBUM COMPLETO →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {collection.map((c, i) => (
              <div key={c.id} className="relative tilt-card overflow-hidden rounded-xl ruby-border shimmer">
                <div className="relative">
                  <img
                    src={card1}
                    alt={c.name}
                    className="aspect-[3/4] w-full object-cover"
                    style={{ filter: `hue-rotate(${i * 12}deg) saturate(1.05)` }}
                  />
                  <div className="holo-shine" />
                </div>
                <div className="relative bg-black/80 p-3">
                  <p className="font-display text-xs tracking-widest text-white">
                    #{c.id} · {c.name.toUpperCase()}
                  </p>
                  <p className="mt-0.5 text-[10px] tracking-widest text-[color:var(--ruby)]">
                    {c.rarity.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function BioRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-white/5 pb-2">
      <dt className="w-32 shrink-0 font-display text-[11px] tracking-widest text-white/50">
        {k.toUpperCase()}
      </dt>
      <dd className="flex-1 text-white/90">{v}</dd>
    </div>
  );
}
