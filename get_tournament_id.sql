-- Get Tournament ID for Chat System Setup
-- Run this in your Supabase SQL Editor to get a real tournament ID

-- First, let's see what tournaments exist
SELECT 
  id,
  name,
  status,
  chat_enabled,
  created_at
FROM tournaments 
ORDER BY created_at DESC 
LIMIT 5;

-- If you want to enable chat for a specific tournament, use the ID from above
-- Example (replace 'ACTUAL_UUID_HERE' with the real ID from the query above):
-- UPDATE tournaments 
-- SET chat_enabled = true 
-- WHERE id = 'ACTUAL_UUID_HERE';

-- To check if chat is enabled for a specific tournament:
-- SELECT id, name, chat_enabled FROM tournaments WHERE id = 'ACTUAL_UUID_HERE';
