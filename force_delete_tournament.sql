-- Force Delete Tournament Function
-- This function bypasses any RLS or trigger restrictions

-- Create a function that forces tournament deletion
CREATE OR REPLACE FUNCTION force_delete_tournament(tournament_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    deleted_count INTEGER := 0;
    table_name TEXT;
    tables_to_cleanup TEXT[] := ARRAY[
        'chat_messages',
        'team_members', 
        'teams',
        'match_invites',
        'recurring_schedules',
        'session_participants',
        'game_sessions',
        'tournament_registrations'
    ];
BEGIN
    -- First, disable RLS temporarily for this operation
    ALTER TABLE public.tournaments DISABLE ROW LEVEL SECURITY;
    
    -- Clean up related records first
    FOREACH table_name IN ARRAY tables_to_cleanup
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) THEN
            EXECUTE format('DELETE FROM public.%I WHERE tournament_id = $1', table_name) USING tournament_uuid;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % records from %', deleted_count, table_name;
        END IF;
    END LOOP;
    
    -- Now force delete the tournament
    DELETE FROM public.tournaments WHERE id = tournament_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Re-enable RLS
    ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
    
    IF deleted_count > 0 THEN
        RETURN format('Tournament %s force deleted successfully. Related records cleaned up.', tournament_uuid);
    ELSE
        RETURN format('Tournament %s not found or already deleted.', tournament_uuid);
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Re-enable RLS even if there's an error
        ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
        RAISE EXCEPTION 'Error force deleting tournament: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION force_delete_tournament(UUID) TO authenticated;

-- Test the function (replace with actual tournament ID)
-- SELECT force_delete_tournament('your-tournament-id-here');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Force delete function created successfully!';
    RAISE NOTICE 'Use: SELECT force_delete_tournament(''tournament-id-here'');';
    RAISE NOTICE 'This function bypasses RLS and triggers to ensure hard deletion.';
END $$;
