import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Guestbook } from "@/components/Guestbook";
import { CardGrid, type CardRow } from "@/components/CardGrid";
import { IMAGES, img } from "@/lib/images";
import { ThornHeart, StarSpike } from "@/components/Sticker";
import { FollowButton, FollowStats } from "@/components/FollowButton";
import { PostCard, type PostRow, type PostAuthor } from "@/components/PostCard";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { RichBio } from "@/components/RichBio";

export const Route = createFileRoute("/santuario/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} · TOKYO` },
      { name: "description", content: `Ficha no Santuário TOKYO.` },
    ],
  }),
  component: MemberPage,
});

type Profile = {
  id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  bio_html: string | null;
  character_key: string | null;
  sign: string | null;
  role: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  relationship_status: string | null;
  partner_name: string | null;
  partner_slug: string | null;
};

type FamilyLink = { id: string; kind: string; name: string; slug: string | null };

const KIND_LABEL: Record<string, string> = {
  pai: "Pai", mae: "Mãe", irmao: "Irmão/Irmã", filho: "Filho(a)",
  avo: "Avô/Avó", tio: "Tio(a)", sobrinho: "Sobrinho(a)",
  afilhado: "Afilhado(a)", primo: "Primo(a)", padrinho: "Padrinho", madrinha: "Madrinha",
};

