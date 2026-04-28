import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth";

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
      { name: "description", content: "Portal da comunidade TOKYO — revistas, membros, álbum de cards e webtoon." },
      { name: "theme-color", content: "#000000" },
      { property: "og:title", content: "TOKYO · Comunidade Oficial" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "TOKYO · Comunidade Oficial" },
      { property: "og:description", content: "Portal da comunidade TOKYO — revistas, membros, álbum de cards e webtoon." },
      { name: "twitter:description", content: "Portal da comunidade TOKYO — revistas, membros, álbum de cards e webtoon." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c7a995e3-5788-4979-adac-b1d39624e8b3/id-preview-d00ebf0c--5e9e417c-b27d-4581-849f-6d0efd8fde8d.lovable.app-1777336866043.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c7a995e3-5788-4979-adac-b1d39624e8b3/id-preview-d00ebf0c--5e9e417c-b27d-4581-849f-6d0efd8fde8d.lovable.app-1777336866043.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
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
    <div className="grain relative min-h-screen bg-black">
      {/* Ambient ruby glow background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 40% at 20% 0%, #4a000f 0%, transparent 60%), radial-gradient(50% 40% at 90% 30%, #2d000a 0%, transparent 60%), radial-gradient(80% 60% at 50% 100%, #1a0006 0%, transparent 70%)",
        }}
      />
      <Navbar />
      <main className="relative z-10">
        <Outlet />
      </main>
      <footer className="relative z-10 mt-20 border-t border-[color:var(--ruby)]/30 bg-black/60 py-8 text-center text-xs tracking-widest text-white/50">
        <p className="font-display">© TOKYO · TUDO O QUE BRILHA, CORTA.</p>
      </footer>
    </div>
    </AuthProvider>
  );
}
