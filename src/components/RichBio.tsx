import { useEffect, useState } from "react";
import { sanitizeRichHtml } from "@/lib/richHtml";

export function RichBio({ html, fallback }: { html: string | null; fallback?: string | null }) {
  const [safe, setSafe] = useState<string>("");

  useEffect(() => {
    if (html && html.trim()) setSafe(sanitizeRichHtml(html));
    else setSafe("");
  }, [html]);

  if (!html?.trim()) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
        {fallback || "Biografia ainda não escrita."}
      </p>
    );
  }

  return (
    <div
      className="rich-bio text-sm leading-relaxed text-white/85"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
