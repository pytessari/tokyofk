CREATE OR REPLACE FUNCTION public.create_conversation_with_participants(
  _participant_ids uuid[],
  _title text DEFAULT NULL,
  _is_group boolean DEFAULT false
)
RETURNS public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _creator uuid := auth.uid();
  _conversation public.conversations;
BEGIN
  IF _creator IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF _participant_ids IS NULL OR array_length(_participant_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'missing_participants';
  END IF;

  IF array_length(_participant_ids, 1) > 9 THEN
    RAISE EXCEPTION 'too_many_participants';
  END IF;

  INSERT INTO public.conversations (is_group, title, created_by)
  VALUES (_is_group, NULLIF(trim(_title), ''), _creator)
  RETURNING * INTO _conversation;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  SELECT _conversation.id, user_id
  FROM (
    SELECT DISTINCT unnest(array_append(_participant_ids, _creator)) AS user_id
  ) participants
  WHERE user_id IS NOT NULL;

  RETURN _conversation;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_conversation_with_participants(uuid[], text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_conversation_with_participants(uuid[], text, boolean) TO authenticated;