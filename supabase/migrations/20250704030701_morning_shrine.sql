/*
  # Fix RLS policies for leads table

  1. Security Updates
    - Update RLS policies to allow anonymous users to insert leads
    - Ensure authenticated users can manage leads
    - Fix policy names and permissions

  2. Changes Made
    - Drop existing restrictive policies
    - Create new policy allowing anonymous inserts for contact form
    - Maintain security for authenticated user operations
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON leads;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON leads;
DROP POLICY IF EXISTS "Allow anonymous inserts to leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can read leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;

-- Create new policy to allow anonymous users to insert leads (for contact form)
CREATE POLICY "Anyone can insert leads" ON leads
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read all leads (for admin dashboard)
CREATE POLICY "Authenticated users can read leads" ON leads
  FOR SELECT 
  TO authenticated
  USING (true);

-- Allow authenticated users to update leads (for admin management)
CREATE POLICY "Authenticated users can update leads" ON leads
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Allow authenticated users to delete leads if needed
CREATE POLICY "Authenticated users can delete leads" ON leads
  FOR DELETE 
  TO authenticated
  USING (true);

-- Ensure the table has RLS enabled
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to anon role for inserts
GRANT INSERT ON TABLE leads TO anon;
GRANT USAGE ON SCHEMA public TO anon;