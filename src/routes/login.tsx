import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar · TOKYO" },
      { name: "description", content: "Acesse sua conta da comunidade TOKYO." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) setError(error);
    else navigate({ to: "/perfil" });
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-display text-5xl tracking-widest text-ruby-gradient">ENTRAR</h1>
      <p className="mt-2 text-sm text-white/60">
        Bem-vindo de volta ao Santuário.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 glass-dark rounded-xl border border-[color:var(--ruby)]/30 p-6">
        <Field label="E-mail" type="email" value={email} onChange={setEmail} required autoComplete="email" />
        <Field label="Senha" type="password" value={password} onChange={setPassword} required autoComplete="current-password" />

        {error && (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-ruby-gradient px-4 py-2.5 font-display tracking-widest text-white shadow-[0_0_20px_#d9003680] transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "ENTRANDO…" : "ENTRAR"}
        </button>

        <div className="space-y-2 text-center text-sm text-white/60">
          <p>
            <Link to="/esqueci-senha" className="text-white/70 underline-offset-4 hover:text-white hover:underline">
              Esqueci minha senha
            </Link>
          </p>
          <p>
            Ainda não tem conta?{" "}
            <Link to="/registro" className="text-[color:var(--ruby)] underline-offset-4 hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, type, value, onChange, required, autoComplete,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; required?: boolean; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-display text-xs tracking-widest text-white/70">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none transition focus:border-[color:var(--ruby)] focus:ring-2 focus:ring-[color:var(--ruby)]/30"
      />
    </label>
  );
}
