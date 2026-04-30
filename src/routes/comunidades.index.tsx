import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/kit/PageHeader";
import { SectionCard } from "@/components/kit/SectionCard";
import { EmptyState } from "@/components/kit/EmptyState";
import { Button } from "@/components/ui/button";
import { GroupIcon, PlusIcon, MagnifyingGlassIcon, PersonIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

type Community = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  category: string | null;
  icon_url: string | null;
  banner_url: string | null;
  members_count: number;
};

export const Route = createFileRoute("/comunidades/")({
  component: CommunitiesIndex,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl p-6 text-red-300">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function CommunitiesIndex() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", tagline: "", category: "" });
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("communities")
      .select("id,slug,name,tagline,category,icon_url,banner_url,members_count")
      .order("members_count", { ascending: false })
      .limit(60);
    setCommunities(data ?? []);
    if (user) {
      const { data: m } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);
      setMine(new Set((m ?? []).map((r) => r.community_id)));
    }
  }

  useEffect(() => {
    load();
  }, [user]);

  async function createCommunity(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) return;
    setCreating(true);
    const slug = slugify(form.name);
    const { data, error } = await supabase
      .from("communities")
      .insert({
        owner_id: user.id,
        name: form.name.trim(),
        slug,
        tagline: form.tagline.trim() || null,
        category: form.category.trim() || null,
      })
      .select("slug")
      .maybeSingle();
    setCreating(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Esse nome já existe, tente outro." : error.message);
      return;
    }
    toast.success("Comunidade criada!");
    setShowForm(false);
    setForm({ name: "", tagline: "", category: "" });
    if (data?.slug) window.location.href = `/comunidades/${data.slug}`;
  }

  const filtered = communities.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.tagline ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (c.category ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <PageHeader
        eyebrow="Círculos · 圏"
        title="Comunidades"
        description="Reúna gente que ama o mesmo. Crie um clube, role uma RPG, organize um fandom."
        actions={
          user && (
            <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
              <PlusIcon className="mr-1 h-4 w-4" /> Nova comunidade
            </Button>
          )
        }
      />

      {showForm && user && (
        <SectionCard title="Criar comunidade" className="mb-6">
          <form onSubmit={createCommunity} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <span className="mb-1 block text-[color:var(--text-3)]">Nome *</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ruby)]"
                placeholder="Clube dos Fakes"
              />
            </label>
            <label className="text-xs">
              <span className="mb-1 block text-[color:var(--text-3)]">Categoria</span>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ruby)]"
                placeholder="RPG, Fandom, K-pop…"
              />
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="mb-1 block text-[color:var(--text-3)]">Tagline</span>
              <input
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ruby)]"
                placeholder="Uma frase que resume a vibe"
                maxLength={120}
              />
            </label>
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" loading={creating}>
                Criar
              </Button>
            </div>
          </form>
        </SectionCard>
      )}

      <div className="mb-4 flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2">
        <MagnifyingGlassIcon className="h-4 w-4 text-[color:var(--text-3)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar comunidades…"
          className="w-full bg-transparent text-sm outline-none"
          aria-label="Buscar comunidades"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<GroupIcon className="h-5 w-5" />}
          title="Nenhuma comunidade ainda"
          description="Seja o primeiro a fundar um círculo. Qualquer membro pode criar."
          action={
            user ? (
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <PlusIcon className="mr-1 h-4 w-4" /> Criar comunidade
              </Button>
            ) : (
              <Button asChild variant="primary">
                <Link to="/login">Entrar para criar</Link>
              </Button>
            )
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                to="/comunidades/$slug"
                params={{ slug: c.slug }}
                className="panel block h-full overflow-hidden transition hover:border-[color:var(--ruby)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]"
              >
                <div
                  className="h-20 w-full bg-cover bg-center"
                  style={{
                    backgroundImage: c.banner_url
                      ? `url(${c.banner_url})`
                      : "linear-gradient(135deg, var(--ruby), #1a1a1a)",
                  }}
                  aria-hidden="true"
                />
                <div className="flex items-start gap-3 p-4">
                  <div className="-mt-8 h-12 w-12 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black">
                    {c.icon_url ? (
                      <img src={c.icon_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[color:var(--surface-3)] text-[color:var(--ruby)]">
                        <GroupIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm tracking-wide text-white">{c.name}</p>
                    {c.category && (
                      <p className="text-[10px] uppercase tracking-widest text-[color:var(--ruby)]">
                        {c.category}
                      </p>
                    )}
                    {c.tagline && (
                      <p className="mt-1 line-clamp-2 text-xs text-[color:var(--text-3)]">{c.tagline}</p>
                    )}
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-[color:var(--text-3)]">
                      <PersonIcon className="h-3 w-3" /> {c.members_count} membros
                      {mine.has(c.id) && (
                        <span className="ml-2 rounded bg-[color:var(--ruby)]/20 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-[color:var(--ruby)]">
                          Membro
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
