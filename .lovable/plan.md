
# Plano: integração com bot, CMS melhor e cara de rede social

## 1. Como o bot vai reconhecer cada pessoa

Hoje o `profiles.discord_id` é só um campo de texto que o usuário digita — não tem prova de que aquele Discord é dele. Vou montar dois caminhos:

**a) Vínculo por código (recomendado, simples)**
- Adicionar tabela `discord_links` com `user_id`, `discord_id`, `verified_at`, `verify_code`, `expires_at`.
- No `/perfil`, botão "Vincular Discord" gera um código tipo `TKY-4F9K2` válido por 10 min e mostra a instrução: "no Discord rode `/vincular codigo:TKY-4F9K2`".
- Endpoint público `POST /api/public/discord/verify` (server route) recebe `{ code, discord_id, secret }` do bot, valida o segredo compartilhado (`BOT_SHARED_SECRET`), confirma o código e grava `discord_id` + `verified_at` no perfil.
- Endpoint público `GET /api/public/profile-by-discord/:discordId` (com header de bot) devolve `{ user_id, slug, display_name }` pro bot conseguir mapear "esse Discord = esse perfil do site" em qualquer comando.

**b) Endpoint pro bot dar cartas pra pessoa**
- `POST /api/public/cards/grant` com `{ discord_id, character_key, card_number, qty }` + segredo do bot → insere/incrementa em `user_cards` do dono certo.
- Assim, quando alguém ganha carta no Discord, ela aparece automaticamente em `/album` no site.

Você só vai precisar me passar depois o `BOT_SHARED_SECRET` (eu peço via secret seguro) e implementar 2 comandos no bot.

## 2. Importar cartas em massa (CSV)

Na aba **Cartas** do `/admin`, botão "Importar CSV" que aceita colunas:
```
character_key,character_name,card_number,name,rarity,season,image_url
```
- Faz parse no cliente, mostra preview (linhas válidas/erros), botão confirmar → `insert` em batch com `upsert` por `(character_key, card_number)`.
- Botão "Baixar modelo" pra exportar CSV de exemplo.
- Mantém upload manual também.

## 3. Editar cartas já cadastradas

Hoje só dá pra excluir. Vou trocar a grade da aba Cartas por:
- Cada carta vira um card editável (clicar abre painel à direita ou modal) com todos os campos + `ImageUpload` pra trocar arte.
- Filtro por `character_key` e busca por nome/número.
- Mesma tela permite trocar raridade, número, temporada, etc.

## 4. Editar revista mais fácil + reordenar páginas

Na aba **Revistas → Páginas**:
- Cada página vira um card arrastável (drag-and-drop com `@dnd-kit/sortable`). Soltar reordena e gera UPDATE em batch nos `page_number`.
- Botões "↑ / ↓" também (acessibilidade + mobile).
- Botão "Duplicar página".
- Preview ao vivo da spread (página esquerda + direita) ao lado da edição.

## 5. Bug do banner sobrepondo o avatar no `/perfil`

Causa: o avatar fica `-mt-12` mas, depois que troquei pra `ImageUpload`, o banner virou um `<img>` direto sem container relativo com altura travada — em telas largas o gradiente cobre o avatar. Corrigir:
- Envolver banner num wrapper `relative h-44 sm:h-56 overflow-hidden` com `aspect` fixo.
- Subir avatar com `-mt-16` + `z-10`, banner com `z-0`.
- Em mobile, empilhar (avatar centralizado abaixo do banner) em vez de sobrepor.

## 6. Cara de rede social

Adicionar camada leve sem virar um Twitter:

**Tabelas novas:**
- `posts` (id, author_id, content, image_url, created_at) — post curto no feed.
- `post_likes` (post_id, user_id) — curtir.
- `post_comments` (id, post_id, author_id, content, created_at).
- `follows` (follower_id, following_id) — seguir membros.
- `notifications` (id, user_id, kind, payload, read_at) — "curtiu seu post", "assinou seu mural", "novo seguidor".

**UI:**
- Nova rota `/feed` (home logada) com:
  - Composer no topo ("o que tá rolando, TOKYO?").
  - Timeline dos perfis que você segue + posts em destaque.
  - Cada post tem curtir, comentar, link pro autor.
- No `/santuario/$slug`: botão "Seguir", contador de seguidores/seguindo, últimos posts da pessoa.
- No `/perfil`: aba "Meus posts" + lista de quem te segue.
- Sininho de notificações no `Navbar` (badge com não-lidas, dropdown com últimas).
- Realtime nas curtidas/comentários via `supabase.channel`.

**Home (`/`):** adicionar um trecho "ÚLTIMAS DO FEED" com 3-4 posts recentes públicos pra dar movimento.

## 7. Detalhes técnicos

- Segredos: `BOT_SHARED_SECRET` (peço via tool de secret).
- Server routes em `src/routes/api/public/discord.verify.ts`, `discord.profile.ts`, `cards.grant.ts` — todas usam `supabaseAdmin` e validam `x-bot-secret` com `timingSafeEqual`.
- RLS: posts/likes/comments/follows com policies "owner manages own", select público. Notifications: select/update só do dono.
- DnD: `bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`.
- CSV parse: `bun add papaparse @types/papaparse`.
- Realtime: habilitar `posts`, `post_likes`, `post_comments`, `notifications` na publication.

## Ordem de execução sugerida

1. Migração (discord_links, posts, likes, comments, follows, notifications + RLS + realtime).
2. Fix do banner/avatar no `/perfil`.
3. CMS melhor (editar cartas, importar CSV, drag-drop páginas).
4. Endpoints pro bot + UI de vínculo no perfil.
5. Camada social (feed, seguir, curtir, comentar, notificações).
6. Plug de "últimas do feed" na home.

Pode aprovar que eu mando ver na ordem.
