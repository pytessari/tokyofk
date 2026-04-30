import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CustomEmoji } from "@/lib/messageFormat";

/** Carrega e cacheia (em memória) o mapa de emojis customizados. */
let cache: Map<string, CustomEmoji> | null = null;
const listeners = new Set<() => void>();

async function fetchAll(): Promise<Map<string, CustomEmoji>> {
  const { data } = await supabase.from("custom_emojis").select("shortcode, url, is_animated");
  const map = new Map<string, CustomEmoji>();
  (data ?? []).forEach((e) => map.set(e.shortcode, e as CustomEmoji));
  cache = map;
  listeners.forEach((cb) => cb());
  return map;
}

export function useCustomEmojis() {
  const [emojis, setEmojis] = useState<Map<string, CustomEmoji>>(cache ?? new Map());
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    const cb = () => setEmojis(new Map(cache ?? []));
    listeners.add(cb);
    if (!cache) {
      void fetchAll().then(() => setLoading(false));
    } else {
      setLoading(false);
    }
    const ch = supabase
      .channel(`custom-emojis-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "custom_emojis" }, () => {
        void fetchAll();
      })
      .subscribe();
    return () => {
      listeners.delete(cb);
      supabase.removeChannel(ch);
    };
  }, []);

  return { emojis, loading, reload: fetchAll };
}
