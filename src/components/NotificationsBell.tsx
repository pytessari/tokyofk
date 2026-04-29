import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/lib/useNotifications";

const KIND_LABEL: Record<string, string> = {
  post_like: "curtiu seu post",
  post_comment: "comentou no seu post",
  follow: "começou a te seguir",
  guestbook: "deixou um recado no seu mural",
};

export function NotificationsBell() {
  const { items, unread, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen((s) => !s); if (!open && unread > 0) markAllRead(); }}
        className="relative rounded-md border border-white/15 bg-black/40 px-3 py-2 font-display text-sm text-white/80 hover:bg-white/5">
        🔔
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--ruby)] px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[420px] overflow-y-auto rounded-lg border border-[color:var(--ruby)]/40 bg-black/95 p-2 shadow-2xl backdrop-blur">
          <p className="px-2 py-1 font-display text-[10px] tracking-widest text-[color:var(--chrome)]">▎NOTIFICAÇÕES</p>
          {items.length === 0 && <p className="px-2 py-4 text-xs text-white/50">Nada por aqui ainda.</p>}
          {items.map((n) => (
            <div key={n.id} className={`rounded px-2 py-2 text-xs ${n.read_at ? "text-white/60" : "text-white"}`}>
              <p>{KIND_LABEL[n.kind] ?? n.kind}</p>
              <p className="text-[10px] text-white/40">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
