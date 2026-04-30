import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CardGrid, type CardRow } from "@/components/CardGrid";
import { StarSpike } from "@/components/Sticker";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { ReloadIcon } from "@radix-ui/react-icons";

export const Route = createFileRoute("/album")({
  head: () => ({ meta: [{ title: "TOKYO · Meu Álbum" }] }),
  component: AlbumPage,
});

type GroupBy = "none" | "character" | "season" | "rarity";

function AlbumPage() {
  const { user, loading } = useAuth();
  const [collected, setCollected] = useState<CardRow[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  // Filtros e agrupamento
  const [filterCharacter, setFilterCharacter] = useState<string>("");
  const [filterSeason, setFilterSeason] = useState<string>("");
  const [filterRarity, setFilterRarity] = useState<string>("");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  const loadAlbum = useCallback(async (userId: string) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const [{ count }, ownedRes] = await Promise.all([
        supabase.from("cards").select("*", { count: "exact", head: true }),
        supabase
          .from("user_cards")
          .select("card:cards(*)")
          .eq("user_id", userId)
          .order("acquired_at", { ascending: false }),
      ]);
      if (!mountedRef.current) return;
      setTotal(count ?? 0);
      const rows = ((ownedRes.data ?? []) as Array<{ card: CardRow | null }>)
        .map((r) => r.card)
        .filter((c): c is CardRow => !!c);
      setCollected(rows);
      setSyncedAt(new Date());
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setFetching(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { setFetching(false); return; }
    const userId = user.id;
    setFetching(true);
    void loadAlbum(userId);

    const ch = supabase
      .channel(`album:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_cards", filter: `user_id=eq.${userId}` },
        () => void loadAlbum(userId),
      )
      .subscribe();

    const onVisibility = () => {
      if (document.visibilityState === "visible") void loadAlbum(userId);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadAlbum(userId);
    }, 60_000);

    return () => {
      supabase.removeChannel(ch);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      window.clearInterval(interval);
    };
  }, [user, loading, loadAlbum]);

  // Opções de filtro extraídas das cartas coletadas
  const characters = useMemo(() => {
    const m = new Map<string, string>();
    collected.forEach((c) => m.set(c.character_key, c.character_name));
    return Array.from(m.entries()).sort(([, a], [, b]) => a.localeCompare(b));
  }, [collected]);
  const seasons = useMemo(() => {
    const s = new Set<string>();
    collected.forEach((c) => { if (c.season) s.add(c.season); });
    return Array.from(s).sort();
  }, [collected]);
  const rarities = useMemo(() => {
    const s = new Set<string>();
    collected.forEach((c) => s.add(c.rarity));
    return Array.from(s).sort();
  }, [collected]);

  // Cartas filtradas
  const filtered = useMemo(() => {
    return collected.filter((c) =>
      (!filterCharacter || c.character_key === filterCharacter) &&
      (!filterSeason || c.season === filterSeason) &&
      (!filterRarity || c.rarity === filterRarity),
    );
  }, [collected, filterCharacter, filterSeason, filterRarity]);

  // Agrupamento
  const groups = useMemo(() => {
    if (groupBy === "none") return null;
    const map = new Map<string, { label: string; cards: CardRow[] }>();
    filtered.forEach((c) => {
      let key: string;
      let label: string;
      if (groupBy === "character") { key = c.character_key; label = c.character_name; }
      else if (groupBy === "season") { key = c.season ?? "_none"; label = c.season ?? "Sem temporada"; }
      else { key = c.rarity; label = `Raridade ${c.rarity.toUpperCase()}`; }
      const g = map.get(key) ?? { label, cards: [] };
      g.cards.push(c);
      map.set(key, g);
    });
    return Array.from(map.entries())
      .map(([key, g]) => ({ key, ...g }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filtered, groupBy]);

  if (loading || (user && fetching && collected.length === 0)) {
    return <div className="px-5 py-20 text-center font-display tracking-widest text-white/60">CARREGANDO…</div>;
  }
  if (!user) return <LoggedOutGate title="ÁLBUM PRIVADO" message="Entre pra ver suas cartas coletadas." />;

  const pct = total > 0 ? Math.round((collected.length / total) * 100) : 0;
  const hasFilter = !!(filterCharacter || filterSeason || filterRarity);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">DASHBOARD PESSOAL</p>
          <h1 className="mt-1 font-display text-5xl text-ruby-gradient sm:text-6xl">MEU ÁLBUM</h1>
          <p className="mt-2 text-sm text-white/60">
            {collected.length} de {total} cartas · {pct}%
            {hasFilter && <span className="ml-2 text-white/40">· {filtered.length} no filtro</span>}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/40">
            <span>
              {syncedAt
                ? `Sincronizado ${syncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                : "Aguardando sincronização…"}
            </span>
            <button
              type="button"
              onClick={() => user && void loadAlbum(user.id)}
              className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-0.5 text-white/70 hover:border-white/30 hover:text-white disabled:opacity-50"
              disabled={fetching}
              aria-label="Atualizar álbum"
            >
              <ReloadIcon className={fetching ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>
        </div>
        <StarSpike className="hidden h-12 w-12 sticker-star sm:block" />
      </div>

      <div className="mb-6 glass-dark rounded-2xl p-5">
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full bg-ruby-gradient shadow-[0_0_20px_#d90036]" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Filtros + agrupamento */}
      <div className="mb-6 grid gap-3 rounded-xl border border-white/10 bg-black/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          label="Personagem"
          value={filterCharacter}
          onChange={setFilterCharacter}
          options={[{ value: "", label: "Todos" }, ...characters.map(([k, n]) => ({ value: k, label: n }))]}
        />
        <FilterSelect
          label="Temporada"
          value={filterSeason}
          onChange={setFilterSeason}
          options={[{ value: "", label: "Todas" }, ...seasons.map((s) => ({ value: s, label: s }))]}
        />
        <FilterSelect
          label="Raridade"
          value={filterRarity}
          onChange={setFilterRarity}
          options={[{ value: "", label: "Todas" }, ...rarities.map((r) => ({ value: r, label: r.toUpperCase() }))]}
        />
        <FilterSelect
          label="Agrupar por"
          value={groupBy}
          onChange={(v) => setGroupBy(v as GroupBy)}
          options={[
            { value: "none", label: "Nada" },
            { value: "character", label: "Personagem" },
            { value: "season", label: "Temporada" },
            { value: "rarity", label: "Raridade" },
          ]}
        />
        {hasFilter && (
          <button
            type="button"
            onClick={() => { setFilterCharacter(""); setFilterSeason(""); setFilterRarity(""); }}
            className="col-span-full justify-self-end rounded border border-white/10 px-3 py-1 text-[11px] uppercase tracking-widest text-white/60 hover:text-white"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {groups ? (
        <div className="space-y-8">
          {groups.length === 0 ? (
            <p className="text-sm text-[color:var(--text-3)]">Nenhuma carta com esses filtros.</p>
          ) : (
            groups.map((g) => (
              <section key={g.key}>
                <h2 className="mb-3 flex items-baseline gap-2 font-display text-sm tracking-widest text-[color:var(--chrome)]">
                  <span>▎{g.label.toUpperCase()}</span>
                  <span className="text-[10px] text-white/40">{g.cards.length}</span>
                </h2>
                <CardGrid cards={g.cards} />
              </section>
            ))
          )}
        </div>
      ) : (
        <CardGrid cards={filtered} empty="Nenhuma carta com esses filtros." />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/50">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-white/10 bg-black/60 px-2 py-1.5 text-sm text-white/90 outline-none focus:border-[color:var(--ruby)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
