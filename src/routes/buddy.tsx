import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/kit/PageHeader";
import { SectionCard } from "@/components/kit/SectionCard";
import { Button } from "@/components/ui/button";
import { BuddyCanvas } from "@/components/buddy/BuddyCanvas";
import { BuddyEditor } from "@/components/buddy/BuddyEditor";
import { useBuddy, saveBuddy } from "@/lib/buddy/useBuddy";
import { POKE_ACTIONS, type PokeAction } from "@/lib/buddy/types";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { timeAgo } from "@/lib/timeAgo";

export const Route = createFileRoute("/buddy")({
  head: () => ({
    meta: [
      { title: "Buddy · TOKYO" },
      { name: "description", content: "Crie seu boneco 3D, customize e mande pokes para outros membros." },
    ],
  }),
  component: BuddyPage,
});

type ReceivedPoke = {
  id: string;
  action: string;
  message: string | null;
  created_at: string;
  seen_at: string | null;
  sender_id: string;
  sender?: { display_name: string; slug: string | null; avatar_url: string | null } | null;
};

function BuddyPage() {
  const { user } = useAuth();
  const { config, setConfig, loading } = useBuddy(user?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<PokeAction | "idle">("idle");
  const [received, setReceived] = useState<ReceivedPoke[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("buddy_pokes")
        .select("id, action, message, created_at, seen_at, sender_id")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      const pokes = (data ?? []) as ReceivedPoke[];
      const ids = Array.from(new Set(pokes.map((p) => p.sender_id)));
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, slug, avatar_url")
          .in("id", ids);
        const map = new Map((profiles ?? []).map((p) => [p.id, p]));
        pokes.forEach((p) => (p.sender = map.get(p.sender_id) as ReceivedPoke["sender"]));
      }
      if (active) setReceived(pokes);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <PageHeader
          eyebrow="MINI-GAME"
          title="Tokyo Buddy"
          description="Crie seu boneco 3D, customize do seu jeito e mande pokes pros amigos."
        />
        <LoggedOutGate />
      </div>
    );
  }

  async function onSave() {
    if (!user) return;
    setSaving(true);
    try {
      await saveBuddy(user.id, config);
      toast.success("Buddy salvo!");
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function markSeen(id: string) {
    await supabase.from("buddy_pokes").update({ seen_at: new Date().toISOString() }).eq("id", id);
    setReceived((prev) => prev.map((p) => (p.id === id ? { ...p, seen_at: new Date().toISOString() } : p)));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader
        eyebrow="MINI-GAME"
        title="Tokyo Buddy"
        description="Monte seu boneco 3D. Salva no seu perfil. Mande pokes pros amigos pelo Santuário."
        actions={
          <Button onClick={onSave} loading={saving} variant="primary">
            Salvar Buddy
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <SectionCard title="Seu Buddy" padded={false}>
          <div className="relative h-[420px] w-full overflow-hidden rounded-[inherit] sm:h-[520px]">
            {!loading && <BuddyCanvas config={config} animation={preview} />}
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-[color:var(--line)] p-3">
            <span className="self-center pr-2 font-display text-[10px] tracking-widest text-[color:var(--text-3)]">
              ▎PRÉVIA
            </span>
            <button
              type="button"
              onClick={() => setPreview("idle")}
              className={`rounded-md border px-2.5 py-1 text-xs ${
                preview === "idle"
                  ? "border-[color:var(--ruby)] text-white"
                  : "border-white/15 text-white/70"
              }`}
            >
              Parado
            </button>
            {POKE_ACTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setPreview(a.id)}
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  preview === a.id
                    ? "border-[color:var(--ruby)] text-white"
                    : "border-white/15 text-white/70 hover:border-white/30 hover:text-white"
                }`}
              >
                {a.emoji} {a.label}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Customizar">
          <BuddyEditor config={config} onChange={setConfig} />
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard
          title="Pokes recebidos"
          description="Quando alguém te manda um poke, aparece aqui. Clique pra ver a animação."
        >
          {received.length === 0 ? (
            <p className="py-6 text-center text-sm text-[color:var(--text-3)]">
              Nenhum poke ainda. Visite o perfil de alguém pra mandar o primeiro!
            </p>
          ) : (
            <ul className="space-y-2">
              {received.map((p) => {
                const meta = POKE_ACTIONS.find((a) => a.id === p.action);
                return (
                  <li
                    key={p.id}
                    className={`flex items-center gap-3 rounded-md border border-[color:var(--line)] p-3 ${
                      p.seen_at ? "" : "bg-[color:var(--ruby)]/5"
                    }`}
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {meta?.emoji ?? "✨"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-display tracking-wide">
                          {p.sender?.display_name ?? "Alguém"}
                        </span>{" "}
                        <span className="text-[color:var(--text-3)]">
                          mandou um {meta?.label.toLowerCase() ?? p.action}
                        </span>
                      </p>
                      {p.message && (
                        <p className="mt-0.5 truncate text-xs italic text-[color:var(--text-3)]">"{p.message}"</p>
                      )}
                      <p className="mt-0.5 text-[10px] tracking-widest text-[color:var(--text-3)]">
                        {timeAgo(p.created_at)}
                      </p>
                    </div>
                    {p.sender?.slug && (
                      <Link
                        to="/santuario/$slug"
                        params={{ slug: p.sender.slug }}
                        className="text-xs text-[color:var(--ruby)] hover:underline"
                      >
                        Ver perfil
                      </Link>
                    )}
                    {!p.seen_at && (
                      <Button size="sm" variant="ghost" onClick={() => markSeen(p.id)}>
                        Marcar visto
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
