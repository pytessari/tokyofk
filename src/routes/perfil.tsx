import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ImageUpload";
import { RichBioEditor } from "@/components/RichBioEditor";
import { IMAGES, img } from "@/lib/images";
import { Save, Trash2, Plus, Link2, ExternalLink, Sparkles } from "lucide-react";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Meu Perfil · TOKYO" }] }),
  component: ProfilePage,
});

type Profile = {
  id: string;
  display_name: string;
  slug: string | null;
  discord_id: string | null;
  bio: string | null;
  bio_html: string | null;
  character_key: string | null;
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

type DiscordLink = {
  id: string;
  user_id: string;
  discord_id: string | null;
  verify_code: string | null;
  expires_at: string | null;
  verified_at: string | null;
};

const SIGNS = [
  "♈ Áries","♉ Touro","♊ Gêmeos","♋ Câncer","♌ Leão","♍ Virgem",
  "♎ Libra","♏ Escorpião","♐ Sagitário","♑ Capricórnio","♒ Aquário","♓ Peixes",
];

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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [characterKeys, setCharacterKeys] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<FamilyLink[]>([]);
  const [discord, setDiscord] = useState<DiscordLink | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [newKind, setNewKind] = useState("pai");
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const [{ data: p }, { data: f }, { data: d }, { data: ck }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("family_links").select("*").eq("owner_id", user.id).order("created_at"),
        supabase.from("discord_links").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("cards").select("character_key").order("character_key"),
      ]);
      if (p) setProfile(p as unknown as Profile);
      if (f) setFamily(f as FamilyLink[]);
      setDiscord((d as DiscordLink) ?? null);
      const keys = Array.from(new Set(((ck ?? []) as Array<{ character_key: string }>).map((r) => r.character_key))).filter(Boolean);
      setCharacterKeys(keys);
      setFetching(false);
    })();
  }, [user, loading, navigate]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!profile || !user) return;
    setSaving(true);
    setMsg(null);
    const slugClean = (profile.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const charKeyClean = (profile.character_key ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    const { error } = await supabase.from("profiles").update({
      display_name: profile.display_name,
      slug: slugClean || null,
      character_key: charKeyClean || null,
      bio: profile.bio,
      bio_html: profile.bio_html,
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

  function genCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "TKY-";
    for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  async function startDiscordLink() {
    if (!user) return;
    const code = genCode();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const payload = { user_id: user.id, verify_code: code, expires_at, verified_at: null, discord_id: null };
    const { data, error } = await supabase.from("discord_links")
      .upsert(payload, { onConflict: "user_id" }).select().single();
    if (error) { setMsg(`Erro: ${error.message}`); return; }
    setDiscord(data as DiscordLink);
  }

  async function unlinkDiscord() {
    if (!user) return;
    if (!confirm("Desvincular conta do Discord?")) return;
    await supabase.from("discord_links").delete().eq("user_id", user.id);
    await supabase.from("profiles").update({ discord_id: null }).eq("id", user.id);
    setDiscord(null);
    if (profile) setProfile({ ...profile, discord_id: null });
  }

  if (loading || fetching) {
    return <div className="px-5 py-20 text-center font-display tracking-widest text-white/60">CARREGANDO…</div>;
  }
  if (!profile || !user) return null;

  const avatarPreview = img(profile.avatar_url ?? "", IMAGES.fallback.avatar);
  const bannerPreview = img(profile.banner_url ?? "", IMAGES.fallback.banner);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      {/* Preview header — banner above, avatar overlapping, side-by-side text */}
      <div className="relative">
        <div className="relative h-44 w-full overflow-hidden rounded-xl ruby-border sm:h-56">
          <img src={bannerPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black/90" />
        </div>
        <div className="relative z-10 -mt-14 flex flex-col items-center gap-3 px-4 sm:-mt-16 sm:flex-row sm:items-end sm:gap-5">
          <img src={avatarPreview} alt={profile.display_name}
            className="h-24 w-24 shrink-0 rounded-full border-4 border-[color:var(--ruby)] bg-black object-cover shadow-[0_0_24px_#d9003680] sm:h-28 sm:w-28" />
          <div className="flex-1 text-center sm:pb-2 sm:text-left">
            <h1 className="font-display text-3xl tracking-widest text-white">{profile.display_name}</h1>
            {profile.slug && (
              <Link to="/santuario/$slug" params={{ slug: profile.slug }}
                className="mt-1 inline-block font-display text-[11px] tracking-widest text-[color:var(--ruby)]">
                /santuario/{profile.slug} ↗
              </Link>
            )}
          </div>
          <div className="flex gap-2 sm:pb-2">
            <Link to="/feed" className="rounded-md border border-white/20 px-3 py-1.5 font-display text-xs tracking-widest text-white/80 hover:bg-white/5">
              FEED
            </Link>
          </div>
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
          <Field label="Papel (ex: O Espinho)" value={profile.role ?? ""}
            onChange={(v) => setProfile({ ...profile, role: v })} />

          <label className="block">
            <span className="mb-1 block font-display text-xs tracking-widest text-white/70">Signo</span>
            <select value={profile.sign ?? ""}
              onChange={(e) => setProfile({ ...profile, sign: e.target.value || null })}
              className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none focus:border-[color:var(--ruby)]">
              <option value="">—</option>
              {SIGNS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 block font-display text-xs tracking-widest text-white/70">
              Personagem (chave das cartas)
            </span>
            <input
              type="text"
              list="character-keys"
              value={profile.character_key ?? ""}
              onChange={(e) => setProfile({ ...profile, character_key: e.target.value })}
              placeholder="ex: jerk"
              className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none focus:border-[color:var(--ruby)]"
            />
            <datalist id="character-keys">
              {characterKeys.map((k) => <option key={k} value={k} />)}
            </datalist>
            <p className="mt-1 text-[11px] text-white/40">
              Use a mesma chave usada no álbum de cartas (ex: <code className="text-[color:var(--ruby)]">jerk</code>).
              Sem isso, suas cartas não aparecem na sua ficha.
            </p>
          </label>
        </div>

        <h2 className="pt-2 font-display text-xl tracking-widest text-[color:var(--chrome)]">▎IMAGENS</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 font-display text-xs tracking-widest text-white/70">AVATAR</p>
            <ImageUpload bucket="avatars" userId={user.id}
              currentUrl={profile.avatar_url} aspect="square"
              onUploaded={(url) => setProfile({ ...profile, avatar_url: url })} />
          </div>
          <div>
            <p className="mb-2 font-display text-xs tracking-widest text-white/70">CAPA (BANNER)</p>
            <ImageUpload bucket="banners" userId={user.id}
              currentUrl={profile.banner_url} aspect="banner"
              onUploaded={(url) => setProfile({ ...profile, banner_url: url })} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block font-display text-xs tracking-widest text-white/70">Bio curta (texto simples)</span>
            <textarea value={profile.bio ?? ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3} maxLength={500}
              placeholder="Frase de apresentação (opcional)."
              className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none focus:border-[color:var(--ruby)]" />
          </label>

          <div>
            <span className="mb-2 flex items-center gap-2 font-display text-xs tracking-widest text-white/70">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--ruby)]" />
              FICHA COMPLETA (imagens, GIFs, vídeos)
            </span>
            <RichBioEditor
              value={profile.bio_html ?? ""}
              onChange={(v) => setProfile({ ...profile, bio_html: v })}
            />
          </div>
        </div>

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
            className="inline-flex items-center gap-2 rounded-md bg-ruby-gradient px-5 py-2.5 font-display tracking-widest text-white shadow-[0_0_20px_#d9003680] hover:brightness-110 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? "SALVANDO…" : "SALVAR"}
          </button>
          {profile.slug && (
            <Link to="/santuario/$slug" params={{ slug: profile.slug }}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
              <ExternalLink className="h-3.5 w-3.5" /> Ver meu santuário
            </Link>
          )}
        </div>
      </form>

      {/* Discord link */}
      <section className="mt-8 glass-dark rounded-xl p-6">
        <h2 className="font-display text-xl tracking-widest text-[color:var(--chrome)]">▎VINCULAR DISCORD</h2>
        {discord?.verified_at && discord.discord_id ? (
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-white/85">Vinculado a <span className="font-display tracking-widest text-[color:var(--ruby)]">{discord.discord_id}</span></p>
              <p className="text-[11px] text-white/40">Suas cartas ganhas no bot caem aqui automaticamente.</p>
            </div>
            <button onClick={unlinkDiscord} className="rounded border border-red-400/50 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10">
              Desvincular
            </button>
          </div>
        ) : discord?.verify_code && discord.expires_at && new Date(discord.expires_at) > new Date() ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-white/80">No Discord, rode o comando do bot e use este código:</p>
            <p className="font-display text-3xl tracking-[0.4em] text-ruby-gradient">{discord.verify_code}</p>
            <p className="text-[11px] text-white/40">Expira em {new Date(discord.expires_at).toLocaleTimeString("pt-BR")}.</p>
            <button onClick={startDiscordLink} className="text-[11px] tracking-widest text-white/60 hover:text-white">
              gerar outro código →
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-white/70">Gere um código e use no bot pra vincular sua conta.</p>
            <button onClick={startDiscordLink}
              className="mt-3 rounded-md bg-ruby-gradient px-4 py-2 font-display text-xs tracking-widest text-white">
              GERAR CÓDIGO
            </button>
          </div>
        )}
      </section>

      {/* Family */}
      <section className="mt-8 glass-dark rounded-xl p-6">
        <h2 className="font-display text-xl tracking-widest text-[color:var(--chrome)]">▎ÁRVORE GENEALÓGICA</h2>
        <p className="mt-1 text-xs text-white/50">Adicione familiares ilimitados. O slug vira link no santuário.</p>

        <ul className="mt-4 divide-y divide-white/10">
          {family.length === 0 && <li className="py-3 text-sm text-white/40">Nenhum familiar cadastrado ainda.</li>}
          {family.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-2">
              <span className="w-24 font-display text-xs uppercase tracking-widest text-[color:var(--ruby)]">
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
