/*
  # Complete Database Schema for खेल खेलेको

  1. New Tables
    - `profiles` - Extended user profiles
    - `tournaments` - Tournament information
    - `tournament_registrations` - Player registrations for tournaments
    - `player_stats` - Player performance statistics
    - `player_achievements` - Player achievements and badges
    - `notifications` - System notifications
    - `facilities` - Sports facilities (for future use)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Proper access control based on user roles

  3. Functions
    - Helper functions for common operations
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('player', 'organizer', 'admin');
CREATE TYPE tournament_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'active', 'completed', 'cancelled');
CREATE TYPE tournament_type AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'league');
CREATE TYPE registration_status AS ENUM ('registered', 'confirmed', 'rejected', 'cancelled');
CREATE TYPE experience_level AS ENUM ('beginner', 'intermediate', 'advanced', 'professional');
CREATE TYPE notification_type AS ENUM ('tournament_submitted', 'tournament_approved', 'tournament_rejected', 'new_tournament_available', 'tournament_registration_success', 'tournament_deleted');

-- Extend the auth.users with profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'player',
  phone text,
  bio text,
  favorite_sports text[],
  skill_level experience_level DEFAULT 'beginner',
  location text,
  date_of_birth date,
  height integer,
  weight integer,
  preferred_position text,
  social_links jsonb DEFAULT '{}',
  privacy_settings jsonb DEFAULT '{"show_stats": true, "show_achievements": true, "show_contact": false}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sport_type text NOT NULL,
  tournament_type tournament_type DEFAULT 'single_elimination',
  organizer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  organizer_name text NOT NULL,
  facility_id text,
  facility_name text NOT NULL,
  venue_name text NOT NULL,
  venue_address text,
  province text,
  district text,
  latitude decimal,
  longitude decimal,
  start_date date NOT NULL,
  end_date date NOT NULL,
  registration_deadline date NOT NULL,
  max_participants integer NOT NULL CHECK (max_participants > 0),
  current_participants integer DEFAULT 0 CHECK (current_participants >= 0),
  entry_fee decimal DEFAULT 0 CHECK (entry_fee >= 0),
  prize_pool decimal DEFAULT 0 CHECK (prize_pool >= 0),
  rules text,
  requirements text,
  status tournament_status DEFAULT 'pending_approval',
  contact_phone text,
  contact_email text,
  images text[],
  pdf_document text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_dates CHECK (start_date <= end_date AND registration_deadline <= start_date)
);

-- Tournament registrations
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  age integer NOT NULL CHECK (age >= 13),
  experience_level experience_level NOT NULL,
  team_name text,
  emergency_contact text NOT NULL,
  medical_conditions text,
  status registration_status DEFAULT 'registered',
  entry_fee_paid boolean DEFAULT false,
  payment_status text DEFAULT 'pending',
  transaction_id text,
  registration_date timestamptz DEFAULT now(),
  
  UNIQUE(tournament_id, player_id)
);

-- Player statistics
CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  tournament_name text NOT NULL,
  sport_type text NOT NULL,
  matches_played integer DEFAULT 0,
  matches_won integer DEFAULT 0,
  matches_lost integer DEFAULT 0,
  hours_played decimal DEFAULT 0,
  performance_rating decimal DEFAULT 0,
  achievements text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Player achievements
CREATE TABLE IF NOT EXISTS player_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL,
  tournament_name text,
  earned_date timestamptz DEFAULT now(),
  badge_color text DEFAULT 'blue'
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL,
  tournament_name text,
  target_role user_role,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Facilities (for future expansion)
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  location text NOT NULL,
  district text NOT NULL,
  province text NOT NULL,
  latitude decimal,
  longitude decimal,
  sports_types text[],
  amenities text[],
  price_per_hour decimal,
  contact_phone text,
  contact_email text,
  images text[],
  rating decimal DEFAULT 0,
  total_reviews integer DEFAULT 0,
  is_active boolean DEFAULT true,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Tournaments policies
CREATE POLICY "Anyone can view approved tournaments" ON tournaments FOR SELECT USING (status = 'approved' OR status = 'active' OR status = 'completed');
CREATE POLICY "Organizers can view own tournaments" ON tournaments FOR SELECT TO authenticated USING (organizer_id = auth.uid());
CREATE POLICY "Admins can view all tournaments" ON tournaments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Organizers can create tournaments" ON tournaments FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "Organizers can update own tournaments" ON tournaments FOR UPDATE TO authenticated USING (organizer_id = auth.uid());
CREATE POLICY "Admins can update all tournaments" ON tournaments FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Tournament registrations policies
CREATE POLICY "Players can view own registrations" ON tournament_registrations FOR SELECT TO authenticated USING (player_id = auth.uid());
CREATE POLICY "Organizers can view registrations for their tournaments" ON tournament_registrations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM tournaments WHERE id = tournament_id AND organizer_id = auth.uid())
);
CREATE POLICY "Players can create registrations" ON tournament_registrations FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());
CREATE POLICY "Players can update own registrations" ON tournament_registrations FOR UPDATE TO authenticated USING (player_id = auth.uid());
CREATE POLICY "Organizers can update registrations for their tournaments" ON tournament_registrations FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM tournaments WHERE id = tournament_id AND organizer_id = auth.uid())
);

-- Player stats policies
CREATE POLICY "Players can view own stats" ON player_stats FOR SELECT TO authenticated USING (player_id = auth.uid());
CREATE POLICY "Anyone can view public stats" ON player_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = player_id AND (privacy_settings->>'show_stats')::boolean = true)
);
CREATE POLICY "System can insert stats" ON player_stats FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Players can update own stats" ON player_stats FOR UPDATE TO authenticated USING (player_id = auth.uid());

-- Player achievements policies
CREATE POLICY "Players can view own achievements" ON player_achievements FOR SELECT TO authenticated USING (player_id = auth.uid());
CREATE POLICY "Anyone can view public achievements" ON player_achievements FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = player_id AND (privacy_settings->>'show_achievements')::boolean = true)
);
CREATE POLICY "System can insert achievements" ON player_achievements FOR INSERT TO authenticated WITH CHECK (true);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can view role-based notifications" ON notifications FOR SELECT TO authenticated USING (
  user_id IS NULL AND (target_role IS NULL OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = target_role))
);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Facilities policies
CREATE POLICY "Anyone can view active facilities" ON facilities FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can view own facilities" ON facilities FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners can create facilities" ON facilities FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update own facilities" ON facilities FOR UPDATE TO authenticated USING (owner_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_sport_type ON tournaments(sport_type);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_player ON tournament_registrations(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_achievements_player ON player_achievements(player_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_tournament_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tournaments 
    SET current_participants = current_participants + 1 
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tournaments 
    SET current_participants = current_participants - 1 
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update participant count
CREATE TRIGGER tournament_participant_count_trigger
  AFTER INSERT OR DELETE ON tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION update_tournament_participant_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();