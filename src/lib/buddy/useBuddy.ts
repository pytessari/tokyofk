import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEFAULT_BUDDY, type BuddyConfig } from "@/lib/buddy/types";

export function useBuddy(userId?: string | null) {
  const { user } = useAuth();
  const target = userId ?? user?.id ?? null;
  const [config, setConfig] = useState<BuddyConfig>(DEFAULT_BUDDY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!target) {
      setConfig(DEFAULT_BUDDY);
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("buddy_avatars")
        .select("config")
        .eq("user_id", target)
        .maybeSingle();
      if (active) {
        if (data?.config) setConfig({ ...DEFAULT_BUDDY, ...(data.config as BuddyConfig) });
        else setConfig(DEFAULT_BUDDY);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [target]);

  return { config, setConfig, loading, isOwn: !!user && user.id === target };
}

export async function saveBuddy(userId: string, config: BuddyConfig) {
  const { error } = await supabase
    .from("buddy_avatars")
    .upsert({ user_id: userId, config }, { onConflict: "user_id" });
  if (error) throw error;
}
