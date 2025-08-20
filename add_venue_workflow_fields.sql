-- Add missing venue workflow fields to sports_facilities table
-- Run this in your Supabase SQL Editor

-- Add workflow fields if they don't exist
ALTER TABLE public.sports_facilities 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'seeded',
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'info_only',
ADD COLUMN IF NOT EXISTS booking_mode TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'admin_manual',
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- Update existing venues to have default values
UPDATE public.sports_facilities 
SET 
  status = COALESCE(status, 'seeded'),
  listing_type = COALESCE(listing_type, 'info_only'),
  booking_mode = COALESCE(booking_mode, 'none'),
  source = COALESCE(source, 'admin_manual'),
  data_quality_score = COALESCE(data_quality_score, 0)
WHERE status IS NULL;

-- Success message
SELECT 'Venue workflow fields added successfully! 🎉' as message;

