import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  bucket: "avatars" | "banners" | "cards" | "magazines";
  userId: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  label?: string;
  aspect?: "square" | "banner" | "card";
};

export function ImageUpload({ bucket, userId, currentUrl, onUploaded, label = "Enviar imagem", aspect = "square" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { setError("Máx 15MB"); return; }
    setUploading(true); setError(null);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true, contentType: file.type,
    });
    if (upErr) { setError(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onUploaded(data.publicUrl);
    setUploading(false);
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
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
