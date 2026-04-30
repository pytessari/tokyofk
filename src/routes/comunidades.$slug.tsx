import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/kit/SectionCard";
import { EmptyState } from "@/components/kit/EmptyState";
import { GroupIcon, ChatBubbleIcon, PersonIcon, ExitIcon, EnterIcon, PlusIcon, Pencil1Icon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { timeAgo } from "@/lib/timeAgo";
import { RichBio } from "@/components/RichBio";
import { RichCommentEditor } from "@/components/RichCommentEditor";
import { CommunityEditDialog } from "@/components/CommunityEditDialog";

type Community = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  rules: string | null;
  category: string | null;
  icon_url: string | null;
  banner_url: string | null;
  owner_id: string;
  members_count: number;
  created_at: string;
};

type Post = {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  author_id: string;
  author?: { display_name: string; slug: string | null; avatar_url: string | null };
};

type Member = {
  user_id: string;
  role: string;
  profile?: { display_name: string; slug: string | null; avatar_url: string | null };
};

export const Route = createFileRoute("/comunidades/$slug")({
  component: CommunityDetail,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl p-6 text-red-300">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl p-6">
      <p className="font-display text-lg">Comunidade não encontrada.</p>
      <Link to="/comunidades" className="text-[color:var(--ruby)] underline">
        Voltar para Comunidades
      </Link>
    </div>
  ),
});

