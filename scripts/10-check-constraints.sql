-- Check the constraint definition for qr_codes type
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conname = 'qr_codes_type_check';

-- Also check what values are currently allowed
SELECT DISTINCT type FROM qr_codes WHERE type IS NOT NULL;
