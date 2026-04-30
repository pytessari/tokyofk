import { useRef } from "react";
import { RichToolbar } from "@/components/RichToolbar";

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

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit?.();
    }
  }

  return (
    <div className="space-y-2">
      <RichToolbar textareaRef={ref} value={value} onChange={onChange} size="sm" />
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        maxLength={2000}
        className="w-full rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-3)] px-3 py-2 text-sm text-[color:var(--text-1)] outline-none transition placeholder:text-[color:var(--text-3)] focus:border-[color:var(--ruby)]"
      />
      {onSubmit && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-[color:var(--text-3)]">⌘/Ctrl + Enter pra enviar · HTML é sanitizado</p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !value.trim()}
            className="rounded-md bg-ruby-gradient px-3 py-1.5 font-display text-xs tracking-widest text-white shadow-[0_4px_14px_-4px_rgba(217,0,54,0.6)] disabled:opacity-50"
          >
            {submitting ? "ENVIANDO…" : "ENVIAR"}
          </button>
        </div>
      )}
    </div>
  );
}
