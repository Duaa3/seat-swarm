-- Update existing employees to use only the 8 approved team names
UPDATE employees 
SET team = CASE 
  WHEN team = 'Security' THEN 'Ops'
  WHEN team = 'DevOps' THEN 'Ops' 
  WHEN team = 'Product' THEN 'Design'
  ELSE team
END
WHERE team IN ('Security', 'DevOps', 'Product');