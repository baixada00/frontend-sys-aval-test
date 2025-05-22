/*
  # Update FUCs table structure

  1. Changes
    - Add tipo column for FUC category
    - Add estrutura column for structured JSON data
    - Add estado column to track FUC status
    - Add validation constraints
    - Add indexes for performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add new columns with constraints
ALTER TABLE fucs
ADD COLUMN tipo TEXT NOT NULL DEFAULT 'curricular',
ADD COLUMN estrutura JSONB NOT NULL DEFAULT '{}',
ADD COLUMN estado TEXT NOT NULL DEFAULT 'rascunho' CHECK (estado IN ('rascunho', 'finalizado'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_fucs_tipo ON fucs(tipo);
CREATE INDEX IF NOT EXISTS idx_fucs_estado ON fucs(estado);
CREATE INDEX IF NOT EXISTS idx_fucs_estrutura ON fucs USING gin(estrutura);

-- Add comment explaining the estrutura column format
COMMENT ON COLUMN fucs.estrutura IS 'Stores structured FUC fields as JSON with the following format:
{
  "campos": [
    {
      "id": "string",
      "titulo": "string",
      "descricao": "string",
      "tipo": "texto|numerico|tabela",
      "maxCaracteres": number (optional)
    }
  ]
}';

-- Add comments for other columns
COMMENT ON COLUMN fucs.tipo IS 'FUC category (e.g., curricular, extracurricular)';
COMMENT ON COLUMN fucs.estado IS 'FUC status (rascunho = draft, finalizado = finalized)';