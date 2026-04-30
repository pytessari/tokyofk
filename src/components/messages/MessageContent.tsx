import { useState } from "react";
import { renderMessage, type CustomEmoji } from "@/lib/messageFormat";

export function MessageContent({
  text,
  emojis,
}: {
  text: string;
  emojis: Map<string, CustomEmoji>;
}) {
  const html = renderMessage(text, emojis);
  return (
    <div
      className="msg-content text-sm leading-relaxed whitespace-pre-wrap break-words"
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
