## 1. Esqueci a senha

- Adicionar link **"Esqueci minha senha"** em `src/routes/login.tsx`.
- Criar `src/routes/esqueci-senha.tsx`: form com email → `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/redefinir-senha' })`.
- Criar `src/routes/redefinir-senha.tsx` (rota pública): detecta sessão de recovery e chama `supabase.auth.updateUser({ password })`. Após sucesso, redireciona pra `/perfil`.
- Sem necessidade de configurar templates customizados — usa o email padrão do Lovable Cloud.

## 2. Área deslogada (gating)

Hoje `/santuario`, `/feed`, `/album` aparecem pra qualquer um. Solução simples sem refatorar pra `_authenticated`:

- Em cada uma dessas 3 rotas (`santuario.index.tsx`, `santuario.$slug.tsx`, `feed.tsx`, `album.tsx`), no componente: se `useAuth().loading` → loading; se `!user` → mostrar tela "Entre pra acessar" com botão pra `/login` e `/registro`. Não renderiza conteúdo.
- Atualizar **`Navbar`**: quando deslogado, esconder os links Feed / Santuário / Álbum (mostrar só Início + Revista + ENTRAR).
- Atualizar **`src/routes/index.tsx`** (home): se deslogado, esconder qualquer CTA/preview que leve a essas áreas e em vez disso mostrar bloco "crie sua conta".

## 3. Cartas do personagem aparecem no perfil

Problema confirmado no banco: profile.slug `jerkspfc` ≠ card.character_key `jerk`. Hoje `santuario/$slug` consulta `cards.character_key = slug`, então nunca casa.

Solução: adicionar coluna **`character_key`** em `profiles` (texto, nullable) — separada do slug da URL.

- Migração: `ALTER TABLE profiles ADD COLUMN character_key text;`
- No `/perfil` (editar): novo campo "Personagem (chave das cartas)" com lista dos `character_key` distintos vindos de `cards` (autocomplete via `<datalist>`), default = slug atual.
- Em `santuario.$slug.tsx`: trocar `.eq("character_key", slug)` por `.eq("character_key", profile.character_key ?? profile.slug)`.
- Backfill da migração: `UPDATE profiles SET character_key = 'jerk' WHERE slug = 'jerkspfc';` (e qualquer outro óbvio que eu confirmar com você antes — por enquanto só o jerk tá claro).

## 4. Ícones (Radix / Lucide)

`lucide-react` já está instalado (usado pelos componentes shadcn). Vamos usar **lucide-react** consistente em todo o app:

- `Navbar`: ícones nos links (Home, Newspaper, Users, Library, Rss), Bell já existe, adicionar `User` no botão Perfil e `LogIn` no Entrar.
- `Perfil`: `Save`, `LogOut`, `Trash2`, `Plus`, `Link2` (discord), `ExternalLink`.
- `Santuário`/`Feed`/`Album`: ícones em headers, botões follow (UserPlus/UserCheck), like (Heart), comment (MessageCircle).

## 5. Mover botão "Sair"

Hoje fica embaixo do form de identidade no `/perfil`. Mudar pra:

- **Navbar**: dropdown no botão "PERFIL" (usando `DropdownMenu` shadcn) com itens: Meu perfil, Meu santuário, Admin (se for), **Sair**.
- Remover o botão "Sair" do form em `perfil.tsx`.

## 6. Ficha editável rica + remover "ficha aberta"

Em `santuario.$slug.tsx`:

- **Remover** o bloco grande `"{Nome} — ficha aberta."`.
- Substituir o card de bio por um render de **conteúdo rico** (HTML sanitizado) vindo de um novo campo `profiles.bio_html` (text), permitindo `<img>`, `<a>`, `<iframe>` (Tenor/YouTube), `<p>`, `<strong>`, `<em>`, listas. Manter `bio` (texto simples) como fallback.
- Migração: `ALTER TABLE profiles ADD COLUMN bio_html text;`
- Sanitização: instalar **dompurify** (`bun add dompurify`) e renderizar com `dangerouslySetInnerHTML` após `DOMPurify.sanitize(html, { ADD_TAGS:['iframe'], ADD_ATTR:['allow','allowfullscreen','frameborder','target'] })`.
- Editor no `/perfil`: textarea grande com campo `bio_html` + barra simples de botões helpers (Inserir GIF por URL, Inserir imagem por URL, Inserir vídeo Tenor/YouTube por URL → injeta tag `<img>` ou `<iframe>`). Sem WYSIWYG complexo, fica leve.
- Pre-visualização ao lado do textarea com mesma sanitização.

## Resumo dos arquivos

**Novos**
- `src/routes/esqueci-senha.tsx`
- `src/routes/redefinir-senha.tsx`

**Editados**
- `src/routes/login.tsx` (link esqueci a senha)
- `src/routes/perfil.tsx` (campo character_key, editor bio_html, remoção do botão Sair)
- `src/routes/santuario.$slug.tsx` (usar character_key real, remover título "ficha aberta", render de bio_html sanitizada)
- `src/routes/santuario.index.tsx`, `feed.tsx`, `album.tsx` (gate deslogado)
- `src/routes/index.tsx` (home adaptada pra deslogado)
- `src/components/Navbar.tsx` (esconder links pra deslogado, dropdown perfil com Sair, ícones lucide)
- Componentes diversos recebem ícones lucide

**Migração SQL**
- `ALTER TABLE profiles ADD COLUMN character_key text, ADD COLUMN bio_html text;`
- Backfill `character_key` (só `jerkspfc → jerk` por ora — confirmo outros mapeamentos depois).

**Dependência nova**: `dompurify` + `@types/dompurify`.

## Pergunta antes de começar

Os outros profiles têm `character_key` óbvio? Tipo `katriwiner → katrina`, `pierre-leblanc → pierre`? Posso fazer um backfill heurístico (primeira palavra do display_name minúscula) ou prefere deixar todos vazios pra cada usuário escolher manualmente no /perfil?
