import { useRef, useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  character_key: string; character_name: string; card_number: string;
  name: string; rarity?: string; season?: string; image_url?: string;
};

const TEMPLATE = "character_key,character_name,card_number,name,rarity,season,image_url\njerk,Jerk Leblanc,001,Espinho,R,T1,\n";

export function CsvCardsImport({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "tokyo-cards-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function handle(file: File) {
    setResult(null); setErrors([]); setRows([]);
    Papa.parse<Row>(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        const errs: string[] = [];
        const ok: Row[] = [];
        res.data.forEach((r, i) => {
          if (!r.character_key || !r.character_name || !r.card_number || !r.name) {
            errs.push(`Linha ${i + 2}: faltam campos obrigatórios`);
            return;
          }
          ok.push({
            character_key: r.character_key.toLowerCase().trim(),
            character_name: r.character_name.trim(),
            card_number: String(r.card_number).trim(),
            name: r.name.trim(),
            rarity: (r.rarity || "C").trim(),
            season: r.season?.trim() || undefined,
            image_url: r.image_url?.trim() || undefined,
          });
        });
        setRows(ok); setErrors(errs);
      },
    });
  }

  async function importAll() {
    if (rows.length === 0) return;
    setBusy(true);
    const { error, count } = await supabase.from("cards")
      .upsert(rows.map((r) => ({
        character_key: r.character_key, character_name: r.character_name,
        card_number: r.card_number, name: r.name, rarity: r.rarity || "C",
        season: r.season ?? null, image_url: r.image_url ?? null,
      })), { onConflict: "character_key,card_number", count: "exact" });
    setBusy(false);
    if (error) setResult(`Erro: ${error.message}`);
    else { setResult(`✦ ${count ?? rows.length} cartas importadas/atualizadas.`); setRows([]); onDone(); }
  }

  return (
    <div className="glass-dark space-y-3 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm tracking-widest text-[color:var(--chrome)]">▎IMPORTAR CSV</h3>
        <button onClick={downloadTemplate} className="font-display text-[10px] tracking-widest text-white/60 hover:text-white">
          baixar modelo ↓
        </button>
      </div>
      <p className="text-[11px] text-white/50">
        Colunas: <code>character_key, character_name, card_number, name, rarity, season, image_url</code>.
        Existentes (mesmo personagem + número) serão atualizadas.
      </p>
      <input ref={ref} type="file" accept=".csv" className="hidden"
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
      <button onClick={() => ref.current?.click()}
        className="w-full rounded-md border border-dashed border-white/25 bg-black/40 py-3 font-display text-xs tracking-widest text-white/70 hover:border-[color:var(--ruby)]">
        + ESCOLHER ARQUIVO CSV
      </button>

      {errors.length > 0 && (
        <div className="rounded border border-yellow-500/40 bg-yellow-500/10 p-2 text-[11px] text-yellow-200">
          {errors.slice(0, 6).map((e, i) => <p key={i}>{e}</p>)}
          {errors.length > 6 && <p>+{errors.length - 6} erros…</p>}
        </div>
      )}
      {rows.length > 0 && (
        <>
          <p className="text-xs text-white/70">{rows.length} linhas válidas. Pré-visualização:</p>
          <ul className="max-h-40 overflow-y-auto rounded border border-white/10 bg-black/40 p-2 text-[11px] text-white/70">
            {rows.slice(0, 10).map((r, i) => (
              <li key={i}>{r.character_key} · #{r.card_number} · {r.name} ({r.rarity})</li>
            ))}
            {rows.length > 10 && <li className="text-white/40">+{rows.length - 10}…</li>}
          </ul>
          <button onClick={importAll} disabled={busy}
            className="w-full rounded bg-ruby-gradient px-4 py-2 font-display text-sm tracking-widest text-white disabled:opacity-50">
            {busy ? "IMPORTANDO…" : `IMPORTAR ${rows.length} CARTAS`}
          </button>
        </>
      )}
      {result && <p className="rounded border border-[color:var(--ruby)]/40 bg-[color:var(--ruby)]/10 px-3 py-2 text-sm text-white">{result}</p>}
    </div>
  );
}
