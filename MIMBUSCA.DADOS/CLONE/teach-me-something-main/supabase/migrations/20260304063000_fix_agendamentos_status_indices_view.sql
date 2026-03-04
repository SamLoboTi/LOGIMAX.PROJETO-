-- ============================================================
-- Migration: Correção completa de agendamentos
-- Data: 2026-03-04
-- Contexto: Após restauração do backup de 03/Mar, aplicar
-- melhorias estruturais para prevenir sumiço de registros
-- ============================================================

-- 1. Atualizar CHECK constraint com todos os 10 status reais
ALTER TABLE agendamentos 
  DROP CONSTRAINT IF EXISTS agendamentos_status_check;

ALTER TABLE agendamentos 
  ADD CONSTRAINT agendamentos_status_check 
  CHECK (status = ANY (ARRAY[
    'agendado',
    'auditado',
    'reuniao_feita',
    'cancelado',
    'em_atendimento_closer',
    'em_reagendamento',
    'sem_resposta',
    'sem_closer',
    'reuniao_manual',
    'reuniao_manual_atribuida'
  ]));

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_status
  ON agendamentos (status);

CREATE INDEX IF NOT EXISTS idx_agendamentos_data_reuniao
  ON agendamentos (data_reuniao);

CREATE INDEX IF NOT EXISTS idx_agendamentos_status_data
  ON agendamentos (status, data_reuniao);

CREATE INDEX IF NOT EXISTS idx_agendamentos_agender_id
  ON agendamentos (agender_id);

-- 3. Criar view unificada para o painel de auditoria
-- Substitui as 3 queries fragmentadas (hoje/futuro, sem data, passados)
-- por 1 query única com bucket_temporal como indicador visual
DROP VIEW IF EXISTS public.view_painel_auditoria;

CREATE VIEW public.view_painel_auditoria AS
SELECT 
  a.*,
  CASE 
    WHEN a.data_reuniao IS NULL THEN 'sem_data'
    WHEN a.data_reuniao::date < CURRENT_DATE THEN 'passado'
    WHEN a.data_reuniao::date = CURRENT_DATE THEN 'hoje'
    ELSE 'futuro'
  END AS bucket_temporal,
  u.nome AS agender_nome,
  u.email AS agender_email
FROM agendamentos a
LEFT JOIN users u ON u.id = a.agender_id
WHERE a.status = 'agendado'
  AND (a.is_followup IS NULL OR a.is_followup = false);

-- 4. Garantir acesso à view para usuários autenticados
GRANT SELECT ON public.view_painel_auditoria TO authenticated;
GRANT SELECT ON public.view_painel_auditoria TO anon;
