import { Link } from "@tanstack/react-router";
import {
  HeartFilledIcon,
  ChatBubbleIcon,
  PersonIcon,
  EnvelopeClosedIcon,
  BellIcon,
} from "@radix-ui/react-icons";
import type { NotificationRow } from "@/lib/useNotifications";
import { timeAgo } from "@/lib/timeAgo";

const KIND: Record<string, { icon: React.ComponentType<{ className?: string }>; verb: string; color: string }> = {
  post_like: { icon: HeartFilledIcon, verb: "curtiu seu post", color: "text-pink-400" },
  post_comment: { icon: ChatBubbleIcon, verb: "comentou no seu post", color: "text-sky-400" },
  follow: { icon: PersonIcon, verb: "começou a te seguir", color: "text-emerald-400" },
  guestbook: { icon: EnvelopeClosedIcon, verb: "deixou um recado no seu mural", color: "text-amber-400" },
  dm: { icon: EnvelopeClosedIcon, verb: "te mandou uma mensagem", color: "text-[color:var(--ruby)]" },
};

type LinkTarget =
  | { to: "/feed"; search?: { post?: string; comment?: string } }
  | { to: "/mensagens"; search?: { conv?: string } }
  | { to: "/santuario/$slug"; params: { slug: string }; search?: { guestbook?: string } }
  | { to: "/santuario/$slug"; params: { slug: string } }
  | null;

function destination(n: NotificationRow): LinkTarget {
  const p = (n.payload ?? {}) as Record<string, string | undefined>;
  switch (n.kind) {
    case "post_like":
      return p.post_id ? { to: "/feed", search: { post: p.post_id } } : null;
    case "post_comment":
      return p.post_id
        ? { to: "/feed", search: { post: p.post_id, comment: p.comment_id } }
        : null;
    case "guestbook":
      return n.actor?.slug
        ? { to: "/santuario/$slug", params: { slug: n.actor.slug }, search: { guestbook: p.guestbook_id } }
        : null;
    case "dm":
      return p.conversation_id ? { to: "/mensagens", search: { conv: p.conversation_id } } : null;
    case "follow":
      return n.actor?.slug ? { to: "/santuario/$slug", params: { slug: n.actor.slug } } : null;
    default:
      return n.actor?.slug ? { to: "/santuario/$slug", params: { slug: n.actor.slug } } : null;
  }
}

export function NotificationItem({ n, onClose }: { n: NotificationRow; onClose: () => void }) {
  const meta = KIND[n.kind] ?? { icon: BellIcon, verb: n.kind, color: "text-white/70" };
  const Icon = meta.icon;
  const actor = n.actor;
  const initials = actor?.display_name?.slice(0, 2).toUpperCase() ?? "??";

  const inner = (
    <div
      className={`group flex gap-3 rounded-md px-2 py-2.5 transition hover:bg-white/5 ${
        n.read_at ? "" : "bg-[color:var(--ruby)]/5"
      }`}
    >
      <div className="relative shrink-0">
        {actor?.avatar_url ? (
          <img
            src={actor.avatar_url}
            alt=""
            className="h-9 w-9 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 font-display text-[10px] tracking-widest text-white/70">
            {initials}
          </div>
        )}
        <span
          className={`absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/80 bg-black ${meta.color}`}
          aria-hidden="true"
        >
          <Icon className="h-3 w-3" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-xs leading-snug ${n.read_at ? "text-white/70" : "text-white"}`}>
          <span className="font-display tracking-wide">{actor?.display_name ?? "Alguém"}</span>{" "}
          <span className={n.read_at ? "text-white/60" : "text-white/85"}>{meta.verb}</span>
        </p>
        {n.preview && (
          <p className="mt-0.5 truncate text-[11px] italic text-white/50">"{n.preview}"</p>
        )}
        <p className="mt-1 text-[10px] tracking-widest text-white/40">{timeAgo(n.created_at)}</p>
      </div>

      {!n.read_at && (
        <span
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[color:var(--ruby)]"
          aria-label="Não lida"
        />
      )}
    </div>
  );

  const dest = destination(n);
  if (dest) {
    // O Link do TanStack é tipado, mas aqui montamos dinamicamente; cast pra any controlado.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props: any = { to: dest.to, onClick: onClose, className: "block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]" };
    if ("params" in dest && dest.params) props.params = dest.params;
    if ("search" in dest && dest.search) props.search = dest.search;
    return <Link {...props}>{inner}</Link>;
  }
  return <div>{inner}</div>;
}
