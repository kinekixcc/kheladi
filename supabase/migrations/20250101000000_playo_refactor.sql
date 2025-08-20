-- Playo.co Style Refactor Migration
-- This migration adds new features to support:
-- 1. Any user can create tournaments/games
-- 2. Team creation and joining
-- 3. Recurring schedules
-- 4. In-app chat
-- 5. Direct joining without admin approval
-- 6. Match invites

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add new fields to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB,
ADD COLUMN IF NOT EXISTS next_occurrence TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS max_teams INTEGER,
ADD COLUMN IF NOT EXISTS current_teams INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS allow_individual_players BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invite_only')),
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    captain_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    max_members INTEGER NOT NULL DEFAULT 1,
    current_members INTEGER DEFAULT 0,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, name)
);

-- Create team members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('captain', 'vice_captain', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Create match invites table
CREATE TABLE IF NOT EXISTS public.match_invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recurring schedules table
CREATE TABLE IF NOT EXISTS public.recurring_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('daily', 'weekly', 'monthly', 'custom')),
    interval INTEGER DEFAULT 1,
    days_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc.
    day_of_month INTEGER,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    max_occurrences INTEGER,
    current_occurrence INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game sessions table (for recurring games)
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create session participants table
CREATE TABLE IF NOT EXISTS public.session_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'maybe', 'declined', 'waitlist')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournaments_visibility ON public.tournaments(visibility);
CREATE INDEX IF NOT EXISTS idx_tournaments_recurring ON public.tournaments(is_recurring);
CREATE INDEX IF NOT EXISTS idx_tournaments_next_occurrence ON public.tournaments(next_occurrence);
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON public.teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_match_invites_recipient ON public.match_invites(recipient_id);
CREATE INDEX IF NOT EXISTS idx_match_invites_status ON public.match_invites(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_tournament ON public.chat_messages(tournament_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_team ON public.chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_tournament ON public.recurring_schedules(tournament_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_tournament ON public.game_sessions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_date ON public.game_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON public.session_participants(session_id);

-- Enable RLS on new tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Teams are viewable by everyone" ON public.teams
    FOR SELECT USING (true);

CREATE POLICY "Users can create teams" ON public.teams
    FOR INSERT WITH CHECK (auth.uid() = captain_id);

CREATE POLICY "Team captains can manage their teams" ON public.teams
    FOR UPDATE USING (auth.uid() = captain_id);

CREATE POLICY "Team captains can delete their teams" ON public.teams
    FOR DELETE USING (auth.uid() = captain_id);

-- RLS Policies for team members
CREATE POLICY "Team members are viewable by everyone" ON public.team_members
    FOR SELECT USING (true);

CREATE POLICY "Users can join teams" ON public.team_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own team membership" ON public.team_members
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave teams" ON public.team_members
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for match invites
CREATE POLICY "Users can view their own invites" ON public.match_invites
    FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

CREATE POLICY "Users can send invites" ON public.match_invites
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own invites" ON public.match_invites
    FOR UPDATE USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- RLS Policies for chat messages
CREATE POLICY "Chat messages are viewable by tournament participants" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tournament_registrations tr 
            WHERE tr.tournament_id = chat_messages.tournament_id 
            AND tr.player_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.teams t 
            JOIN public.team_members tm ON t.id = tm.team_id 
            WHERE t.tournament_id = chat_messages.tournament_id 
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send chat messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can edit their own messages" ON public.chat_messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- RLS Policies for recurring schedules
CREATE POLICY "Recurring schedules are viewable by tournament participants" ON public.recurring_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tournaments t 
            WHERE t.id = recurring_schedules.tournament_id 
            AND (t.organizer_id = auth.uid() OR t.visibility = 'public')
        )
    );

CREATE POLICY "Tournament organizers can manage recurring schedules" ON public.recurring_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.tournaments t 
            WHERE t.id = recurring_schedules.tournament_id 
            AND t.organizer_id = auth.uid()
        )
    );

-- RLS Policies for game sessions
CREATE POLICY "Game sessions are viewable by tournament participants" ON public.game_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tournaments t 
            WHERE t.id = game_sessions.tournament_id 
            AND (t.organizer_id = auth.uid() OR t.visibility = 'public')
        )
    );

CREATE POLICY "Tournament organizers can manage game sessions" ON public.game_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.tournaments t 
            WHERE t.id = game_sessions.tournament_id 
            AND t.organizer_id = auth.uid()
        )
    );

