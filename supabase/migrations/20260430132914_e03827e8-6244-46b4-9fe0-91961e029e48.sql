-- CONVERSATIONS
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group boolean NOT NULL DEFAULT false,
  title text,
  created_by uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- PARTICIPANTS
CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- security definer to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conv uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conv AND user_id = _user
  )
$$;

-- conversations policies
CREATE POLICY "Participants view conversation"
  ON public.conversations FOR SELECT
  USING (public.is_conversation_participant(id, auth.uid()));

CREATE POLICY "Authed create conversation"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator updates conversation"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Creator deletes conversation"
  ON public.conversations FOR DELETE
  USING (auth.uid() = created_by);

-- participants policies
CREATE POLICY "Participants view participants of own convs"
  ON public.conversation_participants FOR SELECT
  USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "User adds participants while creating"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    -- self insert OR creator of conversation can add others
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "User updates own last_read"
  ON public.conversation_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "User leaves or creator removes"
  ON public.conversation_participants FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.created_by = auth.uid()
    )
  );

-- MESSAGES
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read messages"
  ON public.messages FOR SELECT
  USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Participants send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_conversation_participant(conversation_id, auth.uid())
  );

CREATE POLICY "Sender deletes own message"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);

CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_participants_user ON public.conversation_participants(user_id);

-- bump last_message_at and notify
CREATE OR REPLACE FUNCTION public.on_message_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  -- notify all other participants
  INSERT INTO public.notifications (user_id, actor_id, kind, payload)
  SELECT cp.user_id, NEW.sender_id, 'dm',
         jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id, 'preview', left(NEW.content, 120))
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id AND cp.user_id <> NEW.sender_id;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_on_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.on_message_insert();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
