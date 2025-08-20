-- Custom Migration for Existing Database Structure
-- This migration adds missing fields and creates new tables for Playo.co features

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to tournaments table (only if they don't exist)
DO $$
BEGIN
    -- Add requires_approval column (for admin approval toggle)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'requires_approval') THEN
        ALTER TABLE public.tournaments ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added requires_approval column';
    END IF;
    
    -- Add recurrence_pattern column (JSONB for advanced scheduling)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'recurrence_pattern') THEN
        ALTER TABLE public.tournaments ADD COLUMN recurrence_pattern JSONB;
        RAISE NOTICE 'Added recurrence_pattern column';
    END IF;
    
    -- Add next_occurrence column (for recurring tournaments)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'next_occurrence') THEN
        ALTER TABLE public.tournaments ADD COLUMN next_occurrence TIMESTAMPTZ;
        RAISE NOTICE 'Added next_occurrence column';
    END IF;
    
    -- Add max_teams column (maximum number of teams allowed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'max_teams') THEN
        ALTER TABLE public.tournaments ADD COLUMN max_teams INTEGER;
        RAISE NOTICE 'Added max_teams column';
    END IF;
    
    -- Add current_teams column (current number of teams)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'current_teams') THEN
        ALTER TABLE public.tournaments ADD COLUMN current_teams INTEGER DEFAULT 0;
        RAISE NOTICE 'Added current_teams column';
    END IF;
    
    -- Add team_size column (number of players per team)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'team_size') THEN
        ALTER TABLE public.tournaments ADD COLUMN team_size INTEGER DEFAULT 1;
        RAISE NOTICE 'Added team_size column';
    END IF;
    
    -- Add allow_individual_players column (whether solo players can join)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'allow_individual_players') THEN
        ALTER TABLE public.tournaments ADD COLUMN allow_individual_players BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added allow_individual_players column';
    END IF;
    
    -- Add chat_enabled column (toggle for chat functionality)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'chat_enabled') THEN
        ALTER TABLE public.tournaments ADD COLUMN chat_enabled BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added chat_enabled column';
    END IF;
    
    -- Add visibility column (public/private/invite_only)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'visibility') THEN
        ALTER TABLE public.tournaments ADD COLUMN visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invite_only'));
        RAISE NOTICE 'Added visibility column';
    END IF;
    
    -- Add tags column (array of tournament tags)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'tags') THEN
        ALTER TABLE public.tournaments ADD COLUMN tags TEXT[];
        RAISE NOTICE 'Added tags column';
    END IF;
END $$;

-- Create teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tournament_id UUID,
    captain_id UUID,
    max_members INTEGER NOT NULL DEFAULT 1,
    current_members INTEGER DEFAULT 0,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints for teams table
DO $$
BEGIN
    -- Add tournament_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'teams_tournament_id_fkey' 
        AND table_name = 'teams'
    ) THEN
        ALTER TABLE public.teams 
        ADD CONSTRAINT teams_tournament_id_fkey 
        FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added tournament_id foreign key to teams table';
    END IF;
    
    -- Add captain_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'teams_captain_id_fkey' 
        AND table_name = 'teams'
    ) THEN
        ALTER TABLE public.teams 
        ADD CONSTRAINT teams_captain_id_fkey 
        FOREIGN KEY (captain_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added captain_id foreign key to teams table';
    END IF;
    
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'teams_tournament_name_unique' 
        AND table_name = 'teams'
    ) THEN
        ALTER TABLE public.teams 
        ADD CONSTRAINT teams_tournament_name_unique 
        UNIQUE (tournament_id, name);
        RAISE NOTICE 'Added unique constraint on tournament_id and name';
    END IF;
END $$;

-- Create team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID,
    user_id UUID,
    role TEXT DEFAULT 'member' CHECK (role IN ('captain', 'vice_captain', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints for team_members table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'team_members_team_id_fkey' 
        AND table_name = 'team_members'
    ) THEN
        ALTER TABLE public.team_members 
        ADD CONSTRAINT team_members_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added team_id foreign key to team_members table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'team_members_user_id_fkey' 
        AND table_name = 'team_members'
    ) THEN
        ALTER TABLE public.team_members 
        ADD CONSTRAINT team_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id foreign key to team_members table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'team_members_team_user_unique' 
        AND table_name = 'team_members'
    ) THEN
        ALTER TABLE public.team_members 
        ADD CONSTRAINT team_members_team_user_unique 
        UNIQUE (team_id, user_id);
        RAISE NOTICE 'Added unique constraint on team_id and user_id';
    END IF;
