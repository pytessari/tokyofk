import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BuddyCanvas } from "@/components/buddy/BuddyCanvas";
import { useBuddy } from "@/lib/buddy/useBuddy";
import { POKE_ACTIONS, type PokeAction } from "@/lib/buddy/types";

type Props = {
  targetUserId: string;
  targetName: string;
};

export function BuddyPokeButton({ targetUserId, targetName }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<PokeAction>("wave");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { config, loading } = useBuddy(targetUserId);

  if (!user || user.id === targetUserId) return null;

  async function send() {
    if (!user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("buddy_pokes").insert({
        sender_id: user.id,
        receiver_id: targetUserId,
        action,
        message: message.trim() || null,
      });
      if (error) throw error;
      toast.success(`Poke enviado pra ${targetName}!`);
      setOpen(false);
      setMessage("");
    } catch {
      toast.error("Não foi possível enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          ✨ Mandar Poke
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mandar poke para {targetName}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <div className="h-64 overflow-hidden rounded-md border border-[color:var(--line)] sm:h-72">
            {!loading && <BuddyCanvas config={config} animation={action} interactive={false} />}
          </div>

          <div className="space-y-3">
            <div>
              <p className="font-display text-[10px] tracking-widest text-[color:var(--chrome)]">▎AÇÃO</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {POKE_ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAction(a.id)}
                    className={`rounded-md border px-2.5 py-1 text-xs transition outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)] ${
                      action === a.id
                        ? "border-[color:var(--ruby)] bg-[color:var(--ruby)]/15 text-white"
                        : "border-white/15 bg-black/30 text-white/70 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {a.emoji} {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="poke-msg"
                className="font-display text-[10px] tracking-widest text-[color:var(--chrome)]"
              >
                ▎MENSAGEM (OPCIONAL)
              </label>
              <textarea
                id="poke-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 140))}
                placeholder="Diga algo legal…"
                rows={3}
                className="mt-2 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-[color:var(--ruby)]"
              />
              <p className="mt-1 text-right text-[10px] text-white/40">{message.length}/140</p>
            </div>

            <Button onClick={send} loading={sending} variant="primary" className="w-full">
              Enviar poke
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
