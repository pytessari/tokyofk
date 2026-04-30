-- COMMUNITIES
CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  description text,
  rules text,
  category text,
  icon_url text,
  banner_url text,
  is_public boolean NOT NULL DEFAULT true,
  members_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities viewable by everyone"
  ON public.communities FOR SELECT USING (true);

CREATE POLICY "Authenticated users create communities"
  ON public.communities FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner or admin updates community"
  ON public.communities FOR UPDATE
  USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner or admin deletes community"
  ON public.communities FOR DELETE
  USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MEMBERS
CREATE TABLE public.community_members (
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member', -- owner | mod | member
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members readable by everyone"
  ON public.community_members FOR SELECT USING (true);

CREATE POLICY "Users join as themselves"
  ON public.community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users leave themselves or owner removes"
  ON public.community_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.owner_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Owner updates member roles"
  ON public.community_members FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.owner_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- helper: is community member
CREATE OR REPLACE FUNCTION public.is_community_member(_community uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.community_members WHERE community_id = _community AND user_id = _user)
$$;

-- auto-add owner as member + counter triggers
CREATE OR REPLACE FUNCTION public.community_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_community_after_insert
  AFTER INSERT ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.community_after_insert();

CREATE OR REPLACE FUNCTION public.community_member_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET members_count = members_count + 1 WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET members_count = GREATEST(members_count - 1, 0) WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_member_count_ins
  AFTER INSERT ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.community_member_count();

CREATE TRIGGER trg_member_count_del
  AFTER DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.community_member_count();

-- COMMUNITY POSTS
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  title text,
  content text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community posts viewable by everyone"
  ON public.community_posts FOR SELECT USING (true);

CREATE POLICY "Members create community posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id AND public.is_community_member(community_id, auth.uid()));

CREATE POLICY "Authors update own community posts"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Author or owner or admin deletes community post"
  ON public.community_posts FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.owner_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TRIGGER trg_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- COMMUNITY POST COMMENTS
CREATE TABLE public.community_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community comments viewable by everyone"
  ON public.community_post_comments FOR SELECT USING (true);

CREATE POLICY "Users comment as themselves on community"
  ON public.community_post_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Author or admin delete community comment"
  ON public.community_post_comments FOR DELETE
  USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_community_posts_community ON public.community_posts(community_id, created_at DESC);
CREATE INDEX idx_community_members_user ON public.community_members(user_id);
CREATE INDEX idx_community_post_comments_post ON public.community_post_comments(post_id, created_at);

-- storage bucket for community art
INSERT INTO storage.buckets (id, name, public) VALUES ('communities', 'communities', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Community art public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'communities');

CREATE POLICY "Authed upload to communities bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'communities' AND auth.uid() IS NOT NULL);

CREATE POLICY "Owner updates community art"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'communities' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner deletes community art"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'communities' AND auth.uid()::text = (storage.foldername(name))[1]);
