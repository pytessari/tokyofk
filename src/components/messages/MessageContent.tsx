import { useMemo, useState } from "react";
import { renderMessage, type CustomEmoji } from "@/lib/messageFormat";

// Detecta se a mensagem é "só emojis" (até 5 itens entre nativos e :customs:)
const EMOJI_ONLY_RE =
  /^(?:\s|:[a-zA-Z0-9_]+:|\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)+$/u;

function isEmojiOnly(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 80) return false;
  if (!EMOJI_ONLY_RE.test(t)) return false;
  // Conta tokens (custom :code: + grafemas pictográficos)
  const customCount = (t.match(/:[a-zA-Z0-9_]+:/g) ?? []).length;
  const stripped = t.replace(/:[a-zA-Z0-9_]+:/g, "");
  const nativeCount = Array.from(stripped.replace(/\s+/g, "")).length;
  return customCount + nativeCount <= 5;
}

export function MessageContent({
  text,
  emojis,
}: {
  text: string;
  emojis: Map<string, CustomEmoji>;
}) {
  const html = useMemo(() => renderMessage(text, emojis), [text, emojis]);
  const jumbo = useMemo(() => isEmojiOnly(text), [text]);

  return (
    <div
      className={`msg-content text-sm leading-relaxed whitespace-pre-wrap break-words ${jumbo ? "jumbo" : ""}`}
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t?.dataset?.spoiler !== undefined) {
          t.classList.toggle("revealed");
        }
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Apenas para previews curtos (uma linha, sem markdown). */
export function PlainPreview({ text, max = 80 }: { text: string; max?: number }) {
  const [s] = useState(() => text.replace(/\s+/g, " ").trim());
  return <>{s.length > max ? s.slice(0, max) + "…" : s}</>;
}
