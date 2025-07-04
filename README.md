# LambAgentic Website - Contact Form Integration

This project includes a complete contact form integration with Supabase database storage and optional email notifications.

## Setup Instructions

### 1. Supabase Configuration

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and anon key

2. **Run Database Migration**
   - In your Supabase dashboard, go to SQL Editor
   - Copy and paste the contents of `supabase/migrations/create_leads_table.sql`
   - Run the migration to create the leads table with proper RLS policies

3. **Configure Environment Variables**
   - Update `js/supabase-config.js` with your actual Supabase URL and anon key
   - The form will work with just database storage even without email setup

### 2. Email Setup (Optional)

The contact form works perfectly without email notifications - leads are saved to the database. Email notifications are an optional enhancement.

1. **Get a Resend API Key** (Optional)
   - Sign up at [resend.com](https://resend.com)
   - Create an API key
   - Add the API key to your Supabase project's environment variables as `RESEND_API_KEY`

2. **Deploy Edge Function** (Optional)
   - The edge function in `supabase/functions/send-lead-notification/index.ts` handles email notifications
   - Deploy it using: `supabase functions deploy send-lead-notification`
   - Configure the `from` email address to match your verified domain

### 3. Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Update Configuration**
   - Edit `js/supabase-config.js` with your Supabase credentials
   - The form will show a warning if not properly configured

## How It Works

### Primary Method: Direct Database Storage
- Form submissions are saved directly to the Supabase `leads` table
- This is the primary method and works independently of email notifications
- Provides immediate confirmation to users
- All form data is preserved even if email fails

### Secondary Method: Email Notifications (Optional)
- If configured, sends email notifications in the background
- Uses Supabase Edge Function with Resend API
- Failure of email notifications doesn't affect form submission success
- Provides additional alerting for new leads

## Features

### Contact Form
- **Real-time Validation**: Email format, required fields
- **Error Handling**: User-friendly error messages and loading states
- **Success Feedback**: Clear confirmation when form is submitted
- **Responsive Design**: Works on all device sizes
- **Graceful Degradation**: Works even if email service is unavailable

### Database Integration
- **Leads Table**: Stores all form submissions with proper indexing
- **Row Level Security**: Secure data access with proper policies
- **Automatic Timestamps**: Created and updated timestamps
- **Status Tracking**: Lead status management (new, contacted, qualified, etc.)

### Email Notifications (Optional)
- **Background Processing**: Doesn't block form submission
- **Detailed Information**: Includes all form data and lead ID
- **Fallback Handling**: Form still works even if email fails
- **Timeout Protection**: Email attempts timeout after 10 seconds

### Analytics Ready
- **Form Tracking**: Built-in analytics event tracking
- **Lead Source**: Automatically tracks website as lead source
- **Performance Metrics**: Success/failure tracking

## File Structure

```
├── supabase/
│   ├── migrations/
│   │   └── create_leads_table.sql      # Database schema
│   └── functions/
│       └── send-lead-notification/
│           └── index.ts                # Email notification function (optional)
├── js/
│   ├── supabase-config.js             # Supabase configuration
│   └── contact-form.js                # Form handling logic
├── index.html                         # Main website
├── sylvia.html                        # Sylvia product page
└── README.md                          # This file
```

## Security Features

- **Input Validation**: Client and server-side validation of all form inputs
- **SQL Injection Protection**: Parameterized queries via Supabase
- **CORS Protection**: Proper CORS headers on edge function
- **Rate Limiting**: Built-in Supabase rate limiting
- **Data Sanitization**: Clean and validate all user inputs

## Troubleshooting

### Form Not Working
1. **Check browser console for errors**
2. **Verify Supabase configuration** in `js/supabase-config.js`
3. **Ensure the leads table exists** in your Supabase database
4. **Check RLS policies** - the `leads` table should allow anonymous inserts

### Common Error Messages
- **"Database connection not available"**: Supabase client not initialized properly
- **"Database permissions not configured"**: RLS policies need to be set up
- **"Network connection error"**: Internet connectivity issues
- **"Please fill in all required fields"**: Form validation errors

### Database Setup Issues
1. **Run the migration**: Ensure `create_leads_table.sql` has been executed
2. **Check RLS policies**: Anonymous users should be able to INSERT into leads table
3. **Verify table structure**: Ensure all required columns exist

### Email Not Sending (This is Optional)
1. Email notifications are optional - the form works without them
2. Check that `RESEND_API_KEY` is set in Supabase environment variables
3. Ensure the edge function is deployed: `supabase functions deploy send-lead-notification`
4. Verify the `from` email domain is verified in Resend

## Database Migration

Make sure to run this SQL in your Supabase SQL Editor:

```sql
-- Create leads table with proper RLS policies
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  service text,
  message text NOT NULL,
  phone text,
  status text DEFAULT 'new',
  source text DEFAULT 'website',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Grant INSERT permission to anonymous users (required for contact form)
GRANT INSERT ON TABLE leads TO anon;

-- Allow anonymous users to insert leads (for contact form)
CREATE POLICY "Anyone can insert leads" ON leads
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow authenticated users to read and update leads (for admin)
CREATE POLICY "Authenticated users can read leads" ON leads
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update leads" ON leads
  FOR UPDATE TO authenticated
  USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Add constraints
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed'));

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Next Steps

1. **Test the Form**: Submit a test lead and verify it appears in your Supabase database
2. **Set Up Email** (Optional): Configure Resend API for email notifications
3. **Analytics Integration**: Add Google Analytics or other tracking
4. **Lead Management**: Build admin dashboard for managing leads
5. **Automation**: Set up automated follow-up sequences

## Support

The contact form is designed to work reliably with just the database connection. Email notifications are a bonus feature that can be added later. Focus on getting the database connection working first, then optionally add email notifications.

For technical support, check the browser console for specific error messages and refer to the troubleshooting section above.