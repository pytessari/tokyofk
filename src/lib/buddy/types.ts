// Tokyo Buddy — config do avatar 3D
import shirtSakura from "@/assets/buddy/shirt-sakura.jpg";
import shirtCyber from "@/assets/buddy/shirt-cyber.jpg";
import shirtHearts from "@/assets/buddy/shirt-hearts.jpg";
import shirtPlaid from "@/assets/buddy/shirt-plaid.jpg";
import shirtStars from "@/assets/buddy/shirt-stars.jpg";
import shirtInk from "@/assets/buddy/shirt-ink.jpg";

export type SkinTone = "porcelain" | "fair" | "tan" | "bronze" | "deep" | "ebony";
export type HairStyle = "short" | "long" | "ponytail" | "bun" | "spiky" | "bald";
export type Eyes = "happy" | "wink" | "neutral" | "angry" | "sad" | "stars";
export type Mouth = "smile" | "open" | "smirk" | "neutral" | "sad" | "tongue";
export type Accessory = "none" | "glasses" | "shades" | "headphones" | "halo" | "horns";
export type ShirtPattern = "solid" | "sakura" | "cyber" | "hearts" | "plaid" | "stars" | "ink";

export type BuddyConfig = {
  skin: SkinTone;
  hairStyle: HairStyle;
  hairColor: string;
  eyes: Eyes;
  mouth: Mouth;
  accessory: Accessory;
  shirtPattern: ShirtPattern;
  shirtColor: string;
  pantsColor: string;
};

export const DEFAULT_BUDDY: BuddyConfig = {
  skin: "fair",
  hairStyle: "short",
  hairColor: "#1a1a1a",
  eyes: "happy",
  mouth: "smile",
  accessory: "none",
  shirtPattern: "solid",
  shirtColor: "#d90036",
  pantsColor: "#1f2937",
};

export const SKIN_HEX: Record<SkinTone, string> = {
  porcelain: "#fde7d3",
  fair: "#f1c9a5",
  tan: "#d6a37a",
  bronze: "#b07a52",
  deep: "#7a4a30",
  ebony: "#4a2c1c",
};

export const HAIR_PRESETS = ["#1a1a1a", "#5a3825", "#a35a2a", "#d4a017", "#e63946", "#a78bfa", "#22d3ee", "#ffffff"];

export const SHIRT_TEXTURES: Record<Exclude<ShirtPattern, "solid">, string> = {
  sakura: shirtSakura,
  cyber: shirtCyber,
  hearts: shirtHearts,
  plaid: shirtPlaid,
  stars: shirtStars,
  ink: shirtInk,
};

export type PokeAction = "wave" | "hug" | "slap" | "dance" | "kiss" | "highfive";

export const POKE_ACTIONS: { id: PokeAction; label: string; emoji: string }[] = [
  { id: "wave", label: "Acenar", emoji: "👋" },
  { id: "hug", label: "Abraçar", emoji: "🤗" },
  { id: "highfive", label: "Mais 5", emoji: "🙏" },
  { id: "kiss", label: "Beijar", emoji: "😘" },
  { id: "dance", label: "Dançar", emoji: "💃" },
  { id: "slap", label: "Tapa", emoji: "👋" },
];
