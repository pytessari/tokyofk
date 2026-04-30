import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEFAULT_BUDDY, type BuddyConfig } from "@/lib/buddy/types";

export function useBuddy(userId?: string | null) {
  const { user } = useAuth();
  const target = userId ?? user?.id ?? null;
  const [config, setConfigState] = useState<BuddyConfig>(DEFAULT_BUDDY);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const isOwn = !!user && user.id === target;

  // serialização do que foi salvo por último (pra não fazer save redundante)
  const lastSavedRef = useRef<string>("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSaveRef = useRef(true); // não salva ao hidratar

  const load = useCallback(async () => {
    if (!target) {
      setConfigState(DEFAULT_BUDDY);
      lastSavedRef.current = JSON.stringify(DEFAULT_BUDDY);
      skipNextSaveRef.current = true;
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("buddy_avatars")
      .select("config")
      .eq("user_id", target)
      .maybeSingle();
    const next = data?.config
      ? { ...DEFAULT_BUDDY, ...(data.config as BuddyConfig) }
      : DEFAULT_BUDDY;
    skipNextSaveRef.current = true;
    lastSavedRef.current = JSON.stringify(next);
    setConfigState(next);
    setLoading(false);
  }, [target]);

  useEffect(() => {
    let active = true;
    (async () => {
      await load();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [load]);

  // Recarrega ao voltar pra aba (mantém em sincronia entre dispositivos)
  useEffect(() => {
    if (!target) return;
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [target, load]);

  // Auto-save com debounce (só do próprio usuário)
  useEffect(() => {
    if (!isOwn || !user || loading) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const serialized = JSON.stringify(config);
    if (serialized === lastSavedRef.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveBuddy(user.id, config);
        lastSavedRef.current = serialized;
        setSavedAt(Date.now());
      } catch {
        // silencioso — usuário pode tentar novamente
      }
    }, 600);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [config, isOwn, user, loading]);

  // Salva imediatamente antes de fechar/sair da página
  useEffect(() => {
    if (!isOwn || !user) return;
    function flush() {
      const serialized = JSON.stringify(config);
      if (serialized === lastSavedRef.current) return;
      // fire-and-forget
      saveBuddy(user!.id, config).catch(() => {});
      lastSavedRef.current = serialized;
    }
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [config, isOwn, user]);

  const setConfig = useCallback((next: BuddyConfig | ((prev: BuddyConfig) => BuddyConfig)) => {
    setConfigState((prev) => (typeof next === "function" ? (next as (p: BuddyConfig) => BuddyConfig)(prev) : next));
  }, []);

  return { config, setConfig, loading, isOwn, savedAt };
}

export async function saveBuddy(userId: string, config: BuddyConfig) {
  const { error } = await supabase
    .from("buddy_avatars")
    .upsert({ user_id: userId, config }, { onConflict: "user_id" });
  if (error) throw error;
}
