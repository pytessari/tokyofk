import { useEffect, useRef, useState } from "react";
import { BellIcon, CheckIcon } from "@radix-ui/react-icons";
import { useNotifications } from "@/lib/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";

export function NotificationsBell() {
  const { items, unread, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-label={`Notificações${unread > 0 ? `, ${unread} não lidas` : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-black/40 text-white/80 outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]"
      >
        <BellIcon className="h-4 w-4" aria-hidden="true" />
        {unread > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--ruby)] px-1 text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Notificações"
          className="absolute right-0 top-full z-50 mt-2 max-h-[460px] w-[22rem] overflow-y-auto rounded-lg border border-[color:var(--ruby)]/40 bg-black/95 p-2 shadow-2xl backdrop-blur"
        >
          <div className="mb-1 flex items-center justify-between px-2 py-1">
            <p className="font-display text-[10px] tracking-widest text-[color:var(--chrome)]">
              ▎NOTIFICAÇÕES
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] tracking-widest text-white/60 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]"
              >
                <CheckIcon className="h-3 w-3" aria-hidden="true" />
                MARCAR LIDAS
              </button>
            )}
          </div>

          {items.length === 0 && (
            <p className="px-3 py-8 text-center text-xs text-white/60">
              Nada por aqui ainda.
              <br />
              <span className="text-white/40">Curtidas, comentários e seguidores aparecem aqui.</span>
            </p>
          )}

          <div className="space-y-0.5">
            {items.map((n) => (
              <NotificationItem key={n.id} n={n} onClose={() => setOpen(false)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
