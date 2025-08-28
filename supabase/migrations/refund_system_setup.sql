-- Refund System Setup Migration
-- This migration creates the refund management system for rejected registrations

-- Create refund_requests table
CREATE TABLE IF NOT EXISTS refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES auth.users(id),
  tournament_id uuid NOT NULL REFERENCES tournaments(id),
  registration_id uuid NOT NULL REFERENCES tournament_registrations(id),
  payment_id uuid NOT NULL REFERENCES player_registration_fees(id),
  
  -- Refund details
  refund_amount decimal(10,2) NOT NULL,
  reason text NOT NULL,
  player_explanation text,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed')),
  
  -- Support handling
  assigned_to uuid REFERENCES auth.users(id), -- Support staff
  admin_notes text,
  admin_decision text,
  admin_decision_date timestamptz,
  
  -- Refund processing
  refund_method text, -- 'bank_transfer', 'esewa_credit', 'manual'
  refund_transaction_id text,
  refund_date timestamptz,
  refund_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add refund status to player_registration_fees
ALTER TABLE player_registration_fees 
ADD COLUMN IF NOT EXISTS refund_status text DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'processing', 'completed', 'failed'));

-- Add refund_required to payment_status enum (if not exists)
-- Note: This might require recreating the enum if it doesn't support adding values
-- For now, we'll use existing statuses and add a separate refund_status field

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_refund_requests_player_id ON refund_requests(player_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_tournament_id ON refund_requests(tournament_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_assigned_to ON refund_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests(created_at);

-- Enable RLS on refund_requests table
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for refund_requests
CREATE POLICY "Players can view own refund requests" ON refund_requests FOR SELECT TO authenticated USING (auth.uid() = player_id);
CREATE POLICY "Admins can view all refund requests" ON refund_requests FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update refund requests" ON refund_requests FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can create refund requests" ON refund_requests FOR INSERT TO authenticated WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_refund_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_refund_requests_updated_at_trigger
  BEFORE UPDATE ON refund_requests
  FOR EACH ROW EXECUTE FUNCTION update_refund_requests_updated_at();

-- Add comments for clarity
COMMENT ON TABLE refund_requests IS 'Tracks refund requests for rejected tournament registrations';
COMMENT ON COLUMN refund_requests.status IS 'Current status of the refund request';
COMMENT ON COLUMN refund_requests.refund_method IS 'Method used to process the refund';
COMMENT ON COLUMN refund_requests.admin_notes IS 'Internal notes from support/admin staff';
COMMENT ON COLUMN refund_requests.player_explanation IS 'Player explanation for refund request';

-- Create view for admin refund management
CREATE OR REPLACE VIEW admin_refund_requests AS
SELECT 
  rr.id,
  rr.status,
  rr.refund_amount,
  rr.reason,
  rr.created_at,
  rr.updated_at,
  p.full_name as player_name,
  p.email as player_email,
  p.phone as player_phone,
  t.name as tournament_name,
  t.organizer_name,
  prf.payment_method,
  prf.payment_status
FROM refund_requests rr
JOIN profiles p ON rr.player_id = p.id
JOIN tournaments t ON rr.tournament_id = t.id
JOIN player_registration_fees prf ON rr.payment_id = prf.id
ORDER BY rr.created_at DESC;

-- Grant access to the view
GRANT SELECT ON admin_refund_requests TO authenticated;

-- Add comment to the view
COMMENT ON VIEW admin_refund_requests IS 'Admin view for managing refund requests with player and tournament details';




