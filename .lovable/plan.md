# Plano: Painel social, notificações ricas, editor expandido

Foco em Nielsen (visibilidade de status, reconhecer > recordar, controle do usuário) e WCAG 2.1 (contraste AA, foco visível, alt, aria-labels, navegação por teclado).

## 1. Notificações com autor (quem fez o quê)

Hoje `NotificationsBell` mostra só `"curtiu seu post"` sem nome nem link. Vou enriquecer:

- Em `useNotifications.ts`, depois do fetch das notifs, fazer um segundo `select` em `profiles` com os `actor_id` únicos (`id, display_name, slug, avatar_url`) e anexar `actor` em cada item. Mesmo merge para o realtime INSERT.
- `NotificationsBell.tsx`:
  - Mostra avatar (Radix `Avatar`), nome do autor como `<Link>` para `/santuario/$slug`, ação ("curtiu seu post", "começou a te seguir", "comentou: ...", "deixou um recado"), e "há 5 min" usando um helper `timeAgo` em `src/lib/timeAgo.ts`.
  - Para `post_comment`, buscar `post_comments.content` (preview 60 chars).
  - Sino vira `BellIcon` do `@radix-ui/react-icons` (não emoji).
  - `aria-label="Notificações, X não lidas"`, `role="menu"`, focus ring visível, navegação por setas com `DropdownMenu`.
  - Item não lido: ponto vermelho + `font-weight: 600` (não confiar só em cor — WCAG).
  - Botão "Marcar todas como lidas" explícito (controle do usuário).

## 2. Seguidores e Seguindo no perfil

`FollowStats` hoje só mostra contagem. Adicionar listas clicáveis:

- Novo componente `FollowersDialog.tsx` que abre Radix `Dialog` com duas tabs (Radix `Tabs`): **Seguidores** e **Seguindo**.
  - Query: `follows` filtrando por `following_id` (seguidores) ou `follower_id` (seguindo) → join com `profiles` (id, display_name, slug, avatar_url, role).
  - Cada linha: avatar + nome + papel + `FollowButton` inline + link para o santuário.
- `FollowStats` vira clicável: "**128** seguidores · **42** seguindo" — cada número abre o dialog na aba certa.
- Usar no `/santuario/$slug` (já tem `<FollowStats>`) e também na nova página de perfil público.

## 3. Menu: separar "Meu perfil" de "Editar perfil"

Novo item no `DropdownMenu` da Navbar:

```
[Avatar] usuario@email
─────────────────
👤 Meu perfil          → /santuario/{meuSlug}   (PersonIcon)
✎  Editar perfil       → /perfil               (Pencil2Icon)
🛡  Admin (se admin)   → /admin                (LockClosedIcon)
─────────────────
↪  Sair                                        (ExitIcon)
```

- Trigger ganha o avatar do usuário (Radix `Avatar` com fallback nas iniciais), não só ícone genérico.
- Se o usuário não tem `slug` configurado, "Meu perfil" leva para `/perfil` com toast "Configure seu @ primeiro".
- `aria-label`, `role="menu"`, atalho de teclado já vem do Radix.

## 4. Ícones Radix em vez de emojis/lucide misturado

Padronizar em `@radix-ui/react-icons` (instalar com `bun add @radix-ui/react-icons`). Substituições:

- 🔔 → `BellIcon`
- ▎/✦ decorativos no header → `StarFilledIcon` / `DotFilledIcon`
- Família ❤️ → `HeartIcon` / `HeartFilledIcon`
- Discord 🎮 → `DiscordLogoIcon`
- Lápis editar → `Pencil2Icon`, sair → `ExitIcon`, perfil → `PersonIcon`, admin → `LockClosedIcon`
- Notificações: tipos ganham ícone (curtida = `HeartFilledIcon`, comentário = `ChatBubbleIcon`, follow = `PersonIcon`, mural = `EnvelopeClosedIcon`)
- Lucide fica só onde Radix não cobre (ex: `Library`, `Newspaper` na nav — ou troco por equivalentes Radix `ReaderIcon`, `ArchiveIcon`).

Todos com `aria-hidden="true"` quando decorativos; `role="img" aria-label="..."` quando carregam significado sozinhos.

## 5. Mais opções de formatação no editor de ficha

Expandir `RichBioEditor.tsx` com toolbar maior (mantendo a saída sanitizada por `dompurify`):

- **Texto**: Negrito, Itálico, Sublinhado, Riscado, Código inline
- **Estrutura**: Título grande (h2), Título médio (h3), Citação, Lista, Separador `<hr>`
- **Mídia**: Imagem/GIF, Vídeo (YouTube/Tenor), Áudio (Spotify embed), Link
- **Estilo Orkut**: cor do texto (paleta de 8 com botões coloridos, gera `<span style="color:#xxx">`), centralizar, texto piscando (`<marquee>` ou animação CSS leve — opt-in, com aviso de acessibilidade), GIF glitter
- Substituir os `prompt()` por mini-dialogs Radix (acessíveis, com label/erro). Mantém modo `<textarea>` HTML cru pra quem quiser, mas adiciona aba **"Visual"** vs **"HTML"** com Radix `Tabs`.
- Atualizar `richHtml.ts` (allowlist do DOMPurify) para permitir `h2,h3,blockquote,hr,ul,ol,li,u,s,code,span[style],marquee` com `style` limitado a `color`, `text-align`, `background-color`.

## 6. Ar de painel de rede social (UX)

Pequenos ajustes globais que entregam o vibe Orkut/Discord:

- **Card de "presença" no topo do `/feed`**: avatar + saudação + 3 atalhos rápidos (Postar, Ver mural, Editar ficha) — Nielsen "atalhos para experts".
- **Badge global de notificações** persiste no sino mesmo navegando (já persiste via realtime, só garantir visibilidade).
- **Breadcrumbs** sutis em rotas profundas (`Santuário › Jerk`).
- **Estado vazio** em todas as listas com call-to-action (não só "nada aqui").
- **Foco visível**: garantir `focus-visible:ring-2 ring-[color:var(--ruby)]` em todos os botões/links interativos (WCAG 2.4.7).
- **Contraste**: `text-white/40` falha AA em fundos translúcidos — subir para `text-white/60` no mínimo em texto significativo.

## Arquivos a tocar

```
NEW src/lib/timeAgo.ts
NEW src/components/FollowersDialog.tsx
NEW src/components/notifications/NotificationItem.tsx
EDIT src/lib/useNotifications.ts          (anexar actor + preview)
EDIT src/components/NotificationsBell.tsx (rich items, Radix icons)
EDIT src/components/FollowButton.tsx      (FollowStats clicável)
EDIT src/components/Navbar.tsx            (menu Meu perfil + Editar + avatar trigger)
EDIT src/components/RichBioEditor.tsx     (toolbar expandida + Tabs)
EDIT src/lib/richHtml.ts                  (allowlist expandida)
EDIT src/routes/santuario.$slug.tsx       (FollowStats clicável + ícones)
EDIT src/routes/feed.tsx                  (card de presença)
EDIT src/routes/perfil.tsx                (ícones Radix)
NEW package: @radix-ui/react-icons
```

## Sem mudanças no banco

Tudo é só leitura adicional (`profiles`, `follows`, `post_comments`) — RLS já permite leitura pública dessas tabelas.