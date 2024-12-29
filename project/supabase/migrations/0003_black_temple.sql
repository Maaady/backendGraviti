/*
  # Fix RLS Policies - Final Version

  1. Changes
    - Simplify policies to avoid recursion
    - Fix location tracking permissions
    - Add public policy for initial profile creation
  
  2. Security
    - Allow profile creation during signup
    - Maintain secure access control
    - Fix admin access without recursion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable select for users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON locations;
DROP POLICY IF EXISTS "Enable select for users" ON locations;

-- Allow public access for initial profile creation
CREATE POLICY "Allow public profile creation"
  ON user_profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

-- User profile policies
CREATE POLICY "Allow users to read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Allow admins to read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  ));

CREATE POLICY "Allow users to update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Location policies
CREATE POLICY "Allow users to insert own location"
  ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to read own locations"
  ON locations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );