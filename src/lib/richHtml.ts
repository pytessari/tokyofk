import DOMPurify from "dompurify";

const CONFIG = {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "target", "rel"],
  ALLOWED_URI_REGEXP: /^(https?:|mailto:|tel:|#|\/)/i,
};

export function sanitizeRichHtml(html: string): string {
  if (typeof window === "undefined") return ""; // server: render nothing for safety
  return DOMPurify.sanitize(html, CONFIG);
}
