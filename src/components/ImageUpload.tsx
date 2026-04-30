import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CropDialog } from "@/components/CropDialog";
import { toast } from "sonner";

type Props = {
  bucket: "avatars" | "banners" | "cards" | "magazines";
  userId: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  label?: string;
  aspect?: "square" | "banner" | "card";
  /** Se setado, persiste a URL imediatamente em profiles.<persistField> após o upload. */
  persistField?: "avatar_url" | "banner_url";
};

export function ImageUpload({
  bucket,
  userId,
  currentUrl,
  onUploaded,
  label = "Enviar imagem",
  aspect = "square",
  persistField,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // Crop apenas para avatar (1:1) e capa (3:1). Cartas e revistas vão direto.
  const cropAspect = aspect === "square" ? 1 : aspect === "banner" ? 3 : null;
  const cropShape: "rect" | "round" = aspect === "square" ? "round" : "rect";
  // Avatar não precisa ser tão grande; capa pode ser maior.
  const maxOutput = aspect === "banner" ? 1800 : aspect === "square" ? 800 : 1600;

  async function uploadBlob(blob: Blob, ext: string, contentType: string) {
    setUploading(true);
    setError(null);
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, blob, {
      upsert: true,
      contentType,
    });
    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    // Persistência imediata (avatar/capa do perfil)
    if (persistField) {
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ [persistField]: data.publicUrl })
        .eq("id", userId);
      if (dbErr) {
        setError(dbErr.message);
        setUploading(false);
        toast.error(`Salvo no storage, mas falhou ao gravar no perfil: ${dbErr.message}`);
        return;
      }
      toast.success(persistField === "avatar_url" ? "Avatar atualizado!" : "Capa atualizada!");
    }

    onUploaded(data.publicUrl);
    setUploading(false);
    setCropSrc(null);
  }

  async function handleFile(file: File) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError("Máx 15MB");
      toast.error("Imagem muito grande (máx 15MB)");
      return;
    }
    setError(null);
    if (cropAspect) {
      // GIFs não dá pra cortar mantendo animação no canvas — sobe direto.
      if (file.type === "image/gif") {
        await uploadBlob(file, "gif", "image/gif");
        return;
      }
      const url = URL.createObjectURL(file);
      setCropSrc(url);
    } else {
      const ext = file.name.split(".").pop() || "jpg";
      await uploadBlob(file, ext, file.type);
    }
  }

  const aspectClass =
    aspect === "banner" ? "aspect-[3/1]" :
    aspect === "card"   ? "aspect-[3/4]" :
                          "aspect-square";

  return (
    <div className="space-y-2">
      <div
        onClick={() => ref.current?.click()}
        className={`relative ${aspectClass} w-full cursor-pointer overflow-hidden rounded-lg border border-dashed border-white/25 bg-black/40 transition hover:border-[color:var(--ruby)]`}
      >
        {currentUrl ? (
          <img src={currentUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-xs tracking-widest text-white/50">+ {label.toUpperCase()}</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <span className="font-display text-xs tracking-widest text-white">ENVIANDO…</span>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          // permite re-selecionar o mesmo arquivo
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}

      {cropSrc && cropAspect && (
        <CropDialog
          src={cropSrc}
          aspect={cropAspect}
          cropShape={cropShape}
          maxOutput={maxOutput}
          saving={uploading}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }}
          onConfirm={async (blob) => {
            await uploadBlob(blob, "jpg", "image/jpeg");
            URL.revokeObjectURL(cropSrc);
          }}
        />
      )}
    </div>
  );
}
