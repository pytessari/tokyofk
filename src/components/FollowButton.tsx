import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { FollowersDialog } from "@/components/FollowersDialog";

export function FollowButton({ targetId }: { targetId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const isSelf = user?.id === targetId;

  useEffect(() => {
    if (!user || isSelf) return;
    (async () => {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", targetId)
        .maybeSingle();
      setFollowing(!!data);
    })();
  }, [user, targetId, isSelf]);

  if (isSelf) return null;

  async function toggle() {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setBusy(true);
    if (following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
      setFollowing(false);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
      setFollowing(true);
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
      className={`rounded-md px-4 py-2 font-display text-xs tracking-widest outline-none transition focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)] disabled:opacity-50 ${
        following
          ? "border border-white/30 text-white/85 hover:border-red-400 hover:text-red-300"
          : "bg-ruby-gradient text-white shadow-[0_0_18px_#d9003680] hover:brightness-110"
      }`}
    >
      {following ? "SEGUINDO" : "+ SEGUIR"}
    </button>
  );
}

export function FollowStats({ targetId }: { targetId: string }) {
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"followers" | "following">("followers");

  useEffect(() => {
    (async () => {
      const [f, g] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", targetId),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", targetId),
      ]);
      setFollowers(f.count ?? 0);
      setFollowing(g.count ?? 0);
    })();
  }, [targetId]);

  function openTab(t: "followers" | "following") {
    setTab(t);
    setOpen(true);
  }

  return (
    <>
      <div className="flex gap-4 text-xs">
        <button
          type="button"
          onClick={() => openTab("followers")}
          className="group rounded outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]"
          aria-label={`${followers} seguidores, abrir lista`}
        >
          <b className="text-white group-hover:text-[color:var(--ruby)]">{followers}</b>{" "}
          <span className="tracking-widest text-white/60 group-hover:text-white">SEGUIDORES</span>
        </button>
        <button
          type="button"
          onClick={() => openTab("following")}
          className="group rounded outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]"
          aria-label={`Seguindo ${following} pessoas, abrir lista`}
        >
          <b className="text-white group-hover:text-[color:var(--ruby)]">{following}</b>{" "}
          <span className="tracking-widest text-white/60 group-hover:text-white">SEGUINDO</span>
        </button>
      </div>
      <FollowersDialog targetId={targetId} open={open} onOpenChange={setOpen} initialTab={tab} />
    </>
  );
}
