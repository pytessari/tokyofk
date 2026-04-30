import { useEffect } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { IMAGES, img } from "@/lib/images";
import type { CardRow } from "@/components/CardGrid";

type Props = {
  card: (CardRow & { acquired_at?: string | null; quantity?: number | null }) | null;
  onClose: () => void;
};

const RARITY_LABEL: Record<string, string> = {
  C: "Comum", B: "Boa", A: "Alta", R: "Rara", S: "Especial",
};

export function CardDetailDialog({ card, onClose }: Props) {
  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [card, onClose]);

  if (!card) return null;

  const acquired = card.acquired_at ? new Date(card.acquired_at).toLocaleDateString("pt-BR") : null;
  const rarityLabel = RARITY_LABEL[card.rarity?.toUpperCase()] ?? card.rarity;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes da carta ${card.name}`}
    >
      <div
        className="relative grid w-full max-w-3xl gap-6 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-2)] p-6 shadow-2xl sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-3)] text-[color:var(--text-2)] hover:border-[color:var(--line-strong)] hover:text-[color:var(--text-1)]"
        >
          <Cross2Icon className="h-4 w-4" />
        </button>

        <div className="ruby-border overflow-hidden rounded-xl">
          <img
            src={img(card.image_url ?? "", IMAGES.fallback.card)}
            alt={card.name}
            className="aspect-[3/4] w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex flex-col">
          <p className="eyebrow">#{card.card_number} · {card.character_name}</p>
          <h2 className="mt-1 font-display text-3xl text-ruby-gradient sm:text-4xl">
            {card.name.toUpperCase()}
          </h2>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Field label="Raridade" value={rarityLabel} />
            <Field label="Temporada" value={card.season ?? "—"} />
            <Field label="Personagem" value={card.character_name} />
            <Field label="Número" value={`#${card.card_number}`} />
            {card.quantity != null && card.quantity > 1 && (
              <Field label="Quantidade" value={`x${card.quantity}`} />
            )}
            {acquired && <Field label="Adquirida em" value={acquired} />}
          </dl>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-display text-[10px] tracking-widest text-[color:var(--text-3)]">
        {label.toUpperCase()}
      </dt>
      <dd className="mt-0.5 truncate text-[color:var(--text-1)]">{value}</dd>
    </div>
  );
}
