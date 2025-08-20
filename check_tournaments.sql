-- Check what tournaments exist and their current status
SELECT 
  id,
  name,
  status,
  visibility,
  requires_approval,
  chat_enabled,
  is_public,
  join_requires_approval,
  created_at
FROM tournaments 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if the new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
AND column_name IN ('visibility', 'requires_approval', 'chat_enabled', 'team_size')
ORDER BY column_name;


