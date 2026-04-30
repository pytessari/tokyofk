import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil2Icon, PersonIcon, ChatBubbleIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PostComposer } from "@/components/PostComposer";
import { PostCard, type PostRow, type PostAuthor } from "@/components/PostCard";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { PageHeader } from "@/components/kit/PageHeader";
import { TabBar } from "@/components/kit/TabBar";
import { EmptyState } from "@/components/kit/EmptyState";

export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [{ title: "Feed · TOKYO" }] }),
  component: FeedPage,
});

type Tab = "all" | "following";

function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("all");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    let query = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
    if (tab === "following" && user) {
      const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const ids = (f ?? []).map((r) => r.following_id);
      ids.push(user.id); // include yourself
      query = query.in("author_id", ids);
    }
    const { data } = await query;
    const list = (data ?? []) as PostRow[];

    const authorIds = Array.from(new Set(list.map((p) => p.author_id)));
    if (authorIds.length > 0) {
      const { data: profs } = await supabase.from("profiles")
        .select("id, display_name, slug, avatar_url").in("id", authorIds);
      const map = new Map((profs ?? []).map((p) => [p.id, p as PostAuthor]));
      setPosts(list.map((p) => ({ ...p, author: map.get(p.author_id) ?? null })));
    } else setPosts(list);
    setLoading(false);
  }

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [tab, user?.id]);

  // realtime: novos posts
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("feed-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user?.id, tab]);

  if (authLoading) {
    return <div className="px-5 py-20 text-center font-display tracking-widest text-white/60">CARREGANDO…</div>;
  }
  if (!user) return <LoggedOutGate title="FEED FECHADO" message="Entre pra ver o feed da comunidade e postar." />;

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <PageHeader
        eyebrow="A COMUNIDADE"
        title="Feed · Tokyo"
        description="Veja o que está rolando e compartilhe com os outros membros."
      />

      {/* Atalhos rápidos — sensação de painel */}
      <nav
        aria-label="Atalhos rápidos"
        className="panel mb-4 flex flex-wrap items-center gap-2 p-2"
      >
        <Link
          to="/santuario"
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--line)] px-3 py-1.5 text-xs text-[color:var(--text-2)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-1)]"
        >
          <PersonIcon className="h-3.5 w-3.5" aria-hidden="true" /> Santuário
        </Link>
        <Link
          to="/perfil"
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--line)] px-3 py-1.5 text-xs text-[color:var(--text-2)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-1)]"
        >
          <Pencil2Icon className="h-3.5 w-3.5" aria-hidden="true" /> Editar perfil
        </Link>
        <span className="ml-auto inline-flex items-center gap-1 self-center text-[10px] tracking-widest text-[color:var(--text-3)]">
          <ChatBubbleIcon className="h-3 w-3" aria-hidden="true" /> POSTANDO COMO {user.email?.split("@")[0]}
        </span>
      </nav>

      <PostComposer onPosted={load} />

      <div className="mt-6 mb-4">
        <TabBar
          ariaLabel="Filtros do feed"
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          items={[
            { value: "all", label: "Tudo" },
            { value: "following", label: "Quem eu sigo" },
          ]}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-28 w-full" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<ChatBubbleIcon className="h-5 w-5" />}
          title="Sem posts por aqui"
          description={
            tab === "following" ? (
              <>
                Você ainda não segue ninguém.{" "}
                <Link to="/santuario" className="text-[color:var(--ruby)] hover:underline">
                  Conheça os membros →
                </Link>
              </>
            ) : (
              "Seja o primeiro a postar!"
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}
