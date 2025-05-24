/*
  # Update templates structure for enhanced evaluation options

  1. Changes
    - Add campos_avaliacao column to store evaluation fields configuration
    - Add validation for JSON structure
    - Add indexes for performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add new column for evaluation fields configuration
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS campos_avaliacao JSONB NOT NULL DEFAULT '[]';

-- Add comment explaining the campos_avaliacao format
COMMENT ON COLUMN templates.campos_avaliacao IS 'Stores evaluation fields configuration as JSON array:
[
  {
    "campo_id": "string",
    "titulo": "string",
    "tipo_avaliacao": ["texto", "escolha_multipla"],
    "opcoes": ["string"] (optional, for multiple choice)
  }
]';

-- Create index for JSON field
CREATE INDEX IF NOT EXISTS idx_templates_campos ON templates USING gin(campos_avaliacao);

-- Add validation check for campos_avaliacao structure
ALTER TABLE templates 
ADD CONSTRAINT check_campos_avaliacao_structure 
CHECK (
  jsonb_typeof(campos_avaliacao) = 'array' AND
  jsonb_array_length(campos_avaliacao) >= 0
);