import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/kit/PageHeader";
import { Button } from "@/components/ui/button";
import { ConversationView } from "@/components/messages/ConversationView";
import {
  EnvelopeClosedIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { timeAgo } from "@/lib/timeAgo";
import { toast } from "sonner";

type ConvRow = {
  id: string;
  is_group: boolean;
  title: string | null;
  created_by: string;
  last_message_at: string;
};

type Participant = {
  conversation_id: string;
  user_id: string;
  last_read_at: string;
};

type ProfileLite = {
  id: string;
  display_name: string;
  slug: string | null;
  avatar_url: string | null;
};

export const Route = createFileRoute("/mensagens")({
  validateSearch: z.object({ conv: z.string().optional() }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: MessagesPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl p-6 text-red-300">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
});

function MessagesPage() {
  const { user } = useAuth();
  const routeSearch = Route.useSearch();
  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [parts, setParts] = useState<Participant[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProfileLite[]>([]);
  const [picked, setPicked] = useState<ProfileLite[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadConvs() {
    if (!user) return;
    const { data: myParts } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);
    const ids = (myParts ?? []).map((p) => p.conversation_id);
    if (!ids.length) {
      setConvs([]);
      setParts([]);
      return;
    }
    const [{ data: cs }, { data: ps }] = await Promise.all([
      supabase
        .from("conversations")
        .select("*")
        .in("id", ids)
        .order("last_message_at", { ascending: false }),
      supabase.from("conversation_participants").select("*").in("conversation_id", ids),
    ]);
    setConvs((cs ?? []) as ConvRow[]);
    setParts((ps ?? []) as Participant[]);
    const userIds = Array.from(new Set((ps ?? []).map((p) => p.user_id)));
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,display_name,slug,avatar_url")
        .in("id", userIds);
      const map = new Map<string, ProfileLite>();
      (profs ?? []).forEach((p) => map.set(p.id, p));
      setProfiles(map);
    }
  }

  // Abre conversa vinda da URL (?conv=…) — usado por notificações
  useEffect(() => {
    if (routeSearch.conv) setActiveId(routeSearch.conv);
  }, [routeSearch.conv]);

  useEffect(() => {
    loadConvs();
    if (!user) return;
    const ch = supabase
      .channel(`my-convs:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => loadConvs(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_participants" },
        () => loadConvs(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // search profiles for new chat
  useEffect(() => {
    if (!showNew || !search.trim()) {
      setResults([]);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,display_name,slug,avatar_url")
        .or(`display_name.ilike.%${search}%,slug.ilike.%${search}%`)
        .neq("id", user?.id ?? "")
        .limit(8);
      if (active) setResults((data ?? []) as ProfileLite[]);
    })();
    return () => {
      active = false;
    };
  }, [search, showNew, user?.id]);

  function convTitle(c: ConvRow): string {
    if (c.title) return c.title;
    const others = parts
      .filter((p) => p.conversation_id === c.id && p.user_id !== user?.id)
      .map((p) => profiles.get(p.user_id)?.display_name ?? "—");
    if (others.length === 0) return "Você";
    if (others.length === 1) return others[0];
    return others.slice(0, 3).join(", ") + (others.length > 3 ? "…" : "");
  }

  function convAvatar(c: ConvRow) {
    const others = parts
      .filter((p) => p.conversation_id === c.id && p.user_id !== user?.id)
      .map((p) => profiles.get(p.user_id))
      .filter((x): x is ProfileLite => !!x);
    return others[0]?.avatar_url ?? null;
  }

  async function startConversation() {
    if (!user || picked.length === 0) return;
    setCreating(true);
    const isGroup = picked.length > 1;
    // 1:1 dedup: try to find an existing 1:1
    if (!isGroup) {
      const otherId = picked[0].id;
      const { data: existing } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", otherId);
      const otherConvs = new Set((existing ?? []).map((x) => x.conversation_id));
      const match = convs.find(
        (c) =>
          !c.is_group &&
          otherConvs.has(c.id) &&
          parts.filter((p) => p.conversation_id === c.id).length === 2,
      );
      if (match) {
        setCreating(false);
        setShowNew(false);
        setPicked([]);
        setSearch("");
        setActiveId(match.id);
        return;
      }
    }
    const createConversation = supabase.rpc as unknown as (
      fn: "create_conversation_with_participants",
      args: { _participant_ids: string[]; _title: string | null; _is_group: boolean },
    ) => Promise<{ data: ConvRow | null; error: { message: string } | null }>;
    const { data: conv, error } = await createConversation("create_conversation_with_participants", {
      _participant_ids: picked.map((p) => p.id),
      _title: isGroup ? groupTitle.trim() || null : null,
      _is_group: isGroup,
    });
    if (error || !conv) {
      setCreating(false);
      toast.error(error?.message ?? "Erro");
      return;
    }
    setCreating(false);
    setShowNew(false);
    setPicked([]);
    setSearch("");
    setGroupTitle("");
    await loadConvs();
    setActiveId(conv.id);
  }

  const myParticipant = useMemo(
    () => (cId: string) => parts.find((p) => p.conversation_id === cId && p.user_id === user?.id),
    [parts, user?.id],
  );

  const activeConv = convs.find((c) => c.id === activeId);

  return (
    <>
      {/* Mobile fullscreen quando uma conversa está aberta */}
      {activeConv && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[color:var(--surface-1)] lg:hidden">
          <ConversationView
            conversationId={activeConv.id}
            title={convTitle(activeConv)}
            onBack={() => setActiveId(null)}
          />
        </div>
      )}

      <div className="mx-auto max-w-6xl px-3 py-5 sm:px-5 sm:py-8">
        <PageHeader
          eyebrow="DM · 文"
          title="Mensagens"
          description="Conversas privadas, 1:1 ou em grupinho. Em tempo real."
          actions={
            <Button variant="primary" onClick={() => setShowNew((v) => !v)}>
              <PlusIcon className="mr-1 h-4 w-4" /> Nova conversa
            </Button>
          }
        />

        {showNew && (
          <div className="panel mb-6 p-4 sm:p-5">
            <p className="mb-3 font-display text-sm tracking-widest">NOVA CONVERSA</p>
            <div className="mb-3 flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2">
              <MagnifyingGlassIcon className="h-4 w-4 text-[color:var(--text-3)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou @"
                className="w-full bg-transparent text-sm outline-none"
                aria-label="Buscar usuários"
              />
            </div>
            {picked.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {picked.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPicked((prev) => prev.filter((x) => x.id !== p.id))}
                    className="inline-flex items-center gap-1 rounded-full bg-[color:var(--ruby)]/20 px-2 py-1 text-xs text-[color:var(--ruby)] hover:bg-[color:var(--ruby)]/30"
                  >
                    {p.display_name} ✕
                  </button>
                ))}
              </div>
            )}
            {results.length > 0 && (
              <ul className="mb-3 divide-y divide-white/5 rounded-md border border-white/10 bg-black/30">
                {results.map((p) => {
                  const isPicked = picked.some((x) => x.id === p.id);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setPicked((prev) =>
                            isPicked ? prev.filter((x) => x.id !== p.id) : [...prev, p].slice(0, 8),
                          )
                        }
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-white/5"
                      >
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-[color:var(--surface-3)]" />
                        )}
                        <span className="flex-1">{p.display_name}</span>
                        {isPicked && <span className="text-[color:var(--ruby)]">✓</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {picked.length > 1 && (
              <input
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="Nome do grupo (opcional)"
                className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ruby)]"
              />
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowNew(false);
                  setPicked([]);
                  setSearch("");
                }}
              >
                Cancelar
              </Button>
              <Button variant="primary" onClick={startConversation} loading={creating} disabled={picked.length === 0}>
                Começar
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-0 overflow-hidden rounded-lg border border-white/10 bg-black/20 lg:grid-cols-[300px_1fr]" style={{ minHeight: 560 }}>
          <aside className="border-b border-white/10 lg:border-b-0 lg:border-r">
            {convs.length === 0 ? (
              <div className="p-6 text-center text-xs text-[color:var(--text-3)]">
                <EnvelopeClosedIcon className="mx-auto mb-2 h-6 w-6" />
                Nenhuma conversa ainda.
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {convs.map((c) => {
                  const me = myParticipant(c.id);
                  const unread = me ? new Date(c.last_message_at) > new Date(me.last_read_at) : false;
                  const av = convAvatar(c);
                  const active = activeId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(c.id)}
                        className={`flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-white/5 ${
                          active ? "bg-[color:var(--ruby)]/10" : ""
                        }`}
                      >
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[color:var(--surface-3)]">
                          {av ? (
                            <img src={av} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <PersonIcon className="m-2.5 h-4 w-4 text-[color:var(--text-3)]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white">{convTitle(c)}</p>
                          <p className="truncate text-[10px] tracking-widest text-[color:var(--text-3)]">
                            {timeAgo(c.last_message_at)}
                            {c.is_group && " · grupo"}
                          </p>
                        </div>
                        {unread && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--ruby)]" aria-label="Não lida" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section className="hidden min-h-[560px] lg:block">
            {activeConv ? (
              <ConversationView
                conversationId={activeConv.id}
                title={convTitle(activeConv)}
                onBack={() => setActiveId(null)}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-[color:var(--text-3)]">
                Selecione uma conversa ou comece uma nova.
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
