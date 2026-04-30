-- ============================================================
-- DMs estilo Discord: reply, edit, delete, reactions, attachments, custom emojis
-- ============================================================

-- 1) Acrescentar colunas a messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Permitir UPDATE em messages (para edit e soft-delete) pelo próprio sender
DROP POLICY IF EXISTS "Sender updates own message" ON public.messages;
CREATE POLICY "Sender updates own message"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- 2) Tabela de anexos de mensagens
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  url text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('image','file','audio')),
  mime_type text,
  size_bytes integer,
  name text,
  width integer,
  height integer,
  duration_seconds numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_message_attachments_msg ON public.message_attachments(message_id);

ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read attachments"
  ON public.message_attachments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_attachments.message_id
      AND public.is_conversation_participant(m.conversation_id, auth.uid())
  ));

CREATE POLICY "Sender adds attachments"
  ON public.message_attachments FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_attachments.message_id
      AND m.sender_id = auth.uid()
  ));

CREATE POLICY "Sender deletes attachments"
  ON public.message_attachments FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_attachments.message_id
      AND m.sender_id = auth.uid()
  ));

-- 3) Reações em mensagens
CREATE TABLE IF NOT EXISTS public.message_reactions (
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_message_reactions_msg ON public.message_reactions(message_id);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read reactions"
  ON public.message_reactions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_reactions.message_id
      AND public.is_conversation_participant(m.conversation_id, auth.uid())
  ));

CREATE POLICY "Participants add own reactions"
  ON public.message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reactions.message_id
        AND public.is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

CREATE POLICY "Users remove own reactions"
  ON public.message_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4) Emojis customizados (compartilhados pela comunidade)
CREATE TABLE IF NOT EXISTS public.custom_emojis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcode text NOT NULL UNIQUE,
  url text NOT NULL,
  created_by uuid NOT NULL,
  is_animated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_custom_emojis_shortcode ON public.custom_emojis(shortcode);

ALTER TABLE public.custom_emojis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Custom emojis viewable by everyone"
  ON public.custom_emojis FOR SELECT USING (true);

CREATE POLICY "Authed users add emojis"
  ON public.custom_emojis FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator or admin delete emoji"
  ON public.custom_emojis FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- 5) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- 6) Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('dm-attachments', 'dm-attachments', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('emojis', 'emojis', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: dm-attachments
DROP POLICY IF EXISTS "DM attachments public read" ON storage.objects;
CREATE POLICY "DM attachments public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dm-attachments');

DROP POLICY IF EXISTS "DM attachments user upload" ON storage.objects;
CREATE POLICY "DM attachments user upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'dm-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "DM attachments user delete" ON storage.objects;
CREATE POLICY "DM attachments user delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'dm-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: emojis
DROP POLICY IF EXISTS "Emojis public read" ON storage.objects;
CREATE POLICY "Emojis public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'emojis');

DROP POLICY IF EXISTS "Emojis authed upload" ON storage.objects;
CREATE POLICY "Emojis authed upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'emojis');

DROP POLICY IF EXISTS "Emojis owner or admin delete" ON storage.objects;
CREATE POLICY "Emojis owner or admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'emojis' AND (auth.uid() = owner OR public.has_role(auth.uid(), 'admin')));
