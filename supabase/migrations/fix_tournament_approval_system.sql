-- Fix tournament approval system to respect requires_approval field
-- This migration ensures that tournaments requiring approval stay in pending_approval status

-- Update the tournament status trigger to respect approval requirements
CREATE OR REPLACE FUNCTION update_tournament_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only update status if approval is not required OR if already approved
  IF NEW.requires_approval = false OR NEW.status = 'approved' THEN
    -- Update status based on dates only for non-approval tournaments
    IF NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
      NEW.status := 'active';
    ELSIF NEW.end_date < CURRENT_DATE THEN
      NEW.status := 'completed';
    END IF;
  END IF;
  
  -- Set registration end time if not specified
  IF NEW.registration_end_time IS NULL THEN
    NEW.registration_end_time := '23:59:59';
  END IF;
  
  -- Update next occurrence for recurring tournaments
  IF NEW.is_recurring = true AND NEW.next_occurrence IS NULL THEN
    NEW.next_occurrence := NEW.start_date;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS tournament_status_trigger ON public.tournaments;
CREATE TRIGGER tournament_status_trigger
    BEFORE INSERT OR UPDATE ON public.tournaments
    FOR EACH ROW
    EXECUTE FUNCTION update_tournament_status();

-- Update existing tournaments that should be pending approval
UPDATE public.tournaments 
SET status = 'pending_approval' 
WHERE requires_approval = true 
  AND status = 'active' 
  AND start_date > CURRENT_DATE;

-- Create a view specifically for admin tournament management
CREATE OR REPLACE VIEW admin_tournament_management AS
SELECT 
  *,
  CASE 
    WHEN status = 'pending_approval' THEN 'Awaiting Approval'
    WHEN status = 'approved' THEN 'Approved'
    WHEN status = 'active' THEN 'Live'
    WHEN status = 'completed' THEN 'Completed'
    WHEN status = 'cancelled' THEN 'Cancelled'
    WHEN status = 'rejected' THEN 'Rejected'
    ELSE status
  END as status_display
FROM public.tournaments 
ORDER BY 
  CASE 
    WHEN status = 'pending_approval' THEN 1
    WHEN status = 'approved' THEN 2
    WHEN status = 'active' THEN 3
    ELSE 4
  END,
  created_at DESC;

-- Grant access to admin users
GRANT SELECT ON admin_tournament_management TO authenticated;

-- Add comment explaining the new system
COMMENT ON FUNCTION update_tournament_status() IS 'Updated to respect requires_approval field - tournaments requiring approval stay in pending_approval status until manually approved';
COMMENT ON VIEW admin_tournament_management IS 'Admin view for managing all tournaments including pending approvals';



