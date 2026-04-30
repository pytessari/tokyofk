import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({ meta: [{ title: "Redefinir senha · TOKYO" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase recovery flow lands here with a session in the URL hash.
    // The auth client will pick it up automatically; we just wait.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (pwd.length < 6) { setError("A senha precisa ter pelo menos 6 caracteres."); return; }
    if (pwd !== pwd2) { setError("As senhas não conferem."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) setError(error.message);
    else {
      setDone(true);
      setTimeout(() => navigate({ to: "/perfil" }), 1500);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-display text-5xl tracking-widest text-ruby-gradient">NOVA SENHA</h1>
      <p className="mt-2 text-sm text-white/60">Defina uma senha nova pra sua conta TOKYO.</p>

      {!ready ? (
        <p className="mt-8 rounded-md border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-200">
          Aguardando link de recuperação… Se você abriu essa página direto, volte ao email e clique no link enviado.
        </p>
      ) : done ? (
        <p className="mt-8 rounded-md border border-[color:var(--ruby)]/40 bg-[color:var(--ruby)]/10 px-3 py-2 text-sm text-white">
          Senha atualizada ✦ Redirecionando…
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4 glass-dark rounded-xl border border-[color:var(--ruby)]/30 p-6">
          <label className="block">
            <span className="mb-1 block font-display text-xs tracking-widest text-white/70">Nova senha</span>
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required minLength={6} autoComplete="new-password"
              className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none focus:border-[color:var(--ruby)]" />
          </label>
          <label className="block">
            <span className="mb-1 block font-display text-xs tracking-widest text-white/70">Confirmar senha</span>
            <input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} required minLength={6} autoComplete="new-password"
              className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none focus:border-[color:var(--ruby)]" />
          </label>

          {error && <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

          <button type="submit" disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ruby-gradient px-4 py-2.5 font-display tracking-widest text-white shadow-[0_0_20px_#d9003680] hover:brightness-110 disabled:opacity-50">
            <KeyRound className="h-4 w-4" /> {busy ? "SALVANDO…" : "SALVAR SENHA"}
          </button>
        </form>
      )}
    </div>
  );
}
