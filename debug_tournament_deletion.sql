-- Debug Tournament Deletion Issues
-- Run this in your Supabase SQL Editor to diagnose why tournaments keep coming back

-- 1. Check if RLS is enabled on tournaments table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'tournaments';

-- 2. Check RLS policies on tournaments table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tournaments';

-- 3. Check if there are any triggers on tournaments table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'tournaments';

-- 4. Check foreign key constraints with CASCADE DELETE
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND ccu.table_name = 'tournaments';

-- 5. Check if there's a soft delete function or trigger
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%tournaments%' 
AND routine_definition LIKE '%delete%'
AND routine_schema = 'public';

-- 6. Check if there are any BEFORE DELETE triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tournaments' 
AND event_manipulation = 'DELETE'
AND action_timing = 'BEFORE';

-- 7. Test deletion manually (replace 'your-tournament-id' with actual ID)
-- Uncomment and run this to test:
/*
DELETE FROM public.tournaments 
WHERE id = 'your-tournament-id-here';
*/

-- 8. Check if there are any views that might be hiding deleted records
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%tournament%';

-- 9. Check if there's a materialized view or other mechanism
SELECT 
    schemaname,
    matviewname,
    definition
FROM pg_matviews 
WHERE schemaname = 'public' 
AND matviewname LIKE '%tournament%';
