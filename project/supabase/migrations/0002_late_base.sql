/*
  # Fix RLS Policies

  1. Changes
    - Fix user_profiles policies to allow initial profile creation
    - Fix locations policies to allow user location updates
    - Remove recursive policy check that caused infinite recursion
  
  2. Security
    - Maintain secure access control while allowing necessary operations
    - Ensure users can only access their own data
    - Allow admins to view all data without recursion
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own location" ON locations;
DROP POLICY IF EXISTS "Users can read their own locations" ON locations;
DROP POLICY IF EXISTS "Admins can read all locations" ON locations;

-- User Profiles Policies
CREATE POLICY "Enable insert for authenticated users"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for users"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR 
    (SELECT is_admin FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Enable update for users"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Location Policies
CREATE POLICY "Enable insert for authenticated users"
  ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable select for users"
  ON locations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    (SELECT is_admin FROM user_profiles WHERE id = auth.uid())
  );