import DOMPurify from "dompurify";

const CONFIG = {
  ADD_TAGS: ["iframe", "marquee"],
  ADD_ATTR: [
    "allow",
    "allowfullscreen",
    "frameborder",
    "scrolling",
    "target",
    "rel",
    "style",
    "behavior",
    "direction",
    "scrollamount",
  ],
  ALLOWED_URI_REGEXP: /^(https?:|mailto:|tel:|#|\/)/i,
};

export function sanitizeRichHtml(html: string): string {
  if (typeof window === "undefined") return ""; // server: render nothing for safety
  return DOMPurify.sanitize(html, CONFIG);
}
