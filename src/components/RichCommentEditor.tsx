import { useRef } from "react";
import {
  ImageIcon,
  Link2Icon,
  FontBoldIcon,
  FontItalicIcon,
  UnderlineIcon,
  FaceIcon,
} from "@radix-ui/react-icons";

const QUICK_EMOJIS = ["♡", "✦", "🥺", "😂", "🔥", "👀", "✨", "💀", "🫶", "🌙"];

/**
 * Editor compacto pra comentários: aceita formatação simples + imagem/GIF + link + emoji.
 * Mantém um <textarea> de HTML cru — sanitizado na renderização via <RichBio>.
 */
export function RichCommentEditor({
  value,
  onChange,
  onSubmit,
  placeholder = "responder…",
  submitting,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  submitting?: boolean;
  compact?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function insert(snippet: string) {
    const el = ref.current;
    if (!el) return onChange((value || "") + snippet);
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
    });
  }

  function wrap(before: string, after: string, placeholder = "texto") {
    const el = ref.current;
    if (!el) return onChange((value || "") + `${before}${placeholder}${after}`);
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const replacement = `${before}${selected}${after}`;
    const next = value.slice(0, start) + replacement + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = start + before.length + selected.length;
    });
  }

  function promptImage() {
    const url = prompt("URL da imagem ou GIF (Tenor, Imgur, Giphy…):");
    if (!url) return;
    insert(
      `<img src="${url}" alt="" style="max-width:100%;max-height:280px;border-radius:8px;margin:6px 0;" />`,
    );
  }

  function promptLink() {
    const url = prompt("URL:");
    if (!url) return;
    const text = prompt("Texto do link:") || url;
    insert(`<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit?.();
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded border border-white/10 bg-black/30 px-1.5 py-1">
        <ToolBtn label="Negrito (B)" onClick={() => wrap("<strong>", "</strong>")}>
          <FontBoldIcon className="h-3 w-3" />
        </ToolBtn>
        <ToolBtn label="Itálico" onClick={() => wrap("<em>", "</em>")}>
          <FontItalicIcon className="h-3 w-3" />
        </ToolBtn>
        <ToolBtn label="Sublinhado" onClick={() => wrap("<u>", "</u>")}>
          <UnderlineIcon className="h-3 w-3" />
        </ToolBtn>
        <span className="mx-1 h-3 w-px bg-white/15" />
        <ToolBtn label="Imagem ou GIF" onClick={promptImage}>
          <ImageIcon className="h-3 w-3" />
          <span className="ml-1 text-[9px] uppercase tracking-widest">img/gif</span>
        </ToolBtn>
        <ToolBtn label="Link" onClick={promptLink}>
          <Link2Icon className="h-3 w-3" />
        </ToolBtn>
        <span className="mx-1 h-3 w-px bg-white/15" />
        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center rounded border border-white/10 bg-black/40 px-1.5 py-1 text-white/80 hover:border-[color:var(--ruby)]">
            <FaceIcon className="h-3 w-3" />
          </summary>
          <div className="absolute z-10 mt-1 flex flex-wrap gap-1 rounded border border-white/15 bg-[color:var(--surface-3)] p-2 shadow-lg">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => insert(e)}
                className="h-7 w-7 rounded text-base hover:bg-white/10"
              >
                {e}
              </button>
            ))}
          </div>
        </details>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        maxLength={2000}
        className="w-full rounded border border-white/15 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[color:var(--ruby)]"
      />
      {onSubmit && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-white/40">⌘/Ctrl + Enter pra enviar · HTML é sanitizado</p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !value.trim()}
            className="rounded bg-ruby-gradient px-3 py-1.5 font-display text-xs tracking-widest text-white disabled:opacity-50"
          >
            {submitting ? "ENVIANDO…" : "ENVIAR"}
          </button>
        </div>
      )}
    </div>
  );
}

function ToolBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex items-center rounded border border-white/10 bg-black/40 px-1.5 py-1 text-white/80 outline-none transition hover:border-[color:var(--ruby)] hover:text-white focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]"
    >
      {children}
    </button>
  );
}
