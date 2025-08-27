-- Tournament Commission Refund System Setup
-- Run this script in your Supabase SQL Editor

-- Add refund status to tournament_commissions table
ALTER TABLE public.tournament_commissions 
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS refund_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_notes TEXT;

-- Create tournament commission refunds table
CREATE TABLE IF NOT EXISTS public.tournament_commission_refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  commission_amount DECIMAL(10,2) NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  admin_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed')),
  refund_method TEXT,
  refund_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  refund_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create tournament rejection tracking table (preserves data)
CREATE TABLE IF NOT EXISTS public.tournament_rejections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rejection_reason TEXT NOT NULL,
  admin_id UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  refund_processed BOOLEAN DEFAULT FALSE,
  refund_amount DECIMAL(10,2),
  refund_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create view for admin refund management
CREATE OR REPLACE VIEW admin_tournament_refund_management AS
SELECT 
  tcr.id as refund_id,
  tcr.tournament_id,
  tcr.organizer_id,
  t.name as tournament_name,
  p.full_name as organizer_name,
  u.email as organizer_email,
  tcr.commission_amount,
  tcr.refund_amount,
  tcr.reason,
  tcr.status as refund_status,
  tcr.created_at as refund_requested_at,
  tcr.admin_notes,
  tcr.refund_method,
  tcr.refund_transaction_id,
  tcr.refund_date,
  tcr.completed_at
FROM public.tournament_commission_refunds tcr
JOIN public.tournaments t ON tcr.tournament_id = t.id
JOIN public.profiles p ON tcr.organizer_id = p.id
JOIN auth.users u ON p.id = u.id
ORDER BY 
  CASE 
    WHEN tcr.status = 'pending' THEN 1
    WHEN tcr.status = 'processing' THEN 2
    WHEN tcr.status = 'completed' THEN 3
    ELSE 4
  END,
  tcr.created_at DESC;

-- Grant permissions
GRANT SELECT ON public.tournament_commission_refunds TO authenticated;
GRANT SELECT ON public.tournament_rejections TO authenticated;
GRANT SELECT ON admin_tournament_refund_management TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_commission_refunds_tournament_id ON public.tournament_commission_refunds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_commission_refunds_status ON public.tournament_commission_refunds(status);
CREATE INDEX IF NOT EXISTS idx_tournament_rejections_tournament_id ON public.tournament_rejections(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_rejections_organizer_id ON public.tournament_rejections(organizer_id);

-- Add comments
COMMENT ON TABLE public.tournament_commission_refunds IS 'Tracks refund requests for tournament commission payments';
COMMENT ON TABLE public.tournament_rejections IS 'Preserves rejected tournament data and tracks refund processing';
COMMENT ON VIEW admin_tournament_refund_management IS 'Admin view for managing tournament commission refunds';

-- Test data (optional - remove after testing)
-- INSERT INTO public.tournament_commission_refunds (
--   tournament_id, 
--   organizer_id, 
--   commission_amount, 
--   refund_amount, 
--   reason, 
--   status
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000', -- Replace with actual tournament ID
--   '00000000-0000-0000-0000-000000000000', -- Replace with actual organizer ID
--   100.00,
--   100.00,
--   'Test refund request',
--   'pending'
-- );
