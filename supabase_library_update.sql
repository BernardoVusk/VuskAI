-- Add mode column to neural_library table
ALTER TABLE neural_library ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'ARCHITECTURE';

-- Update existing items to ARCHITECTURE if they don't have a mode
UPDATE neural_library SET mode = 'ARCHITECTURE' WHERE mode IS NULL;
