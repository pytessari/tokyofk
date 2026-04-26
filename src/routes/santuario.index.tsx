import { createFileRoute, Link } from "@tanstack/react-router";
import { MEMBERS } from "@/lib/members";
import { ThornHeart } from "@/components/Sticker";

export const Route = createFileRoute("/santuario")({
  head: () => ({
    meta: [
      { title: "TOKYO · O Santuário" },
      { name: "description", content: "Diretório completo dos 26 membros da comunidade TOKYO." },
    ],
  }),
  component: SantuarioPage,
});

function MemberAvatar({ hue, name }: { hue: number; name: string }) {
  // Generated decorative avatar (no AI image needed for every member)
  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-xl"
      style={{
        background: `radial-gradient(120% 80% at 30% 20%, hsl(${hue} 90% 45%) 0%, #1a0006 60%, #000 100%)`,
      }}
    >
      <div
        className="absolute inset-0 mix-blend-overlay opacity-60"
        style={{
          background:
            "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.25), transparent 40%)",
        }}
      />
      <span className="absolute bottom-2 left-2 font-display text-[10px] tracking-widest text-white/80">
        {name.split(" ")[0].toUpperCase()}
      </span>
    </div>
  );
}

function SantuarioPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">
            DIRETÓRIO · 26 ALMAS
          </p>
          <h1 className="mt-1 font-display text-5xl text-ruby-gradient sm:text-6xl">
            O SANTUÁRIO
          </h1>
        </div>
        <ThornHeart className="hidden h-14 w-14 sm:block" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {MEMBERS.map((m) => (
          <Link
            key={m.slug}
            to="/santuario/$slug"
            params={{ slug: m.slug }}
            className="group block"
          >
            <div className="ruby-border rounded-2xl p-2 transition group-hover:shadow-[0_0_24px_#d9003680]">
              <MemberAvatar hue={m.hue} name={m.name} />
              <div className="mt-2 px-1 pb-1">
                <p className="font-display text-sm tracking-wider text-white group-hover:text-[color:var(--ruby)]">
                  {m.name.toUpperCase()}
                </p>
                <p className="text-[11px] tracking-widest text-white/50">{m.role} · {m.sign}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
