import { useEffect, useRef, useState } from "react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import { FaceIcon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCustomEmojis } from "@/lib/useCustomEmojis";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Tab = "native" | "custom";

export function EmojiPickerPopover({
  onPick,
  triggerLabel = "Emoji",
}: {
  onPick: (insert: string) => void;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("native");
  const ref = useRef<HTMLDivElement>(null);
  const { emojis } = useCustomEmojis();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [shortcode, setShortcode] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function uploadEmoji() {
    if (!user || !pendingFile) return;
    const code = shortcode.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!code || code.length < 2) {
      toast.error("Shortcode inválido (mín. 2 chars, a-z 0-9 _)");
      return;
    }
    if (pendingFile.size > 10 * 1024 * 1024) {
      toast.error("Emoji muito grande (máx 10MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = (pendingFile.name.split(".").pop() ?? "png").toLowerCase();
      const path = `${user.id}/${code}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("emojis")
        .upload(path, pendingFile, { upsert: false, contentType: pendingFile.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("emojis").getPublicUrl(path);
      const { error: insErr } = await supabase.from("custom_emojis").insert({
        shortcode: code,
        url: pub.publicUrl,
        is_animated: ext === "gif" || ext === "webp",
        created_by: user.id,
      });
      if (insErr) throw insErr;
      toast.success(`:${code}: adicionado`);
      setShortcode("");
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      const msg = e instanceof Error ? e.message : "erro";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  async function deleteEmoji(id: string, shortcode: string) {
    if (!confirm(`Remover :${shortcode}: ?`)) return;
    const { error } = await supabase.from("custom_emojis").delete().eq("id", id);
    if (error) toast.error(error.message);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-black/30 text-white/70 hover:bg-white/5 hover:text-white"
        aria-label={triggerLabel}
      >
        <FaceIcon className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-[340px] rounded-lg border border-white/10 bg-black/95 shadow-2xl backdrop-blur">
          <div className="flex border-b border-white/10">
            <TabBtn active={tab === "native"} onClick={() => setTab("native")}>Nativos</TabBtn>
            <TabBtn active={tab === "custom"} onClick={() => setTab("custom")}>
              Personalizados {emojis.size > 0 && <span className="text-white/40">· {emojis.size}</span>}
            </TabBtn>
          </div>

          {tab === "native" && (
            <EmojiPicker
              onEmojiClick={(d) => { onPick(d.emoji); }}
              theme={Theme.DARK}
              emojiStyle={EmojiStyle.NATIVE}
              width="100%"
              height={360}
              previewConfig={{ showPreview: false }}
              searchPlaceHolder="Buscar emoji"
              lazyLoadEmojis
            />
          )}

          {tab === "custom" && (
            <div className="max-h-[360px] overflow-y-auto p-3">
              {emojis.size === 0 ? (
                <p className="mb-3 text-xs text-white/50">Nenhum emoji ainda. Suba o primeiro!</p>
              ) : (
                <div className="mb-3 grid grid-cols-6 gap-2">
                  {Array.from(emojis.entries()).map(([code, e]) => (
                    <CustomEmojiButton
                      key={code}
                      shortcode={code}
                      url={e.url}
                      onPick={() => onPick(`:${code}:`)}
                      onDelete={async () => {
                        const { data } = await supabase
                          .from("custom_emojis")
                          .select("id")
                          .eq("shortcode", code)
                          .maybeSingle();
                        if (data) deleteEmoji(data.id, code);
                      }}
                    />
                  ))}
                </div>
              )}

              {user && (
                <div className="border-t border-white/10 pt-3">
                  <p className="mb-2 font-display text-[10px] tracking-widest text-white/50">▎ADICIONAR EMOJI</p>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={shortcode}
                      onChange={(e) => setShortcode(e.target.value)}
                      placeholder="shortcode (ex: blob_dance)"
                      maxLength={32}
                      className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-sm focus:border-[color:var(--ruby)] focus:outline-none"
                    />
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/gif,image/webp,image/jpeg"
                      onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
                      className="text-xs text-white/70 file:mr-2 file:rounded file:border-0 file:bg-[color:var(--surface-3)] file:px-2 file:py-1 file:text-xs file:text-white"
                    />
                    <Button
                      variant="primary"
                      onClick={uploadEmoji}
                      loading={uploading}
                      disabled={!pendingFile || shortcode.length < 2}
                    >
                      <PlusIcon className="mr-1 h-3 w-3" /> Subir
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-2 text-xs tracking-widest transition ${
        active ? "bg-[color:var(--ruby)]/20 text-white" : "text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function CustomEmojiButton({
  shortcode,
  url,
  onPick,
  onDelete,
}: {
  shortcode: string;
  url: string;
  onPick: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onPick}
        title={`:${shortcode}:`}
        className="flex h-9 w-9 items-center justify-center rounded border border-white/5 bg-black/30 hover:border-[color:var(--ruby)]/50"
      >
        <img src={url} alt={shortcode} className="max-h-7 max-w-7 object-contain" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white group-hover:flex"
        title="Remover"
      >
        <TrashIcon className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}
