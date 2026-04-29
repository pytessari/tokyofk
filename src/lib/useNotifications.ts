import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  kind: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setItems([]); setLoading(false); return; }
    let active = true;
    (async () => {
      const { data } = await supabase.from("notifications")
        .select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(40);
      if (active) { setItems((data ?? []) as NotificationRow[]); setLoading(false); }
    })();
    const ch = supabase.channel(`notif:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setItems((prev) => [payload.new as NotificationRow, ...prev]))
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [user]);

  const unread = items.filter((n) => !n.read_at).length;

  async function markAllRead() {
    if (!user) return;
    await supabase.from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id).is("read_at", null);
    setItems((prev) => prev.map((n) => n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
  }

  return { items, loading, unread, markAllRead };
}