-- RLS Policies for session participants
CREATE POLICY "Session participants are viewable by everyone" ON public.session_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join sessions" ON public.session_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session participation" ON public.session_participants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave sessions" ON public.session_participants
    FOR DELETE USING (auth.uid() = user_id);

-- Update existing tournaments to have default values
UPDATE public.tournaments 
SET requires_approval = FALSE,
    is_recurring = FALSE,
    chat_enabled = TRUE,
    visibility = 'public'
WHERE requires_approval IS NULL;

-- Create function to generate recurring game sessions
CREATE OR REPLACE FUNCTION generate_recurring_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    schedule_record RECORD;
    current_date DATE;
    session_date DATE;
    occurrence_count INTEGER;
BEGIN
    FOR schedule_record IN 
        SELECT * FROM public.recurring_schedules 
        WHERE is_active = true 
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    LOOP
        current_date := schedule_record.start_date;
        occurrence_count := 0;
        
        WHILE current_date <= COALESCE(schedule_record.end_date, CURRENT_DATE + INTERVAL '1 year')
        AND (schedule_record.max_occurrences IS NULL OR occurrence_count < schedule_record.max_occurrences)
        LOOP
            -- Check if this date matches the pattern
            IF schedule_record.pattern_type = 'weekly' THEN
                IF schedule_record.days_of_week @> ARRAY[EXTRACT(DOW FROM current_date)::INTEGER] THEN
                    -- Create session for this date
                    INSERT INTO public.game_sessions (
                        tournament_id, session_date, start_time, end_time, 
                        max_participants, status
                    ) VALUES (
                        schedule_record.tournament_id, current_date, 
                        schedule_record.start_time, schedule_record.end_time,
                        (SELECT max_participants FROM public.tournaments WHERE id = schedule_record.tournament_id),
                        'scheduled'
                    );
                    occurrence_count := occurrence_count + 1;
                END IF;
                current_date := current_date + INTERVAL '1 day';
            ELSIF schedule_record.pattern_type = 'monthly' THEN
                IF EXTRACT(DAY FROM current_date) = schedule_record.day_of_month THEN
                    -- Create session for this date
                    INSERT INTO public.game_sessions (
                        tournament_id, session_date, start_time, end_time, 
                        max_participants, status
                    ) VALUES (
                        schedule_record.tournament_id, current_date, 
                        schedule_record.start_time, schedule_record.end_time,
                        (SELECT max_participants FROM public.tournaments WHERE id = schedule_record.tournament_id),
                        'scheduled'
                    );
                    occurrence_count := occurrence_count + 1;
                END IF;
                current_date := current_date + INTERVAL '1 month';
            ELSE
                -- Daily pattern
                INSERT INTO public.game_sessions (
                    tournament_id, session_date, start_time, end_time, 
                    max_participants, status
                ) VALUES (
                    schedule_record.tournament_id, current_date, 
                    schedule_record.start_time, schedule_record.end_time,
                    (SELECT max_participants FROM public.tournaments WHERE id = schedule_record.tournament_id),
                    'scheduled'
                );
                occurrence_count := occurrence_count + 1;
                current_date := current_date + INTERVAL '1 day';
            END IF;
        END LOOP;
        
        -- Update the current occurrence count
        UPDATE public.recurring_schedules 
        SET current_occurrence = occurrence_count 
        WHERE id = schedule_record.id;
    END LOOP;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION generate_recurring_sessions() TO authenticated;

-- Create a trigger to automatically update tournament status based on dates
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

-- Update the existing tournaments table to remove admin approval requirement for new tournaments
-- This allows any user to create tournaments that are immediately visible
ALTER TABLE public.tournaments 
ALTER COLUMN status SET DEFAULT 'active';

-- Update existing tournaments that are pending approval to be active
UPDATE public.tournaments 
SET status = 'active' 
WHERE status = 'pending_approval';

-- Create a view for public tournaments (no approval required)
CREATE OR REPLACE VIEW public_public_tournaments AS
SELECT * FROM public.tournaments 
WHERE visibility = 'public' 
AND (status = 'active' OR status = 'completed')
AND (requires_approval = false OR status != 'pending_approval');

-- Grant access to the view
GRANT SELECT ON public_public_tournaments TO authenticated;
GRANT SELECT ON public_public_tournaments TO anon;

