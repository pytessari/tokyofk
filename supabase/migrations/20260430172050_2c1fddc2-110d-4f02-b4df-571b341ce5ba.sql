-- Buddy avatar configuration per user
CREATE TABLE public.buddy_avatars (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.buddy_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buddy avatars viewable by everyone"
  ON public.buddy_avatars FOR SELECT USING (true);

CREATE POLICY "Users insert own buddy avatar"
  ON public.buddy_avatars FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own buddy avatar"
  ON public.buddy_avatars FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own buddy avatar"
  ON public.buddy_avatars FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER buddy_avatars_set_updated_at
  BEFORE UPDATE ON public.buddy_avatars
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Pokes (interactions sent between buddies)
CREATE TABLE public.buddy_pokes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  message text,
  seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX buddy_pokes_receiver_idx ON public.buddy_pokes(receiver_id, created_at DESC);
CREATE INDEX buddy_pokes_sender_idx ON public.buddy_pokes(sender_id, created_at DESC);

ALTER TABLE public.buddy_pokes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pokes visible to sender or receiver"
  ON public.buddy_pokes FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users send pokes as themselves"
  ON public.buddy_pokes FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND sender_id <> receiver_id);

CREATE POLICY "Receiver marks pokes as seen"
  ON public.buddy_pokes FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Sender or receiver delete poke"
  ON public.buddy_pokes FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Notify on poke
CREATE OR REPLACE FUNCTION public.notify_on_poke()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, kind, payload)
  VALUES (NEW.receiver_id, NEW.sender_id, 'buddy_poke',
          jsonb_build_object('poke_id', NEW.id, 'action', NEW.action));
  RETURN NEW;
END $$;

CREATE TRIGGER buddy_pokes_notify
  AFTER INSERT ON public.buddy_pokes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_poke();