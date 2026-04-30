import { Link } from "@tanstack/react-router";
import { BuddyCanvas } from "@/components/buddy/BuddyCanvas";
import { useBuddy } from "@/lib/buddy/useBuddy";
import { BuddyPokeButton } from "@/components/buddy/BuddyPokeButton";

type Props = {
  userId: string;
  displayName: string;
  isOwn: boolean;
};

export function BuddyProfileCard({ userId, displayName, isOwn }: Props) {
  const { config, loading } = useBuddy(userId);

  return (
    <div className="panel overflow-hidden">
      <div className="relative h-72 w-full">
        {!loading && <BuddyCanvas config={config} animation="idle" interactive={true} />}
        <div className="pointer-events-none absolute left-3 top-3">
          <p className="font-display text-[10px] tracking-widest text-[color:var(--chrome)]">▎TOKYO BUDDY</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--line)] p-3">
        {isOwn ? (
          <Link
            to="/buddy"
            className="text-xs text-[color:var(--ruby)] hover:underline"
          >
            ✏️ Editar meu Buddy
          </Link>
        ) : (
          <span className="text-xs text-[color:var(--text-3)]">Buddy 3D de {displayName}</span>
        )}
        {!isOwn && <BuddyPokeButton targetUserId={userId} targetName={displayName} />}
      </div>
    </div>
  );
}
