import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Share1Icon, CheckIcon, HeartIcon } from "@radix-ui/react-icons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/useRole";
import { Guestbook } from "@/components/Guestbook";
import { CardGrid, type CardRow } from "@/components/CardGrid";
import { CardDetailDialog } from "@/components/CardDetailDialog";
import { IMAGES, img } from "@/lib/images";
import { ThornHeart, StarSpike } from "@/components/Sticker";
import { FollowButton, FollowStats } from "@/components/FollowButton";
import { PostCard, type PostRow, type PostAuthor } from "@/components/PostCard";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { RichBio } from "@/components/RichBio";
import { BuddyProfileCard } from "@/components/buddy/BuddyProfileCard";

export const Route = createFileRoute("/santuario/$slug")({
  validateSearch: z.object({ guestbook: z.string().optional() }),
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

// Agrupamento de família por categorias visualmente distintas
const FAMILY_GROUPS: { key: string; label: string; kinds: string[] }[] = [
  { key: "ascendencia", label: "Ascendência", kinds: ["pai", "mae", "avo", "padrinho", "madrinha"] },
  { key: "irmandade", label: "Irmandade", kinds: ["irmao", "primo"] },
  { key: "descendencia", label: "Descendência", kinds: ["filho", "afilhado", "sobrinho"] },
  { key: "outros", label: "Outros", kinds: ["tio"] },
];

function groupFamily(family: FamilyLink[]) {
  const seen = new Set<string>();
  const out: { key: string; label: string; items: FamilyLink[] }[] = [];
  for (const g of FAMILY_GROUPS) {
    const items = family.filter((f) => g.kinds.includes(f.kind));
    items.forEach((i) => seen.add(i.id));
    if (items.length) out.push({ key: g.key, label: g.label, items });
  }
  const rest = family.filter((f) => !seen.has(f.id));
  if (rest.length) out.push({ key: "extra", label: "Demais", items: rest });
  return out;
}

function MemberPage() {
  const { slug } = Route.useParams();
  const routeSearch = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useRole();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<FamilyLink[]>([]);
  const [allCards, setAllCards] = useState<CardRow[]>([]);
  const [characterCatalog, setCharacterCatalog] = useState<CardRow[]>([]);
  const [collectedKeys, setCollectedKeys] = useState<Set<string>>(new Set());
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [t1Totals, setT1Totals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFound] = useState(false);
  const [showFullAlbum, setShowFullAlbum] = useState(false);
  const [openCard, setOpenCard] = useState<CardRow | null>(null);

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
    setCollectedKeys(new Set(rows.map((c) => c.id)));
  }, []);

  const loadCharacterCatalog = useCallback(async (characterKey: string) => {
    const { data } = await supabase
      .from("cards")
      .select("*")
      .eq("character_key", characterKey)
      .order("card_number");
    setCharacterCatalog(((data ?? []) as CardRow[]));
  }, []);

  // Totais por personagem na Temporada 1
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("cards")
        .select("character_key")
        .eq("season", "T1");
      const totals: Record<string, number> = {};
      for (const r of (data ?? []) as { character_key: string }[]) {
        totals[r.character_key] = (totals[r.character_key] ?? 0) + 1;
      }
      setT1Totals(totals);
    })();
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
      if (p.character_key) await loadCharacterCatalog(p.character_key);
      else setCharacterCatalog([]);
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
  }, [slug, user, authLoading, loadMemberAlbum, loadCharacterCatalog]);

  if (authLoading) {
    return <div className="px-5 py-20 text-center font-display tracking-widest text-[color:var(--text-3)]">CARREGANDO…</div>;
  }
  if (!user) return <LoggedOutGate title="FICHA RESERVADA" message="Entre pra ver as fichas dos membros." />;
  if (loading) {
    return <div className="px-5 py-20 text-center font-display tracking-widest text-[color:var(--text-3)]">CARREGANDO…</div>;
  }
  if (notFoundState || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-display text-4xl text-ruby-gradient">MEMBRO NÃO ENCONTRADO</h1>
        <p className="mt-2 text-sm text-[color:var(--text-3)]">Esse slug não existe no santuário.</p>
        <Link to="/santuario" className="mt-6 inline-block font-display text-sm tracking-widest text-[color:var(--text-1)] underline">
          ← VOLTAR AO SANTUÁRIO
        </Link>
      </div>
    );
  }

  const avatar = img(profile.avatar_url ?? "", IMAGES.fallback.avatar);
  const banner = img(profile.banner_url ?? "", IMAGES.fallback.banner);
  // Cartas exibidas no perfil = catálogo do personagem dele(a), com flag de coletada
  const characterCards = characterCatalog;
  const grouped = groupFamily(family);

  return (
    <div>
      {/* Banner — menor no desktop pra não dominar */}
      <div className="relative h-44 w-full overflow-hidden sm:h-56 lg:h-64">
        <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-[color:var(--surface-1)]" />
        <StarSpike className="absolute right-10 top-8 h-8 w-8 sticker-star" />
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-16">
        {/* Header */}
        <div className="relative -mt-14 flex flex-col items-start gap-5 sm:-mt-16 sm:flex-row sm:items-end">
          <div className="chrome-frame rounded-full">
            <img src={avatar} alt={profile.display_name}
              className="h-28 w-28 rounded-full object-cover sm:h-32 sm:w-32 lg:h-36 lg:w-36" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="eyebrow">FICHA OFICIAL · TOKYO</p>
            <h1 className="font-display text-3xl text-[color:var(--text-1)] sm:text-4xl lg:text-5xl">
              {profile.display_name.toUpperCase()}
            </h1>
            {profile.role && (
              <p className="mt-1 text-xs tracking-widest text-[color:var(--ruby)] sm:text-sm">
                {profile.role.toUpperCase()}
              </p>
            )}
            <div className="mt-3"><FollowStats targetId={profile.id} /></div>
          </div>
          <div className="pb-1">
            <FollowButton targetId={profile.id} />
          </div>
        </div>

        {/* Bio + Sobre */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="relative panel p-5">
            <ThornHeart className="absolute -right-3 -top-3 h-10 w-10" />
            <h2 className="font-display text-base tracking-widest text-[color:var(--text-1)]">FICHA RÁPIDA ✦</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              {profile.sign && <BioRow k="Signo" v={profile.sign} />}
              {profile.role && <BioRow k="Papel" v={profile.role} />}
              {profile.relationship_status && (
                <BioRow k="Relacionamento" v={
                  <span className="inline-flex items-center gap-1.5">
                    <ThornHeart className="h-3.5 w-3.5" />
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

          <div className="relative panel p-6">
            <StarSpike className="absolute right-5 top-5 h-6 w-6 sticker-star" />
            <RichBio html={profile.bio_html} fallback={profile.bio} />
          </div>
        </div>

        {/* Tokyo Buddy 3D — visível só para admins enquanto está em testes */}
        {isAdmin && (
          <div className="mt-8">
            <BuddyProfileCard
              userId={profile.id}
              displayName={profile.display_name}
              isOwn={!!user && user.id === profile.id}
            />
          </div>
        )}

        {/* Família — redesign tipo cartões agrupados */}
        {family.length > 0 && (
          <section className="mt-10">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="eyebrow">LAÇOS</p>
                <h2 className="font-display text-2xl text-[color:var(--text-1)]">FAMÍLIA</h2>
              </div>
              <span className="text-xs text-[color:var(--text-3)]">{family.length} {family.length === 1 ? "pessoa" : "pessoas"}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grouped.map((g) => (
                <div key={g.key} className="panel p-4">
                  <p className="font-display text-[10px] tracking-[0.3em] text-[color:var(--ruby)]">
                    {g.label.toUpperCase()}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {g.items.map((f) => (
                      <li key={f.id} className="flex items-center gap-2.5">
                        <HeartIcon className="h-3 w-3 shrink-0 text-[color:var(--ruby)]" />
                        <span className="font-display text-[10px] uppercase tracking-widest text-[color:var(--text-3)]">
                          {KIND_LABEL[f.kind] ?? f.kind}
                        </span>
                        <span className="text-[color:var(--text-3)]">·</span>
                        {f.slug ? (
                          <Link to="/santuario/$slug" params={{ slug: f.slug }}
                            className="truncate text-sm text-[color:var(--text-1)] hover:text-[color:var(--ruby)]">
                            {f.name}
                          </Link>
                        ) : <span className="truncate text-sm text-[color:var(--text-2)]">{f.name}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cartas */}
        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">CARTAS DO PERSONAGEM</p>
              <h2 className="font-display text-3xl text-ruby-gradient sm:text-4xl">
                ÁLBUM DE {profile.display_name.split(" ")[0].toUpperCase()}
              </h2>
              <p className="mt-1 text-xs text-[color:var(--text-3)]">
                {characterCards.filter((c) => collectedKeys.has(c.id)).length}/{characterCards.length}
                {profile.character_key ? ` cartas de ${profile.character_key}` : ""} · {allCards.length} coletadas no total
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFullAlbum(true)}
                className="rounded border border-[color:var(--ruby)]/40 bg-[color:var(--ruby)]/10 px-3 py-1.5 font-display text-[11px] tracking-widest text-[color:var(--text-1)] hover:bg-[color:var(--ruby)]/20"
              >
                ÁLBUM COMPLETO ({allCards.length})
              </button>
              <Link to="/album" className="font-display text-[11px] tracking-widest text-[color:var(--text-3)] hover:text-[color:var(--text-1)]">
                MEU ÁLBUM →
              </Link>
            </div>
          </div>
          <CardGrid
            cards={characterCards}
            collectedIds={collectedKeys}
            empty={profile.character_key ? "Esse personagem ainda não tem cartas no catálogo." : "Esse membro ainda não escolheu um personagem."}
            onCardClick={(c) => setOpenCard(c)}
          />
        </section>

        {/* Posts */}
        {posts.length > 0 && (
          <section className="mt-12 mx-auto max-w-2xl">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="eyebrow">A LINHA DO TEMPO</p>
                <h2 className="font-display text-2xl text-ruby-gradient sm:text-3xl">ÚLTIMOS POSTS</h2>
              </div>
              <Link to="/feed" className="font-display text-[11px] tracking-widest text-[color:var(--text-3)] hover:text-[color:var(--text-1)]">
                ABRIR FEED →
              </Link>
            </div>
            <div className="space-y-4">
              {posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </section>
        )}

        {/* Modal: álbum completo */}
        {showFullAlbum && (
          <FullAlbumModal
            displayName={profile.display_name}
            slug={profile.slug}
            cards={allCards}
            t1Totals={t1Totals}
            onClose={() => setShowFullAlbum(false)}
            onCardClick={(c) => setOpenCard(c)}
          />
        )}

        <CardDetailDialog card={openCard} onClose={() => setOpenCard(null)} />

        {/* Mural */}
        <div className="mt-12">
          <Guestbook profileId={profile.id} ownerId={profile.id} highlightId={routeSearch.guestbook} />
        </div>
      </div>
    </div>
  );
}

function BioRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-[color:var(--line)] pb-2">
      <dt className="w-28 shrink-0 font-display text-[10px] tracking-widest text-[color:var(--text-3)]">
        {k.toUpperCase()}
      </dt>
      <dd className="flex-1 text-[color:var(--text-1)]">{v}</dd>
    </div>
  );
}

function FullAlbumModal({
  displayName, slug, cards, t1Totals, onClose, onCardClick,
}: {
  displayName: string;
  slug: string;
  cards: CardRow[];
  t1Totals: Record<string, number>;
  onClose: () => void;
  onCardClick: (c: CardRow) => void;
}) {
  const [shareDone, setShareDone] = useState<"copied" | "shared" | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const { groups, orderedKeys } = useMemo(() => {
    const groups = cards.reduce<Record<string, CardRow[]>>((acc, c) => {
      const key = c.character_key || "outros";
      (acc[key] ||= []).push(c);
      return acc;
    }, {});
    const orderedKeys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
    return { groups, orderedKeys };
  }, [cards]);

  // Total T1 = soma de todos os personagens da Temporada 1
  const seasonTotal = useMemo(
    () => Object.values(t1Totals).reduce((a, b) => a + b, 0),
    [t1Totals],
  );
  const t1Owned = useMemo(
    () => cards.filter((c) => c.season === "T1").length,
    [cards],
  );

  async function handleShare() {
    const url = `${window.location.origin}/santuario/${slug}`;
    const title = `${displayName} · Álbum TOKYO`;
    const text = `Confira o álbum de ${displayName} em TOKYO — ${cards.length} carta${cards.length === 1 ? "" : "s"} coletada${cards.length === 1 ? "" : "s"}.`;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    try {
      if (typeof nav.share === "function") {
        await nav.share({ title, text, url });
        setShareDone("shared");
      } else {
        await nav.clipboard.writeText(url);
        setShareDone("copied");
      }
    } catch {
      // canceled by user → ignore
      return;
    }
    setTimeout(() => setShareDone(null), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-2)] p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">ÁLBUM COMPLETO</p>
            <h2 className="font-display text-2xl text-ruby-gradient sm:text-3xl">
              {displayName.toUpperCase()}
            </h2>
            <p className="mt-1 text-xs text-[color:var(--text-3)]">
              {cards.length} {cards.length === 1 ? "carta" : "cartas"} ·{" "}
              {orderedKeys.length} {orderedKeys.length === 1 ? "personagem" : "personagens"}
              {seasonTotal > 0 && (
                <>
                  {" · "}
                  <span className="font-display tracking-widest text-[color:var(--text-2)]">
                    T1: {t1Owned}/{seasonTotal}
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded border border-[color:var(--line)] px-3 py-1.5 font-display text-[11px] tracking-widest text-[color:var(--text-2)] transition hover:border-[color:var(--ruby)] hover:text-[color:var(--text-1)]"
            >
              {shareDone ? <CheckIcon className="h-3 w-3" /> : <Share1Icon className="h-3 w-3" />}
              {shareDone === "copied" ? "LINK COPIADO" : shareDone === "shared" ? "COMPARTILHADO" : "COMPARTILHAR"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[color:var(--line)] px-3 py-1.5 font-display text-[11px] tracking-widest text-[color:var(--text-2)] hover:border-[color:var(--line-strong)] hover:text-[color:var(--text-1)]"
              aria-label="Fechar"
            >
              FECHAR ✕
            </button>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-display text-sm tracking-widest text-[color:var(--text-2)]">
              ESSE MEMBRO AINDA NÃO COLETOU NENHUMA CARTA
            </p>
            <p className="mt-2 text-xs text-[color:var(--text-3)]">
              Quando ele(a) resgatar drops no Discord, as cartas aparecem aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            {orderedKeys.map((key) => {
              const total = t1Totals[key];
              const owned = groups[key].filter((c) => c.season === "T1").length;
              return (
                <div key={key}>
                  <div className="mb-3 flex items-baseline gap-3 border-b border-[color:var(--line)] pb-2">
                    <h3 className="font-display text-base uppercase tracking-widest text-[color:var(--ruby)]">
                      {key}
                    </h3>
                    {total ? (
                      <span className="font-display text-[11px] tracking-widest text-[color:var(--text-2)]">
                        {owned}/{total} <span className="text-[color:var(--text-3)]">T1</span>
                      </span>
                    ) : (
                      <span className="text-xs text-[color:var(--text-3)]">{groups[key].length}</span>
                    )}
                    {total && owned >= total && (
                      <span className="badge badge-success">COMPLETO</span>
                    )}
                  </div>
                  <CardGrid cards={groups[key]} empty="" onCardClick={onCardClick} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

void notFound;
