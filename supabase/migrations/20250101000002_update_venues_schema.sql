-- Update Venues Schema Migration
-- This migration updates the existing sports_facilities table to match our new design

-- Step 1: Add google_maps_link column
ALTER TABLE public.sports_facilities 
ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- Step 2: Make google_maps_link required (after adding it)
UPDATE public.sports_facilities 
SET google_maps_link = 'https://maps.google.com/?q=0,0' 
WHERE google_maps_link IS NULL;

ALTER TABLE public.sports_facilities 
ALTER COLUMN google_maps_link SET NOT NULL;

-- Step 3: Remove old coordinate columns (optional - you can keep them for future use)
-- ALTER TABLE public.sports_facilities DROP COLUMN IF EXISTS latitude;
-- ALTER TABLE public.sports_facilities DROP COLUMN IF EXISTS longitude;

-- Step 4: Update sample data to include google_maps_link
UPDATE public.sports_facilities 
SET google_maps_link = 'https://maps.google.com/?q=27.7172,85.3240'
WHERE name = 'Kathmandu Sports Complex';

UPDATE public.sports_facilities 
SET google_maps_link = 'https://maps.google.com/?q=28.2096,83.9856'
WHERE name = 'Pokhara Valley Sports Center';

UPDATE public.sports_facilities 
SET google_maps_link = 'https://maps.google.com/?q=26.4521,87.2717'
WHERE name = 'Biratnagar Indoor Stadium';

-- Success message
SELECT 'Venue schema updated successfully! google_maps_link column added.' as status;



