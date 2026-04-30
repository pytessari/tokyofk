import { Link } from "@tanstack/react-router";
import { Lock, LogIn, UserPlus } from "lucide-react";

export function LoggedOutGate({ title = "ÁREA RESTRITA", message }: { title?: string; message?: string }) {
  return (
    <div className="mx-auto max-w-md px-5 py-20 text-center">
      <Lock className="mx-auto h-12 w-12 text-[color:var(--ruby)]" />
      <h1 className="mt-4 font-display text-4xl text-ruby-gradient">{title}</h1>
      <p className="mt-3 text-sm text-white/70">
        {message ?? "Entre ou crie sua conta pra acessar essa parte da comunidade."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/login" className="inline-flex items-center gap-2 rounded-md bg-ruby-gradient px-5 py-2.5 font-display text-sm tracking-widest text-white shadow-[0_0_20px_#d9003680] hover:brightness-110">
          <LogIn className="h-4 w-4" /> ENTRAR
        </Link>
        <Link to="/registro" className="inline-flex items-center gap-2 rounded-md border border-[color:var(--ruby)]/60 px-5 py-2.5 font-display text-sm tracking-widest text-white hover:bg-[color:var(--ruby)]/10">
          <UserPlus className="h-4 w-4" /> CRIAR CONTA
        </Link>
      </div>
    </div>
  );
}
