-- Fix tournament visibility and registration deadline logic

-- Add new columns for better tournament management
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archive_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_end_time TIME DEFAULT '23:59:59';

-- Create function to automatically archive old tournaments
CREATE OR REPLACE FUNCTION archive_old_tournaments()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.tournaments 
  SET 
    is_archived = TRUE,
    archive_date = NOW()
  WHERE 
    end_date < (CURRENT_DATE - INTERVAL '30 days')
    AND is_archived = FALSE
    AND status IN ('completed', 'cancelled');
END;
$$;

-- Create a scheduled job to run this function daily (if cron extension is available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'archive-old-tournaments',
      '0 2 * * *', -- Run at 2 AM daily
      'SELECT archive_old_tournaments();'
    );
  END IF;
END $$;

-- Update the tournament status trigger to handle registration deadlines better
CREATE OR REPLACE FUNCTION update_tournament_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update status based on dates
  IF NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
    NEW.status := 'active';
  ELSIF NEW.end_date < CURRENT_DATE THEN
    NEW.status := 'completed';
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

-- Create view for public tournaments (only visible ones)
CREATE OR REPLACE VIEW public_visible_tournaments AS
SELECT * FROM public.tournaments 
WHERE 
  visibility = 'public' 
  AND (status = 'active' OR status = 'completed')
  AND (requires_approval = false OR status != 'pending_approval')
  AND is_archived = FALSE
  AND end_date >= (CURRENT_DATE - INTERVAL '30 days');

-- Grant access to the view
GRANT SELECT ON public_visible_tournaments TO authenticated;
GRANT SELECT ON public_visible_tournaments TO anon;

-- Create index for better performance on visibility queries
CREATE INDEX IF NOT EXISTS idx_tournaments_visibility_status ON public.tournaments(visibility, status, end_date, is_archived);

-- Create index for registration deadline queries
CREATE INDEX IF NOT EXISTS idx_tournaments_registration_deadline ON public.tournaments(registration_deadline, current_participants, max_participants);

-- Update existing tournaments to set proper registration end time
UPDATE public.tournaments 
SET registration_end_time = '23:59:59' 
WHERE registration_end_time IS NULL;

-- Add comment to explain the new system
COMMENT ON COLUMN public.tournaments.is_archived IS 'Whether the tournament has been archived (hidden from public view)';
COMMENT ON COLUMN public.tournaments.archive_date IS 'When the tournament was archived';
COMMENT ON COLUMN public.tournaments.registration_end_time IS 'Time of day when registration closes (defaults to 23:59:59)';
COMMENT ON FUNCTION archive_old_tournaments() IS 'Automatically archives tournaments that ended more than 30 days ago';
COMMENT ON VIEW public_visible_tournaments IS 'Public view showing only tournaments that are visible to players';




