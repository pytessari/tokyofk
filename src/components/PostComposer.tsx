import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";

export function PostComposer({ onPosted }: { onPosted?: () => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [posting, setPosting] = useState(false);

  if (!user) return null;

  async function submit() {
    if (!content.trim() || !user) return;
    setPosting(true);
    await supabase.from("posts").insert({
      author_id: user.id,
      content: content.trim().slice(0, 1000),
      image_url: imageUrl,
    });
    setContent(""); setImageUrl(null); setShowImage(false);
    setPosting(false);
    onPosted?.();
  }

  return (
    <div className="glass-dark rounded-xl p-5">
      <p className="font-display text-xs tracking-[0.4em] text-[color:var(--chrome)]">▎O QUE TÁ ROLANDO?</p>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={1000} rows={3}
        placeholder="conta pra TOKYO…"
        className="mt-2 w-full resize-none rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none focus:border-[color:var(--ruby)]" />
      {showImage && (
        <div className="mt-3 max-w-xs">
          <ImageUpload bucket="banners" userId={user.id} currentUrl={imageUrl} aspect="banner"
            onUploaded={(url) => setImageUrl(url)} label="anexar imagem" />
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <button onClick={() => setShowImage((s) => !s)}
          className="font-display text-[10px] tracking-widest text-white/60 hover:text-white">
          {showImage ? "− IMAGEM" : "+ IMAGEM"}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/40">{content.length}/1000</span>
          <button onClick={submit} disabled={posting || !content.trim()}
            className="rounded-md bg-ruby-gradient px-4 py-1.5 font-display text-xs tracking-widest text-white disabled:opacity-50">
            {posting ? "…" : "POSTAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
