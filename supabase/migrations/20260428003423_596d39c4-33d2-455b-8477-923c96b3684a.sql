-- =========================================
-- 1. ROLES (admin / member)
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Roles readable by everyone" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins manage roles - insert" ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins manage roles - update" ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins manage roles - delete" ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto admin for pytessari@gmail.com + member for everyone
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member')
    ON CONFLICT DO NOTHING;
  IF NEW.email = 'pytessari@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Promote existing user if already signed up
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'pytessari@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'member' FROM auth.users
ON CONFLICT DO NOTHING;

-- =========================================
-- 2. PROFILES cleanup (remove hue)
-- =========================================
ALTER TABLE public.profiles DROP COLUMN IF EXISTS hue;

-- =========================================
-- 3. CARDS catalog
-- =========================================
CREATE TABLE public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_key text NOT NULL,           -- 'jerk', 'katrina', etc — matches bot
  character_name text NOT NULL,
  card_number text NOT NULL,
  name text NOT NULL,
  rarity text NOT NULL DEFAULT 'C',      -- R / S / A / B / C / Holo / Foil / Promo
  season text,
  image_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cards_character ON public.cards(character_key);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cards viewable by everyone" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Admins insert cards" ON public.cards FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update cards" ON public.cards FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete cards" ON public.cards FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER cards_updated
  BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 4. USER_CARDS (coleção pessoal)
-- =========================================
CREATE TABLE public.user_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_id)
);

ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User cards viewable by everyone" ON public.user_cards FOR SELECT USING (true);
CREATE POLICY "Users add own cards" ON public.user_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cards" ON public.user_cards FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users remove own cards" ON public.user_cards FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 5. GUESTBOOK (mural de recados por perfil)
-- =========================================
CREATE TABLE public.guestbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_guestbook_profile ON public.guestbook(profile_id, created_at DESC);

ALTER TABLE public.guestbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guestbook readable by everyone" ON public.guestbook FOR SELECT USING (true);
CREATE POLICY "Authenticated users post" ON public.guestbook FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author or profile owner or admin delete" ON public.guestbook FOR DELETE
  USING (
    auth.uid() = author_id
    OR auth.uid() = profile_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================================
-- 6. MAGAZINES + PAGES
-- =========================================
CREATE TABLE public.magazines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  cover_url text,
  issue_number integer,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.magazines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published magazines visible to all" ON public.magazines FOR SELECT
  USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin insert magazine" ON public.magazines FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update magazine" ON public.magazines FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete magazine" ON public.magazines FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER magazines_updated
  BEFORE UPDATE ON public.magazines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.magazine_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  magazine_id uuid NOT NULL REFERENCES public.magazines(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  title text,
  body text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (magazine_id, page_number)
);
CREATE INDEX idx_mag_pages ON public.magazine_pages(magazine_id, page_number);

ALTER TABLE public.magazine_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pages follow magazine visibility" ON public.magazine_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.magazines m
      WHERE m.id = magazine_id AND (m.published = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "Admin insert page" ON public.magazine_pages FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update page" ON public.magazine_pages FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete page" ON public.magazine_pages FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 7. STORAGE BUCKETS
-- =========================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('banners', 'banners', true),
  ('cards', 'cards', true),
  ('magazines', 'magazines', true)
ON CONFLICT (id) DO NOTHING;

-- Public read on all four
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "Public read banners" ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');
CREATE POLICY "Public read cards" ON storage.objects FOR SELECT
  USING (bucket_id = 'cards');
CREATE POLICY "Public read magazines" ON storage.objects FOR SELECT
  USING (bucket_id = 'magazines');

-- User writes own avatar (folder = user id)
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own banner" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own banner" ON storage.objects FOR UPDATE
  USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own banner" ON storage.objects FOR DELETE
  USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin only for cards + magazines buckets
CREATE POLICY "Admin upload cards" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cards' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update cards" ON storage.objects FOR UPDATE
  USING (bucket_id = 'cards' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete cards" ON storage.objects FOR DELETE
  USING (bucket_id = 'cards' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin upload magazines" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'magazines' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update magazines" ON storage.objects FOR UPDATE
  USING (bucket_id = 'magazines' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete magazines" ON storage.objects FOR DELETE
  USING (bucket_id = 'magazines' AND public.has_role(auth.uid(), 'admin'));