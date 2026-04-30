import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PaperPlaneIcon, PersonIcon } from "@radix-ui/react-icons";
import { timeAgo } from "@/lib/timeAgo";
import { toast } from "sonner";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Profile = {
  id: string;
  display_name: string;
  slug: string | null;
  avatar_url: string | null;
};

export function ConversationView({
  conversationId,
  title,
}: {
  conversationId: string;
  title: string;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadProfiles(ids: string[]) {
    if (!ids.length) return;
    const missing = ids.filter((id) => !profiles.has(id));
    if (!missing.length) return;
    const { data } = await supabase
      .from("profiles")
      .select("id,display_name,slug,avatar_url")
      .in("id", missing);
    setProfiles((prev) => {
      const next = new Map(prev);
      (data ?? []).forEach((p) => next.set(p.id, p));
      return next;
    });
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!active) return;
      const msgs = (data ?? []) as Message[];
      setMessages(msgs);
      await loadProfiles(Array.from(new Set(msgs.map((m) => m.sender_id))));
      // mark read
      if (user) {
        await supabase
          .from("conversation_participants")
          .update({ last_read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .eq("user_id", user.id);
      }
    })();

    const ch = supabase
      .channel(`conv:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          await loadProfiles([m.sender_id]);
          if (user && m.sender_id !== user.id) {
            await supabase
              .from("conversation_participants")
              .update({ last_read_at: new Date().toISOString() })
              .eq("conversation_id", conversationId)
              .eq("user_id", user.id);
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !draft.trim()) return;
    setSending(true);
    const content = draft.trim();
    setDraft("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      setDraft(content);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-white/10 bg-black/30 px-4 py-3">
        <p className="font-display text-sm tracking-widest text-white">{title.toUpperCase()}</p>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-12 text-center text-xs text-[color:var(--text-3)]">
            Diga oi 👋
          </p>
        )}
        {messages.map((m) => {
          const isMe = m.sender_id === user?.id;
          const prof = profiles.get(m.sender_id);
          return (
            <div key={m.id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[color:var(--surface-3)]">
                  {prof?.avatar_url ? (
                    <img src={prof.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <PersonIcon className="m-1.5 h-4 w-4 text-[color:var(--text-3)]" />
                  )}
                </div>
              )}
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                {!isMe && (
                  <span className="mb-0.5 text-[10px] tracking-wide text-[color:var(--text-3)]">
                    {prof?.display_name ?? "—"}
                  </span>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 text-sm ${
                    isMe
                      ? "bg-[color:var(--ruby)] text-white rounded-br-sm"
                      : "bg-[color:var(--surface-3)] text-white/90 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                <span className="mt-0.5 text-[10px] text-[color:var(--text-3)]">{timeAgo(m.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-white/10 bg-black/30 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escreva uma mensagem…"
          className="flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ruby)]"
          aria-label="Mensagem"
        />
        <Button type="submit" variant="primary" loading={sending} disabled={!draft.trim()}>
          <PaperPlaneIcon className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
