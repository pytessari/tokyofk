import DOMPurify from "dompurify";

/** Escape HTML chars so we can build markup safely. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type CustomEmoji = { shortcode: string; url: string; is_animated: boolean };

/**
 * Formato estilo Discord — subset:
 *  - ```bloco```          → <pre><code>
 *  - `inline`             → <code>
 *  - **negrito**          → <strong>
 *  - *itálico* ou _it_    → <em>
 *  - __sublinhado__       → <u>
 *  - ~~riscado~~          → <s>
 *  - ||spoiler||          → <span class="spoiler">
 *  - > citação            → <blockquote>
 *  - https://… auto-link  → <a>
 *  - :shortcode:          → <img class="custom-emoji">
 *  - quebras de linha     → <br>
 *
 * Sanitizado com DOMPurify no fim.
 */
export function renderMessage(raw: string, emojis: Map<string, CustomEmoji> = new Map()): string {
  if (!raw) return "";

  // 1) Extrair code blocks primeiro (não processar markdown dentro)
  const codeBlocks: string[] = [];
  let work = raw.replace(/```([\s\S]*?)```/g, (_, code: string) => {
    codeBlocks.push(code);
    return `\u0000CB${codeBlocks.length - 1}\u0000`;
  });

  // 2) Inline code
  const inlineCodes: string[] = [];
  work = work.replace(/`([^`\n]+)`/g, (_, code: string) => {
    inlineCodes.push(code);
    return `\u0000IC${inlineCodes.length - 1}\u0000`;
  });

  // 3) Escape HTML do restante
  work = escapeHtml(work);

  // 4) Citação por linha (> texto)
  work = work
    .split("\n")
    .map((line) => {
      const m = /^&gt;\s?(.*)$/.exec(line);
      if (m) return `<blockquote>${m[1]}</blockquote>`;
      return line;
    })
    .join("\n");

  // 5) Spoiler ||x||
  work = work.replace(/\|\|([^|\n]+)\|\|/g, '<span class="spoiler" data-spoiler>$1</span>');

  // 6) Negrito **x**
  work = work.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");

  // 7) Sublinhado __x__
  work = work.replace(/__([^_\n]+)__/g, "<u>$1</u>");

  // 8) Itálico *x* ou _x_ (cuidado: _ dentro de palavra não conta)
  work = work.replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, "<em>$1</em>");
  work = work.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, "<em>$1</em>");

  // 9) Riscado ~~x~~
  work = work.replace(/~~([^~\n]+)~~/g, "<s>$1</s>");

  // 10) Auto-link http(s)
  work = work.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, (url) =>
    `<a href="${url}" target="_blank" rel="noopener noreferrer nofollow">${url}</a>`,
  );

  // 11) Custom emojis :shortcode:
  work = work.replace(/:([a-zA-Z0-9_]+):/g, (full, code: string) => {
    const e = emojis.get(code);
    if (!e) return full;
    return `<img class="custom-emoji" src="${e.url}" alt=":${code}:" title=":${code}:" />`;
  });

  // 12) Quebras de linha
  work = work.replace(/\n/g, "<br />");

  // 13) Restaurar code
  work = work.replace(/\u0000IC(\d+)\u0000/g, (_, i: string) => `<code>${escapeHtml(inlineCodes[Number(i)])}</code>`);
  work = work.replace(/\u0000CB(\d+)\u0000/g, (_, i: string) => `<pre><code>${escapeHtml(codeBlocks[Number(i)])}</code></pre>`);

  // 14) Sanitização final
  return DOMPurify.sanitize(work, {
    ALLOWED_TAGS: ["strong", "em", "u", "s", "span", "blockquote", "code", "pre", "br", "a", "img"],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "data-spoiler", "src", "alt", "title"],
  });
}
