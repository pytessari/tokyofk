import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type NotificationActor = {
  id: string;
  display_name: string;
  slug: string | null;
  avatar_url: string | null;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  kind: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  actor?: NotificationActor | null;
  preview?: string | null;
};

async function enrich(rows: NotificationRow[]): Promise<NotificationRow[]> {
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter((x): x is string => !!x)));
  const commentIds = Array.from(
    new Set(
      rows
        .filter((r) => r.kind === "post_comment")
        .map((r) => (r.payload as { comment_id?: string })?.comment_id)
        .filter((x): x is string => !!x),
    ),
  );

  const [actorsRes, commentsRes] = await Promise.all([
    actorIds.length
      ? supabase.from("profiles").select("id, display_name, slug, avatar_url").in("id", actorIds)
      : Promise.resolve({ data: [] as NotificationActor[] }),
    commentIds.length
      ? supabase.from("post_comments").select("id, content").in("id", commentIds)
      : Promise.resolve({ data: [] as Array<{ id: string; content: string }> }),
  ]);

  const actorMap = new Map((actorsRes.data ?? []).map((p) => [p.id, p as NotificationActor]));
  const commentMap = new Map((commentsRes.data ?? []).map((c) => [c.id, c.content]));

  return rows.map((r) => {
    const next: NotificationRow = {
      ...r,
      actor: r.actor_id ? actorMap.get(r.actor_id) ?? null : null,
    };
    if (r.kind === "post_comment") {
      const cid = (r.payload as { comment_id?: string })?.comment_id;
      const text = cid ? commentMap.get(cid) ?? null : null;
      if (text) next.preview = text.length > 80 ? text.slice(0, 80) + "…" : text;
    }
    return next;
  });
}

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(40);
      const enriched = await enrich((data ?? []) as NotificationRow[]);
      if (active) {
        setItems(enriched);
        setLoading(false);
      }
    })();
    const ch = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const enriched = await enrich([payload.new as NotificationRow]);
          setItems((prev) => [...enriched, ...prev]);
        },
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [user]);

  const unread = items.filter((n) => !n.read_at).length;

  async function markAllRead() {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    setItems((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
    );
  }

  return { items, loading, unread, markAllRead };
}
