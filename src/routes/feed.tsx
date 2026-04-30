import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PostComposer } from "@/components/PostComposer";
import { PostCard, type PostRow, type PostAuthor } from "@/components/PostCard";
import { LoggedOutGate } from "@/components/LoggedOutGate";

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
      <div className="mb-5">
        <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">A COMUNIDADE</p>
        <h1 className="mt-1 font-display text-4xl text-ruby-gradient">FEED · TOKYO</h1>
      </div>

      <PostComposer onPosted={load} />

      <div className="mt-6 mb-3 flex gap-2 border-b border-white/10">
        {(["all", "following"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 font-display text-xs tracking-widest transition ${
              tab === t ? "border-b-2 border-[color:var(--ruby)] text-white" : "text-white/50 hover:text-white"
            }`}>
            {t === "all" ? "TUDO" : "QUEM EU SIGO"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-white/50">carregando…</p>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-display text-sm tracking-widest text-white/60">SEM POSTS POR AQUI</p>
          <p className="mt-2 text-xs text-white/40">
            {tab === "following"
              ? <>Você ainda não segue ninguém. <Link to="/santuario" className="text-[color:var(--ruby)] hover:underline">Conheça os membros →</Link></>
              : "Seja o primeiro a postar!"}
          </p>
        </div>
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
