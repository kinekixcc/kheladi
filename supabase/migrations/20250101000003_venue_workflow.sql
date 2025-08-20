-- Venue Workflow Migration
-- Adds new fields to venues table and creates new tables for leads and claims
-- 
-- IMPORTANT: This migration will drop and recreate the venue_leads and venue_claim_requests tables
-- If you have existing data in these tables, make sure to backup first!
-- 
-- To run this migration:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute

-- Add new fields to venues table
ALTER TABLE sports_facilities 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'seeded' CHECK (status IN ('seeded', 'verified', 'claimed', 'bookable', 'suspended')),
ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'info_only' CHECK (listing_type IN ('info_only', 'external_link', 'on_platform')),
ADD COLUMN IF NOT EXISTS booking_mode text DEFAULT 'none' CHECK (booking_mode IN ('none', 'lead_form', 'external', 'internal')),
ADD COLUMN IF NOT EXISTS source text DEFAULT 'admin_manual' CHECK (source IN ('admin_manual', 'user_suggested', 'maps_import')),
ADD COLUMN IF NOT EXISTS data_quality_score integer DEFAULT 0 CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS price_range_min integer,
ADD COLUMN IF NOT EXISTS price_range_max integer;

-- Create venue_leads table (drop if exists first to ensure clean state)
DROP TABLE IF EXISTS venue_leads CASCADE;
CREATE TABLE venue_leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id uuid REFERENCES sports_facilities(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_date date NOT NULL,
    start_minute integer NOT NULL CHECK (start_minute >= 0 AND start_minute < 1440), -- 0-1439 minutes in a day
    duration_min integer NOT NULL CHECK (duration_min > 0 AND duration_min <= 1440),
    notes text,
    contact_phone text NOT NULL,
    status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed_won', 'closed_lost')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create venue_claim_requests table (drop if exists first to ensure clean state)
DROP TABLE IF EXISTS venue_claim_requests CASCADE;
CREATE TABLE venue_claim_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id uuid REFERENCES sports_facilities(id) ON DELETE CASCADE,
    contact_name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    proof_url text,
    status text DEFAULT 'new' CHECK (status IN ('new', 'verified', 'rejected')),
    claimed_by uuid REFERENCES auth.users(id),
    message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_venue_leads_venue_id ON venue_leads(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_leads_user_id ON venue_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_leads_status ON venue_leads(status);
CREATE INDEX IF NOT EXISTS idx_venue_claim_requests_venue_id ON venue_claim_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_claim_requests_status ON venue_claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_status ON sports_facilities(status);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_claimed_by ON sports_facilities(claimed_by);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers (drop if exist first)
DROP TRIGGER IF EXISTS update_venue_leads_updated_at ON venue_leads;
CREATE TRIGGER update_venue_leads_updated_at BEFORE UPDATE ON venue_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_venue_claim_requests_updated_at ON venue_claim_requests;
CREATE TRIGGER update_venue_claim_requests_updated_at BEFORE UPDATE ON venue_claim_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing venues to have default status
UPDATE sports_facilities 
SET status = 'seeded', 
    listing_type = 'info_only', 
    booking_mode = 'none', 
    source = 'admin_manual'
WHERE status IS NULL;

-- Calculate initial data quality scores for existing venues
UPDATE sports_facilities 
SET data_quality_score = (
    CASE WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN 20 ELSE 0 END +
    CASE WHEN length(description) > 200 THEN 20 ELSE 0 END +
    CASE WHEN amenities IS NOT NULL AND array_length(amenities, 1) >= 5 THEN 10 ELSE 0 END +
    CASE WHEN google_maps_link IS NOT NULL AND google_maps_link != '' THEN 10 ELSE 0 END +
    CASE WHEN contact_phone IS NOT NULL AND contact_phone != '' THEN 10 ELSE 0 END +
    CASE WHEN status = 'verified' THEN 30 ELSE 0 END
)
WHERE data_quality_score IS NULL OR data_quality_score = 0;

-- Clean up test venues (remove test data)
DELETE FROM sports_facilities 
WHERE name LIKE '%Test%' 
   OR name LIKE '%test%' 
   OR description LIKE '%test%' 
   OR description LIKE '%Test%';
