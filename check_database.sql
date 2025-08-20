-- Check current database structure
-- Run this in your Supabase SQL Editor to see what exists

-- Check if tournaments table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if other tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('teams', 'team_members', 'chat_messages', 'match_invites', 'recurring_schedules', 'game_sessions', 'session_participants');

-- Check if the migration was partially applied
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('teams', 'team_members', 'chat_messages')
ORDER BY table_name, ordinal_position;



