-- Add missing columns to profiles table if they don't exist
-- This migration adds the notification_settings and privacy_settings columns
-- that are referenced in the UserProfileSettings component

-- Check if columns exist before adding them
DO $$ 
BEGIN
    -- Add notification_settings column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'notification_settings'
    ) THEN
        ALTER TABLE profiles ADD COLUMN notification_settings jsonb DEFAULT '{
            "email_notifications": true,
            "push_notifications": true,
            "tournament_updates": true,
            "registration_alerts": true,
            "marketing_emails": false
        }';
        RAISE NOTICE 'Added notification_settings column to profiles table';
    ELSE
        RAISE NOTICE 'notification_settings column already exists in profiles table';
    END IF;

    -- Add privacy_settings column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'privacy_settings'
    ) THEN
        ALTER TABLE profiles ADD COLUMN privacy_settings jsonb DEFAULT '{
            "show_profile": true,
            "show_contact": false,
            "show_stats": true,
            "show_achievements": true
        }';
        RAISE NOTICE 'Added privacy_settings column to profiles table';
    ELSE
        RAISE NOTICE 'privacy_settings column already exists in profiles table';
    END IF;

    -- Add organization_name and organization_description columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'organization_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN organization_name text;
        RAISE NOTICE 'Added organization_name column to profiles table';
    ELSE
        RAISE NOTICE 'organization_name column already exists in profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'organization_description'
    ) THEN
        ALTER TABLE profiles ADD COLUMN organization_description text;
        RAISE NOTICE 'Added organization_description column to profiles table';
    ELSE
        RAISE NOTICE 'organization_description column already exists in profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'website'
    ) THEN
        ALTER TABLE profiles ADD COLUMN website text;
        RAISE NOTICE 'Added website column to profiles table';
    ELSE
        RAISE NOTICE 'website column already exists in profiles table';
    END IF;

END $$;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
