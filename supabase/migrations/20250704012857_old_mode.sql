/*
  # Create leads table for contact form submissions

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, required)
      - `company` (text, optional)
      - `service` (text, optional)
      - `message` (text, required)
      - `phone` (text, optional)
      - `status` (text, default 'new')
      - `source` (text, default 'website')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `leads` table
    - Add policy for inserting new leads (public access for form submissions)
    - Add policy for reading leads (authenticated users only)

  3. Indexes
    - Index on email for quick lookups
    - Index on status for filtering
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  service text,
  message text NOT NULL,
  phone text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
  source text DEFAULT 'website',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy for inserting new leads (public access for contact form)
CREATE POLICY "Anyone can insert leads"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy for reading leads (authenticated users only)
CREATE POLICY "Authenticated users can read leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for updating leads (authenticated users only)
CREATE POLICY "Authenticated users can update leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();