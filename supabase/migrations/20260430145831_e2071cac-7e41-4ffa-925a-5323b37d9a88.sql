-- Tabela de auditoria das tentativas de drop
CREATE TABLE public.card_grant_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL, -- 'ok' | 'unauthorized' | 'bad_json' | 'missing_fields' | 'not_linked' | 'card_not_found' | 'db_error'
  discord_id text,
  character_key text,
  card_number text,
  qty integer,
  user_id uuid,
  card_id uuid,
  error text,
  ip text
);

CREATE INDEX idx_card_grant_logs_created ON public.card_grant_logs (created_at DESC);
CREATE INDEX idx_card_grant_logs_status ON public.card_grant_logs (status, created_at DESC);
CREATE INDEX idx_card_grant_logs_discord ON public.card_grant_logs (discord_id, created_at DESC);

ALTER TABLE public.card_grant_logs ENABLE ROW LEVEL SECURITY;

-- Só admins podem ler. Nenhum INSERT/UPDATE/DELETE pelo cliente
-- (o endpoint usa supabaseAdmin que bypassa RLS).
CREATE POLICY "Admins read grant logs"
  ON public.card_grant_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));