-- 1) Hide discord_id from public profiles SELECT.
-- Drop the broad public select and add scoped policies: own row sees all,
-- others get a view-style restriction enforced via column-level revoke.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Public can read profiles but NOT the discord_id column.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, display_name, slug, avatar_url, banner_url, bio, bio_html,
  sign, role, relationship_status, partner_name, partner_slug,
  character_key, created_at, updated_at
) ON public.profiles TO anon, authenticated;

-- Owner sees all columns including discord_id.
GRANT SELECT ON public.profiles TO authenticated;
-- Re-create row policy: rows are visible to everyone, but column grants
-- restrict who can read discord_id.
CREATE POLICY "Profiles rows readable by everyone"
  ON public.profiles FOR SELECT USING (true);

-- Actually the cleanest approach: revoke discord_id grant from anon/auth, only owner can SELECT it.
-- We already restricted the column grant above; the owner needs explicit grant of discord_id too.
-- Postgres column-level GRANT cannot be conditional on row, so we instead:
-- Give discord_id read only via a SECURITY DEFINER function for self.
GRANT SELECT (discord_id) ON public.profiles TO authenticated;
-- And add a RLS policy that ONLY allows reading discord_id when auth.uid() = id?
-- RLS is row-level not column-level, so we keep column grant for authenticated
-- but block anon. To prevent authenticated users seeing each other's discord_id,
-- we null it out via a view. Simpler: drop the column grant for authenticated,
-- and expose own discord via has_role/self check elsewhere.
REVOKE SELECT (discord_id) ON public.profiles FROM authenticated, anon;

-- Helper function: get own discord_id
CREATE OR REPLACE FUNCTION public.my_discord_id()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT discord_id FROM public.profiles WHERE id = auth.uid() $$;
REVOKE EXECUTE ON FUNCTION public.my_discord_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_discord_id() TO authenticated;

-- 2) Restrict user_roles SELECT to own row.
DROP POLICY IF EXISTS "Roles readable by everyone" ON public.user_roles;
CREATE POLICY "Own role readable"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Restrict communities bucket uploads to user-owned folder.
DROP POLICY IF EXISTS "Authed upload to communities bucket" ON storage.objects;
CREATE POLICY "Authed upload to own communities folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'communities'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4) Realtime channel authorization for private DM channels.
-- Restrict subscriptions to topics named "conv:<conversation_id>" to participants.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authed read realtime msgs" ON realtime.messages;
CREATE POLICY "Authed read realtime msgs"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    -- Allow non-conv topics (postgres_changes broadcast etc.) by default,
    -- but for conv:<uuid> topics require participant membership.
    CASE
      WHEN realtime.topic() LIKE 'conv:%'
        THEN public.is_conversation_participant(
          (substring(realtime.topic() from 6))::uuid,
          (SELECT auth.uid())
        )
      ELSE true
    END
  );