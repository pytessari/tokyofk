import { Link, useNavigate } from "@tanstack/react-router";
import { IMAGES } from "@/lib/images";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/useRole";
import { NotificationsBell } from "@/components/NotificationsBell";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Home, Newspaper, Users, Library, Rss, LogIn, User, LogOut, Shield, ChevronDown } from "lucide-react";

const publicLinks = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/revista", label: "Revista", icon: Newspaper, exact: false },
] as const;

const memberLinks = [
  { to: "/feed", label: "Feed", icon: Rss, exact: false },
  { to: "/santuario", label: "Santuário", icon: Users, exact: false },
  { to: "/album", label: "Álbum", icon: Library, exact: false },
] as const;

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();

  const links = user ? [...publicLinks, ...memberLinks] : publicLinks;

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
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.exact }}
                className="group relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 font-display text-sm tracking-widest text-white/80 transition hover:text-white"
                activeProps={{ className: "text-white" }}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{l.label.toUpperCase()}</span>
                    <span
                      className={`absolute inset-x-2 -bottom-0.5 h-[2px] rounded bg-ruby-gradient transition-all ${
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </>
                )}
              </Link>
            );
          })}

          {!loading && (user ? (
            <>
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-[color:var(--ruby)]/60 bg-black/40 px-3 py-2 font-display text-sm tracking-widest text-white transition hover:bg-[color:var(--ruby)]/10">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">PERFIL</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-display text-[10px] tracking-widest text-white/50">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Editar perfil
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 text-yellow-300">
                        <Shield className="h-4 w-4" /> Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => { await signOut(); navigate({ to: "/" }); }}
                    className="flex items-center gap-2 text-red-300 focus:text-red-200"
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link
              to="/login"
              className="ml-3 inline-flex items-center gap-1.5 rounded-md bg-ruby-gradient px-4 py-2 font-display text-sm tracking-widest text-white shadow-[0_0_20px_#d9003680] transition hover:brightness-110"
            >
              <LogIn className="h-4 w-4" /> ENTRAR
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
