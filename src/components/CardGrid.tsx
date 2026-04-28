import { IMAGES, img } from "@/lib/images";

export type CardRow = {
  id: string;
  character_key: string;
  character_name: string;
  card_number: string;
  name: string;
  rarity: string;
  season: string | null;
  image_url: string | null;
};

function rarityColor(r: string) {
  const k = r.toUpperCase();
  if (k.includes("HOLO") || k === "R") return "text-[color:var(--ruby)]";
  if (k.includes("FOIL") || k === "S") return "text-pink-300";
  if (k.includes("PROMO")) return "text-yellow-300";
  if (k === "A") return "text-orange-300";
  if (k === "B") return "text-cyan-300";
  return "text-white/60";
}

export function CardGrid({ cards, empty = "Nenhuma carta." }: { cards: CardRow[]; empty?: string }) {
  if (cards.length === 0) return <p className="text-sm text-white/50">{empty}</p>;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {cards.map((c, i) => (
        <div key={c.id} className="tilt-card relative overflow-hidden rounded-xl ruby-border shimmer">
          <div className="relative">
            <img src={img(c.image_url ?? "", IMAGES.fallback.card)} alt={c.name}
              className="aspect-[3/4] w-full object-cover"
              style={c.image_url ? undefined : { filter: `hue-rotate(${i * 18}deg)` }} />
            <div className="holo-shine" />
          </div>
          <div className="relative bg-black/85 p-3">
            <p className="font-display text-[11px] tracking-widest text-white">
              #{c.card_number} · {c.name.toUpperCase()}
            </p>
            <p className={`mt-0.5 text-[10px] tracking-widest ${rarityColor(c.rarity)}`}>
              {c.rarity.toUpperCase()}{c.season ? ` · ${c.season}` : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
