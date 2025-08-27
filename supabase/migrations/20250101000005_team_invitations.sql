-- Migration: Team Invitations System
-- Description: Creates tables and functions for team invitations and enhanced team management
-- Date: 2025-01-01

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee_id ON team_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON team_invitations(expires_at);

-- Create unique constraint to prevent duplicate invitations
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_unique 
ON team_invitations(team_id, invitee_id, status) 
WHERE status = 'pending';

-- Add RLS policies
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations they sent or received
CREATE POLICY "Users can view their own invitations" ON team_invitations
  FOR SELECT USING (
    auth.uid() = inviter_id OR auth.uid() = invitee_id
  );

-- Policy: Team captains can send invitations
CREATE POLICY "Team captains can send invitations" ON team_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE id = team_id AND captain_id = auth.uid()
    )
  );

-- Policy: Invitees can update their invitations (accept/decline)
CREATE POLICY "Invitees can update their invitations" ON team_invitations
  FOR UPDATE USING (
    auth.uid() = invitee_id
  );

-- Policy: Team captains can delete invitations
CREATE POLICY "Team captains can delete invitations" ON team_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE id = team_id AND captain_id = auth.uid()
    )
  );

-- Create function to automatically expire invitations
CREATE OR REPLACE FUNCTION expire_team_invitations()
RETURNS void AS $$
BEGIN
  UPDATE team_invitations 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_team_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_team_invitations_updated_at();

-- Create function to increment team member count
CREATE OR REPLACE FUNCTION increment_team_members()
RETURNS integer AS $$
BEGIN
  RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement team member count
CREATE OR REPLACE FUNCTION decrement_team_members()
RETURNS integer AS $$
BEGIN
  RETURN -1;
END;
$$ LANGUAGE plpgsql;

-- Update teams table to add missing fields if they don't exist
DO $$ 
BEGIN
  -- Add sport_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'sport_type') THEN
    ALTER TABLE teams ADD COLUMN sport_type TEXT;
  END IF;
  
  -- Add max_members column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'max_members') THEN
    ALTER TABLE teams ADD COLUMN max_members INTEGER DEFAULT 5;
  END IF;
  
  -- Add current_members column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'current_members') THEN
    ALTER TABLE teams ADD COLUMN current_members INTEGER DEFAULT 1;
  END IF;
  
  -- Add description column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'description') THEN
    ALTER TABLE teams ADD COLUMN description TEXT;
  END IF;
  
  -- Add logo_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'logo_url') THEN
    ALTER TABLE teams ADD COLUMN logo_url TEXT;
  END IF;
END $$;

-- Update team_members table to add missing fields if they don't exist
DO $$ 
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'role') THEN
    ALTER TABLE team_members ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('captain', 'vice_captain', 'member'));
  END IF;
  
  -- Add joined_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'joined_at') THEN
    ALTER TABLE team_members ADD COLUMN joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create view for enriched team data
CREATE OR REPLACE VIEW enriched_teams AS
SELECT 
  t.*,
  c.full_name as captain_name,
  c.email as captain_email,
  COUNT(tm.id) as member_count
FROM teams t
LEFT JOIN user_profiles c ON t.captain_id = c.id
LEFT JOIN team_members tm ON t.id = tm.team_id
GROUP BY t.id, c.full_name, c.email;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON team_invitations TO authenticated;
GRANT SELECT ON enriched_teams TO authenticated;

-- Insert sample data for testing (optional)
-- INSERT INTO teams (name, description, sport_type, max_members, captain_id) VALUES 
-- ('Sample Team', 'A sample team for testing', 'Football', 5, '00000000-0000-0000-0000-000000000001');

COMMENT ON TABLE team_invitations IS 'Stores team invitations sent by team captains to potential members';
COMMENT ON COLUMN team_invitations.status IS 'Status of the invitation: pending, accepted, declined, or expired';
COMMENT ON COLUMN team_invitations.expires_at IS 'When the invitation expires (typically 7 days after creation)';
COMMENT ON COLUMN team_invitations.message IS 'Optional message from the inviter to the invitee';