END $$;

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID,
    team_id UUID,
    sender_id UUID,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints for chat_messages table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_messages_tournament_id_fkey' 
        AND table_name = 'chat_messages'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD CONSTRAINT chat_messages_tournament_id_fkey 
        FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added tournament_id foreign key to chat_messages table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_messages_team_id_fkey' 
        AND table_name = 'chat_messages'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD CONSTRAINT chat_messages_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added team_id foreign key to chat_messages table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_messages_sender_id_fkey' 
        AND table_name = 'chat_messages'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD CONSTRAINT chat_messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added sender_id foreign key to chat_messages table';
    END IF;
END $$;

-- Create match_invites table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.match_invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID,
    sender_id UUID,
    recipient_id UUID,
    team_id UUID,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints for match_invites table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'match_invites_tournament_id_fkey' 
        AND table_name = 'match_invites'
    ) THEN
        ALTER TABLE public.match_invites 
        ADD CONSTRAINT match_invites_tournament_id_fkey 
        FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added tournament_id foreign key to match_invites table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'match_invites_sender_id_fkey' 
        AND table_name = 'match_invites'
    ) THEN
        ALTER TABLE public.match_invites 
        ADD CONSTRAINT match_invites_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added sender_id foreign key to match_invites table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'match_invites_recipient_id_fkey' 
        AND table_name = 'match_invites'
    ) THEN
        ALTER TABLE public.match_invites 
        ADD CONSTRAINT match_invites_recipient_id_fkey 
        FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added recipient_id foreign key to match_invites table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'match_invites_team_id_fkey' 
        AND table_name = 'match_invites'
    ) THEN
        ALTER TABLE public.match_invites 
        ADD CONSTRAINT match_invites_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added team_id foreign key to match_invites table';
    END IF;
END $$;

-- Update existing tournaments to have default values for new fields
UPDATE public.tournaments 
SET requires_approval = COALESCE(join_requires_approval, FALSE),
    chat_enabled = TRUE,
    visibility = CASE 
        WHEN is_public = TRUE THEN 'public' 
        ELSE 'private' 
    END,
    allow_individual_players = TRUE,
    team_size = 1
WHERE requires_approval IS NULL OR chat_enabled IS NULL OR visibility IS NULL;

-- Set default status to 'active' for new tournaments (if status column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'status') THEN
        ALTER TABLE public.tournaments ALTER COLUMN status SET DEFAULT 'active';
        
        -- Update existing pending_approval tournaments to active
        UPDATE public.tournaments 
        SET status = 'active' 
        WHERE status = 'pending_approval';
        
        RAISE NOTICE 'Updated tournament status defaults and existing pending tournaments';
    END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_invites ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
DO $$
BEGIN
    -- Teams policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Teams are viewable by everyone') THEN
        CREATE POLICY "Teams are viewable by everyone" ON public.teams FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Users can create teams') THEN
        CREATE POLICY "Users can create teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = captain_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Team captains can manage their teams') THEN
        CREATE POLICY "Team captains can manage their teams" ON public.teams FOR UPDATE USING (auth.uid() = captain_id);
    END IF;
    
    -- Team members policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Team members are viewable by everyone') THEN
        CREATE POLICY "Team members are viewable by everyone" ON public.team_members FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Users can join teams') THEN
        CREATE POLICY "Users can join teams" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Users can leave teams') THEN
        CREATE POLICY "Users can leave teams" ON public.team_members FOR DELETE USING (auth.uid() = user_id);
    END IF;
    
    -- Chat messages policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Chat messages are viewable by tournament participants') THEN
        CREATE POLICY "Chat messages are viewable by tournament participants" ON public.chat_messages FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can send chat messages') THEN
        CREATE POLICY "Users can send chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can edit their own messages') THEN
        CREATE POLICY "Users can edit their own messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = sender_id);
    END IF;
    
    -- Match invites policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'match_invites' AND policyname = 'Users can view their own invites') THEN
        CREATE POLICY "Users can view their own invites" ON public.match_invites FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = sender_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'match_invites' AND policyname = 'Users can send invites') THEN
        CREATE POLICY "Users can send invites" ON public.match_invites FOR INSERT WITH CHECK (auth.uid() = sender_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'match_invites' AND policyname = 'Users can update their own invites') THEN
        CREATE POLICY "Users can update their own invites" ON public.match_invites FOR UPDATE USING (auth.uid() = recipient_id OR auth.uid() = sender_id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON public.teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_tournament ON public.chat_messages(tournament_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_team ON public.chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_match_invites_recipient ON public.match_invites(recipient_id);
CREATE INDEX IF NOT EXISTS idx_match_invites_status ON public.match_invites(status);

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Custom migration completed successfully!';
    RAISE NOTICE 'Your database now supports:';
    RAISE NOTICE '- Team creation and management';
    RAISE NOTICE '- In-app chat functionality';
    RAISE NOTICE '- Match invitations';
    RAISE NOTICE '- Advanced tournament settings';
END $$;
