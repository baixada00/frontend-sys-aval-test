/*
  # Enable FUC activation and template management

  1. Changes
    - Add enabled column to fucs table for activation status
    - Add template management constraints
    - Add indexes for performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add index for enabled status
CREATE INDEX IF NOT EXISTS idx_fucs_enabled ON fucs(enabled);

-- Add comment for enabled column
COMMENT ON COLUMN fucs.enabled IS 'Controls whether a FUC is active for evaluation';

-- Add constraint to ensure templates can only be created for enabled FUCs
ALTER TABLE templates
ADD CONSTRAINT templates_enabled_fuc_check
CHECK (
  EXISTS (
    SELECT 1 FROM fucs
    WHERE fucs.id = templates.fuc_id
    AND fucs.enabled = true
  )
);