-- Production Database Setup Script for खेल खेलेको
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM ('player', 'organizer', 'admin');
CREATE TYPE tournament_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'active', 'completed', 'cancelled');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'player',
    phone TEXT,
    date_of_birth DATE,
    province TEXT,
    district TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sports facilities table
CREATE TABLE IF NOT EXISTS public.sports_facilities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    district TEXT NOT NULL,
    province TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    sports_types TEXT[] NOT NULL,
    amenities TEXT[],
    price_per_hour DECIMAL(10, 2) NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    images TEXT[],
    rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    sport_type TEXT NOT NULL,
    tournament_type TEXT NOT NULL,
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES public.sports_facilities(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline DATE NOT NULL,
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    entry_fee DECIMAL(10, 2) DEFAULT 0,
    prize_pool DECIMAL(10, 2) DEFAULT 0,
    rules TEXT NOT NULL,
    requirements TEXT NOT NULL,
    status tournament_status DEFAULT 'pending_approval',
    admin_notes TEXT,
    venue_name TEXT,
    venue_address TEXT,
    province TEXT,
    district TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    images TEXT[],
    pdf_document TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournament registrations table
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER NOT NULL,
    experience_level TEXT NOT NULL,
    team_name TEXT,
    emergency_contact TEXT NOT NULL,
    medical_conditions TEXT,
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'registered',
    entry_fee_paid BOOLEAN DEFAULT FALSE,
    payment_status payment_status DEFAULT 'pending',
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, player_id)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES public.sports_facilities(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours DECIMAL(4, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    status booking_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES public.sports_facilities(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'NPR',
    payment_method TEXT NOT NULL,
    transaction_id TEXT UNIQUE,
    gateway_response JSONB,
    status payment_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Sports facilities: Public read, owners can manage their own
CREATE POLICY "Facilities are viewable by everyone" ON public.sports_facilities
    FOR SELECT USING (is_active = true);

CREATE POLICY "Facility owners can manage their facilities" ON public.sports_facilities
    FOR ALL USING (auth.uid() = owner_id);

-- Tournaments: Public read for approved, organizers manage their own
CREATE POLICY "Approved tournaments are viewable by everyone" ON public.tournaments
    FOR SELECT USING (status = 'approved' OR auth.uid() = organizer_id);

CREATE POLICY "Organizers can manage their tournaments" ON public.tournaments
    FOR ALL USING (auth.uid() = organizer_id);

-- Tournament registrations: Players see their own, organizers see their tournament's
CREATE POLICY "Players can view their registrations" ON public.tournament_registrations
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Players can register for tournaments" ON public.tournament_registrations
    FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Organizers can view registrations for their tournaments" ON public.tournament_registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tournaments 
            WHERE tournaments.id = tournament_registrations.tournament_id 
            AND tournaments.organizer_id = auth.uid()
        )
    );

-- Bookings: Users can manage their own bookings
CREATE POLICY "Users can view their bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Reviews: Public read, users can manage their own
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Notifications: Users can only see their own
CREATE POLICY "Users can view their notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Payments: Users can view their own payments
CREATE POLICY "Users can view their payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sports_facilities_updated_at BEFORE UPDATE ON public.sports_facilities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tournament_registrations_updated_at BEFORE UPDATE ON public.tournament_registrations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'player')::user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_sport_type ON public.tournaments(sport_type);
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer ON public.tournaments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_facilities_location ON public.sports_facilities(province, district);
CREATE INDEX IF NOT EXISTS idx_facilities_sports ON public.sports_facilities USING GIN(sports_types);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament ON public.tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_player ON public.tournament_registrations(player_id);
CREATE INDEX IF NOT EXISTS idx_bookings_facility ON public.bookings(facility_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);

-- Insert sample data (optional)
-- You can uncomment this section to add some initial data

/*
-- Sample provinces and districts data
INSERT INTO public.sports_facilities (name, description, owner_id, location, district, province, sports_types, price_per_hour, contact_phone) VALUES
('Kathmandu Sports Complex', 'Modern sports facility in the heart of Kathmandu', (SELECT id FROM auth.users LIMIT 1), 'New Baneshwor, Kathmandu', 'Kathmandu', 'Bagmati Province', ARRAY['Football', 'Basketball', 'Volleyball'], 1500.00, '+977-1-4567890'),
('Pokhara Adventure Sports', 'Outdoor sports facility with mountain views', (SELECT id FROM auth.users LIMIT 1), 'Lakeside, Pokhara', 'Kaski', 'Gandaki Province', ARRAY['Rock Climbing', 'Cycling', 'Swimming'], 2000.00, '+977-61-123456');
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully! 🎉';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Set up authentication in Supabase dashboard';
    RAISE NOTICE '2. Configure your environment variables';
    RAISE NOTICE '3. Test the connection from your app';
END $$;