
-- ============ DISCORD LINKS ============
CREATE TABLE public.discord_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  discord_id text,
  verify_code text UNIQUE,
  expires_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.discord_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own discord link select" ON public.discord_links
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Own discord link insert" ON public.discord_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own discord link update" ON public.discord_links
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own discord link delete" ON public.discord_links
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER discord_links_updated_at
  BEFORE UPDATE ON public.discord_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CARDS uniqueness for CSV upsert ============
ALTER TABLE public.cards
  ADD CONSTRAINT cards_character_card_unique UNIQUE (character_key, card_number);

-- ============ POSTS ============
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users create own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users delete own posts or admin" ON public.posts FOR DELETE
  USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX posts_author_idx ON public.posts(author_id);
CREATE INDEX posts_created_idx ON public.posts(created_at DESC);

-- ============ POST LIKES ============
CREATE TABLE public.post_likes (
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users like as themselves" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike own" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- ============ POST COMMENTS ============
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by everyone" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users comment as themselves" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users delete own comments or admin" ON public.post_comments FOR DELETE
  USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX post_comments_post_idx ON public.post_comments(post_id);

-- ============ FOLLOWS ============
CREATE TABLE public.follows (
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users follow as themselves" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users unfollow own" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own notifications select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own notifications update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own notifications delete" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
-- inserts done by triggers (security definer) — no client insert policy

CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);

-- ============ TRIGGERS for notifications ============
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_author uuid;
BEGIN
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  IF post_author IS NOT NULL AND post_author <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, kind, payload)
    VALUES (post_author, NEW.user_id, 'post_like', jsonb_build_object('post_id', NEW.post_id));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER post_likes_notify AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_author uuid;
BEGIN
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  IF post_author IS NOT NULL AND post_author <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, actor_id, kind, payload)
    VALUES (post_author, NEW.author_id, 'post_comment', jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER post_comments_notify AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, kind, payload)
  VALUES (NEW.following_id, NEW.follower_id, 'follow', '{}'::jsonb);
  RETURN NEW;
END $$;
CREATE TRIGGER follows_notify AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

CREATE OR REPLACE FUNCTION public.notify_on_guestbook()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.profile_id <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, actor_id, kind, payload)
    VALUES (NEW.profile_id, NEW.author_id, 'guestbook', jsonb_build_object('guestbook_id', NEW.id));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guestbook_notify AFTER INSERT ON public.guestbook
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_guestbook();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
