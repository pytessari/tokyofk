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

export function CardGrid({
  cards,
  empty = "Nenhuma carta.",
  onCardClick,
  collectedIds,
}: {
  cards: CardRow[];
  empty?: string;
  onCardClick?: (card: CardRow) => void;
  /** Quando passado, cartas fora deste set ficam esmaecidas e marcadas como "FALTA". */
  collectedIds?: Set<string>;
}) {
  if (cards.length === 0) return <p className="text-sm text-[color:var(--text-3)]">{empty}</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cards.map((c, i) => {
        const interactive = !!onCardClick;
        const collected = collectedIds ? collectedIds.has(c.id) : true;
        const inner = (
          <>
            <div className="relative aspect-[3/4] w-full bg-black">
              <img src={img(c.image_url ?? "", IMAGES.fallback.card)} alt={c.name}
                className={`absolute inset-0 h-full w-full object-contain transition ${collected ? "" : "opacity-30 grayscale"}`}
                style={c.image_url ? undefined : { filter: `hue-rotate(${i * 18}deg)`, objectFit: "cover" }} />
              <div className="holo-shine" />
              {!collected && (
                <span className="absolute left-2 top-2 rounded bg-black/80 px-1.5 py-0.5 font-display text-[9px] tracking-widest text-white/70 border border-white/15">
                  FALTA
                </span>
              )}
            </div>
            <div className="relative bg-black/85 p-2.5">
              <p className="font-display text-[11px] tracking-widest text-white truncate">
                #{c.card_number} · {c.name.toUpperCase()}
              </p>
              <p className={`mt-0.5 text-[10px] tracking-widest ${rarityColor(c.rarity)}`}>
                {c.rarity.toUpperCase()}{c.season ? ` · ${c.season}` : ""}
              </p>
            </div>
          </>
        );
        const baseClass = "tilt-card relative overflow-hidden rounded-xl ruby-border shimmer text-left";
        return interactive ? (
          <button
            key={c.id}
            type="button"
            onClick={() => onCardClick(c)}
            className={`${baseClass} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]`}
            aria-label={`Abrir detalhes de ${c.name}`}
          >
            {inner}
          </button>
        ) : (
          <div key={c.id} className={baseClass}>{inner}</div>
        );
      })}
    </div>
  );
}
