/*
  # Update Admin Credentials

  1. Updates
    - Update admin email to adminsabin@gmail.com
    - Update admin password to windows8.1
    - Ensure admin profile exists with correct details

  2. Security
    - Maintain admin role and permissions
    - Update auth.users table with new credentials
*/

-- Update admin user in auth.users table
UPDATE auth.users 
SET 
  email = 'adminsabin@gmail.com',
  raw_user_meta_data = jsonb_build_object(
    'full_name', 'Admin Sabin',
    'role', 'admin'
  ),
  email_confirmed_at = now(),
  updated_at = now()
WHERE email = 'admin@khelkheleko.com';

-- If admin doesn't exist, create new admin user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'adminsabin@gmail.com'
  ) THEN
    -- Insert admin user (password will be set via auth.signup)
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      gen_random_uuid(),
      'adminsabin@gmail.com',
      crypt('windows8.1', gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', 'Admin Sabin', 'role', 'admin'),
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  END IF;
END $$;

-- Ensure admin profile exists
INSERT INTO profiles (
  id,
  full_name,
  role,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'Admin Sabin',
  'admin'::user_role,
  now(),
  now()
FROM auth.users u
WHERE u.email = 'adminsabin@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Admin Sabin',
  role = 'admin'::user_role,
  updated_at = now();