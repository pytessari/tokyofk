-- Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS discord_id TEXT,
  ADD COLUMN IF NOT EXISTS hue INTEGER NOT NULL DEFAULT 350,
  ADD COLUMN IF NOT EXISTS relationship_status TEXT,
  ADD COLUMN IF NOT EXISTS partner_name TEXT,
  ADD COLUMN IF NOT EXISTS partner_slug TEXT;

-- Family tree table
CREATE TABLE IF NOT EXISTS public.family_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('pai','mae','irmao','filho','avo','tio','sobrinho','afilhado','primo','padrinho','madrinha')),
  name TEXT NOT NULL,
  slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family links are viewable by everyone"
  ON public.family_links FOR SELECT USING (true);

CREATE POLICY "Users manage their own family links - insert"
  ON public.family_links FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users manage their own family links - update"
  ON public.family_links FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users manage their own family links - delete"
  ON public.family_links FOR DELETE USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_family_links_owner ON public.family_links(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);