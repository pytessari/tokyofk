import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="panel flex flex-col items-center justify-center gap-3 px-6 py-12 text-center"
    >
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--surface-3)] text-[color:var(--ruby)]">
          {icon}
        </div>
      )}
      <p className="font-display text-sm tracking-widest text-[color:var(--text-1)]">
        {title.toUpperCase()}
      </p>
      {description && (
        <p className="max-w-md text-xs text-[color:var(--text-3)]">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
