-- Fixed Admin Dashboard Migration
-- This migration adds the necessary tables and functions for the new admin dashboard
-- WITHOUT assuming specific table names

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create system_settings table for storing app configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_actions table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID NOT NULL,
    admin_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    old_data JSONB,
    new_data JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feature_flags table for dynamic feature toggles
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    category TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default feature flags
INSERT INTO public.feature_flags (id, name, description, enabled, category) VALUES
('tournament_creation', 'Tournament Creation', 'Allow users to create tournaments', TRUE, 'tournaments'),
('public_tournaments', 'Public Tournaments', 'Show tournaments to all users without approval', TRUE, 'tournaments'),
('team_management', 'Team Management', 'Allow teams to be created and managed', TRUE, 'tournaments'),
('chat_system', 'Chat System', 'Enable in-app chat for tournaments and teams', TRUE, 'tournaments'),
('recurring_schedules', 'Recurring Schedules', 'Allow tournaments to be scheduled repeatedly', TRUE, 'tournaments'),
('match_invites', 'Match Invites', 'Allow players to send and receive match invitations', TRUE, 'tournaments'),
('user_registration', 'User Registration', 'Allow new users to register', TRUE, 'users'),
('admin_approval', 'Admin Approval', 'Require admin approval for tournaments', FALSE, 'core'),
('audit_logging', 'Audit Logging', 'Track all admin and user actions', TRUE, 'security'),
('real_time_updates', 'Real-time Updates', 'Enable live updates across the app', TRUE, 'core')
ON CONFLICT (id) DO NOTHING;

-- Insert default system settings
INSERT INTO public.system_settings (id, config) VALUES
('app_config', '{
    "requireApproval": false,
    "allowPublicTournaments": true,
    "enableChat": true,
    "enableTeams": true,
    "enableRecurring": true,
    "enableInvites": true,
    "enableNotifications": true,
    "enableAuditLog": true
}')
ON CONFLICT (id) DO NOTHING;

-- Create function to cleanup orphaned records
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_records()
RETURNS TEXT AS $$
DECLARE
    deleted_count INTEGER := 0;
    table_name TEXT;
BEGIN
    -- Clean up orphaned tournament registrations (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tournament_registrations') THEN
        DELETE FROM public.tournament_registrations 
        WHERE tournament_id NOT IN (SELECT id FROM public.tournaments);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % orphaned tournament registrations', deleted_count;
    END IF;
    
    -- Clean up orphaned team members (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        DELETE FROM public.team_members 
        WHERE team_id NOT IN (SELECT id FROM public.teams);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % orphaned team members', deleted_count;
    END IF;
    
    -- Clean up orphaned chat messages (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        DELETE FROM public.chat_messages 
        WHERE tournament_id NOT IN (SELECT id FROM public.tournaments);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % orphaned chat messages', deleted_count;
    END IF;
    
    -- Clean up orphaned match invites (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'match_invites') THEN
        DELETE FROM public.match_invites 
        WHERE tournament_id NOT IN (SELECT id FROM public.tournaments);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % orphaned match invites', deleted_count;
    END IF;
    
    RETURN 'Cleanup completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Create function to rebuild database indexes
CREATE OR REPLACE FUNCTION public.rebuild_indexes()
RETURNS TEXT AS $$
DECLARE
    index_record RECORD;
BEGIN
    FOR index_record IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname NOT LIKE '%_pkey'
    LOOP
        EXECUTE 'REINDEX INDEX ' || index_record.indexname;
        RAISE NOTICE 'Rebuilt index: %', index_record.indexname;
    END LOOP;
    
    RETURN 'Index rebuild completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Create function to validate database integrity
CREATE OR REPLACE FUNCTION public.validate_integrity()
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    orphaned_count INTEGER;
BEGIN
    -- Check for orphaned tournament registrations (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tournament_registrations') THEN
        SELECT COUNT(*) INTO orphaned_count
        FROM public.tournament_registrations tr
        LEFT JOIN public.tournaments t ON tr.tournament_id = t.id
        WHERE t.id IS NULL;
        
        result := result || jsonb_build_object('orphaned_registrations', orphaned_count);
    END IF;
    
    -- Check for orphaned team members (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        SELECT COUNT(*) INTO orphaned_count
        FROM public.team_members tm
        LEFT JOIN public.teams t ON tm.team_id = t.id
        WHERE t.id IS NULL;
        
        result := result || jsonb_build_object('orphaned_team_members', orphaned_count);
    END IF;
    
    -- Check for orphaned chat messages (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        SELECT COUNT(*) INTO orphaned_count
        FROM public.chat_messages cm
        LEFT JOIN public.tournaments t ON cm.tournament_id = t.id
        WHERE t.id IS NULL;
        
        result := result || jsonb_build_object('orphaned_chat_messages', orphaned_count);
    END IF;
    
    -- Check for orphaned match invites (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'match_invites') THEN
        SELECT COUNT(*) INTO orphaned_count
        FROM public.match_invites mi
        LEFT JOIN public.tournaments t ON mi.tournament_id = t.id
        WHERE t.id IS NULL;
        
        result := result || jsonb_build_object('orphaned_match_invites', orphaned_count);
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on new tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (simplified - allow all authenticated users for now)
-- You can customize these later based on your actual user table structure

-- System settings - allow all authenticated users to view, only admins to edit
CREATE POLICY "System settings are viewable by everyone" ON public.system_settings
    FOR SELECT USING (true);

CREATE POLICY "System settings are editable by admins" ON public.system_settings
    FOR ALL USING (true); -- Simplified for now

-- Admin actions - allow all authenticated users
CREATE POLICY "Admin actions are viewable by everyone" ON public.admin_actions
    FOR SELECT USING (true);

CREATE POLICY "Admin actions are insertable by everyone" ON public.admin_actions
    FOR INSERT WITH CHECK (true); -- Simplified for now

-- Feature flags - allow all authenticated users to view, edit
CREATE POLICY "Feature flags are viewable by everyone" ON public.feature_flags
    FOR SELECT USING (true);

CREATE POLICY "Feature flags are editable by everyone" ON public.feature_flags
    FOR ALL USING (true); -- Simplified for now

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON public.feature_flags(category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(enabled);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.feature_flags TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_records() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rebuild_indexes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_integrity() TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Fixed admin dashboard migration completed successfully!';
    RAISE NOTICE 'New features added:';
    RAISE NOTICE '- System settings table for app configuration';
    RAISE NOTICE '- Admin actions tracking table';
    RAISE NOTICE '- Feature flags for dynamic toggles';
    RAISE NOTICE '- Database maintenance functions';
    RAISE NOTICE '- RLS policies for security (simplified)';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: RLS policies are simplified for now.';
    RAISE NOTICE 'You can customize them later based on your user table structure.';
END $$;






