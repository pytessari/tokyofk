import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ImageUpload";

export type CardRow = {
  id: string; character_key: string; character_name: string; card_number: string;
  name: string; rarity: string; season: string | null; image_url: string | null;
  description?: string | null;
};

export function CardEditDialog({
  card, userId, onClose, onSaved,
}: { card: CardRow; userId: string; onClose: () => void; onSaved: (c: CardRow) => void }) {
  const [draft, setDraft] = useState<CardRow>(card);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(card), [card]);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("cards").update({
      character_key: draft.character_key.toLowerCase().trim(),
      character_name: draft.character_name,
      card_number: draft.card_number,
      name: draft.name,
      rarity: draft.rarity,
      season: draft.season,
      image_url: draft.image_url,
      description: draft.description ?? null,
    }).eq("id", draft.id);
    setSaving(false);
    if (!error) { onSaved(draft); onClose(); }
    else alert(error.message);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-xl border border-[color:var(--ruby)]/40 bg-black p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-3 top-3 text-white/60 hover:text-white">×</button>
        <p className="font-display text-xs tracking-[0.4em] text-[color:var(--chrome)]">▎EDITAR CARTA</p>
        <h2 className="mt-1 font-display text-2xl text-ruby-gradient">#{draft.card_number} {draft.name}</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-[200px_1fr]">
          <ImageUpload bucket="cards" userId={userId} currentUrl={draft.image_url} aspect="card"
            onUploaded={(url) => setDraft({ ...draft, image_url: url })} />
          <div className="space-y-3">
            <Field label="character_key (bot)" value={draft.character_key}
              onChange={(v) => setDraft({ ...draft, character_key: v })} />
            <Field label="Nome do personagem" value={draft.character_name}
              onChange={(v) => setDraft({ ...draft, character_name: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nº" value={draft.card_number} onChange={(v) => setDraft({ ...draft, card_number: v })} />
              <label className="block">
                <span className="mb-1 block font-display text-[10px] tracking-widest text-white/60">RARIDADE</span>
                <select value={draft.rarity} onChange={(e) => setDraft({ ...draft, rarity: e.target.value })}
                  className="w-full rounded border border-white/15 bg-black/60 px-2 py-1.5 text-sm text-white">
                  {["R","S","A","B","C","Holo","Foil","Promo"].map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
            </div>
            <Field label="Nome da carta" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
            <Field label="Temporada" value={draft.season ?? ""} onChange={(v) => setDraft({ ...draft, season: v || null })} />
            <label className="block">
              <span className="mb-1 block font-display text-[10px] tracking-widest text-white/60">DESCRIÇÃO</span>
              <textarea value={draft.description ?? ""} rows={3}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="w-full rounded border border-white/15 bg-black/60 px-2 py-1 text-sm text-white" />
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-white/20 px-4 py-2 text-sm text-white/80">
            Cancelar
          </button>
          <button onClick={save} disabled={saving}
            className="rounded bg-[color:var(--ruby)] hover:bg-[oklch(from_var(--ruby)_calc(l+0.04)_c_h)] px-5 py-2 font-display text-sm tracking-widest text-white disabled:opacity-50">
            {saving ? "SALVANDO…" : "SALVAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block font-display text-[10px] tracking-widest text-white/60">{label.toUpperCase()}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-white/15 bg-black/60 px-2 py-1.5 text-sm text-white outline-none focus:border-[color:var(--ruby)]" />
    </label>
  );
}
