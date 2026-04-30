-- Fix RLS for conversations and related tables to explicitly target authenticated role
DROP POLICY IF EXISTS "Authed create conversation" ON public.conversations;
DROP POLICY IF EXISTS "Creator updates conversation" ON public.conversations;
DROP POLICY IF EXISTS "Creator deletes conversation" ON public.conversations;
DROP POLICY IF EXISTS "Participants view conversation" ON public.conversations;

CREATE POLICY "Authed create conversation"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator updates conversation"
  ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Creator deletes conversation"
  ON public.conversations FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Participants view conversation"
  ON public.conversations FOR SELECT TO authenticated
  USING (public.is_conversation_participant(id, auth.uid()));

-- conversation_participants
DROP POLICY IF EXISTS "Participants view participants of own convs" ON public.conversation_participants;
DROP POLICY IF EXISTS "User adds participants while creating" ON public.conversation_participants;
DROP POLICY IF EXISTS "User leaves or creator removes" ON public.conversation_participants;
DROP POLICY IF EXISTS "User updates own last_read" ON public.conversation_participants;

CREATE POLICY "Participants view participants of own convs"
  ON public.conversation_participants FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_conversation_participant(conversation_id, auth.uid())
  );

CREATE POLICY "User adds participants while creating"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.conversations c
               WHERE c.id = conversation_id AND c.created_by = auth.uid())
  );

CREATE POLICY "User leaves or creator removes"
  ON public.conversation_participants FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.conversations c
               WHERE c.id = conversation_id AND c.created_by = auth.uid())
  );

CREATE POLICY "User updates own last_read"
  ON public.conversation_participants FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- messages
DROP POLICY IF EXISTS "Participants read messages" ON public.messages;
DROP POLICY IF EXISTS "Participants send messages" ON public.messages;
DROP POLICY IF EXISTS "Sender deletes own message" ON public.messages;

CREATE POLICY "Participants read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Participants send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_conversation_participant(conversation_id, auth.uid())
  );

CREATE POLICY "Sender deletes own message"
  ON public.messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);