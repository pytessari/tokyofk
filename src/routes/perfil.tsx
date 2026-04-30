import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ImageUpload";
import { RichBioEditor } from "@/components/RichBioEditor";
import { IMAGES, img } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/kit/PageHeader";
import { SectionCard } from "@/components/kit/SectionCard";
import { TabBar } from "@/components/kit/TabBar";
import {
  CheckIcon,
  TrashIcon,
  PlusIcon,
  Link2Icon,
  ExternalLinkIcon,
  HeartIcon,
  PersonIcon,
  IdCardIcon,
  ImageIcon,
  StarIcon,
  DiscIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

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

type SectionTab = "identidade" | "ficha" | "vinculos";

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [characterKeys, setCharacterKeys] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<FamilyLink[]>([]);
  const [discord, setDiscord] = useState<DiscordLink | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<SectionTab>("identidade");

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
    if (error) toast.error(error.message);
    else toast.success("Perfil salvo ✦");
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
    } else if (error) toast.error(error.message);
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
    if (error) { toast.error(error.message); return; }
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
    return <div className="px-5 py-20 text-center text-sm text-[color:var(--text-3)]">Carregando…</div>;
  }
  if (!profile || !user) return null;

  const avatarPreview = img(profile.avatar_url ?? "", IMAGES.fallback.avatar);
  const bannerPreview = img(profile.banner_url ?? "", IMAGES.fallback.banner);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <PageHeader
        eyebrow="EDIÇÃO · 編"
        title="Meu perfil"
        description="Como o resto da comunidade te vê. Atualize avatar, ficha e vínculos."
        actions={
          profile.slug && (
            <Button asChild variant="outline" size="sm">
              <Link to="/santuario/$slug" params={{ slug: profile.slug }}>
                <ExternalLinkIcon className="mr-1 h-3.5 w-3.5" /> Ver santuário
              </Link>
            </Button>
          )
        }
      />

      {/* Preview header */}
      <div className="panel mb-6 overflow-hidden">
        <div className="relative h-36 w-full sm:h-48">
          <img src={bannerPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--surface-2)] via-[color:var(--surface-2)]/40 to-transparent" />
        </div>
        <div className="-mt-12 flex flex-col items-center gap-3 px-5 pb-5 sm:-mt-14 sm:flex-row sm:items-end sm:gap-5">
          <img
            src={avatarPreview}
            alt={profile.display_name}
            className="h-24 w-24 shrink-0 rounded-full border-4 border-[color:var(--surface-2)] bg-[color:var(--surface-3)] object-cover sm:h-28 sm:w-28"
            style={{ boxShadow: "0 0 0 2px color-mix(in oklab, var(--ruby) 60%, transparent)" }}
          />
          <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
            <h2 className="font-display text-2xl text-[color:var(--text-1)] sm:text-3xl">{profile.display_name}</h2>
            {profile.slug ? (
              <p className="mt-0.5 font-mono text-xs text-[color:var(--text-3)]">/santuario/{profile.slug}</p>
            ) : (
              <p className="mt-0.5 text-xs text-amber-300/80">Defina um slug pra ter um santuário público.</p>
            )}
            {profile.role && (
              <p className="mt-1 text-[11px] uppercase tracking-widest text-[color:var(--ruby)]">{profile.role}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-5">
        <TabBar
          ariaLabel="Seções do perfil"
          value={tab}
          onChange={(v) => setTab(v as SectionTab)}
          items={[
            { value: "identidade", label: "Identidade" },
            { value: "ficha", label: "Ficha & Bio" },
            { value: "vinculos", label: "Vínculos" },
          ]}
        />
      </div>

      <form onSubmit={onSave} className="space-y-6">
        {tab === "identidade" && (
          <>
            <SectionCard
              title={<HeaderWithIcon icon={<IdCardIcon className="h-4 w-4" />} text="Identidade" />}
              description="Nome, slug, papel e signo. Aparecem no topo do santuário."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome de exibição" value={profile.display_name} required
                  onChange={(v) => setProfile({ ...profile, display_name: v })} />
                <Field label="Slug (URL do santuário)" value={profile.slug ?? ""}
                  placeholder="jerk-leblanc"
                  hint="Apenas letras minúsculas, números e hífen."
                  onChange={(v) => setProfile({ ...profile, slug: v })} />
                <Field label="Papel (ex: O Espinho)" value={profile.role ?? ""}
                  onChange={(v) => setProfile({ ...profile, role: v })} />
                <SelectField
                  label="Signo"
                  value={profile.sign ?? ""}
                  onChange={(v) => setProfile({ ...profile, sign: v || null })}
                  options={[{ value: "", label: "—" }, ...SIGNS.map((s) => ({ value: s, label: s }))]}
                />
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-[color:var(--text-2)]">
                    Personagem (chave das cartas)
                  </span>
                  <input
                    type="text"
                    list="character-keys"
                    value={profile.character_key ?? ""}
                    onChange={(e) => setProfile({ ...profile, character_key: e.target.value })}
                    placeholder="ex: jerk"
                    className={inputCls}
                  />
                  <datalist id="character-keys">
                    {characterKeys.map((k) => <option key={k} value={k} />)}
                  </datalist>
                  <p className="mt-1 text-[11px] text-[color:var(--text-3)]">
                    Use a mesma chave do álbum (ex: <code className="text-[color:var(--ruby)]">jerk</code>).
                    Sem isso, suas cartas não aparecem na ficha.
                  </p>
                </label>
              </div>
            </SectionCard>

            <SectionCard
              title={<HeaderWithIcon icon={<ImageIcon className="h-4 w-4" />} text="Imagens" />}
              description="Tamanhos sugeridos: avatar 400×400, capa 1600×500."
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium text-[color:var(--text-2)]">Avatar</p>
                  <ImageUpload bucket="avatars" userId={user.id}
                    currentUrl={profile.avatar_url} aspect="square"
                    onUploaded={(url) => setProfile({ ...profile, avatar_url: url })} />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-[color:var(--text-2)]">Capa (banner)</p>
                  <ImageUpload bucket="banners" userId={user.id}
                    currentUrl={profile.banner_url} aspect="banner"
                    onUploaded={(url) => setProfile({ ...profile, banner_url: url })} />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title={<HeaderWithIcon icon={<HeartIcon className="h-4 w-4" />} text="Status amoroso" />}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <SelectField
                  label="Status"
                  value={profile.relationship_status ?? ""}
                  onChange={(v) => setProfile({ ...profile, relationship_status: v || null })}
                  options={RELATIONSHIP_OPTIONS.map((o) => ({ value: o, label: o || "—" }))}
                />
                <Field label="Nome do parceiro" value={profile.partner_name ?? ""}
                  onChange={(v) => setProfile({ ...profile, partner_name: v })} />
                <Field label="Slug do parceiro" value={profile.partner_slug ?? ""}
                  placeholder="nome-no-santuario"
                  onChange={(v) => setProfile({ ...profile, partner_slug: v })} />
              </div>
            </SectionCard>
          </>
        )}

        {tab === "ficha" && (
          <>
            <SectionCard
              title={<HeaderWithIcon icon={<StarIcon className="h-4 w-4" />} text="Bio curta" />}
              description="Frase de apresentação. Aparece logo abaixo do nome."
            >
              <textarea
                value={profile.bio ?? ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={3} maxLength={500}
                placeholder="Uma frase que te resume."
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-[color:var(--text-3)]">
                {(profile.bio ?? "").length}/500
              </p>
            </SectionCard>

            <SectionCard
              title={<HeaderWithIcon icon={<StarIcon className="h-4 w-4" />} text="Ficha completa" />}
              description="Texto rico com imagens, GIFs, vídeos e Spotify. Tudo é sanitizado antes de salvar."
            >
              <RichBioEditor
                value={profile.bio_html ?? ""}
                onChange={(v) => setProfile({ ...profile, bio_html: v })}
              />
            </SectionCard>
          </>
        )}

        {tab === "vinculos" && (
          <>
            <SectionCard
              title={<HeaderWithIcon icon={<DiscIcon className="h-4 w-4" />} text="Discord" />}
              description="Vincule pra que cartas ganhas no bot caiam no seu álbum."
            >
              {discord?.verified_at && discord.discord_id ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-[color:var(--text-1)]">
                      Vinculado a <span className="font-mono text-[color:var(--ruby)]">{discord.discord_id}</span>
                    </p>
                    <p className="text-[11px] text-[color:var(--text-3)]">
                      Suas cartas caem aqui automaticamente.
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={unlinkDiscord}>
                    <TrashIcon className="mr-1 h-3.5 w-3.5" /> Desvincular
                  </Button>
                </div>
              ) : discord?.verify_code && discord.expires_at && new Date(discord.expires_at) > new Date() ? (
                <div className="space-y-2">
                  <p className="text-sm text-[color:var(--text-2)]">
                    No Discord, rode o comando do bot e cole este código:
                  </p>
                  <p className="font-display text-3xl tracking-[0.4em] text-ruby-gradient">{discord.verify_code}</p>
                  <p className="text-[11px] text-[color:var(--text-3)]">
                    Expira em {new Date(discord.expires_at).toLocaleTimeString("pt-BR")}.
                  </p>
                  <Button variant="ghost" size="sm" onClick={startDiscordLink}>
                    Gerar outro código
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[color:var(--text-2)]">
                    Gere um código e use no bot pra vincular sua conta.
                  </p>
                  <Button variant="primary" onClick={startDiscordLink}>
                    <Link2Icon className="mr-1 h-4 w-4" /> Gerar código
                  </Button>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title={<HeaderWithIcon icon={<PersonIcon className="h-4 w-4" />} text="Árvore genealógica" />}
              description="Relações familiares ilimitadas. O slug vira link no santuário."
            >
              {family.length === 0 ? (
                <p className="text-sm text-[color:var(--text-3)]">Nenhum familiar cadastrado ainda.</p>
              ) : (
                <ul className="divide-y divide-[color:var(--line)]">
                  {family.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-24 text-[10px] uppercase tracking-widest text-[color:var(--ruby)]">
                        {KIND_OPTIONS.find((k) => k.value === f.kind)?.label ?? f.kind}
                      </span>
                      <span className="flex-1 text-sm text-[color:var(--text-1)]">{f.name}</span>
                      {f.slug && (
                        <span className="font-mono text-xs text-[color:var(--text-3)]">/{f.slug}</span>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => removeFamily(f.id)}>
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={addFamily} className="mt-5 grid gap-2 sm:grid-cols-[140px_1fr_1fr_auto]">
                <select
                  value={newKind}
                  onChange={(e) => setNewKind(e.target.value)}
                  className={inputCls}
                >
                  {KIND_OPTIONS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
                <input type="text" placeholder="Nome do familiar" value={newName}
                  onChange={(e) => setNewName(e.target.value)} required className={inputCls} />
                <input type="text" placeholder="slug (opcional)" value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)} className={inputCls} />
                <Button type="submit" variant="primary">
                  <PlusIcon className="mr-1 h-4 w-4" /> Adicionar
                </Button>
              </form>
            </SectionCard>
          </>
        )}

        {/* Save bar */}
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[color:var(--line)] bg-[color:var(--surface-2)]/95 p-3 shadow-lg backdrop-blur">
          <p className="text-xs text-[color:var(--text-3)]">
            Mudanças não são salvas automaticamente.
          </p>
          <Button type="submit" variant="primary" loading={saving} loadingText="Salvando…">
            <CheckIcon className="mr-1 h-4 w-4" /> Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface-3)] px-3 py-2 text-sm text-[color:var(--text-1)] outline-none transition focus:border-[color:var(--ruby)] focus:ring-2 focus:ring-[color:var(--ruby)]/30";

function HeaderWithIcon({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-[color:var(--ruby)]">{icon}</span>
      {text}
    </span>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[color:var(--text-2)]">{props.label}</span>
      <input
        type="text"
        value={props.value}
        placeholder={props.placeholder}
        required={props.required}
        onChange={(e) => props.onChange(e.target.value)}
        className={inputCls}
      />
      {props.hint && <p className="mt-1 text-[11px] text-[color:var(--text-3)]">{props.hint}</p>}
    </label>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[color:var(--text-2)]">{props.label}</span>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={inputCls}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
