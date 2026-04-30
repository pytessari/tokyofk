-- Allow conversation creators to read the conversation before participant rows exist.
DROP POLICY IF EXISTS "Participants view conversation" ON public.conversations;
CREATE POLICY "Participants view conversation"
  ON public.conversations FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_conversation_participant(id, auth.uid())
  );

-- Ensure album ownership changes are available to realtime listeners.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_cards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_cards;
  END IF;
END $$;

ALTER TABLE public.user_cards REPLICA IDENTITY FULL;