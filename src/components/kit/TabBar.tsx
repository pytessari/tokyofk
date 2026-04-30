import type { ReactNode } from "react";

export type TabItem<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  count?: number;
};

export function TabBar<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-1 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-2)] p-1"
    >
      {items.map((item) => {
        const active = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-state={active ? "active" : "inactive"}
            onClick={() => onChange(item.value)}
            className="tab-pill"
          >
            {item.icon}
            <span>{item.label.toUpperCase()}</span>
            {typeof item.count === "number" && (
              <span className="ml-1 rounded-full bg-[color:var(--surface-4)] px-1.5 text-[10px] text-[color:var(--text-2)]">
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
