import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Cross2Icon, ImageIcon, UploadIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

type Community = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  rules: string | null;
  category: string | null;
  icon_url: string | null;
  banner_url: string | null;
  owner_id: string;
};

export function CommunityEditDialog({
  community,
  onClose,
  onSaved,
}: {
  community: Community;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: community.name,
    tagline: community.tagline ?? "",
    description: community.description ?? "",
    rules: community.rules ?? "",
    category: community.category ?? "",
    icon_url: community.icon_url ?? "",
    banner_url: community.banner_url ?? "",
  });
  const [uploading, setUploading] = useState<"icon" | "banner" | null>(null);
  const [saving, setSaving] = useState(false);

  async function uploadImage(file: File, kind: "icon" | "banner") {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 15MB)");
      return;
    }
    setUploading(kind);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${community.owner_id}/${community.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("communities").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) {
      setUploading(null);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("communities").getPublicUrl(path);
    setForm((f) => ({ ...f, [`${kind}_url`]: data.publicUrl }));
    setUploading(null);
    toast.success(`${kind === "icon" ? "Ícone" : "Banner"} carregado`);
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("communities")
      .update({
        name: form.name.trim(),
        tagline: form.tagline.trim() || null,
        description: form.description.trim() || null,
        rules: form.rules.trim() || null,
        category: form.category.trim() || null,
        icon_url: form.icon_url || null,
        banner_url: form.banner_url || null,
      })
      .eq("id", community.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Comunidade atualizada");
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-white/10 bg-[color:var(--surface-2)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[color:var(--surface-2)] px-5 py-3">
          <h2 className="font-display text-lg">Editar comunidade</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-white/10">
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Banner */}
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-[color:var(--text-3)]">
              Banner
            </label>
            <div
              className="relative h-32 overflow-hidden rounded border border-white/10 bg-cover bg-center"
              style={{
                backgroundImage: form.banner_url
                  ? `url(${form.banner_url})`
                  : "linear-gradient(135deg, var(--ruby), #1a1a1a)",
              }}
            >
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                <span className="flex items-center gap-1 rounded bg-black/70 px-3 py-1.5 text-xs">
                  <UploadIcon className="h-3 w-3" />
                  {uploading === "banner" ? "Enviando…" : "Trocar banner"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "banner")}
                />
              </label>
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-widest text-[color:var(--text-3)]">
              Ícone (foto da comunidade)
            </label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black">
                {form.icon_url ? (
                  <img src={form.icon_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[color:var(--ruby)]">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1 rounded border border-white/15 bg-black/40 px-3 py-1.5 text-xs hover:bg-white/10">
                  <UploadIcon className="h-3 w-3" />
                  {uploading === "icon" ? "Enviando…" : "Enviar ícone"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "icon")}
                />
              </label>
            </div>
          </div>

          <Field label="Nome">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-base"
            />
          </Field>

          <Field label="Categoria">
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="ex: RPG, Discord, Roleplay…"
              className="input-base"
            />
          </Field>

          <Field label="Tagline">
            <input
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              placeholder="Frase curta de boas-vindas"
              className="input-base"
            />
          </Field>

          <Field label="Descrição">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="input-base"
            />
          </Field>

          <Field label="Regras">
            <textarea
              value={form.rules}
              onChange={(e) => setForm({ ...form, rules: e.target.value })}
              rows={4}
              className="input-base"
            />
          </Field>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-white/10 bg-[color:var(--surface-2)] px-5 py-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save} loading={saving}>Salvar</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-widest text-[color:var(--text-3)]">
        {label}
      </label>
      {children}
    </div>
  );
}
