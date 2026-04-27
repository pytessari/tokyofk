import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { IMAGES, img } from "@/lib/images";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Meu Perfil · TOKYO" }] }),
  component: ProfilePage,
});

type Profile = {
  id: string;
  display_name: string;
  slug: string | null;
  discord_id: string | null;
  hue: number;
  bio: string | null;
  sign: string | null;
  role: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  relationship_status: string | null;
  partner_name: string | null;
  partner_slug: string | null;
};

type FamilyLink = {
  id: string;
  owner_id: string;
  kind: string;
  name: string;
  slug: string | null;
};

const RELATIONSHIP_OPTIONS = [
  "", "Solteiro(a)", "Namorando", "Casado(a) com",
  "Noivo(a) de", "Rolinho com", "Crush em", "Viúvo(a)", "É complicado",
];

const KIND_OPTIONS = [
  { value: "pai", label: "Pai" },
  { value: "mae", label: "Mãe" },
  { value: "irmao", label: "Irmão/Irmã" },
  { value: "filho", label: "Filho(a)" },
  { value: "avo", label: "Avô/Avó" },
  { value: "tio", label: "Tio(a)" },
  { value: "sobrinho", label: "Sobrinho(a)" },
  { value: "afilhado", label: "Afilhado(a)" },
  { value: "primo", label: "Primo(a)" },
  { value: "padrinho", label: "Padrinho" },
  { value: "madrinha", label: "Madrinha" },
];

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<FamilyLink[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // new family form
  const [newKind, setNewKind] = useState("pai");
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const [{ data: p }, { data: f }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("family_links").select("*").eq("owner_id", user.id).order("created_at"),
      ]);
      if (p) setProfile(p as Profile);
      if (f) setFamily(f as FamilyLink[]);
      setFetching(false);
    })();
  }, [user, loading, navigate]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!profile || !user) return;
    setSaving(true);
    setMsg(null);
    const slugClean = (profile.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const { error } = await supabase.from("profiles").update({
      display_name: profile.display_name,
      slug: slugClean || null,
      discord_id: (profile.discord_id ?? "").trim() || null,
      hue: profile.hue,
      bio: profile.bio,
      sign: profile.sign,
      role: profile.role,
      avatar_url: profile.avatar_url,
      banner_url: profile.banner_url,
      relationship_status: profile.relationship_status,
      partner_name: profile.partner_name,
      partner_slug: profile.partner_slug,
    }).eq("id", user.id);
    setSaving(false);
    setMsg(error ? `Erro: ${error.message}` : "Perfil salvo ✦");
  }

  async function addFamily(e: FormEvent) {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    const { data, error } = await supabase.from("family_links").insert({
      owner_id: user.id,
      kind: newKind,
      name: newName.trim(),
      slug: newSlug.trim() || null,
    }).select().single();
    if (!error && data) {
      setFamily([...family, data as FamilyLink]);
      setNewName(""); setNewSlug("");
    } else if (error) setMsg(`Erro família: ${error.message}`);
  }

  async function removeFamily(id: string) {
    const { error } = await supabase.from("family_links").delete().eq("id", id);
    if (!error) setFamily(family.filter((f) => f.id !== id));
  }

  if (loading || fetching) {
    return <div className="px-5 py-20 text-center font-display tracking-widest text-white/60">CARREGANDO…</div>;
  }
  if (!profile) return null;

  const avatar = img(profile.avatar_url ?? "", IMAGES.fallback.avatar);
  const banner = img(profile.banner_url ?? "", IMAGES.fallback.banner);
  const hueStyle = { ["--user-hue" as string]: profile.hue } as React.CSSProperties;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10" style={hueStyle}>
      {/* Live preview header */}
      <div className="relative overflow-hidden rounded-xl border" style={{ borderColor: `hsl(${profile.hue} 90% 50% / 0.5)` }}>
        <img src={banner} alt="" className="h-44 w-full object-cover sm:h-56" />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, transparent 0%, hsl(${profile.hue} 90% 8%) 100%)` }}
        />
      </div>
      <div className="-mt-12 flex items-end gap-4 px-2">
        <img
          src={avatar}
          alt={profile.display_name}
          className="h-24 w-24 rounded-full border-4 bg-black object-cover"
          style={{ borderColor: `hsl(${profile.hue} 90% 50%)`, boxShadow: `0 0 24px hsl(${profile.hue} 90% 50% / 0.6)` }}
        />
        <div className="pb-2">
          <h1 className="font-display text-3xl tracking-widest text-white">{profile.display_name}</h1>
          <p className="text-xs uppercase tracking-widest text-white/50">{user?.email}</p>
          {profile.slug && (
            <Link to="/santuario/$slug" params={{ slug: profile.slug }}
              className="mt-1 inline-block font-display text-[11px] tracking-widest"
              style={{ color: `hsl(${profile.hue} 90% 65%)` }}>
              /santuario/{profile.slug} ↗
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={onSave} className="mt-8 space-y-5 glass-dark rounded-xl p-6">
        <h2 className="font-display text-xl tracking-widest text-[color:var(--chrome)]">▎IDENTIDADE</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome de exibição" value={profile.display_name}
            onChange={(v) => setProfile({ ...profile, display_name: v })} required />
          <Field label="Slug (URL do santuário)" value={profile.slug ?? ""}
            onChange={(v) => setProfile({ ...profile, slug: v })}
            placeholder="jerk-leblanc" />
          <Field label="Discord ID (numérico)" value={profile.discord_id ?? ""}
            onChange={(v) => setProfile({ ...profile, discord_id: v })}
            placeholder="123456789012345678" />
          <Field label="Papel (ex: O Espinho)" value={profile.role ?? ""}
            onChange={(v) => setProfile({ ...profile, role: v })} />
          <Field label="Signo (ex: ♏ Escorpião)" value={profile.sign ?? ""}
            onChange={(v) => setProfile({ ...profile, sign: v })} />

          <label className="block">
            <span className="mb-1 block font-display text-xs tracking-widest text-white/70">
              Cor (Hue {profile.hue}°)
            </span>
            <input type="range" min="0" max="360" value={profile.hue}
              onChange={(e) => setProfile({ ...profile, hue: Number(e.target.value) })}
              className="w-full"
              style={{ accentColor: `hsl(${profile.hue} 90% 55%)` }} />
            <div className="mt-1 h-3 rounded-full" style={{
              background: "linear-gradient(90deg, hsl(0 90% 55%), hsl(60 90% 55%), hsl(120 90% 55%), hsl(180 90% 55%), hsl(240 90% 55%), hsl(300 90% 55%), hsl(360 90% 55%))"
            }} />
          </label>
        </div>

        <h2 className="pt-2 font-display text-xl tracking-widest text-[color:var(--chrome)]">▎IMAGENS</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL do avatar" value={profile.avatar_url ?? ""}
            onChange={(v) => setProfile({ ...profile, avatar_url: v })}
            placeholder="https://i.imgur.com/xxxxx.jpg" />
          <Field label="URL da capa (banner)" value={profile.banner_url ?? ""}
            onChange={(v) => setProfile({ ...profile, banner_url: v })}
            placeholder="https://i.imgur.com/xxxxx.jpg" />
        </div>

        <label className="block">
          <span className="mb-1 block font-display text-xs tracking-widest text-white/70">Bio</span>
          <textarea value={profile.bio ?? ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4} maxLength={500}
            className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none focus:border-[color:var(--ruby)]" />
        </label>

        <h2 className="pt-2 font-display text-xl tracking-widest text-[color:var(--chrome)]">▎STATUS AMOROSO</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block font-display text-xs tracking-widest text-white/70">Status</span>
            <select value={profile.relationship_status ?? ""}
              onChange={(e) => setProfile({ ...profile, relationship_status: e.target.value || null })}
              className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none">
              {RELATIONSHIP_OPTIONS.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
            </select>
          </label>
          <Field label="Nome do parceiro" value={profile.partner_name ?? ""}
            onChange={(v) => setProfile({ ...profile, partner_name: v })} />
          <Field label="Slug do parceiro" value={profile.partner_slug ?? ""}
            onChange={(v) => setProfile({ ...profile, partner_slug: v })}
            placeholder="nome-no-santuario" />
        </div>

        {msg && (
          <p className="rounded-md border border-[color:var(--ruby)]/40 bg-[color:var(--ruby)]/10 px-3 py-2 text-sm text-white">{msg}</p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving}
            className="rounded-md bg-ruby-gradient px-5 py-2.5 font-display tracking-widest text-white shadow-[0_0_20px_#d9003680] hover:brightness-110 disabled:opacity-50">
            {saving ? "SALVANDO…" : "SALVAR"}
          </button>
          <Link to="/santuario" className="rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
            Ver Santuário
          </Link>
          <button type="button"
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="ml-auto rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
            Sair
          </button>
        </div>
      </form>

      {/* Family tree */}
      <section className="mt-8 glass-dark rounded-xl p-6">
        <h2 className="font-display text-xl tracking-widest text-[color:var(--chrome)]">▎ÁRVORE GENEALÓGICA</h2>
        <p className="mt-1 text-xs text-white/50">Adicione familiares ilimitados. O slug vira link clicável no santuário.</p>

        <ul className="mt-4 divide-y divide-white/10">
          {family.length === 0 && <li className="py-3 text-sm text-white/40">Nenhum familiar cadastrado ainda.</li>}
          {family.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-2">
              <span className="font-display text-xs tracking-widest text-[color:var(--ruby)] uppercase w-24">
                {KIND_OPTIONS.find((k) => k.value === f.kind)?.label ?? f.kind}
              </span>
              <span className="flex-1 text-white">{f.name}</span>
              {f.slug && <span className="text-xs text-white/40">/{f.slug}</span>}
              <button onClick={() => removeFamily(f.id)}
                className="rounded border border-white/15 px-2 py-1 text-xs text-white/60 hover:border-red-400 hover:text-red-300">
                Excluir
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={addFamily} className="mt-4 grid gap-3 sm:grid-cols-[140px_1fr_1fr_auto]">
          <select value={newKind} onChange={(e) => setNewKind(e.target.value)}
            className="rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white">
            {KIND_OPTIONS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <input type="text" placeholder="Nome do familiar" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white" required />
          <input type="text" placeholder="slug (opcional)" value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            className="rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white" />
          <button type="submit"
            className="rounded-md bg-ruby-gradient px-4 py-2 font-display text-sm tracking-widest text-white">
            ADICIONAR
          </button>
        </form>
      </section>
    </div>
  );
}

function Field(props: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-display text-xs tracking-widest text-white/70">{props.label}</span>
      <input type="text" value={props.value} placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)} required={props.required}
        className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none focus:border-[color:var(--ruby)]" />
    </label>
  );
}
