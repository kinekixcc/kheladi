-- Check what user-related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%user%' 
OR table_name LIKE '%profile%'
OR table_name LIKE '%auth%'
ORDER BY table_name;

-- Check the structure of any user table found
-- (This will be run after we find the table name)






