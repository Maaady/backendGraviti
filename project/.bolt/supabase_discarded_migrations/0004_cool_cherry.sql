/*
  # Fix RLS Policies - Final Version

  1. Changes
    - Simplify admin checks using a separate function
    - Fix location tracking permissions
    - Optimize policy performance
  
  2. Security
    - Maintain secure access control
    - Prevent recursion in admin checks
*/

-- Create admin check function
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public profile creation" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow admins to read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to insert own location" ON locations;
DROP POLICY IF EXISTS "Allow users to read own locations" ON locations;

-- User profile policies
CREATE POLICY "public_create_profile"
  ON user_profiles FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "read_own_profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR auth.is_admin());

CREATE POLICY "update_own_profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Location policies
CREATE POLICY "create_own_location"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "read_locations"
  ON locations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR auth.is_admin());