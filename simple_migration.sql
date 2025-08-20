-- ========================================
-- SIMPLE MIGRATION SCRIPT - No Conflicts!
-- ========================================

-- PART 1: ADD NEW FIELDS TO SPORTS_FACILITIES
-- ========================================

-- Add new columns to sports_facilities table
DO $$ BEGIN
    ALTER TABLE sports_facilities ADD COLUMN status VARCHAR(50) DEFAULT 'seeded';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE sports_facilities ADD COLUMN listing_type VARCHAR(50) DEFAULT 'info_only';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE sports_facilities ADD COLUMN booking_mode VARCHAR(50) DEFAULT 'none';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE sports_facilities ADD COLUMN source VARCHAR(50) DEFAULT 'admin_manual';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE sports_facilities ADD COLUMN data_quality_score INTEGER DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE sports_facilities ADD COLUMN claimed_by UUID REFERENCES auth.users(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE sports_facilities ADD COLUMN last_verified_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE sports_facilities ADD COLUMN price_range_min DECIMAL(10,2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE sports_facilities ADD COLUMN price_range_max DECIMAL(10,2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- PART 2: CREATE NEW TABLES
-- ========================================

-- Drop and recreate venue_leads table to ensure proper structure
DROP TABLE IF EXISTS venue_leads CASCADE;

-- Create venue_leads table
CREATE TABLE venue_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES sports_facilities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_date DATE NOT NULL,
    start_minute INTEGER NOT NULL,
    duration_min INTEGER NOT NULL,
    notes TEXT,
    contact_phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed_won', 'closed_lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop and recreate venue_claim_requests table to ensure proper structure
DROP TABLE IF EXISTS venue_claim_requests CASCADE;

-- Create venue_claim_requests table
CREATE TABLE venue_claim_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES sports_facilities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    proof_url TEXT,
    message TEXT,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'verified', 'rejected')),
    claimed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop and recreate payment_methods table to ensure proper structure
DROP TABLE IF EXISTS payment_methods CASCADE;

-- Create payment_methods table
CREATE TABLE payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
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
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'verified', 'rejected')),
    payment_method_id UUID REFERENCES payment_methods(id),
    payment_proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_registration_fees table
CREATE TABLE IF NOT EXISTS player_registration_fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    registration_fee DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'verified', 'rejected')),
    payment_method_id UUID REFERENCES payment_methods(id),
    payment_proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_verifications table
CREATE TABLE IF NOT EXISTS payment_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('commission', 'registration_fee')),
    payment_id UUID NOT NULL,
    verified_by UUID NOT NULL REFERENCES auth.users(id),
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PART 3: CREATE INDEXES
-- ========================================

-- Venue workflow indexes
CREATE INDEX IF NOT EXISTS idx_venue_leads_venue_id ON venue_leads(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_leads_user_id ON venue_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_leads_status ON venue_leads(status);
CREATE INDEX IF NOT EXISTS idx_venue_claim_requests_venue_id ON venue_claim_requests(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_claim_requests_user_id ON venue_claim_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_claim_requests_status ON venue_claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_status ON sports_facilities(status);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_claimed_by ON sports_facilities(claimed_by);

-- Payment system indexes
CREATE INDEX IF NOT EXISTS idx_tournament_commissions_tournament_id ON tournament_commissions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_commissions_organizer_id ON tournament_commissions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tournament_commissions_payment_status ON tournament_commissions(payment_status);
CREATE INDEX IF NOT EXISTS idx_player_registration_fees_tournament_id ON player_registration_fees(tournament_id);
CREATE INDEX IF NOT EXISTS idx_player_registration_fees_player_id ON player_registration_fees(player_id);
CREATE INDEX IF NOT EXISTS idx_player_registration_fees_payment_status ON player_registration_fees(payment_status);

-- PART 4: CREATE TRIGGERS
-- ========================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_venue_leads_updated_at ON venue_leads;
CREATE TRIGGER update_venue_leads_updated_at BEFORE UPDATE ON venue_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_venue_claim_requests_updated_at ON venue_claim_requests;
CREATE TRIGGER update_venue_claim_requests_updated_at BEFORE UPDATE ON venue_claim_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tournament_commissions_updated_at ON tournament_commissions;
CREATE TRIGGER update_tournament_commissions_updated_at 
  BEFORE UPDATE ON tournament_commissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_registration_fees_updated_at ON player_registration_fees;
CREATE TRIGGER update_player_registration_fees_updated_at 
  BEFORE UPDATE ON player_registration_fees 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Insert default payment methods (simple insert, no conflicts)
INSERT INTO payment_methods (name, type, qr_code_url, bank_details, is_active) VALUES
('eSewa Personal QR', 'esewa', '/esewa-qr.png', NULL, true),
('Bank QR Code', 'qr_code', '/bank-qr.png', NULL, true);

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

DROP POLICY IF EXISTS "Admins can view verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can update verifications" ON payment_verifications;

-- Create RLS policies
CREATE POLICY "Users can view their own leads" ON venue_leads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create leads" ON venue_leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all leads" ON venue_leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update leads" ON venue_leads
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view their own claims" ON venue_claim_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create claims" ON venue_claim_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all claims" ON venue_claim_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update claims" ON venue_claim_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Everyone can view active payment methods" ON payment_methods
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage payment methods" ON payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Organizers can view their commissions" ON tournament_commissions
    FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Admins can view all commissions" ON tournament_commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update commissions" ON tournament_commissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Players can view their fees" ON player_registration_fees
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Admins can view all fees" ON player_registration_fees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update fees" ON player_registration_fees
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view verifications" ON payment_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update verifications" ON payment_verifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- PART 7: ADD TOURNAMENT FIELDS
-- ========================================

-- Add commission fields to tournaments table
DO $$ BEGIN
    ALTER TABLE tournaments ADD COLUMN commission_percentage DECIMAL(5,2) DEFAULT 10.00;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE tournaments ADD COLUMN registration_fee DECIMAL(10,2) DEFAULT 0.00;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- ========================================
-- MIGRATION COMPLETE!
-- ========================================



