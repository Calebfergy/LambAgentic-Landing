/*
  # Fix RLS Policy for Leads Table

  1. Security Updates
    - Drop and recreate RLS policies for leads table
    - Ensure proper grants for anon role
    - Add explicit INSERT policy for anonymous users
    - Verify all permissions are correctly applied

  2. Changes
    - Drop existing policies that might be conflicting
    - Grant necessary permissions to anon role
    - Create clear, simple policy for anonymous inserts
    - Ensure RLS is properly enabled
*/

-- First, ensure RLS is enabled on the leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can read leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;

-- Grant necessary permissions to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON TABLE leads TO anon;

-- Grant necessary permissions to authenticated role
GRANT SELECT, UPDATE ON TABLE leads TO authenticated;

-- Create a simple, clear policy for anonymous inserts
CREATE POLICY "Allow anonymous inserts to leads"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (true);

-- Ensure the anon role can use the gen_random_uuid() function
GRANT EXECUTE ON FUNCTION gen_random_uuid() TO anon;

-- Verify the table structure and constraints are correct
DO $$
BEGIN
  -- Check if the status constraint exists and is correct
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'leads_status_check'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_status_check 
      CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed'));
  END IF;
END $$;