/**
 * 🖼️ CENTRAL DE IMAGENS DO SITE TOKYO
 * ────────────────────────────────────
 * Edite este arquivo para trocar QUALQUER imagem do site.
 * Cole aqui URLs públicas de Imgur, Cloudinary, ImgBB, GitHub raw, etc.
 *
 * Onde hospedar (gratuito):
 *  • Imgur          → https://imgur.com (cole o link "Direct Link" terminado em .jpg/.png)
 *  • ImgBB          → https://imgbb.com
 *  • Cloudinary     → https://cloudinary.com (CDN, melhor qualidade)
 *  • Postimages     → https://postimages.org
 *
 * Depois de subir a imagem, pegue o link direto e cole abaixo.
 * Exemplo de link válido: "https://i.imgur.com/oB0JfFW.jpeg"
 */

import logoLocal from "@/assets/tokyo-logo.png";

export const IMAGES = {
  // ─── Branding ─────────────────────────────────────────────────────────
  logo: logoLocal,

  // ─── Capas de revistas ────────────────────────────────────────────────
  coverSeason1: "", // ← cole URL da capa Edição Especial Temporada 1
  coverSeason2: "",

  // ─── Banners / Hero ───────────────────────────────────────────────────
  heroBackground: "",

  // ─── Cards colecionáveis (Temporada 1) ────────────────────────────────
  cards: {
    card1: "",
    card2: "",
    card3: "",
    card4: "",
    card5: "",
  },

  // ─── Membros (avatar + banner) ────────────────────────────────────────
  // Use o slug como chave (igual ao src/lib/members.ts)
  members: {
    "jerk-leblanc": {
      avatar: "",
      banner: "",
    },
    // adicione os outros conforme tiver as imagens...
  } as Record<string, { avatar: string; banner: string } | undefined>,

  // ─── Webtoon / Quadrinhos ─────────────────────────────────────────────
  webtoonPanels: [
    "", // painel 1
    "", // painel 2
    "", // painel 3
  ],

  // ─── Fallbacks (caso a URL acima esteja vazia) ────────────────────────
  fallback: {
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=tokyo",
    banner:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 400'><defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='%23800020'/><stop offset='1' stop-color='%23d90036'/></linearGradient></defs><rect width='1200' height='400' fill='url(%23g)'/></svg>",
    card: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 420'><rect width='300' height='420' fill='%23120006'/><text x='50%25' y='50%25' fill='%23d90036' font-family='sans-serif' font-size='24' text-anchor='middle'>TOKYO</text></svg>",
  },
} as const;

/** Helper: pega imagem do membro com fallback */
export function getMemberImages(slug: string) {
  const m = IMAGES.members[slug];
  return {
    avatar: m?.avatar || IMAGES.fallback.avatar,
    banner: m?.banner || IMAGES.fallback.banner,
  };
}

/** Helper: garante URL não vazia */
export function img(url: string | undefined, fallback: string) {
  return url && url.length > 0 ? url : fallback;
}
