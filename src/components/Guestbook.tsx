import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/useRole";

type Entry = {
  id: string;
  profile_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: { display_name: string; slug: string | null; avatar_url: string | null } | null;
};

export function Guestbook({ profileId, ownerId }: { profileId: string; ownerId: string }) {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("guestbook")
      .select("id, profile_id, author_id, content, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!data) { setEntries([]); setLoading(false); return; }
    const authorIds = Array.from(new Set(data.map((d) => d.author_id)));
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, display_name, slug, avatar_url")
      .in("id", authorIds);
    const map = new Map((authors ?? []).map((a) => [a.id, a]));
    setEntries(data.map((d) => ({ ...d, author: map.get(d.author_id) as Entry["author"] ?? null })));
    setLoading(false);
  }

  useEffect(() => { load(); }, [profileId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setPosting(true);
    await supabase.from("guestbook").insert({
      profile_id: profileId,
      author_id: user.id,
      content: text.trim(),
    });
    setText("");
    setPosting(false);
    load();
  }

  async function onDelete(id: string) {
    await supabase.from("guestbook").delete().eq("id", id);
    setEntries(entries.filter((e) => e.id !== id));
  }

  return (
    <section className="glass-dark rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl tracking-widest text-[color:var(--chrome)]">▎MURAL DE RECADOS</h2>
        <span className="font-display text-[10px] tracking-widest text-white/40">{entries.length} RECADO(S)</span>
      </div>

      {user ? (
        <form onSubmit={onSubmit} className="mb-4 space-y-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            maxLength={500} rows={3} placeholder="Deixe um recado…"
            className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[color:var(--ruby)]" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] tracking-widest text-white/40">{text.length}/500</span>
            <button disabled={posting || !text.trim()}
              className="rounded-md bg-ruby-gradient px-4 py-1.5 font-display text-xs tracking-widest text-white disabled:opacity-50">
              {posting ? "ENVIANDO…" : "DEIXAR RECADO"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-4 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/60">
          <Link to="/login" className="text-[color:var(--ruby)] underline">Entre</Link> pra deixar um recado.
        </p>
      )}

      {loading ? (
        <p className="text-xs text-white/40">Carregando…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-white/40">Nenhum recado ainda. Seja o primeiro.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => {
            const canDelete = user && (user.id === e.author_id || user.id === ownerId || isAdmin);
            return (
              <li key={e.id} className="flex gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
                <img src={e.author?.avatar_url || "https://api.dicebear.com/9.x/shapes/svg?seed=tokyo"}
                  alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {e.author?.slug ? (
                      <Link to="/santuario/$slug" params={{ slug: e.author.slug }}
                        className="font-display text-xs tracking-widest text-[color:var(--ruby)] hover:underline">
                        {(e.author.display_name || "Anônimo").toUpperCase()}
                      </Link>
                    ) : (
                      <span className="font-display text-xs tracking-widest text-white/80">
                        {(e.author?.display_name || "Anônimo").toUpperCase()}
                      </span>
                    )}
                    <span className="text-[10px] text-white/30">
                      {new Date(e.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                    {canDelete && (
                      <button onClick={() => onDelete(e.id)}
                        className="ml-auto text-[10px] text-white/40 hover:text-red-400">excluir</button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-white/85">{e.content}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
