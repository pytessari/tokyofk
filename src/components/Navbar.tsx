import { Link, useNavigate } from "@tanstack/react-router";
import {
  HomeIcon,
  ReaderIcon,
  PersonIcon,
  ArchiveIcon,
  ChatBubbleIcon,
  GroupIcon,
  EnvelopeClosedIcon,
  EnterIcon,
  ExitIcon,
  Pencil2Icon,
  LockClosedIcon,
  ChevronDownIcon,
  HamburgerMenuIcon,
  FaceIcon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { IMAGES } from "@/lib/images";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/useRole";
import { supabase } from "@/integrations/supabase/client";
import { NotificationsBell } from "@/components/NotificationsBell";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Links principais (sempre visíveis na barra)
const primaryPublic = [
  { to: "/", label: "Início", icon: HomeIcon, exact: true },
] as const;

const primaryMember = [
  { to: "/feed", label: "Feed", icon: ChatBubbleIcon, exact: false },
  { to: "/mensagens", label: "DM", icon: EnvelopeClosedIcon, exact: false },
  { to: "/santuario", label: "Santuário", icon: PersonIcon, exact: false },
] as const;

// Agrupados em "Explorar"
const exploreGroups = [
  {
    title: "Conteúdo",
    items: [
      { to: "/revista", label: "Revista", icon: ReaderIcon, exact: false },
      { to: "/comunidades", label: "Comunidades", icon: GroupIcon, exact: false },
    ],
  },
  {
    title: "Coleção & Diversão",
    items: [
      { to: "/album", label: "Álbum", icon: ArchiveIcon, exact: false },
    ],
  },
] as const;

// Itens visíveis somente para admins
const adminExploreItems = [
  { to: "/buddy", label: "Buddy (beta)", icon: FaceIcon, exact: false },
] as const;

// Para o menu mobile (logged-out)
const publicLinks = [
  { to: "/", label: "Início", icon: HomeIcon, exact: true },
  { to: "/revista", label: "Revista", icon: ReaderIcon, exact: false },
] as const;

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const [me, setMe] = useState<{ slug: string | null; avatar_url: string | null; display_name: string } | null>(
    null,
  );

  useEffect(() => {
    if (!user) {
      setMe(null);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("slug, avatar_url, display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (active && data) setMe(data);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const links = user ? [...primaryPublic, ...primaryMember] : primaryPublic;

  function goToMyProfile() {
    if (me?.slug) {
      navigate({ to: "/santuario/$slug", params: { slug: me.slug } });
    } else {
      toast.info("Configure seu @ primeiro pra ter um perfil público.");
      navigate({ to: "/perfil" });
    }
  }

  return (
    <>
    <header className="sticky top-0 z-40 glass-dark border-b border-[color:var(--ruby)]/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-5 sm:py-3">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)] rounded"
        >
          <img
            src={IMAGES.logo}
            alt="TOKYO"
            className="h-9 w-auto drop-shadow-[0_0_18px_#d90036] sm:h-14"
          />
          <span className="hidden font-display text-xs tracking-[0.4em] text-[color:var(--chrome)] xl:inline">
            COMUNIDADE OFICIAL · 東京
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.exact }}
                className="group relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 font-display text-sm tracking-widest text-white/85 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]"
                activeProps={{ className: "text-white" }}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden lg:inline">{l.label.toUpperCase()}</span>
                    <span
                      className={`absolute inset-x-2 -bottom-0.5 h-[2px] rounded bg-ruby-gradient transition-all ${
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                      aria-hidden="true"
                    />
                  </>
                )}
              </Link>
            );
          })}

          {/* Dropdown "Explorar" — só pra logados */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="group relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 font-display text-sm tracking-widest text-white/85 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]"
                aria-label="Mais seções"
              >
                <HamburgerMenuIcon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">EXPLORAR</span>
                <ChevronDownIcon className="h-3.5 w-3.5 text-white/60" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                {exploreGroups.map((group, gi) => (
                  <div key={group.title}>
                    {gi > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="font-display text-[10px] tracking-widest text-white/50">
                      {group.title.toUpperCase()}
                    </DropdownMenuLabel>
                    {group.items.map((l) => {
                      const Icon = l.icon;
                      return (
                        <DropdownMenuItem key={l.to} asChild>
                          <Link to={l.to} className="flex items-center gap-2">
                            <Icon className="h-4 w-4" aria-hidden="true" /> {l.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                ))}
                {isAdmin && (
                  <div>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="font-display text-[10px] tracking-widest text-yellow-300/70">
                      ADMIN
                    </DropdownMenuLabel>
                    {adminExploreItems.map((l) => {
                      const Icon = l.icon;
                      return (
                        <DropdownMenuItem key={l.to} asChild>
                          <Link to={l.to} className="flex items-center gap-2 text-yellow-300">
                            <Icon className="h-4 w-4" aria-hidden="true" /> {l.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Right cluster: bell + avatar (or login) + mobile menu */}
        <div className="flex items-center gap-1">
          {!loading &&
            (user ? (
              <>
                <NotificationsBell />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-[color:var(--ruby)]/60 bg-black/40 px-1.5 py-1 outline-none transition hover:bg-[color:var(--ruby)]/10 focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]"
                    aria-label="Menu da conta"
                  >
                    {me?.avatar_url ? (
                      <img
                        src={me.avatar_url}
                        alt=""
                        className="h-7 w-7 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-[10px] font-display tracking-widest text-white/80">
                        {(me?.display_name ?? user.email ?? "??").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <ChevronDownIcon className="hidden h-3.5 w-3.5 text-white/70 sm:block" aria-hidden="true" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel className="font-display text-[10px] tracking-widest text-white/50">
                      {me?.display_name ?? user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={goToMyProfile} className="flex items-center gap-2">
                      <PersonIcon className="h-4 w-4" aria-hidden="true" /> Meu perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/perfil" className="flex items-center gap-2">
                        <Pencil2Icon className="h-4 w-4" aria-hidden="true" /> Editar perfil
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 text-yellow-300">
                          <LockClosedIcon className="h-4 w-4" aria-hidden="true" /> Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        await signOut();
                        navigate({ to: "/" });
                      }}
                      className="flex items-center gap-2 text-red-300 focus:text-red-200"
                    >
                      <ExitIcon className="h-4 w-4" aria-hidden="true" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link
                to="/login"
                className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-ruby-gradient px-3 py-1.5 font-display text-xs tracking-widest text-white shadow-[0_0_20px_#d9003680] outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white sm:px-4 sm:py-2 sm:text-sm"
              >
                <EnterIcon className="h-4 w-4" aria-hidden="true" /> ENTRAR
              </Link>
            ))}

          {/* Mobile menu (only when logged out — logged-in uses bottom nav) */}
          {!user && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-black/40 outline-none transition hover:bg-[color:var(--ruby)]/10 focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)] md:hidden"
                aria-label="Abrir menu"
              >
                <HamburgerMenuIcon className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {publicLinks.map((l) => {
                  const Icon = l.icon;
                  return (
                    <DropdownMenuItem key={l.to} asChild>
                      <Link to={l.to} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" aria-hidden="true" /> {l.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>

    {/* Mobile bottom nav for logged-in users */}
    {user && (
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[color:var(--ruby)]/30 bg-black/85 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {[
          { to: "/feed", label: "Feed", icon: ChatBubbleIcon, exact: false },
          { to: "/comunidades", label: "Círculos", icon: GroupIcon, exact: false },
          { to: "/mensagens", label: "DM", icon: EnvelopeClosedIcon, exact: false },
          { to: "/santuario", label: "Pessoas", icon: PersonIcon, exact: false },
          { to: "/album", label: "Álbum", icon: ArchiveIcon, exact: false },
        ].map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.exact }}
              className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] tracking-widest text-white/65 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]"
              activeProps={{ className: "text-white" }}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-5 w-5 ${isActive ? "text-[color:var(--ruby)]" : ""}`} aria-hidden="true" />
                  <span>{l.label}</span>
                </>
              )}
            </Link>
          );
        })}
      </nav>
    )}
    </>
  );
}
