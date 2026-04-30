import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  PaperPlaneIcon,
  PersonIcon,
  PlusIcon,
  Cross2Icon,
  ImageIcon,
  FileIcon,
  SpeakerLoudIcon,
  ChatBubbleIcon,
  Pencil1Icon,
  TrashIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";
import { timeAgo } from "@/lib/timeAgo";
import { toast } from "sonner";
import { MessageContent } from "./MessageContent";
import { EmojiPickerPopover } from "./EmojiPickerPopover";
import { useCustomEmojis } from "@/lib/useCustomEmojis";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  reply_to: string | null;
};

type Attachment = {
  id: string;
  message_id: string;
  url: string;
  kind: "image" | "file" | "audio";
  mime_type: string | null;
  size_bytes: number | null;
  name: string | null;
};

type Reaction = { message_id: string; user_id: string; emoji: string };

type Profile = {
  id: string;
  display_name: string;
  slug: string | null;
  avatar_url: string | null;
};

const MAX_FILE_MB = 25;

export function ConversationView({
  conversationId,
  title,
  onBack,
}: {
  conversationId: string;
  title: string;
  onBack?: () => void;
}) {
  const { user } = useAuth();
  const { emojis } = useCustomEmojis();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [attachments, setAttachments] = useState<Map<string, Attachment[]>>(new Map());
  const [reactions, setReactions] = useState<Map<string, Reaction[]>>(new Map());
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);

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

  async function loadAttachments(messageIds: string[]) {
    if (!messageIds.length) return;
    const { data } = await supabase
      .from("message_attachments")
      .select("*")
      .in("message_id", messageIds);
    const map = new Map<string, Attachment[]>();
    (data ?? []).forEach((a) => {
      const arr = map.get(a.message_id) ?? [];
      arr.push(a as Attachment);
      map.set(a.message_id, arr);
    });
    setAttachments(map);
  }

  async function loadReactions(messageIds: string[]) {
    if (!messageIds.length) return;
    const { data } = await supabase
      .from("message_reactions")
      .select("*")
      .in("message_id", messageIds);
    const map = new Map<string, Reaction[]>();
    (data ?? []).forEach((r) => {
      const arr = map.get(r.message_id) ?? [];
      arr.push(r as Reaction);
      map.set(r.message_id, arr);
    });
    setReactions(map);
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
      const ids = msgs.map((m) => m.id);
      await Promise.all([
        loadProfiles(Array.from(new Set(msgs.map((m) => m.sender_id)))),
        loadAttachments(ids),
        loadReactions(ids),
      ]);
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
          await Promise.all([loadProfiles([m.sender_id]), loadAttachments([m.id])]);
          if (user && m.sender_id !== user.id) {
            await supabase
              .from("conversation_participants")
              .update({ last_read_at: new Date().toISOString() })
              .eq("conversation_id", conversationId)
              .eq("user_id", user.id);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        async () => {
          const ids = (await currentIds());
          if (ids.length) loadReactions(ids);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_attachments" },
        async () => {
          const ids = (await currentIds());
          if (ids.length) loadAttachments(ids);
        },
      )
      .subscribe();

    async function currentIds(): Promise<string[]> {
      // pega ids atuais via state
      return new Promise((resolve) => {
        setMessages((prev) => {
          resolve(prev.map((m) => m.id));
          return prev;
        });
      });
    }

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // -------- Send / Edit --------
  async function send(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!user || (!draft.trim() && pendingFiles.length === 0)) return;
    setSending(true);
    const content = draft.trim();
    const filesToSend = pendingFiles;
    const replyId = replyTo?.id ?? null;
    setDraft("");
    setPendingFiles([]);
    setReplyTo(null);

    if (editingId) {
      const { error } = await supabase
        .from("messages")
        .update({ content, edited_at: new Date().toISOString() })
        .eq("id", editingId);
      setEditingId(null);
      setSending(false);
      if (error) toast.error(error.message);
      return;
    }

    const { data: msg, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content || "",
        reply_to: replyId,
      })
      .select()
      .single();

    if (error || !msg) {
      setSending(false);
      toast.error(error?.message ?? "erro ao enviar");
      setDraft(content);
      setPendingFiles(filesToSend);
      return;
    }

    // Upload de anexos
    for (const f of filesToSend) {
      try {
        const ext = (f.name.split(".").pop() ?? "bin").toLowerCase();
        const path = `${user.id}/${msg.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("dm-attachments")
          .upload(path, f, { contentType: f.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("dm-attachments").getPublicUrl(path);
        const kind: Attachment["kind"] = f.type.startsWith("image/")
          ? "image"
          : f.type.startsWith("audio/")
            ? "audio"
            : "file";
        await supabase.from("message_attachments").insert({
          message_id: msg.id,
          url: pub.publicUrl,
          kind,
          mime_type: f.type,
          size_bytes: f.size,
          name: f.name,
        });
      } catch (err) {
        const m = err instanceof Error ? err.message : "erro upload";
        toast.error(m);
      }
    }
    setSending(false);
  }

  function startEdit(m: Message) {
    if (m.sender_id !== user?.id) return;
    setEditingId(m.id);
    setReplyTo(null);
    setDraft(m.content);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function deleteMsg(m: Message) {
    if (m.sender_id !== user?.id) return;
    if (!confirm("Apagar mensagem?")) return;
    await supabase
      .from("messages")
      .update({ content: "", deleted_at: new Date().toISOString() })
      .eq("id", m.id);
  }

  // -------- Files --------
  function pickFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).filter((f) => {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`${f.name} > ${MAX_FILE_MB}MB`);
        return false;
      }
      return true;
    });
    setPendingFiles((p) => [...p, ...arr].slice(0, 8));
  }

  // -------- Audio recording --------
  async function toggleRecord() {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: blob.type });
        setPendingFiles((p) => [...p, file]);
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        recorderRef.current = null;
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (e) {
      toast.error("Microfone não disponível");
    }
  }

  // -------- Reactions --------
  async function toggleReaction(messageId: string, emoji: string) {
    if (!user) return;
    const my = reactions.get(messageId)?.find((r) => r.user_id === user.id && r.emoji === emoji);
    if (my) {
      await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
    } else {
      await supabase.from("message_reactions").insert({ message_id: messageId, user_id: user.id, emoji });
    }
  }

  // -------- Insert in input (emoji etc) --------
  function insertAtCaret(text: string) {
    const el = inputRef.current;
    if (!el) { setDraft((d) => d + text); return; }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + text + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  }

  const messagesById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-white/10 bg-black/30 px-3 py-3 sm:px-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/80 hover:bg-white/10 lg:hidden"
            aria-label="Voltar"
          >
            ←
          </button>
        )}
        <p className="truncate font-display text-sm tracking-widest text-white">{title.toUpperCase()}</p>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
        {messages.length === 0 && (
          <p className="py-12 text-center text-xs text-[color:var(--text-3)]">Diga oi 👋</p>
        )}
        {messages.map((m, idx) => {
          const isMe = m.sender_id === user?.id;
          const prof = profiles.get(m.sender_id);
          const prev = messages[idx - 1];
          const groupWithPrev =
            prev &&
            prev.sender_id === m.sender_id &&
            new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000;
          const replyMsg = m.reply_to ? messagesById.get(m.reply_to) : null;
          const replyAuthor = replyMsg ? profiles.get(replyMsg.sender_id) : null;
          return (
            <MessageBubble
              key={m.id}
              msg={m}
              isMe={isMe}
              author={prof}
              groupWithPrev={!!groupWithPrev}
              attachments={attachments.get(m.id) ?? []}
              reactions={reactions.get(m.id) ?? []}
              currentUserId={user?.id ?? ""}
              emojis={emojis}
              replyMsg={replyMsg ?? null}
              replyAuthor={replyAuthor ?? null}
              onReply={() => { setReplyTo(m); setEditingId(null); inputRef.current?.focus(); }}
              onEdit={() => startEdit(m)}
              onDelete={() => deleteMsg(m)}
              onReact={(emoji) => toggleReaction(m.id, emoji)}
            />
          );
        })}
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 border-t border-white/10 bg-black/40 px-3 py-2 text-xs">
          <ReaderIcon className="h-3.5 w-3.5 text-[color:var(--ruby)]" />
          <span className="text-white/60">
            Respondendo a{" "}
            <span className="text-white">{profiles.get(replyTo.sender_id)?.display_name ?? "—"}</span>
            : <span className="text-white/50">"{replyTo.content.slice(0, 60)}"</span>
          </span>
          <button onClick={() => setReplyTo(null)} className="ml-auto text-white/50 hover:text-white" aria-label="Cancelar reply">
            <Cross2Icon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Editing preview */}
      {editingId && (
        <div className="flex items-center gap-2 border-t border-white/10 bg-amber-500/10 px-3 py-2 text-xs">
          <Pencil1Icon className="h-3.5 w-3.5 text-amber-300" />
          <span className="text-white/70">Editando mensagem</span>
          <button
            onClick={() => { setEditingId(null); setDraft(""); }}
            className="ml-auto text-white/50 hover:text-white"
            aria-label="Cancelar edição"
          >
            <Cross2Icon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-white/10 bg-black/40 px-3 py-2">
          {pendingFiles.map((f, i) => (
            <PendingFileChip
              key={i}
              file={f}
              onRemove={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}
            />
          ))}
        </div>
      )}

      <form onSubmit={send} className="flex items-end gap-2 border-t border-white/10 bg-black/30 p-3">
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { pickFiles(e.target.files); if (fileRef.current) fileRef.current.value = ""; }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/30 text-white/70 hover:text-white"
          aria-label="Anexar arquivo"
          title="Anexar"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={toggleRecord}
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 ${recording ? "bg-red-600 text-white animate-pulse" : "bg-black/30 text-white/70 hover:text-white"}`}
          aria-label={recording ? "Parar gravação" : "Gravar áudio"}
          title={recording ? "Parar" : "Gravar áudio"}
        >
          <SpeakerLoudIcon className="h-4 w-4" />
        </button>
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          placeholder="Mensagem… (markdown: **negrito** *itálico* `code` ||spoiler||)"
          className="flex-1 resize-none rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ruby)]"
          style={{ maxHeight: 160 }}
          aria-label="Mensagem"
        />
        <EmojiPickerPopover onPick={insertAtCaret} />
        <Button type="submit" variant="primary" loading={sending} disabled={!draft.trim() && pendingFiles.length === 0}>
          <PaperPlaneIcon className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({
  msg,
  isMe,
  author,
  groupWithPrev,
  attachments,
  reactions,
  currentUserId,
  emojis,
  replyMsg,
  replyAuthor,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: {
  msg: Message;
  isMe: boolean;
  author: Profile | undefined;
  groupWithPrev: boolean;
  attachments: Attachment[];
  reactions: Reaction[];
  currentUserId: string;
  emojis: Map<string, { shortcode: string; url: string; is_animated: boolean }>;
  replyMsg: Message | null;
  replyAuthor: Profile | null;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [reactOpen, setReactOpen] = useState(false);

  // Agrupar reactions por emoji
  const grouped = useMemo(() => {
    const m = new Map<string, Reaction[]>();
    reactions.forEach((r) => {
      const arr = m.get(r.emoji) ?? [];
      arr.push(r);
      m.set(r.emoji, arr);
    });
    return Array.from(m.entries());
  }, [reactions]);

  if (msg.deleted_at) {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} px-1`}>
        <p className="text-[11px] italic text-white/30">mensagem apagada</p>
      </div>
    );
  }

  return (
    <div
      className={`group/msg relative flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${groupWithPrev ? "" : "mt-2"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setReactOpen(false); }}
    >
      <div className="w-7 shrink-0">
        {!groupWithPrev && (
          <div className="h-7 w-7 overflow-hidden rounded-full bg-[color:var(--surface-3)]">
            {author?.avatar_url ? (
              <img src={author.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <PersonIcon className="m-1.5 h-4 w-4 text-[color:var(--text-3)]" />
            )}
          </div>
        )}
      </div>

      <div className={`flex max-w-[75%] flex-col ${isMe ? "items-end" : "items-start"}`}>
        {!groupWithPrev && !isMe && (
          <span className="mb-0.5 text-[10px] tracking-wide text-[color:var(--text-3)]">
            {author?.display_name ?? "—"}
          </span>
        )}

        {replyMsg && (
          <div className={`mb-0.5 max-w-full rounded-md border-l-2 border-[color:var(--ruby)] bg-black/30 px-2 py-1 text-[11px] text-white/60 ${isMe ? "text-right" : ""}`}>
            <span className="text-[color:var(--ruby)]">↩ {replyAuthor?.display_name ?? "—"}</span>{" "}
            <span className="text-white/50">{(replyMsg.content || "[anexo]").slice(0, 80)}</span>
          </div>
        )}

        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            isMe
              ? "bg-[color:var(--ruby)] text-white rounded-br-sm"
              : "bg-[color:var(--surface-3)] text-white/90 rounded-bl-sm"
          }`}
        >
          {msg.content && <MessageContent text={msg.content} emojis={emojis} />}

          {attachments.length > 0 && (
            <div className={`flex flex-col gap-2 ${msg.content ? "mt-2" : ""}`}>
              {attachments.map((a) => <AttachmentView key={a.id} att={a} />)}
            </div>
          )}

          {msg.edited_at && (
            <span className="ml-1 text-[9px] italic opacity-60">(editada)</span>
          )}
        </div>

        {grouped.length > 0 && (
          <div className={`mt-1 flex flex-wrap gap-1 ${isMe ? "justify-end" : ""}`}>
            {grouped.map(([emoji, list]) => {
              const mine = list.some((r) => r.user_id === currentUserId);
              const isCustom = emoji.startsWith(":") && emoji.endsWith(":");
              const customCode = isCustom ? emoji.slice(1, -1) : null;
              const customUrl = customCode ? emojis.get(customCode)?.url : null;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(emoji)}
                  className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition ${
                    mine
                      ? "border-[color:var(--ruby)] bg-[color:var(--ruby)]/15 text-white"
                      : "border-white/10 bg-black/30 text-white/70 hover:bg-white/5"
                  }`}
                >
                  {customUrl ? <img src={customUrl} alt={emoji} className="h-4 w-4 object-contain" /> : <span>{emoji}</span>}
                  <span>{list.length}</span>
                </button>
              );
            })}
          </div>
        )}

        <span className="mt-0.5 text-[10px] text-[color:var(--text-3)]">{timeAgo(msg.created_at)}</span>
      </div>

      {/* Hover actions */}
      {hovered && (
        <div className={`absolute -top-3 ${isMe ? "left-2" : "right-2"} z-10 flex items-center gap-0.5 rounded-md border border-white/10 bg-black/90 px-1 py-0.5 shadow-lg`}>
          <ReactionShortcuts onPick={onReact} open={reactOpen} setOpen={setReactOpen} emojis={emojis} />
          <ActionBtn label="Responder" onClick={onReply}><ChatBubbleIcon className="h-3.5 w-3.5" /></ActionBtn>
          {isMe && (
            <>
              <ActionBtn label="Editar" onClick={onEdit}><Pencil1Icon className="h-3.5 w-3.5" /></ActionBtn>
              <ActionBtn label="Apagar" onClick={onDelete}><TrashIcon className="h-3.5 w-3.5" /></ActionBtn>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex h-6 w-6 items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}

function ReactionShortcuts({
  onPick,
  open,
  setOpen,
  emojis,
}: {
  onPick: (emoji: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  emojis: Map<string, { shortcode: string; url: string; is_animated: boolean }>;
}) {
  const quick = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
  const customList = Array.from(emojis.entries()).slice(0, 6);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-6 w-6 items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white"
        title="Reagir"
        aria-label="Reagir"
      >
        <span className="text-xs">😊</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 flex flex-col gap-1 rounded-md border border-white/10 bg-black/95 p-1.5 shadow-xl">
          <div className="flex gap-1">
            {quick.map((e) => (
              <button key={e} type="button" onClick={() => { onPick(e); setOpen(false); }} className="rounded px-1.5 py-0.5 text-base hover:bg-white/10">
                {e}
              </button>
            ))}
          </div>
          {customList.length > 0 && (
            <div className="flex gap-1 border-t border-white/10 pt-1">
              {customList.map(([code, e]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => { onPick(`:${code}:`); setOpen(false); }}
                  className="rounded p-0.5 hover:bg-white/10"
                  title={`:${code}:`}
                >
                  <img src={e.url} alt={code} className="h-5 w-5 object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AttachmentView({ att }: { att: Attachment }) {
  if (att.kind === "image") {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={att.url}
          alt={att.name ?? "imagem"}
          className="max-h-80 max-w-full rounded-lg border border-white/10 object-cover"
          loading="lazy"
        />
      </a>
    );
  }
  if (att.kind === "audio") {
    return <audio controls src={att.url} className="max-w-[280px]" />;
  }
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white/80 hover:bg-white/5"
    >
      <FileIcon className="h-4 w-4" />
      <span className="truncate max-w-[200px]">{att.name ?? "arquivo"}</span>
      {att.size_bytes && <span className="text-white/40">({(att.size_bytes / 1024).toFixed(0)} KB)</span>}
    </a>
  );
}

function PendingFileChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImg = file.type.startsWith("image/");
  const isAud = file.type.startsWith("audio/");
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="relative flex items-center gap-2 rounded-md border border-white/10 bg-black/40 p-1.5 pr-6 text-xs">
      {isImg ? (
        <img src={url} alt="" className="h-12 w-12 rounded object-cover" />
      ) : isAud ? (
        <SpeakerLoudIcon className="h-5 w-5 text-white/70" />
      ) : (
        <FileIcon className="h-5 w-5 text-white/70" />
      )}
      <span className="max-w-[120px] truncate text-white/80">{file.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 text-white/50 hover:text-white"
        aria-label="Remover"
      >
        <Cross2Icon className="h-3 w-3" />
      </button>
    </div>
  );
}

// ImageIcon kept to avoid unused warnings if future refactor uses it
void ImageIcon;
