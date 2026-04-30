import { useRef, useState } from "react";
import { ImageIcon, Cross1Icon } from "@radix-ui/react-icons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";
import { RichToolbar } from "@/components/RichToolbar";
import { RichBio } from "@/components/RichBio";

export function PostComposer({ onPosted }: { onPosted?: () => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [posting, setPosting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  if (!user) return null;

  async function submit() {
    if (!content.trim() || !user) return;
    setPosting(true);
    await supabase.from("posts").insert({
      author_id: user.id,
      content: content.trim().slice(0, 2000),
      image_url: imageUrl,
    });
    setContent(""); setImageUrl(null); setShowImage(false); setShowPreview(false);
    setPosting(false);
    onPosted?.();
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <div className="panel p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="eyebrow">O QUE TÁ ROLANDO?</p>
        {content && (
          <button
            type="button"
            onClick={() => setShowPreview((s) => !s)}
            className="font-display text-[10px] tracking-widest text-[color:var(--text-3)] hover:text-[color:var(--text-1)]"
          >
            {showPreview ? "EDITAR" : "PRÉVIA"}
          </button>
        )}
      </div>

      <RichToolbar textareaRef={ref} value={content} onChange={setContent} />

      {showPreview ? (
        <div className="mt-2 min-h-[88px] rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-3)] px-3 py-2.5 text-sm">
          {content ? <RichBio html={content} fallback="" /> : <span className="text-[color:var(--text-3)]">vazio</span>}
        </div>
      ) : (
        <textarea
          ref={ref}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKey}
          maxLength={2000}
          rows={3}
          placeholder="conta pra TOKYO…"
          className="mt-2 w-full resize-none rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-3)] px-3 py-2.5 text-sm text-[color:var(--text-1)] outline-none transition placeholder:text-[color:var(--text-3)] focus:border-[color:var(--ruby)]"
        />
      )}

      {(showImage || imageUrl) && (
        <div className="mt-3 max-w-xs">
          <ImageUpload
            bucket="banners"
            userId={user.id}
            currentUrl={imageUrl}
            aspect="banner"
            onUploaded={(url) => setImageUrl(url)}
            label="anexar imagem"
          />
          {imageUrl && (
            <button
              type="button"
              onClick={() => { setImageUrl(null); setShowImage(false); }}
              className="mt-1.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--text-3)] hover:text-[color:var(--ruby)]"
            >
              <Cross1Icon className="h-2.5 w-2.5" /> remover imagem
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowImage((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--line)] px-2.5 py-1.5 text-[11px] text-[color:var(--text-2)] transition hover:border-[color:var(--ruby)] hover:text-[color:var(--text-1)]"
        >
          <ImageIcon className="h-3 w-3" />
          {imageUrl ? "trocar imagem" : showImage ? "fechar" : "imagem"}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] tabular-nums text-[color:var(--text-3)]">{content.length}/2000</span>
          <button
            type="button"
            onClick={submit}
            disabled={posting || !content.trim()}
            className="rounded-md bg-ruby-gradient px-4 py-1.5 font-display text-xs tracking-widest text-white shadow-[0_4px_14px_-4px_rgba(217,0,54,0.6)] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {posting ? "…" : "POSTAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
