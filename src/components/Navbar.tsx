import { Link } from "@tanstack/react-router";
import { IMAGES } from "@/lib/images";
import { useAuth } from "@/lib/auth";

const links = [
  { to: "/", label: "Início" },
  { to: "/santuario", label: "O Santuário" },
  { to: "/banca", label: "A Banca" },
  { to: "/album", label: "Meu Álbum" },
] as const;

export function Navbar() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 glass-dark border-b border-[color:var(--ruby)]/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={IMAGES.logo} alt="TOKYO" className="h-14 w-auto drop-shadow-[0_0_22px_#d90036]" />
          <span className="hidden font-display text-xs tracking-[0.4em] text-[color:var(--chrome)] sm:inline">
            COMUNIDADE OFICIAL · 東京
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="group relative rounded-md px-3 py-2 font-display text-sm tracking-widest text-white/80 transition hover:text-white"
              activeProps={{ className: "text-white" }}
            >
              {({ isActive }) => (
                <>
                  <span>{l.label.toUpperCase()}</span>
                  <span
                    className={`absolute inset-x-2 -bottom-0.5 h-[2px] rounded bg-ruby-gradient transition-all ${
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </>
              )}
            </Link>
          ))}

          {!loading && (user ? (
            <Link
              to="/perfil"
              className="ml-3 rounded-md border border-[color:var(--ruby)]/60 bg-black/40 px-4 py-2 font-display text-sm tracking-widest text-white transition hover:bg-[color:var(--ruby)]/10"
            >
              MEU PERFIL
            </Link>
          ) : (
            <Link
              to="/login"
              className="ml-3 rounded-md bg-ruby-gradient px-4 py-2 font-display text-sm tracking-widest text-white shadow-[0_0_20px_#d9003680] transition hover:brightness-110"
            >
              ENTRAR
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
