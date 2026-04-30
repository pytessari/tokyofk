
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS character_key text,
  ADD COLUMN IF NOT EXISTS bio_html text;

UPDATE public.profiles
  SET character_key = lower(split_part(display_name, ' ', 1))
  WHERE character_key IS NULL;
