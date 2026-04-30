import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ReloadIcon, CheckCircledIcon, CrossCircledIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";

type LogRow = {
  id: string;
  created_at: string;
  status: string;
  discord_id: string | null;
  character_key: string | null;
  card_number: string | null;
  qty: number | null;
  user_id: string | null;
  card_id: string | null;
  error: string | null;
  ip: string | null;
};

type Profile = { id: string; display_name: string; slug: string | null };

const STATUS_LABEL: Record<string, string> = {
  ok: "Sucesso",
  unauthorized: "Secret inválido",
  bad_json: "JSON inválido",
  missing_fields: "Campos faltando",
  not_linked: "Discord não vinculado",
  card_not_found: "Carta inexistente",
  db_error: "Erro no banco",
};

const STATUS_TONE: Record<string, string> = {
  ok: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  unauthorized: "text-rose-400 border-rose-400/30 bg-rose-400/10",
  bad_json: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  missing_fields: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  not_linked: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  card_not_found: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  db_error: "text-rose-400 border-rose-400/30 bg-rose-400/10",
};

export function DropsAdmin() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [hours, setHours] = useState(24);

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("card_grant_logs")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);
    const rows = (data ?? []) as LogRow[];
    setLogs(rows);
    const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter((x): x is string => !!x)));
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles").select("id, display_name, slug").in("id", userIds);
      const map = new Map<string, Profile>();
      (profs as Profile[] | null)?.forEach((p) => map.set(p.id, p));
      setProfiles(map);
    } else {
      setProfiles(new Map());
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // realtime: novos logs aparecem na hora
    const ch = supabase
      .channel("admin:card_grant_logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "card_grant_logs" },
        () => void load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  const filtered = useMemo(() => {
    if (filter === "all") return logs;
    if (filter === "errors") return logs.filter((l) => l.status !== "ok");
    return logs.filter((l) => l.status === filter);
  }, [logs, filter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const ok = logs.filter((l) => l.status === "ok").length;
    const failed = total - ok;
    const uniqueUsers = new Set(logs.filter((l) => l.status === "ok").map((l) => l.user_id)).size;
    const totalQty = logs.filter((l) => l.status === "ok").reduce((acc, l) => acc + (l.qty ?? 0), 0);
    const byStatus: Record<string, number> = {};
    logs.forEach((l) => { byStatus[l.status] = (byStatus[l.status] ?? 0) + 1; });
    return { total, ok, failed, uniqueUsers, totalQty, byStatus };
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Total" value={stats.total} />
        <Stat label="Sucessos" value={stats.ok} tone="ok" />
        <Stat label="Falhas" value={stats.failed} tone={stats.failed > 0 ? "err" : undefined} />
        <Stat label="Usuários únicos" value={stats.uniqueUsers} />
        <Stat label="Cartas entregues" value={stats.totalQty} />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
        <div className="flex items-center gap-1 text-xs">
          <span className="font-display tracking-widest text-white/50">JANELA</span>
          {[1, 6, 24, 72, 168].map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={`rounded border px-2 py-1 text-[11px] uppercase tracking-widest transition ${
                hours === h
                  ? "border-[color:var(--ruby)] bg-[color:var(--ruby)]/15 text-white"
                  : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
              }`}
            >
              {h < 24 ? `${h}h` : `${h / 24}d`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="font-display tracking-widest text-white/50">FILTRO</span>
          {[
            { v: "all", l: "Todos" },
            { v: "ok", l: "Sucesso" },
            { v: "errors", l: "Só falhas" },
            { v: "not_linked", l: "Não vinculado" },
            { v: "unauthorized", l: "Secret inválido" },
            { v: "card_not_found", l: "Carta inexistente" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`rounded border px-2 py-1 text-[11px] uppercase tracking-widest transition ${
                filter === f.v
                  ? "border-[color:var(--ruby)] bg-[color:var(--ruby)]/15 text-white"
                  : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>

        <button
          onClick={() => void load()}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[11px] uppercase tracking-widest text-white/70 hover:border-white/30 hover:text-white disabled:opacity-50"
        >
          <ReloadIcon className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-widest text-white/50">
            <tr>
              <th className="px-3 py-2 text-left">Quando</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Discord</th>
              <th className="px-3 py-2 text-left">Usuário</th>
              <th className="px-3 py-2 text-left">Carta</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-left">Detalhe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-white/40">
                {loading ? "Carregando…" : "Nenhum registro nessa janela. Aguardando o bot disparar."}
              </td></tr>
            )}
            {filtered.map((l) => {
              const prof = l.user_id ? profiles.get(l.user_id) : null;
              return (
                <tr key={l.id} className="hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-3 py-2 text-white/60">
                    {new Date(l.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "medium" })}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_TONE[l.status] ?? "border-white/20 text-white/70"}`}>
                      {l.status === "ok" ? <CheckCircledIcon /> : l.status === "unauthorized" || l.status === "db_error" ? <CrossCircledIcon /> : <ExclamationTriangleIcon />}
                      {STATUS_LABEL[l.status] ?? l.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-white/70">{l.discord_id ?? "—"}</td>
                  <td className="px-3 py-2 text-white/85">
                    {prof ? (
                      <a href={`/santuario/${prof.slug ?? ""}`} className="hover:text-white hover:underline">
                        {prof.display_name}
                      </a>
                    ) : <span className="text-white/40">—</span>}
                  </td>
                  <td className="px-3 py-2 text-white/70">
                    {l.character_key ? (
                      <span><span className="text-[color:var(--ruby)]">{l.character_key}</span>/{l.card_number}</span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-white/70">{l.qty ?? "—"}</td>
                  <td className="px-3 py-2 text-[11px] text-white/50">{l.error ?? (l.status === "ok" ? "OK" : "—")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-white/40">
        Endpoint do bot: <code className="rounded bg-white/5 px-1.5 py-0.5">POST /api/public/bot/cards-grant</code> — header <code className="rounded bg-white/5 px-1.5 py-0.5">x-bot-secret</code> · body <code className="rounded bg-white/5 px-1.5 py-0.5">{`{ discord_id, character_key, card_number, qty? }`}</code>
      </p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "ok" | "err" }) {
  const color = tone === "ok" ? "text-emerald-400" : tone === "err" ? "text-rose-400" : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <p className="font-display text-[10px] uppercase tracking-widest text-white/50">{label}</p>
      <p className={`mt-1 font-display text-2xl ${color}`}>{value}</p>
    </div>
  );
}
