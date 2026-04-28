import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/useRole";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ImageUpload";
import { IMAGES, img } from "@/lib/images";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · TOKYO" }] }),
  component: AdminPage,
});

type Tab = "members" | "cards" | "magazines" | "guestbook";

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("members");

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) navigate({ to: "/login" });
  }, [user, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return <div className="px-5 py-20 text-center font-display tracking-widest text-white/60">CARREGANDO…</div>;
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="font-display text-4xl text-ruby-gradient">ACESSO NEGADO</h1>
        <p className="mt-2 text-sm text-white/60">Essa área é só do admin.</p>
        <Link to="/" className="mt-6 inline-block font-display text-xs tracking-widest text-white underline">← VOLTAR</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-6">
        <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">PAINEL DE CONTROLE</p>
        <h1 className="mt-1 font-display text-5xl text-ruby-gradient">ADMIN · TOKYO</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {(["members","cards","magazines","guestbook"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 font-display text-xs tracking-widest transition ${
              tab === t ? "bg-ruby-gradient text-white shadow-[0_0_14px_#d9003680]" : "border border-white/15 text-white/70 hover:bg-white/5"
            }`}>
            {t === "members" ? "MEMBROS" : t === "cards" ? "CARTAS" : t === "magazines" ? "REVISTAS" : "MURAL"}
          </button>
        ))}
      </div>

      {tab === "members" && <MembersAdmin />}
      {tab === "cards" && <CardsAdmin userId={user.id} />}
      {tab === "magazines" && <MagazinesAdmin userId={user.id} />}
      {tab === "guestbook" && <GuestbookAdmin />}
    </div>
  );
}

/* ==================== MEMBERS (profiles) ==================== */
type ProfileRow = {
  id: string; display_name: string; slug: string | null; role: string | null;
  sign: string | null; bio: string | null; avatar_url: string | null; banner_url: string | null;
};

function MembersAdmin() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const { data } = await supabase.from("profiles")
      .select("id, display_name, slug, role, sign, bio, avatar_url, banner_url")
      .order("display_name");
    setRows((data ?? []) as ProfileRow[]);
  }
  useEffect(() => { load(); }, []);

  async function update(id: string, patch: Partial<ProfileRow>) {
    await supabase.from("profiles").update(patch).eq("id", id);
    setRows(rows.map((r) => r.id === id ? { ...r, ...patch } : r));
  }

  const filtered = rows.filter((r) =>
    !q || r.display_name.toLowerCase().includes(q.toLowerCase()) || (r.slug ?? "").includes(q));

  return (
    <div className="space-y-3">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="buscar por nome/slug…"
        className="w-full max-w-sm rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white" />
      <p className="text-xs text-white/50">Edite aqui qualquer membro. Imagens você pode pedir pro dono trocar no perfil dele.</p>
      <ul className="space-y-2">
        {filtered.map((r) => (
          <li key={r.id} className="glass-dark rounded-lg p-4">
            <div className="flex items-start gap-3">
              <img src={img(r.avatar_url ?? "", IMAGES.fallback.avatar)} alt=""
                className="h-14 w-14 rounded-full border border-white/15 object-cover" />
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <TextCell label="Nome" value={r.display_name} onSave={(v) => update(r.id, { display_name: v })} />
                <TextCell label="Slug" value={r.slug ?? ""} onSave={(v) => update(r.id, { slug: v || null })} />
                <TextCell label="Papel" value={r.role ?? ""} onSave={(v) => update(r.id, { role: v || null })} />
                <TextCell label="Signo" value={r.sign ?? ""} onSave={(v) => update(r.id, { sign: v || null })} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TextCell({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <label className="block">
      <span className="mb-1 block font-display text-[10px] tracking-widest text-white/50">{label.toUpperCase()}</span>
      <input value={v} onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== value && onSave(v)}
        className="w-full rounded border border-white/10 bg-black/60 px-2 py-1 text-sm text-white outline-none focus:border-[color:var(--ruby)]" />
    </label>
  );
}

/* ==================== CARDS ==================== */
type CardRow = {
  id: string; character_key: string; character_name: string; card_number: string;
  name: string; rarity: string; season: string | null; image_url: string | null;
};

function CardsAdmin({ userId }: { userId: string }) {
  const [rows, setRows] = useState<CardRow[]>([]);
  const [form, setForm] = useState<Partial<CardRow>>({ rarity: "C" });

  async function load() {
    const { data } = await supabase.from("cards").select("*").order("character_key").order("card_number");
    setRows((data ?? []) as CardRow[]);
  }
  useEffect(() => { load(); }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!form.character_key || !form.character_name || !form.card_number || !form.name) return;
    const { error } = await supabase.from("cards").insert({
      character_key: form.character_key.toLowerCase().trim(),
      character_name: form.character_name,
      card_number: form.card_number,
      name: form.name,
      rarity: form.rarity || "C",
      season: form.season || null,
      image_url: form.image_url || null,
    });
    if (!error) { setForm({ rarity: "C" }); load(); }
  }

  async function remove(id: string) {
    if (!confirm("Excluir carta?")) return;
    await supabase.from("cards").delete().eq("id", id);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <form onSubmit={create} className="glass-dark space-y-3 rounded-xl p-5">
        <h3 className="font-display text-sm tracking-widest text-[color:var(--chrome)]">▎NOVA CARTA</h3>
        <Input label="Nome do personagem no bot (character_key)" value={form.character_key ?? ""}
          onChange={(v) => setForm({ ...form, character_key: v })} placeholder="jerk" required />
        <Input label="Nome exibido do personagem" value={form.character_name ?? ""}
          onChange={(v) => setForm({ ...form, character_name: v })} placeholder="Jerk Leblanc" required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nº da carta" value={form.card_number ?? ""}
            onChange={(v) => setForm({ ...form, card_number: v })} placeholder="001" required />
          <label className="block">
            <span className="mb-1 block font-display text-[10px] tracking-widest text-white/60">RARIDADE</span>
            <select value={form.rarity ?? "C"} onChange={(e) => setForm({ ...form, rarity: e.target.value })}
              className="w-full rounded border border-white/15 bg-black/60 px-2 py-1.5 text-sm text-white">
              {["R","S","A","B","C","Holo","Foil","Promo"].map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
        </div>
        <Input label="Nome da carta" value={form.name ?? ""}
          onChange={(v) => setForm({ ...form, name: v })} placeholder="Jerk · Espinho" required />
        <Input label="Temporada" value={form.season ?? ""}
          onChange={(v) => setForm({ ...form, season: v })} placeholder="T1" />
        <div>
          <p className="mb-1 font-display text-[10px] tracking-widest text-white/60">IMAGEM DA CARTA</p>
          <ImageUpload bucket="cards" userId={userId} currentUrl={form.image_url} aspect="card"
            onUploaded={(url) => setForm({ ...form, image_url: url })} />
        </div>
        <button className="w-full rounded-md bg-ruby-gradient px-4 py-2 font-display text-sm tracking-widest text-white">
          CRIAR CARTA
        </button>
      </form>

      <div className="space-y-2">
        <p className="text-xs text-white/50">{rows.length} cartas no catálogo</p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {rows.map((c) => (
            <li key={c.id} className="relative overflow-hidden rounded-lg ruby-border">
              <img src={img(c.image_url ?? "", IMAGES.fallback.card)} alt={c.name}
                className="aspect-[3/4] w-full object-cover" />
              <div className="bg-black/85 p-2">
                <p className="font-display text-[10px] tracking-widest text-white">#{c.card_number} {c.name}</p>
                <p className="text-[9px] tracking-widest text-[color:var(--ruby)]">{c.character_key} · {c.rarity}</p>
              </div>
              <button onClick={() => remove(c.id)}
                className="absolute right-1 top-1 rounded bg-black/70 px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-500/40">×</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ==================== MAGAZINES ==================== */
type MagRow = {
  id: string; title: string; subtitle: string | null; cover_url: string | null;
  issue_number: number | null; published: boolean;
};
type MagPage = { id: string; magazine_id: string; page_number: number; title: string | null; body: string | null; image_url: string | null };

function MagazinesAdmin({ userId }: { userId: string }) {
  const [mags, setMags] = useState<MagRow[]>([]);
  const [selected, setSelected] = useState<MagRow | null>(null);
  const [pages, setPages] = useState<MagPage[]>([]);
  const [title, setTitle] = useState("");

  async function loadMags() {
    const { data } = await supabase.from("magazines")
      .select("id, title, subtitle, cover_url, issue_number, published")
      .order("issue_number", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    setMags((data ?? []) as MagRow[]);
  }
  useEffect(() => { loadMags(); }, []);

  async function loadPages(id: string) {
    const { data } = await supabase.from("magazine_pages").select("*").eq("magazine_id", id).order("page_number");
    setPages((data ?? []) as MagPage[]);
  }
  useEffect(() => { if (selected) loadPages(selected.id); else setPages([]); }, [selected]);

  async function createMag(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const { data } = await supabase.from("magazines").insert({ title: title.trim(), published: false }).select().single();
    setTitle("");
    loadMags();
    if (data) setSelected(data as MagRow);
  }

  async function updateMag(patch: Partial<MagRow>) {
    if (!selected) return;
    await supabase.from("magazines").update(patch).eq("id", selected.id);
    const next = { ...selected, ...patch };
    setSelected(next);
    setMags(mags.map((m) => m.id === selected.id ? next : m));
  }

  async function deleteMag() {
    if (!selected || !confirm("Excluir edição e todas as páginas?")) return;
    await supabase.from("magazines").delete().eq("id", selected.id);
    setSelected(null); loadMags();
  }

  async function addPage() {
    if (!selected) return;
    const nextNum = (pages.at(-1)?.page_number ?? 0) + 1;
    await supabase.from("magazine_pages").insert({
      magazine_id: selected.id, page_number: nextNum,
    });
    loadPages(selected.id);
  }

  async function updatePage(id: string, patch: Partial<MagPage>) {
    await supabase.from("magazine_pages").update(patch).eq("id", id);
    setPages(pages.map((p) => p.id === id ? { ...p, ...patch } : p));
  }

  async function deletePage(id: string) {
    if (!confirm("Excluir página?")) return;
    await supabase.from("magazine_pages").delete().eq("id", id);
    if (selected) loadPages(selected.id);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="glass-dark rounded-xl p-4">
        <form onSubmit={createMag} className="mb-4 flex gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da nova edição"
            className="flex-1 rounded border border-white/15 bg-black/60 px-2 py-1.5 text-sm text-white" />
          <button className="rounded bg-ruby-gradient px-3 py-1 font-display text-xs tracking-widest text-white">+</button>
        </form>
        <ul className="space-y-1">
          {mags.map((m) => (
            <li key={m.id}>
              <button onClick={() => setSelected(m)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${selected?.id === m.id ? "bg-[color:var(--ruby)]/20 text-white" : "text-white/70 hover:bg-white/5"}`}>
                <span className="font-display text-xs tracking-widest">
                  {m.issue_number != null ? `#${String(m.issue_number).padStart(2, "0")} · ` : ""}{m.title}
                </span>
                <span className={`ml-2 text-[10px] ${m.published ? "text-green-400" : "text-yellow-400"}`}>
                  {m.published ? "publicada" : "rascunho"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {selected ? (
        <div className="space-y-5">
          <section className="glass-dark rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm tracking-widest text-[color:var(--chrome)]">▎EDIÇÃO</h3>
              <div className="flex gap-2">
                <button onClick={() => updateMag({ published: !selected.published })}
                  className={`rounded px-3 py-1 font-display text-xs tracking-widest ${selected.published ? "border border-yellow-400/60 text-yellow-300" : "bg-ruby-gradient text-white"}`}>
                  {selected.published ? "DESPUBLICAR" : "PUBLICAR"}
                </button>
                <button onClick={deleteMag} className="rounded border border-red-400/50 px-3 py-1 font-display text-xs tracking-widest text-red-300 hover:bg-red-500/10">
                  EXCLUIR
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input label="Título" value={selected.title} onChange={(v) => updateMag({ title: v })} />
              <Input label="Subtítulo" value={selected.subtitle ?? ""} onChange={(v) => updateMag({ subtitle: v || null })} />
              <Input label="Número da edição" value={selected.issue_number?.toString() ?? ""}
                onChange={(v) => updateMag({ issue_number: v ? parseInt(v) : null })} />
              <div>
                <p className="mb-1 font-display text-[10px] tracking-widest text-white/60">CAPA</p>
                <ImageUpload bucket="magazines" userId={userId} currentUrl={selected.cover_url} aspect="card"
                  onUploaded={(url) => updateMag({ cover_url: url })} />
              </div>
            </div>
          </section>

          <section className="glass-dark rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm tracking-widest text-[color:var(--chrome)]">▎PÁGINAS</h3>
              <button onClick={addPage}
                className="rounded bg-ruby-gradient px-3 py-1 font-display text-xs tracking-widest text-white">+ PÁGINA</button>
            </div>
            <div className="mt-4 space-y-4">
              {pages.length === 0 && <p className="text-sm text-white/50">Nenhuma página. Clique em + PÁGINA.</p>}
              {pages.map((p) => (
                <div key={p.id} className="grid gap-3 rounded-lg border border-white/10 bg-black/40 p-4 sm:grid-cols-[160px_1fr]">
                  <div>
                    <p className="mb-1 font-display text-[10px] tracking-widest text-white/60">PÁGINA {p.page_number}</p>
                    <ImageUpload bucket="magazines" userId={userId} currentUrl={p.image_url} aspect="card"
                      onUploaded={(url) => updatePage(p.id, { image_url: url })} />
                  </div>
                  <div className="space-y-2">
                    <Input label="Título (opcional)" value={p.title ?? ""}
                      onChange={(v) => updatePage(p.id, { title: v || null })} />
                    <label className="block">
                      <span className="mb-1 block font-display text-[10px] tracking-widest text-white/60">TEXTO</span>
                      <textarea value={p.body ?? ""} rows={4}
                        onChange={(e) => updatePage(p.id, { body: e.target.value || null })}
                        className="w-full rounded border border-white/10 bg-black/60 px-2 py-1 text-sm text-white" />
                    </label>
                    <div className="flex justify-end">
                      <button onClick={() => deletePage(p.id)}
                        className="text-[11px] text-white/50 hover:text-red-300">excluir página</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="glass-dark flex items-center justify-center rounded-xl p-10 text-white/60">
          Selecione uma edição ou crie uma nova.
        </div>
      )}
    </div>
  );
}

/* ==================== GUESTBOOK MOD ==================== */
type GbRow = { id: string; profile_id: string; author_id: string; content: string; created_at: string };

function GuestbookAdmin() {
  const [rows, setRows] = useState<GbRow[]>([]);
  async function load() {
    const { data } = await supabase.from("guestbook").select("*").order("created_at", { ascending: false }).limit(100);
    setRows((data ?? []) as GbRow[]);
  }
  useEffect(() => { load(); }, []);
  async function del(id: string) {
    await supabase.from("guestbook").delete().eq("id", id);
    setRows(rows.filter((r) => r.id !== id));
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-white/50">Últimos 100 recados · exclua o que for ofensivo</p>
      {rows.length === 0 && <p className="text-sm text-white/50">Mural vazio.</p>}
      {rows.map((r) => (
        <div key={r.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
          <div className="flex-1">
            <p className="font-display text-[10px] tracking-widest text-white/40">
              {new Date(r.created_at).toLocaleString("pt-BR")}
            </p>
            <p className="mt-1 text-sm text-white/85">{r.content}</p>
          </div>
          <button onClick={() => del(r.id)}
            className="rounded border border-red-400/50 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">
            excluir
          </button>
        </div>
      ))}
    </div>
  );
}

/* ==================== util ==================== */
function Input({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-display text-[10px] tracking-widest text-white/60">{label.toUpperCase()}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full rounded border border-white/15 bg-black/60 px-2 py-1.5 text-sm text-white outline-none focus:border-[color:var(--ruby)]" />
    </label>
  );
}
