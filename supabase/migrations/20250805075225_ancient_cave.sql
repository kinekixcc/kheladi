/*
  # Ensure Admin User Exists

  1. Admin User Setup
    - Creates admin user with correct credentials
    - Ensures profile exists with admin role
    - Updates existing admin if needed

  2. Security
    - Admin has full access to all tables
    - Proper role assignment
*/

-- First, check if admin user exists and update/create as needed
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Try to find existing admin user
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'adminsabin@gmail.com';
    
    IF admin_user_id IS NULL THEN
        -- Create new admin user
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'adminsabin@gmail.com',
            crypt('windows8.1', gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Admin Sabin", "role": "admin"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_user_id;
    ELSE
        -- Update existing admin user password
        UPDATE auth.users 
        SET 
            encrypted_password = crypt('windows8.1', gen_salt('bf')),
            raw_user_meta_data = '{"full_name": "Admin Sabin", "role": "admin"}',
            updated_at = now()
        WHERE id = admin_user_id;
    END IF;
    
    -- Ensure admin profile exists
    INSERT INTO profiles (
        id,
        full_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'Admin Sabin',
        'admin',
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = 'Admin Sabin',
        role = 'admin',
        updated_at = now();
        
    RAISE NOTICE 'Admin user created/updated with ID: %', admin_user_id;
END $$;