function CommunityDetail() {
  const { slug } = useParams({ from: "/comunidades/$slug" });
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);

  const isOwner = !!user && !!community && community.owner_id === user.id;

  async function load() {
    setLoading(true);
    const { data: c } = await supabase
      .from("communities")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (!c) {
      setLoading(false);
      return;
    }
    setCommunity(c as Community);

    const [{ data: p }, { data: m }] = await Promise.all([
      supabase
        .from("community_posts")
        .select("id,title,content,created_at,author_id")
        .eq("community_id", c.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("community_members")
        .select("user_id,role")
        .eq("community_id", c.id)
        .order("joined_at", { ascending: false })
        .limit(500),
    ]);

    const ids = Array.from(
      new Set([...(p ?? []).map((x) => x.author_id), ...(m ?? []).map((x) => x.user_id)]),
    );
    let profilesMap = new Map<string, { display_name: string; slug: string | null; avatar_url: string | null }>();
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,display_name,slug,avatar_url")
        .in("id", ids);
      profilesMap = new Map((profs ?? []).map((x) => [x.id, x]));
    }

    setPosts((p ?? []).map((x) => ({ ...x, author: profilesMap.get(x.author_id) })));
    setMembers((m ?? []).map((x) => ({ ...x, profile: profilesMap.get(x.user_id) })));

    if (user) {
      const { data: mm } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", c.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setIsMember(!!mm);
    } else {
      setIsMember(false);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [slug, user]);

  async function join() {
    if (!user || !community) return;
    const { error } = await supabase
      .from("community_members")
      .insert({ community_id: community.id, user_id: user.id, role: "member" });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vindo!");
    load();
  }

  async function leave() {
    if (!user || !community) return;
    if (community.owner_id === user.id) {
      toast.error("Você é o dono. Transfira ou exclua a comunidade.");
      return;
    }
    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("community_id", community.id)
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    load();
  }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !community || !draft.content.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("community_posts").insert({
      community_id: community.id,
      author_id: user.id,
      title: draft.title.trim() || null,
      content: draft.content.trim(),
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft({ title: "", content: "" });
    load();
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl p-6 text-[color:var(--text-3)]">Carregando…</div>;
  }
  if (!community) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="font-display text-lg">Comunidade não encontrada.</p>
        <Link to="/comunidades" className="text-[color:var(--ruby)] underline">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div
        className="relative mb-6 h-44 overflow-hidden rounded-lg border border-white/10 bg-cover bg-center sm:h-56"
        style={{
          backgroundImage: community.banner_url
            ? `url(${community.banner_url})`
            : "linear-gradient(135deg, var(--ruby), #1a1a1a)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-white/20 bg-black">
            {community.icon_url ? (
              <img src={community.icon_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[color:var(--surface-3)] text-[color:var(--ruby)]">
                <GroupIcon className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {community.category && (
              <p className="text-[10px] uppercase tracking-widest text-[color:var(--ruby)]">
                {community.category}
              </p>
            )}
            <h1 className="font-display text-2xl text-white sm:text-3xl">{community.name}</h1>
            {community.tagline && (
              <p className="mt-1 text-sm text-white/80">{community.tagline}</p>
            )}
            <p className="mt-1 text-xs text-white/60">
              <PersonIcon className="mr-1 inline h-3 w-3" />
              {community.members_count} membros
            </p>
          </div>
          <div className="hidden sm:flex sm:flex-col sm:items-end sm:gap-2">
            {isOwner && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil1Icon className="mr-1 h-4 w-4" /> Editar
              </Button>
            )}
            {user ? (
              isMember ? (
                <Button variant="outline" onClick={leave}>
                  <ExitIcon className="mr-1 h-4 w-4" /> Sair
                </Button>
              ) : (
                <Button variant="primary" onClick={join}>
                  <EnterIcon className="mr-1 h-4 w-4" /> Entrar
                </Button>
              )
            ) : (
              <Button asChild variant="primary">
                <Link to="/login">Entrar para participar</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-2 sm:hidden">
        {isOwner && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil1Icon className="mr-1 h-4 w-4" /> Editar
          </Button>
        )}
        {user ? (
          isMember ? (
            <Button variant="outline" onClick={leave}>
              <ExitIcon className="mr-1 h-4 w-4" /> Sair
            </Button>
          ) : (
            <Button variant="primary" onClick={join}>
              <EnterIcon className="mr-1 h-4 w-4" /> Entrar
            </Button>
          )
        ) : (
          <Button asChild variant="primary">
            <Link to="/login">Entrar</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {isMember && (
            <SectionCard title="Postar na comunidade">
              <form onSubmit={submitPost} className="space-y-2">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Título (opcional)"
                  className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ruby)]"
                />
                <textarea
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                  placeholder="O que tá rolando?"
                  required
                  rows={4}
                  className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ruby)]"
                />
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" loading={posting}>
                    <PlusIcon className="mr-1 h-4 w-4" /> Publicar
                  </Button>
                </div>
              </form>
            </SectionCard>
          )}

          <SectionCard title={`Posts (${posts.length})`}>
            {posts.length === 0 ? (
              <EmptyState
                icon={<ChatBubbleIcon className="h-5 w-5" />}
                title="Sem posts ainda"
                description={isMember ? "Quebra o gelo!" : "Entre na comunidade pra postar."}
              />
            ) : (
              <ul className="space-y-4">
                {posts.map((p) => (
                  <CommunityPostItem key={p.id} post={p} canComment={isMember} currentUserId={user?.id ?? null} />
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <aside className="space-y-6">
          {community.description && (
            <SectionCard title="Sobre">
              <p className="whitespace-pre-wrap text-sm text-[color:var(--text-2)]">
                {community.description}
              </p>
            </SectionCard>
          )}
          {community.rules && (
            <SectionCard title="Regras">
              <p className="whitespace-pre-wrap text-sm text-[color:var(--text-2)]">{community.rules}</p>
            </SectionCard>
          )}
          <SectionCard title={`Membros (${community.members_count})`}>
            <ul className="space-y-2">
              {(showAllMembers ? members : members.slice(0, 12)).map((m) => (
                <li key={m.user_id} className="flex items-center gap-2 text-sm">
                  {m.profile?.avatar_url ? (
                    <img src={m.profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-[color:var(--surface-3)]" />
                  )}
                  {m.profile?.slug ? (
                    <Link to="/santuario/$slug" params={{ slug: m.profile.slug }} className="truncate hover:underline">
                      {m.profile.display_name}
                    </Link>
                  ) : (
                    <span className="truncate">{m.profile?.display_name ?? "—"}</span>
                  )}
                  {m.role !== "member" && (
                    <span className="ml-auto rounded bg-[color:var(--ruby)]/20 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-[color:var(--ruby)]">
                      {m.role}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {members.length > 12 && (
              <button
                onClick={() => setShowAllMembers((s) => !s)}
                className="mt-3 w-full rounded border border-white/10 py-1.5 text-[10px] uppercase tracking-widest text-[color:var(--text-3)] hover:bg-white/5 hover:text-white"
              >
                {showAllMembers ? "Ver menos" : `Ver todos (${members.length})`}
              </button>
            )}
          </SectionCard>
        </aside>
      </div>

      {editing && community && (
        <CommunityEditDialog
          community={community}
          onClose={() => setEditing(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

type CommentRow = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: { display_name: string; slug: string | null; avatar_url: string | null };
};

function CommunityPostItem({
  post,
  canComment,
  currentUserId,
}: {
  post: Post;
  canComment: boolean;
  currentUserId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { count: c } = await supabase
        .from("community_post_comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);
      setCount(c ?? 0);
    })();
  }, [post.id]);

  async function loadComments() {
    const { data } = await supabase
      .from("community_post_comments")
      .select("id,author_id,content,created_at")
      .eq("post_id", post.id)
      .order("created_at");
    if (!data) return;
    const ids = Array.from(new Set(data.map((c) => c.author_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,display_name,slug,avatar_url")
      .in("id", ids);
    const map = new Map((profs ?? []).map((p) => [p.id, p]));
    setComments(
      data.map((c) => ({ ...c, author: map.get(c.author_id) ?? undefined })),
    );
    setCount(data.length);
  }

  async function toggle() {
    if (!open) await loadComments();
    setOpen((s) => !s);
  }

  async function send() {
    if (!currentUserId || !draft.trim()) return;
    setSending(true);
    const { error } = await supabase.from("community_post_comments").insert({
      post_id: post.id,
      author_id: currentUserId,
      content: draft.trim().slice(0, 2000),
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft("");
    loadComments();
  }

  return (
    <li className="rounded-md border border-white/10 bg-black/30 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-[color:var(--text-3)]">
        {post.author?.avatar_url ? (
          <img src={post.author.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <div className="h-6 w-6 rounded-full bg-[color:var(--surface-3)]" />
        )}
        {post.author?.slug ? (
          <Link to="/santuario/$slug" params={{ slug: post.author.slug }} className="font-medium text-white hover:underline">
            {post.author.display_name}
          </Link>
        ) : (
          <span className="text-white">{post.author?.display_name ?? "Anônimo"}</span>
        )}
        <span>·</span>
        <span>{timeAgo(post.created_at)}</span>
      </div>
      {post.title && <h3 className="mb-1 font-display text-sm">{post.title}</h3>}
      <p className="whitespace-pre-wrap text-sm text-white/90">{post.content}</p>

      <div className="mt-3 border-t border-white/10 pt-2">
        <button
          onClick={toggle}
          className="flex items-center gap-1.5 font-display text-[10px] tracking-widest text-white/60 hover:text-white"
        >
          <ChatBubbleIcon className="h-3 w-3" />
          {count ?? "—"} COMENTÁRIO{(count ?? 0) === 1 ? "" : "S"}
        </button>

        {open && (
          <div className="mt-3 space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2 text-sm">
                {c.author?.avatar_url ? (
                  <img src={c.author.avatar_url} alt="" className="h-7 w-7 rounded-full border border-white/15 object-cover" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-[color:var(--surface-3)]" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] tracking-widest text-white/50">
                    {c.author?.slug ? (
                      <Link to="/santuario/$slug" params={{ slug: c.author.slug }} className="hover:underline">
                        {c.author.display_name}
                      </Link>
                    ) : (
                      c.author?.display_name ?? "anônimo"
                    )}
                    <span className="ml-2 text-white/30">{timeAgo(c.created_at)}</span>
                  </p>
                  <RichBio html={c.content} fallback="" />
                </div>
              </div>
            ))}
            {currentUserId && canComment ? (
              <RichCommentEditor
                value={draft}
                onChange={setDraft}
                onSubmit={send}
                submitting={sending}
                placeholder="comentar com texto, imagem ou GIF…"
                compact
              />
            ) : (
              <p className="text-[11px] text-white/40">
                {currentUserId ? "Entre na comunidade pra comentar." : "Faça login pra comentar."}
              </p>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
