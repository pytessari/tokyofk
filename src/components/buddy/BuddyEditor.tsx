import type { BuddyConfig } from "@/lib/buddy/types";
import {
  HAIR_PRESETS,
  SKIN_HEX,
  type Accessory,
  type Eyes,
  type HairStyle,
  type Mouth,
  type ShirtPattern,
  type SkinTone,
} from "@/lib/buddy/types";

type Props = {
  config: BuddyConfig;
  onChange: (next: BuddyConfig) => void;
};

const SKINS: SkinTone[] = ["porcelain", "fair", "tan", "bronze", "deep", "ebony"];
const HAIRS: { id: HairStyle; label: string }[] = [
  { id: "short", label: "Curto" },
  { id: "long", label: "Longo" },
  { id: "ponytail", label: "Rabo" },
  { id: "bun", label: "Coque" },
  { id: "spiky", label: "Espetado" },
  { id: "bald", label: "Careca" },
];
const EYES: { id: Eyes; label: string }[] = [
  { id: "happy", label: "Feliz" },
  { id: "wink", label: "Piscada" },
  { id: "neutral", label: "Neutro" },
  { id: "angry", label: "Bravo" },
  { id: "sad", label: "Triste" },
  { id: "stars", label: "Estrelas" },
];
const MOUTHS: { id: Mouth; label: string }[] = [
  { id: "smile", label: "Sorriso" },
  { id: "open", label: "Aberta" },
  { id: "smirk", label: "Sarcástico" },
  { id: "neutral", label: "Neutra" },
  { id: "sad", label: "Triste" },
  { id: "tongue", label: "Língua" },
];
const ACCS: { id: Accessory; label: string }[] = [
  { id: "none", label: "Nenhum" },
  { id: "glasses", label: "Óculos" },
  { id: "shades", label: "Escuros" },
  { id: "headphones", label: "Fone" },
  { id: "halo", label: "Auréola" },
  { id: "horns", label: "Chifres" },
];
const PATTERNS: { id: ShirtPattern; label: string }[] = [
  { id: "solid", label: "Liso" },
  { id: "sakura", label: "Sakura" },
  { id: "cyber", label: "Cyber" },
  { id: "hearts", label: "Hearts" },
  { id: "plaid", label: "Xadrez" },
  { id: "stars", label: "Estrelas" },
  { id: "ink", label: "Ink" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-display text-[10px] tracking-widest text-[color:var(--chrome)]">▎{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs transition outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)] ${
        active
          ? "border-[color:var(--ruby)] bg-[color:var(--ruby)]/15 text-white"
          : "border-white/15 bg-black/30 text-white/70 hover:border-white/30 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Swatch({
  color,
  active,
  onClick,
  label,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`h-7 w-7 rounded-full border-2 transition outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)] ${
        active ? "border-white scale-110" : "border-white/20 hover:border-white/60"
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

export function BuddyEditor({ config, onChange }: Props) {
  const set = <K extends keyof BuddyConfig>(key: K, value: BuddyConfig[K]) =>
    onChange({ ...config, [key]: value });

  return (
    <div className="space-y-4">
      <Section title="Pele">
        {SKINS.map((s) => (
          <Swatch
            key={s}
            color={SKIN_HEX[s]}
            active={config.skin === s}
            onClick={() => set("skin", s)}
            label={`Pele ${s}`}
          />
        ))}
      </Section>

      <Section title="Cabelo — estilo">
        {HAIRS.map((h) => (
          <Pill key={h.id} active={config.hairStyle === h.id} onClick={() => set("hairStyle", h.id)}>
            {h.label}
          </Pill>
        ))}
      </Section>

      <Section title="Cabelo — cor">
        {HAIR_PRESETS.map((c) => (
          <Swatch
            key={c}
            color={c}
            active={config.hairColor.toLowerCase() === c.toLowerCase()}
            onClick={() => set("hairColor", c)}
            label={`Cor ${c}`}
          />
        ))}
        <input
          type="color"
          value={config.hairColor}
          onChange={(e) => set("hairColor", e.target.value)}
          className="h-7 w-7 cursor-pointer rounded-full border border-white/20 bg-transparent"
          aria-label="Cor personalizada do cabelo"
        />
      </Section>

      <Section title="Olhos">
        {EYES.map((e) => (
          <Pill key={e.id} active={config.eyes === e.id} onClick={() => set("eyes", e.id)}>
            {e.label}
          </Pill>
        ))}
      </Section>

      <Section title="Boca">
        {MOUTHS.map((m) => (
          <Pill key={m.id} active={config.mouth === m.id} onClick={() => set("mouth", m.id)}>
            {m.label}
          </Pill>
        ))}
      </Section>

      <Section title="Acessório">
        {ACCS.map((a) => (
          <Pill key={a.id} active={config.accessory === a.id} onClick={() => set("accessory", a.id)}>
            {a.label}
          </Pill>
        ))}
      </Section>

      <Section title="Camisa — estampa">
        {PATTERNS.map((p) => (
          <Pill key={p.id} active={config.shirtPattern === p.id} onClick={() => set("shirtPattern", p.id)}>
            {p.label}
          </Pill>
        ))}
      </Section>

      {config.shirtPattern === "solid" && (
        <Section title="Camisa — cor">
          <input
            type="color"
            value={config.shirtColor}
            onChange={(e) => set("shirtColor", e.target.value)}
            className="h-7 w-12 cursor-pointer rounded border border-white/20 bg-transparent"
            aria-label="Cor da camisa"
          />
          {["#d90036", "#1f2937", "#fbbf24", "#16a34a", "#7c3aed", "#ffffff"].map((c) => (
            <Swatch
              key={c}
              color={c}
              active={config.shirtColor.toLowerCase() === c.toLowerCase()}
              onClick={() => set("shirtColor", c)}
              label={`Camisa ${c}`}
            />
          ))}
        </Section>
      )}

      <Section title="Calça">
        <input
          type="color"
          value={config.pantsColor}
          onChange={(e) => set("pantsColor", e.target.value)}
          className="h-7 w-12 cursor-pointer rounded border border-white/20 bg-transparent"
          aria-label="Cor da calça"
        />
        {["#1f2937", "#0a0a0a", "#3730a3", "#7f1d1d", "#92400e", "#ffffff"].map((c) => (
          <Swatch
            key={c}
            color={c}
            active={config.pantsColor.toLowerCase() === c.toLowerCase()}
            onClick={() => set("pantsColor", c)}
            label={`Calça ${c}`}
          />
        ))}
      </Section>
    </div>
  );
}
