-- Simple Venue Setup - Run this in your Supabase SQL Editor
-- This ensures the basic sports_facilities table exists with the right fields

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sports_facilities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sports_facilities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    district TEXT NOT NULL,
    province TEXT NOT NULL,
    location TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    price_per_hour DECIMAL(10, 2) DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sports_facilities ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
DROP POLICY IF EXISTS "Public read access" ON public.sports_facilities;
CREATE POLICY "Public read access" ON public.sports_facilities
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access" ON public.sports_facilities;
CREATE POLICY "Admin full access" ON public.sports_facilities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insert a test venue if table is empty
INSERT INTO public.sports_facilities (name, description, district, province, location, contact_phone, price_per_hour)
SELECT 
    'Test Sports Complex',
    'A modern sports facility with multiple courts and amenities',
    'Kathmandu',
    'Bagmati Province',
    'Near Central Park, Kathmandu',
    '+977-1-4444444',
    500
WHERE NOT EXISTS (SELECT 1 FROM public.sports_facilities);

-- Success message
SELECT 'Simple venue setup completed! 🎉' as message;

