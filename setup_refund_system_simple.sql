-- Tournament Commission Refund System Setup (Simplified)
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.tournament_commission_refunds TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tournament_rejections TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_commission_refunds_tournament_id ON public.tournament_commission_refunds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_commission_refunds_status ON public.tournament_commission_refunds(status);
CREATE INDEX IF NOT EXISTS idx_tournament_rejections_tournament_id ON public.tournament_rejections(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_rejections_organizer_id ON public.tournament_rejections(organizer_id);

-- Add comments
COMMENT ON TABLE public.tournament_commission_refunds IS 'Tracks refund requests for tournament commission payments';
COMMENT ON TABLE public.tournament_rejections IS 'Preserves rejected tournament data and tracks refund processing';






