-- Check tournament images field in database
-- Run this in your Supabase SQL editor to diagnose the images issue

-- 1. Check if the images column exists and its type
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
    AND table_schema = 'public'
    AND column_name = 'images';

-- 2. Check if there are any tournaments with images
SELECT 
    id,
    name,
    images,
    CASE 
        WHEN images IS NULL THEN 'NULL'
        WHEN images = '{}' THEN 'Empty Array'
        WHEN array_length(images, 1) > 0 THEN 'Has Images: ' || array_length(images, 1)
        ELSE 'Empty Array'
    END as images_status
FROM tournaments 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check tournaments table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if there are any database views affecting tournaments
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND (table_name LIKE '%tournament%' OR table_name LIKE '%public%')
ORDER BY table_name;

-- 5. Check for any triggers on tournaments table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tournaments'
    AND trigger_schema = 'public';

-- 6. Check RLS policies on tournaments table
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

-- 7. Test inserting a sample tournament with images
-- (Uncomment this if you want to test)
/*
INSERT INTO tournaments (
    name, 
    description, 
    sport_type, 
    tournament_type,
    organizer_id,
    organizer_name,
    facility_name,
    venue_name,
    start_date,
    end_date,
    registration_deadline,
    max_participants,
    entry_fee,
    prize_pool,
    images,
    status
) VALUES (
    'Test Tournament with Images',
    'Test tournament to check images field',
    'Test Sport',
    'single_elimination',
    '00000000-0000-0000-0000-000000000000',
    'Test Organizer',
    'Test Facility',
    'Test Venue',
    '2025-12-01',
    '2025-12-02',
    '2025-11-30',
    10,
    100,
    1000,
    ARRAY['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    'approved'
) RETURNING id, name, images;
*/
