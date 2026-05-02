
-- 1) user_cards: remove user-level INSERT/UPDATE; only admins (or supabaseAdmin which bypasses RLS) can grant cards
DROP POLICY IF EXISTS "Users add own cards" ON public.user_cards;
DROP POLICY IF EXISTS "Users update own cards" ON public.user_cards;

CREATE POLICY "Admins insert user cards"
ON public.user_cards
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update user cards"
ON public.user_cards
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) realtime.messages: replace ELSE true with explicit deny
DROP POLICY IF EXISTS "Authed read realtime msgs" ON realtime.messages;

CREATE POLICY "Authed read realtime msgs"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'conv:%' THEN
      public.is_conversation_participant(
        (substring(realtime.topic() FROM 6))::uuid,
        (SELECT auth.uid())
      )
    ELSE false
  END
);
