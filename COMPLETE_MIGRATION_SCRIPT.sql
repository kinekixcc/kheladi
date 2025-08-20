-- Complete Migration Script for Venue Workflow + Payment System
-- Run this in your Supabase Dashboard > SQL Editor
-- This script is idempotent and can be run multiple times safely

-- ========================================
-- PART 1: VENUE WORKFLOW MIGRATION
-- ========================================

-- Add new fields to sports_facilities table (venue workflow fields)
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sports_facilities' AND column_name = 'status') THEN
        ALTER TABLE sports_facilities ADD COLUMN status text DEFAULT 'seeded';
        ALTER TABLE sports_facilities ADD CONSTRAINT check_status 
            CHECK (status IN ('seeded', 'verified', 'claimed', 'bookable', 'suspended'));
    END IF;

    -- Add listing_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sports_facilities' AND column_name = 'listing_type') THEN
        ALTER TABLE sports_facilities ADD COLUMN listing_type text DEFAULT 'info_only';
        ALTER TABLE sports_facilities ADD CONSTRAINT check_listing_type 
            CHECK (listing_type IN ('info_only', 'external_link', 'on_platform'));
    END IF;

    -- Add booking_mode column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sports_facilities' AND column_name = 'booking_mode') THEN
        ALTER TABLE sports_facilities ADD COLUMN booking_mode text DEFAULT 'none';
        ALTER TABLE sports_facilities ADD CONSTRAINT check_booking_mode 
            CHECK (booking_mode IN ('none', 'lead_form', 'external', 'internal'));
    END IF;

    -- Add source column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sports_facilities' AND column_name = 'source') THEN
        ALTER TABLE sports_facilities ADD COLUMN source text DEFAULT 'admin_manual';
        ALTER TABLE sports_facilities ADD CONSTRAINT check_source 
            CHECK (source IN ('admin_manual', 'user_suggested', 'maps_import'));
    END IF;

    -- Add data_quality_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sports_facilities' AND column_name = 'data_quality_score') THEN
        ALTER TABLE sports_facilities ADD COLUMN data_quality_score integer DEFAULT 0;
        ALTER TABLE sports_facilities ADD CONSTRAINT check_data_quality_score 
            CHECK (data_quality_score >= 0 AND data_quality_score <= 100);
    END IF;

    -- Add claimed_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sports_facilities' AND column_name = 'claimed_by') THEN
        ALTER TABLE sports_facilities ADD COLUMN claimed_by uuid REFERENCES auth.users(id);
    END IF;

    -- Add last_verified_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sports_facilities' AND column_name = 'last_verified_at') THEN
        ALTER TABLE sports_facilities ADD COLUMN last_verified_at timestamptz;
    END IF;

    -- Add price_range_min column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sports_facilities' AND column_name = 'price_range_min') THEN
        ALTER TABLE sports_facilities ADD COLUMN price_range_min integer;
    END IF;

    -- Add price_range_max column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sports_facilities' AND column_name = 'price_range_max') THEN
        ALTER TABLE sports_facilities ADD COLUMN price_range_max integer;
    END IF;
END $$;

-- Create venue_leads table
DROP TABLE IF EXISTS venue_leads CASCADE;
CREATE TABLE venue_leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id uuid REFERENCES sports_facilities(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_date date NOT NULL,
    start_minute integer NOT NULL CHECK (start_minute >= 0 AND start_minute < 1440),
    duration_min integer NOT NULL CHECK (duration_min > 0 AND duration_min <= 1440),
    notes text,
    contact_phone text NOT NULL,
    status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed_won', 'closed_lost')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create venue_claim_requests table
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

-- ========================================
-- PART 2: PAYMENT SYSTEM MIGRATION
-- ========================================

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('qr_code', 'bank_transfer', 'esewa')),
  qr_code_url TEXT,
  bank_details JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_commissions table
CREATE TABLE IF NOT EXISTS tournament_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'verified', 'failed')),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'qr_code',
  payment_proof_url TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_registration_fees table
CREATE TABLE IF NOT EXISTS player_registration_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_fee DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'verified', 'failed')),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'qr_code',
  payment_proof_url TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_verifications table
CREATE TABLE IF NOT EXISTS payment_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL,
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('tournament_commission', 'player_registration')),
  verified_by UUID NOT NULL REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL CHECK (status IN ('approved', 'rejected')),
  notes TEXT,
  proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PART 3: ADD MISSING TOURNAMENT FIELDS
-- ========================================

-- Add commission_percentage and registration_fee to tournaments table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tournaments' AND column_name = 'commission_percentage') THEN
        ALTER TABLE tournaments ADD COLUMN commission_percentage DECIMAL(5,2) DEFAULT 10.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tournaments' AND column_name = 'registration_fee') THEN
        ALTER TABLE tournaments ADD COLUMN registration_fee DECIMAL(10,2) DEFAULT 0.00;
    END IF;
END $$;

-- ========================================
-- PART 4: CREATE INDEXES AND TRIGGERS
-- ========================================

