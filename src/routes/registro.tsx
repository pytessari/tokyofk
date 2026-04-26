import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Criar conta · TOKYO" },
      { name: "description", content: "Junte-se à comunidade TOKYO." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("A senha precisa ter no mínimo 6 caracteres.");
      return;
    }
    setBusy(true);
    const { error } = await signUp(email, password, name.trim() || email.split("@")[0]);
    setBusy(false);
    if (error) setError(error);
    else {
      setDone(true);
      setTimeout(() => navigate({ to: "/perfil" }), 800);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-display text-5xl tracking-widest text-ruby-gradient">ENTRAR PRA GANGUE</h1>
      <p className="mt-2 text-sm text-white/60">Crie sua conta TOKYO e ganhe seu lugar no Santuário.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 glass-dark rounded-xl border border-[color:var(--ruby)]/30 p-6">
        <Field label="Nome de exibição" type="text" value={name} onChange={setName} required />
        <Field label="E-mail" type="email" value={email} onChange={setEmail} required autoComplete="email" />
        <Field label="Senha (mín. 6)" type="password" value={password} onChange={setPassword} required autoComplete="new-password" />

        {error && (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
        )}
        {done && (
          <p className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
            Conta criada! Redirecionando…
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-ruby-gradient px-4 py-2.5 font-display tracking-widest text-white shadow-[0_0_20px_#d9003680] transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "CRIANDO…" : "CRIAR CONTA"}
        </button>

        <p className="text-center text-sm text-white/60">
          Já tem conta?{" "}
          <Link to="/login" className="text-[color:var(--ruby)] underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}

function Field(props: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; required?: boolean; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-display text-xs tracking-widest text-white/70">{props.label}</span>
      <input
        type={props.type}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        autoComplete={props.autoComplete}
        className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-white outline-none transition focus:border-[color:var(--ruby)] focus:ring-2 focus:ring-[color:var(--ruby)]/30"
      />
    </label>
  );
}
