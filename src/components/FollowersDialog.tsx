import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cross2Icon, PersonIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { FollowButton } from "@/components/FollowButton";

type ProfileLite = {
  id: string;
  display_name: string;
  slug: string | null;
  avatar_url: string | null;
  role: string | null;
};

type Mode = "followers" | "following";

export function FollowersDialog({
  targetId,
  open,
  onOpenChange,
  initialTab = "followers",
  trigger,
}: {
  targetId: string;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  initialTab?: Mode;
  trigger?: React.ReactNode;
}) {
  const [tab, setTab] = useState<Mode>(initialTab);
  const [followers, setFollowers] = useState<ProfileLite[] | null>(null);
  const [following, setFollowing] = useState<ProfileLite[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
  }, [initialTab, open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      if (tab === "followers" && followers === null) {
        const { data } = await supabase.from("follows").select("follower_id").eq("following_id", targetId);
        const ids = (data ?? []).map((r) => r.follower_id);
        if (!ids.length) {
          if (active) setFollowers([]);
          return;
        }
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name, slug, avatar_url, role")
          .in("id", ids);
        if (active) setFollowers((profs ?? []) as ProfileLite[]);
      }
      if (tab === "following" && following === null) {
        const { data } = await supabase.from("follows").select("following_id").eq("follower_id", targetId);
        const ids = (data ?? []).map((r) => r.following_id);
        if (!ids.length) {
          if (active) setFollowing([]);
          return;
        }
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name, slug, avatar_url, role")
          .in("id", ids);
        if (active) setFollowing((profs ?? []) as ProfileLite[]);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, tab, targetId, followers, following]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md border-[color:var(--ruby)]/40 bg-black/95 p-0">
        <DialogHeader className="border-b border-white/10 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 font-display tracking-widest text-white">
            <PersonIcon className="h-4 w-4" aria-hidden="true" />
            CONEXÕES
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Mode)} className="px-2 pb-4 pt-3">
          <TabsList className="grid w-full grid-cols-2 bg-black/40">
            <TabsTrigger value="followers">Seguidores</TabsTrigger>
            <TabsTrigger value="following">Seguindo</TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-3 max-h-[60vh] overflow-y-auto">
            <UserList
              list={followers}
              empty="Ainda ninguém segue esse perfil."
              onClose={() => onOpenChange?.(false)}
            />
          </TabsContent>
          <TabsContent value="following" className="mt-3 max-h-[60vh] overflow-y-auto">
            <UserList
              list={following}
              empty="Esse perfil ainda não segue ninguém."
              onClose={() => onOpenChange?.(false)}
            />
          </TabsContent>
        </Tabs>

        <button
          type="button"
          onClick={() => onOpenChange?.(false)}
          className="absolute right-3 top-3 rounded p-1 text-white/60 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]"
          aria-label="Fechar"
        >
          <Cross2Icon className="h-4 w-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
}

function UserList({
  list,
  empty,
  onClose,
}: {
  list: ProfileLite[] | null;
  empty: string;
  onClose: () => void;
}) {
  if (list === null) return <p className="px-4 py-6 text-center text-xs text-white/60">carregando…</p>;
  if (list.length === 0) return <p className="px-4 py-8 text-center text-xs text-white/60">{empty}</p>;
  return (
    <ul className="space-y-1 px-1">
      {list.map((p) => (
        <li
          key={p.id}
          className="flex items-center gap-3 rounded-md border border-white/5 bg-black/40 px-3 py-2"
        >
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[10px] font-display tracking-widest text-white/60">
              {p.display_name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {p.slug ? (
              <Link
                to="/santuario/$slug"
                params={{ slug: p.slug }}
                onClick={onClose}
                className="block truncate text-sm font-medium text-white outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)]"
              >
                {p.display_name}
              </Link>
            ) : (
              <span className="block truncate text-sm text-white">{p.display_name}</span>
            )}
            {p.role && (
              <span className="text-[10px] tracking-widest text-[color:var(--ruby)]">
                {p.role.toUpperCase()}
              </span>
            )}
          </div>
          <FollowButton targetId={p.id} />
        </li>
      ))}
    </ul>
  );
}
