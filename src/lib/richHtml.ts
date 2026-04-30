import DOMPurify from "dompurify";

// Allowlist of safe iframe hosts (embeds for music/video).
const IFRAME_HOST_ALLOWLIST = [
  "www.youtube.com",
  "youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "open.spotify.com",
  "w.soundcloud.com",
  "bandcamp.com",
];

const CONFIG = {
  ADD_TAGS: ["iframe", "marquee"],
  ADD_ATTR: [
    "allow",
    "allowfullscreen",
    "frameborder",
    "scrolling",
    "target",
    "rel",
    "behavior",
    "direction",
    "scrollamount",
  ],
  ALLOWED_URI_REGEXP: /^(https?:|mailto:|tel:|#|\/)/i,
};

// Allow only safe inline color/background-color text styling. Strip everything
// else (position, z-index, width, height, transform, etc.) to prevent CSS
// overlay phishing attacks.
const SAFE_STYLE_RE =
  /^\s*(color|background-color)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-zA-Z]+)\s*$/;

function sanitizeStyleAttr(value: string): string {
  return value
    .split(";")
    .map((d) => d.trim())
    .filter((d) => d && SAFE_STYLE_RE.test(d))
    .join("; ");
}

let hooked = false;
function ensureHooks() {
  if (hooked || typeof window === "undefined") return;
  hooked = true;
  DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (data.attrName === "style") {
      const cleaned = sanitizeStyleAttr(String(data.attrValue ?? ""));
      if (cleaned) {
        data.attrValue = cleaned;
        data.keepAttr = true;
      } else {
        data.keepAttr = false;
      }
    }
  });
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName === "iframe") {
      const src = (node as Element).getAttribute("src") ?? "";
      try {
        const url = new URL(src);
        if (url.protocol !== "https:" || !IFRAME_HOST_ALLOWLIST.includes(url.hostname)) {
          (node as Element).remove();
        }
      } catch {
        (node as Element).remove();
      }
    }
  });
}

export function sanitizeRichHtml(html: string): string {
  if (typeof window === "undefined") return ""; // server: render nothing for safety
  ensureHooks();
  return DOMPurify.sanitize(html, CONFIG) as unknown as string;
}
