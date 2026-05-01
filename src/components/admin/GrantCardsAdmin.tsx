import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";

type Profile = { id: string; display_name: string; slug: string | null; discord_id: string | null };
type Card = { id: string; character_key: string; card_number: string; name: string; rarity: string };

/**
 * Painel admin para conceder cartas manualmente a um usuário.
 * Útil enquanto o bot do Discord não está conectado, ou para corrigir histórico.
 */
export function GrantCardsAdmin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [cardId, setCardId] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [filterChar, setFilterChar] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [collected, setCollected] = useState<{ id: string; quantity: number; card_id: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, slug, discord_id").order("display_name"),
        supabase.from("cards").select("id, character_key, card_number, name, rarity").order("character_key").order("card_number"),
      ]);
      setProfiles((p ?? []) as Profile[]);
      setCards((c ?? []) as Card[]);
    })();
  }, []);

  useEffect(() => {
    if (!userId) { setCollected([]); return; }
    (async () => {
      const { data } = await supabase.from("user_cards")
        .select("id, quantity, card_id").eq("user_id", userId);
      setCollected((data ?? []) as { id: string; quantity: number; card_id: string }[]);
    })();
  }, [userId, feedback]);

  const characters = useMemo(() => Array.from(new Set(cards.map((c) => c.character_key))).sort(), [cards]);
  const filteredCards = cards.filter((c) => {
    if (filterChar && c.character_key !== filterChar) return false;
    if (search && !`${c.character_key} ${c.card_number} ${c.name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const collectedById = new Map(collected.map((c) => [c.card_id, c]));

  async function grant() {
    if (!userId || !cardId) return;
    setBusy(true);
    setFeedback(null);
    try {
      const existing = collectedById.get(cardId);
      if (existing) {
        const { error } = await supabase.from("user_cards")
          .update({ quantity: existing.quantity + qty }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_cards")
          .insert({ user_id: userId, card_id: cardId, quantity: qty });
        if (error) throw error;
      }
      const card = cards.find((c) => c.id === cardId);
      const profile = profiles.find((p) => p.id === userId);
      setFeedback({ ok: true, msg: `+${qty} ${card?.character_key}/#${card?.card_number} para ${profile?.display_name}` });
    } catch (e) {
      setFeedback({ ok: false, msg: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function removeFromUser(ucId: string) {
    if (!confirm("Remover essa carta do usuário?")) return;
    await supabase.from("user_cards").delete().eq("id", ucId);
    setCollected(collected.filter((c) => c.id !== ucId));
  }

  const selectedProfile = profiles.find((p) => p.id === userId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <section className="glass-dark rounded-xl p-5 space-y-4">
          <h3 className="font-display text-sm tracking-widest text-[color:var(--text-2)]">▎CONCEDER CARTA</h3>
          <p className="text-xs text-[color:var(--text-3)]">
            Use enquanto o bot não está enviando para um usuário, ou para corrigir histórico manualmente.
          </p>

          <label className="block">
            <span className="mb-1 block font-display text-[10px] tracking-widest text-[color:var(--text-3)]">USUÁRIO</span>
            <select value={userId} onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded border border-white/15 bg-black/60 px-2 py-2 text-sm text-white">
              <option value="">— selecionar membro —</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name} {p.slug ? `(/${p.slug})` : ""} {p.discord_id ? "🔗" : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-[1fr_120px_140px]">
            <label className="block">
              <span className="mb-1 block font-display text-[10px] tracking-widest text-[color:var(--text-3)]">CARTA</span>
              <select value={cardId} onChange={(e) => setCardId(e.target.value)}
                className="w-full rounded border border-white/15 bg-black/60 px-2 py-2 text-sm text-white">
                <option value="">— selecionar —</option>
                {filteredCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.character_key}/#{c.card_number} · {c.name} · {c.rarity}
                    {collectedById.has(c.id) ? `  (já tem ×${collectedById.get(c.id)!.quantity})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-display text-[10px] tracking-widest text-[color:var(--text-3)]">QTD</span>
              <input type="number" min={1} max={50} value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                className="w-full rounded border border-white/15 bg-black/60 px-2 py-2 text-sm text-white" />
            </label>
            <button type="button" onClick={grant} disabled={!userId || !cardId || busy}
              className="self-end rounded bg-[color:var(--ruby)] hover:bg-[oklch(from_var(--ruby)_calc(l+0.04)_c_h)] px-4 py-2 font-display text-sm tracking-widest text-white disabled:opacity-50">
              {busy ? "ENVIANDO…" : "CONCEDER"}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-display text-[10px] tracking-widest text-[color:var(--text-3)]">FILTRAR PERSONAGEM</span>
              <select value={filterChar} onChange={(e) => setFilterChar(e.target.value)}
                className="w-full rounded border border-white/15 bg-black/60 px-2 py-2 text-sm text-white">
                <option value="">todos</option>
                {characters.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-display text-[10px] tracking-widest text-[color:var(--text-3)]">BUSCAR</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="número, nome…"
                className="w-full rounded border border-white/15 bg-black/60 px-2 py-2 text-sm text-white" />
            </label>
          </div>

          {feedback && (
            <div className={`flex items-center gap-2 rounded border px-3 py-2 text-xs ${feedback.ok
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "border-rose-400/30 bg-rose-400/10 text-rose-300"}`}>
              {feedback.ok ? <CheckCircledIcon /> : <CrossCircledIcon />}
              <span>{feedback.msg}</span>
            </div>
          )}
        </section>
      </div>

      <aside className="glass-dark rounded-xl p-5">
        <h3 className="font-display text-sm tracking-widest text-[color:var(--text-2)]">
          ▎COLEÇÃO {selectedProfile ? `DE ${selectedProfile.display_name.toUpperCase()}` : ""}
        </h3>
        {!userId ? (
          <p className="mt-3 text-xs text-[color:var(--text-3)]">Selecione um usuário pra ver e remover cartas.</p>
        ) : collected.length === 0 ? (
          <p className="mt-3 text-xs text-[color:var(--text-3)]">Esse membro ainda não tem cartas.</p>
        ) : (
          <ul className="mt-3 space-y-1.5 max-h-[480px] overflow-auto pr-1">
            {collected.map((uc) => {
              const card = cards.find((c) => c.id === uc.card_id);
              return (
                <li key={uc.id} className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs">
                  <span className="text-white/80 truncate">
                    {card ? `${card.character_key}/#${card.card_number} · ${card.name}` : uc.card_id}
                    {uc.quantity > 1 ? <span className="ml-1 text-[color:var(--ruby)]">×{uc.quantity}</span> : null}
                  </span>
                  <button onClick={() => removeFromUser(uc.id)}
                    className="rounded px-2 py-0.5 text-[10px] uppercase text-red-300 hover:bg-red-500/20">remover</button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
}
