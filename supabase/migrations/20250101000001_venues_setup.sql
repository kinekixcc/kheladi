-- Venues Setup Migration
-- This migration ensures the sports_facilities table exists with proper structure

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sports_facilities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sports_facilities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    district TEXT NOT NULL,
    province TEXT NOT NULL,
    google_maps_link TEXT NOT NULL,
    sports_types TEXT[] NOT NULL,
    amenities TEXT[],
    price_per_hour DECIMAL(10, 2) NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    images TEXT[],
    rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'manual' CHECK (source IN ('google_maps', 'manual', 'venue_registration')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES public.sports_facilities(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES public.sports_facilities(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours DECIMAL(4, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sports_facilities_active ON public.sports_facilities(is_active);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_province ON public.sports_facilities(province);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_district ON public.sports_facilities(district);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_sports_types ON public.sports_facilities USING GIN(sports_types);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_amenities ON public.sports_facilities USING GIN(amenities);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_rating ON public.sports_facilities(rating);
CREATE INDEX IF NOT EXISTS idx_sports_facilities_price ON public.sports_facilities(price_per_hour);

-- Enable Row Level Security
ALTER TABLE public.sports_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sports_facilities
CREATE POLICY "Public venues are viewable by everyone" ON public.sports_facilities
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all venues" ON public.sports_facilities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.role = 'admin'
        )
    );

CREATE POLICY "Venue owners can manage their own venues" ON public.sports_facilities
    FOR ALL USING (auth.uid() = owner_id);

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can add reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert some sample venues for testing
INSERT INTO public.sports_facilities (
    name, description, location, district, province, 
    google_maps_link, sports_types, amenities, price_per_hour, contact_phone, 
    source, notes
) VALUES 
(
    'Kathmandu Sports Complex',
    'Premier multi-sport facility with indoor and outdoor courts, professional equipment, and excellent amenities.',
    'Thamel, Kathmandu',
    'Kathmandu',
    'Bagmati',
    'https://maps.google.com/?q=27.7172,85.3240',
    ARRAY['Basketball', 'Football', 'Tennis', 'Badminton'],
    ARRAY['Parking', 'Changing Rooms', 'Showers', 'Equipment Rental', 'Food Court'],
    1500,
    '+977-1-4444444',
    'google_maps',
    'Popular venue in tourist area, high demand'
),
(
    'Pokhara Valley Sports Center',
    'Scenic sports facility with mountain views, multiple courts, and modern facilities.',
    'Lakeside, Pokhara',
    'Kaski',
    'Gandaki',
    'https://maps.google.com/?q=28.2096,83.9856',
    ARRAY['Volleyball', 'Basketball', 'Swimming'],
    ARRAY['Parking', 'Changing Rooms', 'WiFi', 'Restrooms'],
    1200,
    '+977-61-5555555',
    'google_maps',
    'Beautiful location, popular with tourists'
),
(
    'Biratnagar Indoor Stadium',
    'Professional indoor sports facility with multiple courts and modern amenities.',
    'Biratnagar City Center',
    'Morang',
    'Province 1',
    'https://maps.google.com/?q=26.4521,87.2717',
    ARRAY['Basketball', 'Volleyball', 'Badminton', 'Table Tennis'],
    ARRAY['Air Conditioning', 'Professional Lighting', 'Seating Area', 'Parking'],
    1000,
    '+977-21-6666666',
    'google_maps',
    'Professional venue, good for tournaments'
)
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sports_facilities_updated_at 
    BEFORE UPDATE ON public.sports_facilities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON public.reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
