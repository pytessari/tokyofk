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
  bio: string | null;
  sign: string | null;
  role: string | null;
  avatar_url: string | null;
  banner_url: string | null;
};

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (!error && data) setProfile(data as Profile);
      setFetching(false);
    })();
  }, [user, loading, navigate]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!profile || !user) return;
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        sign: profile.sign,
        role: profile.role,
        avatar_url: profile.avatar_url,
        banner_url: profile.banner_url,
      })
      .eq("id", user.id);
    setSaving(false);
    setMsg(error ? `Erro: ${error.message}` : "Perfil salvo ✦");
  }

  if (loading || fetching) {
    return <div className="px-5 py-20 text-center font-display tracking-widest text-white/60">CARREGANDO…</div>;
  }
  if (!profile) return null;

  const avatar = img(profile.avatar_url ?? "", IMAGES.fallback.avatar);
  const banner = img(profile.banner_url ?? "", IMAGES.fallback.banner);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      {/* Banner + avatar */}
      <div className="relative overflow-hidden rounded-xl border border-[color:var(--ruby)]/40">
        <img src={banner} alt="" className="h-44 w-full object-cover sm:h-56" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      </div>
      <div className="-mt-12 flex items-end gap-4 px-2">
        <img
          src={avatar}
          alt={profile.display_name}
          className="h-24 w-24 rounded-full border-4 border-[color:var(--chrome)] bg-black object-cover shadow-[0_0_20px_#d9003680]"
        />
        <div className="pb-2">
          <h1 className="font-display text-3xl tracking-widest text-white">{profile.display_name}</h1>
          <p className="text-xs uppercase tracking-widest text-white/50">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={onSave} className="mt-8 space-y-4 glass-dark rounded-xl border border-[color:var(--ruby)]/30 p-6">
        <h2 className="font-display text-xl tracking-widest text-[color:var(--chrome)]">EDITAR PERFIL</h2>

        <Field label="Nome de exibição"
          value={profile.display_name}
          onChange={(v) => setProfile({ ...profile, display_name: v })}
          required />
        <Field label="Papel (ex: O Espinho, A Musa)"
          value={profile.role ?? ""}
          onChange={(v) => setProfile({ ...profile, role: v })} />
        <Field label="Signo (ex: ♏ Escorpião)"
          value={profile.sign ?? ""}
          onChange={(v) => setProfile({ ...profile, sign: v })} />
        <Field label="URL do avatar (link de imagem)"
          value={profile.avatar_url ?? ""}
          onChange={(v) => setProfile({ ...profile, avatar_url: v })}
          placeholder="https://i.imgur.com/xxxxx.jpg" />
        <Field label="URL da capa (banner)"
          value={profile.banner_url ?? ""}
          onChange={(v) => setProfile({ ...profile, banner_url: v })}
          placeholder="https://i.imgur.com/xxxxx.jpg" />

        <label className="block">
          <span className="mb-1 block font-display text-xs tracking-widest text-white/70">Bio</span>
          <textarea
            value={profile.bio ?? ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4}
            maxLength={500}
            className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none transition focus:border-[color:var(--ruby)] focus:ring-2 focus:ring-[color:var(--ruby)]/30"
          />
        </label>

        {msg && (
          <p className="rounded-md border border-[color:var(--ruby)]/40 bg-[color:var(--ruby)]/10 px-3 py-2 text-sm text-white">
            {msg}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-ruby-gradient px-5 py-2.5 font-display tracking-widest text-white shadow-[0_0_20px_#d9003680] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "SALVANDO…" : "SALVAR"}
          </button>
          <Link to="/santuario" className="rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
            Ver Santuário
          </Link>
          <button
            type="button"
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="ml-auto rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Sair
          </button>
        </div>
      </form>
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
      <input
        type="text"
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none transition focus:border-[color:var(--ruby)] focus:ring-2 focus:ring-[color:var(--ruby)]/30"
      />
    </label>
  );
}
