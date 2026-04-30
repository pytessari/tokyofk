import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { IMAGES, img } from "@/lib/images";
import { RichBio } from "@/components/RichBio";
import { RichCommentEditor } from "@/components/RichCommentEditor";

export type PostAuthor = {
  id: string;
  display_name: string;
  slug: string | null;
  avatar_url: string | null;
};

export type PostRow = {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author?: PostAuthor | null;
};

type Comment = { id: string; author_id: string; content: string; created_at: string; author?: PostAuthor | null };

export function PostCard({ post, onDeleted }: { post: PostRow; onDeleted?: (id: string) => void }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ count }, likedRes] = await Promise.all([
        supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("post_id", post.id),
        user ? supabase.from("post_likes").select("user_id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle()
             : Promise.resolve({ data: null } as const),
      ]);
      if (!active) return;
      setLikes(count ?? 0);
      setLiked(!!likedRes.data);
    })();
    const ch = supabase.channel(`post:${post.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes", filter: `post_id=eq.${post.id}` },
        async () => {
          const { count } = await supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("post_id", post.id);
          setLikes(count ?? 0);
        })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "post_comments", filter: `post_id=eq.${post.id}` },
        () => loadComments())
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, user?.id]);

  async function loadComments() {
    const { data } = await supabase.from("post_comments")
      .select("id, author_id, content, created_at").eq("post_id", post.id).order("created_at");
    if (!data) return;
    const ids = Array.from(new Set(data.map((c) => c.author_id)));
    const { data: profs } = await supabase.from("profiles")
      .select("id, display_name, slug, avatar_url").in("id", ids);
    const map = new Map((profs ?? []).map((p) => [p.id, p as PostAuthor]));
    setComments(data.map((c) => ({ ...c, author: map.get(c.author_id) ?? null })));
  }

  async function toggleLike() {
    if (!user) return;
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      setLiked(false); setLikes((n) => Math.max(0, n - 1));
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
      setLiked(true); setLikes((n) => n + 1);
    }
  }

  async function postComment() {
    if (!user || !draft.trim()) return;
    const content = draft.trim().slice(0, 2000);
    setDraft("");
    await supabase.from("post_comments").insert({ post_id: post.id, author_id: user.id, content });
    loadComments();
  }

  async function del() {
    if (!confirm("Excluir post?")) return;
    await supabase.from("posts").delete().eq("id", post.id);
    onDeleted?.(post.id);
  }

  const a = post.author;
  const avatarUrl = img(a?.avatar_url ?? "", IMAGES.fallback.avatar);
  const isOwn = user?.id === post.author_id;
  const date = new Date(post.created_at);

  function openComments() {
    if (!showComments) loadComments();
    setShowComments((s) => !s);
  }

  return (
    <article className="glass-dark rounded-xl p-5">
      <header className="flex items-center gap-3">
        {a?.slug ? (
          <Link to="/santuario/$slug" params={{ slug: a.slug }} className="flex items-center gap-3">
            <img src={avatarUrl} alt="" className="h-11 w-11 rounded-full border border-[color:var(--ruby)]/40 object-cover" />
            <div>
              <p className="font-display text-sm tracking-widest text-white">{a.display_name}</p>
              <p className="text-[10px] tracking-widest text-white/40">{date.toLocaleString("pt-BR")}</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <img src={avatarUrl} alt="" className="h-11 w-11 rounded-full border border-white/15 object-cover" />
            <div>
              <p className="font-display text-sm tracking-widest text-white">{a?.display_name ?? "anônimo"}</p>
              <p className="text-[10px] tracking-widest text-white/40">{date.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        )}
        {isOwn && (
          <button onClick={del} className="ml-auto text-[10px] uppercase tracking-widest text-white/40 hover:text-red-300">
            excluir
          </button>
        )}
      </header>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/90">{post.content}</p>
      {post.image_url && (
        <img src={post.image_url} alt="" className="mt-3 max-h-[480px] w-full rounded-lg border border-white/10 object-cover" />
      )}

      <div className="mt-4 flex items-center gap-4 border-t border-white/10 pt-3 text-xs">
        <button onClick={toggleLike} disabled={!user}
          className={`flex items-center gap-1.5 font-display tracking-widest transition ${liked ? "text-[color:var(--ruby)]" : "text-white/60 hover:text-white"}`}>
          <span>{liked ? "♥" : "♡"}</span>
          <span>{likes}</span>
        </button>
        <button onClick={openComments}
          className="flex items-center gap-1.5 font-display tracking-widest text-white/60 hover:text-white">
          <span>💬</span><span>COMENTAR</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 text-sm">
              <img src={img(c.author?.avatar_url ?? "", IMAGES.fallback.avatar)} alt="" className="h-7 w-7 rounded-full border border-white/15 object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] tracking-widest text-white/50">
                  {c.author?.slug ? <Link to="/santuario/$slug" params={{ slug: c.author.slug }} className="hover:underline">{c.author.display_name}</Link> : c.author?.display_name}
                </p>
                <RichBio html={c.content} fallback="" />
              </div>
            </div>
          ))}
          {user && (
            <RichCommentEditor
              value={draft}
              onChange={setDraft}
              onSubmit={postComment}
              placeholder="responder com texto, imagem ou GIF…"
              compact
            />
          )}
        </div>
      )}
    </article>
  );
}
