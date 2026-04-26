import { Link } from "@tanstack/react-router";
import logo from "@/assets/tokyo-logo.png";

const links = [
  { to: "/", label: "Início" },
  { to: "/santuario", label: "O Santuário" },
  { to: "/banca", label: "A Banca" },
  { to: "/album", label: "Meu Álbum" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 glass-dark border-b border-[color:var(--ruby)]/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="TOKYO" className="h-12 w-auto drop-shadow-[0_0_18px_#d90036]" />
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
          <button className="ml-3 rounded-md bg-ruby-gradient px-4 py-2 font-display text-sm tracking-widest text-white shadow-[0_0_20px_#d9003680] transition hover:brightness-110">
            ENTRAR
          </button>
        </nav>
      </div>
    </header>
  );
}
