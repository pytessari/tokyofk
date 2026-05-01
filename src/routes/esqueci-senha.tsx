import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({ meta: [{ title: "Esqueci a senha · TOKYO" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/redefinir-senha` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (error) setError(error.message);
    else setMsg("Se esse email existe na nossa base, um link de redefinição foi enviado. Olha sua caixa de entrada (e o spam).");
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <Link to="/login" className="inline-flex items-center gap-1.5 font-display text-xs tracking-widest text-white/60 hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> VOLTAR PRO LOGIN
      </Link>
      <h1 className="mt-4 font-display text-5xl tracking-widest text-ruby-gradient">ESQUECI</h1>
      <p className="mt-2 text-sm text-white/60">A gente manda um link pro seu email pra você criar uma senha nova.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 glass-dark rounded-xl border border-[color:var(--ruby)]/30 p-6">
        <label className="block">
          <span className="mb-1 block font-display text-xs tracking-widest text-white/70">E-mail</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
            className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none focus:border-[color:var(--ruby)]" />
        </label>

        {error && <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        {msg && <p className="rounded-md border border-[color:var(--ruby)]/40 bg-[color:var(--ruby)]/10 px-3 py-2 text-sm text-white">{msg}</p>}

        <button type="submit" disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--ruby)] hover:bg-[oklch(from_var(--ruby)_calc(l+0.04)_c_h)] px-4 py-2.5 font-display tracking-widest text-white  hover:brightness-110 disabled:opacity-50">
          <Mail className="h-4 w-4" /> {busy ? "ENVIANDO…" : "ENVIAR LINK"}
        </button>
      </form>
    </div>
  );
}