function MemberPage() {
  const { slug } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<FamilyLink[]>([]);
  const [allCards, setAllCards] = useState<CardRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFound] = useState(false);
  const [showFullAlbum, setShowFullAlbum] = useState(false);

  const loadMemberAlbum = useCallback(async (profileId: string) => {
    const { data } = await supabase
      .from("user_cards")
      .select("card:cards(*)")
      .eq("user_id", profileId)
      .order("acquired_at", { ascending: false });
    const rows = ((data ?? []) as Array<{ card: CardRow | null }>)
      .map((r) => r.card)
      .filter((c): c is CardRow => !!c);
    setAllCards(rows);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let profileId: string | null = null;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("slug", slug).maybeSingle();
      if (!p) { setNotFound(true); setLoading(false); return; }
      setProfile(p as unknown as Profile);
      profileId = p.id;

      const [{ data: f }, { data: ps }] = await Promise.all([
        supabase.from("family_links").select("id, kind, name, slug").eq("owner_id", p.id).order("created_at"),
        supabase.from("posts").select("*").eq("author_id", p.id).order("created_at", { ascending: false }).limit(10),
      ]);
      setFamily((f as FamilyLink[]) ?? []);
      await loadMemberAlbum(p.id);
      const author: PostAuthor = {
        id: p.id, display_name: p.display_name, slug: p.slug, avatar_url: p.avatar_url,
      };
      setPosts(((ps as PostRow[]) ?? []).map((x) => ({ ...x, author })));
      setLoading(false);
    })();

    const ch = supabase
      .channel(`member-album:${slug}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_cards" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { user_id?: string };
          if (profileId && row.user_id === profileId) void loadMemberAlbum(profileId);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [slug, user, authLoading, loadMemberAlbum]);

  if (authLoading) {
    return <div className="px-5 py-20 text-center font-display tracking-widest text-white/60">CARREGANDO…</div>;
  }
  if (!user) return <LoggedOutGate title="FICHA RESERVADA" message="Entre pra ver as fichas dos membros." />;
  if (loading) {
    return <div className="px-5 py-20 text-center font-display tracking-widest text-white/60">CARREGANDO…</div>;
  }
  if (notFoundState || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-display text-4xl text-ruby-gradient">MEMBRO NÃO ENCONTRADO</h1>
        <p className="mt-2 text-sm text-white/60">Esse slug não existe no santuário.</p>
        <Link to="/santuario" className="mt-6 inline-block font-display text-sm tracking-widest text-white underline">
          ← VOLTAR AO SANTUÁRIO
        </Link>
      </div>
    );
  }

  const avatar = img(profile.avatar_url ?? "", IMAGES.fallback.avatar);
  const banner = img(profile.banner_url ?? "", IMAGES.fallback.banner);
  const characterCards = profile.character_key
    ? allCards.filter((c) => c.character_key === profile.character_key)
    : [];

  return (
    <div>
      {/* Banner */}
      <div className="relative h-64 w-full overflow-hidden sm:h-80">
        <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
        <StarSpike className="absolute right-10 top-8 h-10 w-10 sticker-star" />
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-16">
        {/* Header */}
        <div className="relative -mt-20 flex flex-col items-start gap-6 sm:flex-row sm:items-end">
          <div className="chrome-frame rounded-full">
            <img src={avatar} alt={profile.display_name}
              className="h-36 w-36 rounded-full object-cover sm:h-44 sm:w-44" />
          </div>
          <div className="flex-1">
            <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">
              FICHA OFICIAL · TOKYO
            </p>
            <h1 className="font-display text-5xl text-white sm:text-6xl">
              {profile.display_name.toUpperCase()}
            </h1>
            {profile.role && (
              <p className="mt-1 text-sm tracking-widest text-[color:var(--ruby)]">
                {profile.role.toUpperCase()}
              </p>
            )}
            <div className="mt-3"><FollowStats targetId={profile.id} /></div>
          </div>
          <div className="pb-2">
            <FollowButton targetId={profile.id} />
          </div>
        </div>

        {/* Bio + Sobre */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="relative glass-dark rounded-2xl p-6">
            <ThornHeart className="absolute -right-3 -top-3 h-12 w-12" />
            <h2 className="font-display text-xl tracking-widest text-white">FICHA RÁPIDA ✦</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {profile.sign && <BioRow k="Signo" v={profile.sign} />}
              {profile.role && <BioRow k="Papel" v={profile.role} />}
              {profile.relationship_status && (
                <BioRow k="Relacionamento" v={
                  <span className="inline-flex items-center gap-1.5">
                    <ThornHeart className="h-4 w-4" />
                    {profile.relationship_status}
                    {profile.partner_name && (profile.partner_slug ? (
                      <Link to="/santuario/$slug" params={{ slug: profile.partner_slug }}
                        className="text-[color:var(--ruby)] hover:underline">
                        {" "}{profile.partner_name}
                      </Link>
                    ) : <span> {profile.partner_name}</span>)}
                  </span>
                } />
              )}
              <BioRow k="Cartas" v={`${allCards.length} coletadas`} />
            </dl>
          </div>

          <div className="relative glass-dark rounded-2xl p-8">
            <StarSpike className="absolute right-6 top-6 h-8 w-8 sticker-star" />
            <RichBio html={profile.bio_html} fallback={profile.bio} />
          </div>
        </div>

        {/* Família */}
        {family.length > 0 && (
          <section className="mt-10 glass-dark rounded-2xl p-6">
            <h2 className="font-display text-xl tracking-widest text-[color:var(--chrome)]">▎FAMÍLIA</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {family.map((f) => (
                <li key={f.id} className="flex items-center gap-3 rounded border border-white/10 bg-black/40 px-3 py-2">
                  <span className="w-24 font-display text-[11px] uppercase tracking-widest text-[color:var(--ruby)]">
                    {KIND_LABEL[f.kind] ?? f.kind}
                  </span>
                  {f.slug ? (
                    <Link to="/santuario/$slug" params={{ slug: f.slug }} className="text-white hover:underline">
                      {f.name}
                    </Link>
                  ) : <span className="text-white/85">{f.name}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Posts */}
        {posts.length > 0 && (
          <section className="mt-14">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">A LINHA DO TEMPO</p>
                <h2 className="font-display text-3xl text-ruby-gradient">ÚLTIMOS POSTS</h2>
              </div>
              <Link to="/feed" className="font-display text-xs tracking-widest text-white/70 hover:text-white">
                ABRIR FEED →
              </Link>
            </div>
            <div className="space-y-4">
              {posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </section>
        )}

        {/* Cartas */}
        <section className="mt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-display text-xs tracking-[0.5em] text-[color:var(--chrome)]">CARTAS DO PERSONAGEM</p>
              <h2 className="font-display text-4xl text-ruby-gradient">ÁLBUM DE {profile.display_name.split(" ")[0].toUpperCase()}</h2>
              <p className="mt-1 text-xs text-white/50">
                {characterCards.length} {profile.character_key ? `de ${profile.character_key}` : ""} · {allCards.length} no total
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFullAlbum(true)}
                className="rounded border border-[color:var(--ruby)]/40 bg-[color:var(--ruby)]/10 px-3 py-1.5 font-display text-[11px] tracking-widest text-white hover:bg-[color:var(--ruby)]/20"
              >
                VER ÁLBUM COMPLETO ({allCards.length})
              </button>
              <Link to="/album" className="font-display text-[11px] tracking-widest text-white/70 hover:text-white">
                MEU ÁLBUM →
              </Link>
            </div>
          </div>
          <CardGrid cards={characterCards} empty={profile.character_key ? "Esse personagem ainda não tem cartas coletadas." : "Esse membro ainda não escolheu um personagem."} />
        </section>

        {/* Modal: álbum completo */}
        {showFullAlbum && (
          <FullAlbumModal
            displayName={profile.display_name}
            cards={allCards}
            onClose={() => setShowFullAlbum(false)}
          />
        )}
        {/* Mural */}
        <div className="mt-14">
          <Guestbook profileId={profile.id} ownerId={profile.id} />
        </div>
      </div>
    </div>
  );
}

function BioRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-white/5 pb-2">
      <dt className="w-32 shrink-0 font-display text-[11px] tracking-widest text-white/50">
        {k.toUpperCase()}
      </dt>
      <dd className="flex-1 text-white/90">{v}</dd>
    </div>
  );
}

void notFound;
