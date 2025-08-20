-- Payment System Migration
-- This migration creates all necessary tables for the revenue generation system

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_commissions_tournament_id ON tournament_commissions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_commissions_organizer_id ON tournament_commissions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tournament_commissions_payment_status ON tournament_commissions(payment_status);
CREATE INDEX IF NOT EXISTS idx_tournament_commissions_created_at ON tournament_commissions(created_at);

CREATE INDEX IF NOT EXISTS idx_player_registration_fees_tournament_id ON player_registration_fees(tournament_id);
CREATE INDEX IF NOT EXISTS idx_player_registration_fees_player_id ON player_registration_fees(player_id);
CREATE INDEX IF NOT EXISTS idx_player_registration_fees_payment_status ON player_registration_fees(payment_status);
CREATE INDEX IF NOT EXISTS idx_player_registration_fees_created_at ON player_registration_fees(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_verifications_payment_id ON payment_verifications(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_verified_by ON payment_verifications(verified_by);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_status ON payment_verifications(status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tournament_commissions_updated_at 
  BEFORE UPDATE ON tournament_commissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_registration_fees_updated_at 
  BEFORE UPDATE ON player_registration_fees 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment methods
INSERT INTO payment_methods (name, type, qr_code_url, bank_details, is_active) VALUES
('eSewa Personal QR', 'esewa', '/esewa-qr.png', NULL, true),
('Bank QR Code', 'qr_code', '/bank-qr.png', NULL, true),
('Bank Transfer', 'bank_transfer', NULL, '{"account_name": "Your Company Name", "account_number": "1234567890", "bank_name": "Nepal Bank", "ifsc_code": "NEPL0001234"}', true)
ON CONFLICT DO NOTHING;

-- Add RLS policies
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_registration_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

-- Payment methods: Readable by all authenticated users
CREATE POLICY "Payment methods are viewable by authenticated users" ON payment_methods
  FOR SELECT USING (auth.role() = 'authenticated');

-- Tournament commissions: Organizers can view their own, admins can view all
CREATE POLICY "Users can view their own tournament commissions" ON tournament_commissions
  FOR SELECT USING (auth.uid() = organizer_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own tournament commissions" ON tournament_commissions
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update their own tournament commissions" ON tournament_commissions
  FOR UPDATE USING (auth.uid() = organizer_id OR auth.role() = 'service_role');

-- Player registration fees: Players can view their own, admins can view all
CREATE POLICY "Users can view their own registration fees" ON player_registration_fees
  FOR SELECT USING (auth.uid() = player_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own registration fees" ON player_registration_fees
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own registration fees" ON player_registration_fees
  FOR UPDATE USING (auth.uid() = player_id OR auth.role() = 'service_role');

-- Payment verifications: Only admins can manage
CREATE POLICY "Only admins can manage payment verifications" ON payment_verifications
  FOR ALL USING (auth.role() = 'service_role');

-- Add commission fields to tournaments table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'commission_percentage') THEN
    ALTER TABLE tournaments ADD COLUMN commission_percentage DECIMAL(5,2) DEFAULT 10.00;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'registration_fee') THEN
    ALTER TABLE tournaments ADD COLUMN registration_fee DECIMAL(10,2) DEFAULT 0.00;
  END IF;
END $$;


