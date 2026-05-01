import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import ogCover from "@/assets/og-cover.jpg";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

const SITE_URL = "https://tokyofk.lovable.app";
const OG_IMAGE = `${SITE_URL}${ogCover}`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl text-ruby-gradient">404</h1>
        <h2 className="mt-2 font-display text-2xl tracking-widest text-white">PÁGINA PERDIDA NO BECO</h2>
        <p className="mt-3 text-sm text-white/60">
          Essa rua não existe no mapa de TOKYO.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-ruby-gradient px-5 py-2.5 font-display tracking-widest text-white"
        >
          VOLTAR PRO INÍCIO
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TOKYO · Comunidade Oficial" },
      { name: "description", content: "A rede social da TOKYO — perfis, álbum de cartas, revistas e mural da comunidade." },
      { name: "theme-color", content: "#0b0b10" },
      // Open Graph
      { property: "og:site_name", content: "TOKYO" },
      { property: "og:title", content: "TOKYO · Comunidade Oficial" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:description", content: "A rede social da TOKYO — perfis, álbum de cartas, revistas e mural da comunidade." },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1216" },
      { property: "og:image:height", content: "640" },
      { property: "og:image:alt", content: "TOKYO — comunidade, revista e álbum de cartas" },
      { property: "og:locale", content: "pt_BR" },
      // Twitter / X
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TOKYO · Comunidade Oficial" },
      { name: "twitter:description", content: "A rede social da TOKYO — perfis, álbum de cartas, revistas e mural da comunidade." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: SITE_URL },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head><HeadContent /></head>
      <body className="bg-black text-white antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
    <div className="grain relative min-h-screen bg-[color:var(--surface-1)]">
      {/* Ambient ruby glow background — bem sutil */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-30"
        style={{
          background:
            "radial-gradient(60% 40% at 15% 0%, #2a000a 0%, transparent 55%), radial-gradient(45% 35% at 95% 25%, #1a0006 0%, transparent 60%)",
        }}
      />
      <Navbar />
      <main className="relative z-10 pb-20 md:pb-0">
        <Outlet />
      </main>
      <footer className="relative z-10 mt-20 border-t border-[color:var(--line)] bg-[color:var(--surface-1)]/80 py-8 pb-24 text-center text-xs tracking-widest text-[color:var(--text-3)] md:pb-8">
        <p className="font-display">© TOKYO · TUDO O QUE BRILHA, CORTA.</p>
      </footer>
      <Toaster richColors position="top-right" />
    </div>
    </AuthProvider>
  );
}
