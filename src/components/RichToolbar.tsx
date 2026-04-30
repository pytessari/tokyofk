import { useRef, useState } from "react";
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
 * Toolbar moderna pra editores de texto rico (composer e comentários).
 * Aplica wraps no <textarea> referenciado.
 */
export function RichToolbar({
  textareaRef,
  value,
  onChange,
  size = "md",
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (v: string) => void;
  size?: "sm" | "md";
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  function insert(snippet: string) {
    const el = textareaRef.current;
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

  function wrap(before: string, after: string, fallback = "texto") {
    const el = textareaRef.current;
    if (!el) return onChange((value || "") + `${before}${fallback}${after}`);
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || fallback;
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

  const iconCls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-3)] p-1">
      <Btn label="Negrito" onClick={() => wrap("<strong>", "</strong>")}><FontBoldIcon className={iconCls} /></Btn>
      <Btn label="Itálico" onClick={() => wrap("<em>", "</em>")}><FontItalicIcon className={iconCls} /></Btn>
      <Btn label="Sublinhado" onClick={() => wrap("<u>", "</u>")}><UnderlineIcon className={iconCls} /></Btn>
      <Sep />
      <Btn label="Imagem ou GIF" onClick={promptImage}>
        <ImageIcon className={iconCls} />
      </Btn>
      <Btn label="Link" onClick={promptLink}><Link2Icon className={iconCls} /></Btn>
      <Sep />
      <div className="relative">
        <Btn label="Emoji" onClick={() => setEmojiOpen((o) => !o)}>
          <FaceIcon className={iconCls} />
        </Btn>
        {emojiOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setEmojiOpen(false)} />
            <div
              ref={popRef}
              className="absolute left-0 top-full z-20 mt-1 flex flex-wrap gap-1 rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--surface-2)] p-2 shadow-xl"
            >
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { insert(e); setEmojiOpen(false); }}
                  className="h-8 w-8 rounded text-base hover:bg-[color:var(--surface-3)]"
                >
                  {e}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Btn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex h-7 items-center justify-center rounded-md px-2 text-[color:var(--text-2)] transition hover:bg-[color:var(--surface-4)] hover:text-[color:var(--text-1)] focus-visible:bg-[color:var(--surface-4)]"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-4 w-px bg-[color:var(--line)]" aria-hidden="true" />;
}