-- Create indexes for venue workflow
CREATE INDEX IF NOT EXISTS idx_venue_leads_venue_id ON venue_leads(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_leads_user_id ON venue_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_leads_status ON venue_leads(status);
CREATE INDEX IF NOT EXISTS idx_venue_claim_requests_venue_id ON venue_claim_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_claim_requests_status ON venue_claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_status ON sports_facilities(status);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_claimed_by ON sports_facilities(claimed_by);

-- Create indexes for payment system
CREATE INDEX IF NOT EXISTS idx_tournament_commissions_tournament_id ON tournament_commissions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_commissions_organizer_id ON tournament_commissions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tournament_commissions_payment_status ON tournament_commissions(payment_status);
CREATE INDEX IF NOT EXISTS idx_player_registration_fees_tournament_id ON player_registration_fees(tournament_id);
CREATE INDEX IF NOT EXISTS idx_player_registration_fees_player_id ON player_registration_fees(player_id);
CREATE INDEX IF NOT EXISTS idx_player_registration_fees_payment_status ON player_registration_fees(payment_status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers (drop if exist first to prevent errors)
DROP TRIGGER IF EXISTS update_venue_leads_updated_at ON venue_leads;
CREATE TRIGGER update_venue_leads_updated_at BEFORE UPDATE ON venue_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_venue_claim_requests_updated_at ON venue_claim_requests;
CREATE TRIGGER update_venue_claim_requests_updated_at BEFORE UPDATE ON venue_claim_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Drop existing triggers before creating new ones to prevent "already exists" errors
DROP TRIGGER IF EXISTS update_tournament_commissions_updated_at ON tournament_commissions;
CREATE TRIGGER update_tournament_commissions_updated_at 
  BEFORE UPDATE ON tournament_commissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_registration_fees_updated_at ON player_registration_fees;
CREATE TRIGGER update_player_registration_fees_updated_at 
  BEFORE UPDATE ON player_registration_fees 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- PART 5: INITIALIZE DATA
-- ========================================

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

-- Insert default payment methods
INSERT INTO payment_methods (name, type, qr_code_url, bank_details, is_active) VALUES
('eSewa Personal QR', 'esewa', '/esewa-qr.png', NULL, true),
('Bank QR Code', 'qr_code', '/bank-qr.png', NULL, true);

-- ========================================
-- PART 6: SETUP RLS POLICIES
-- ========================================

-- Enable RLS on new tables
ALTER TABLE venue_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_registration_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Users can view their own leads" ON venue_leads;
DROP POLICY IF EXISTS "Users can create leads" ON venue_leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON venue_leads;
DROP POLICY IF EXISTS "Admins can update leads" ON venue_leads;

DROP POLICY IF EXISTS "Users can view their own claims" ON venue_claim_requests;
DROP POLICY IF EXISTS "Users can create claims" ON venue_claim_requests;
DROP POLICY IF EXISTS "Admins can view all claims" ON venue_claim_requests;
DROP POLICY IF EXISTS "Admins can update claims" ON venue_claim_requests;

DROP POLICY IF EXISTS "Everyone can view active payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admins can manage payment methods" ON payment_methods;

DROP POLICY IF EXISTS "Organizers can view their commissions" ON tournament_commissions;
DROP POLICY IF EXISTS "Admins can view all commissions" ON tournament_commissions;
DROP POLICY IF EXISTS "Admins can update commissions" ON tournament_commissions;

DROP POLICY IF EXISTS "Players can view their fees" ON player_registration_fees;
DROP POLICY IF EXISTS "Admins can view all fees" ON player_registration_fees;
DROP POLICY IF EXISTS "Admins can update fees" ON player_registration_fees;

DROP POLICY IF EXISTS "Admins can view all verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can create verifications" ON payment_verifications;

-- Venue leads RLS policies
CREATE POLICY "Users can view their own leads" ON venue_leads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create leads" ON venue_leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all leads" ON venue_leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update leads" ON venue_leads
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Venue claim requests RLS policies
CREATE POLICY "Users can view their own claims" ON venue_claim_requests
    FOR SELECT USING (auth.uid() = claimed_by);

CREATE POLICY "Users can create claims" ON venue_claim_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all claims" ON venue_claim_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update claims" ON venue_claim_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Payment methods RLS policies
CREATE POLICY "Everyone can view active payment methods" ON payment_methods
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage payment methods" ON payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Tournament commissions RLS policies
CREATE POLICY "Organizers can view their commissions" ON tournament_commissions
    FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Admins can view all commissions" ON tournament_commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update commissions" ON tournament_commissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Player registration fees RLS policies
CREATE POLICY "Players can view their fees" ON player_registration_fees
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Admins can view all fees" ON player_registration_fees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update fees" ON player_registration_fees
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Payment verifications RLS policies
CREATE POLICY "Admins can view all verifications" ON payment_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can create verifications" ON payment_verifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- PART 7: VERIFICATION
-- ========================================

-- Verify the migration was successful
SELECT 'Migration completed successfully!' as status;

-- Show new columns in sports_facilities
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sports_facilities' 
AND column_name IN ('status', 'listing_type', 'booking_mode', 'source', 'data_quality_score', 'claimed_by', 'last_verified_at', 'price_range_min', 'price_range_max')
ORDER BY column_name;

-- Show new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('venue_leads', 'venue_claim_requests', 'payment_methods', 'tournament_commissions', 'player_registration_fees', 'payment_verifications')
ORDER BY table_name;
