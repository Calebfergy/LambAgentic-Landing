# LambAgentic Website - Contact Form Integration

This project includes a complete contact form integration with Supabase database storage and email notifications.

## Setup Instructions

### 1. Supabase Configuration

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and anon key

2. **Run Database Migration**
   - In your Supabase dashboard, go to SQL Editor
   - Copy and paste the contents of `supabase/migrations/create_leads_table.sql`
   - Run the migration to create the leads table

3. **Deploy Edge Function**
   - The edge function in `supabase/functions/send-lead-notification/index.ts` handles form submissions
   - This function will be automatically deployed when you connect to Supabase

4. **Configure Environment Variables**
   - Update `js/supabase-config.js` with your actual Supabase URL and anon key
   - For the email functionality, you'll need a Resend API key (see Email Setup below)

### 2. Email Setup (Optional but Recommended)

1. **Get a Resend API Key**
   - Sign up at [resend.com](https://resend.com)
   - Create an API key
   - Add the API key to your Supabase project's environment variables as `RESEND_API_KEY`

2. **Configure Email Domain**
   - In the edge function, update the `from` email address to match your verified domain
   - Or use the default Resend sandbox domain for testing

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

## Features

### Contact Form
- **Real-time Validation**: Email format, required fields, minimum message length
- **Error Handling**: User-friendly error messages and loading states
- **Success Feedback**: Clear confirmation when form is submitted
- **Responsive Design**: Works on all device sizes

### Database Integration
- **Leads Table**: Stores all form submissions with proper indexing
- **Row Level Security**: Secure data access with proper policies
- **Automatic Timestamps**: Created and updated timestamps
- **Status Tracking**: Lead status management (new, contacted, qualified, etc.)

### Email Notifications
- **Instant Alerts**: Email sent to info@lambagentic.com on form submission
- **Detailed Information**: Includes all form data and lead ID
- **Fallback Handling**: Form still works even if email fails

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
│           └── index.ts                # Email notification function
├── js/
│   ├── supabase-config.js             # Supabase configuration
│   └── contact-form.js                # Form handling logic
├── index.html                         # Main website
├── sylvia.html                        # Sylvia product page
└── README.md                          # This file
```

## Security Features

- **Input Validation**: Server-side validation of all form inputs
- **SQL Injection Protection**: Parameterized queries via Supabase
- **CORS Protection**: Proper CORS headers on edge function
- **Rate Limiting**: Built-in Supabase rate limiting
- **Data Sanitization**: Clean and validate all user inputs

## Troubleshooting

### Form Not Working
1. Check browser console for errors
2. Verify Supabase configuration in `js/supabase-config.js`
3. Ensure the leads table exists in your Supabase database
4. Check that the edge function is deployed

### Email Not Sending
1. Verify Resend API key is set in Supabase environment variables
2. Check that the `from` email domain is verified in Resend
3. Form will still save leads even if email fails

### Database Errors
1. Ensure the migration has been run
2. Check RLS policies are properly configured
3. Verify anon key has proper permissions

## Next Steps

1. **Analytics Integration**: Add Google Analytics or other tracking
2. **Lead Management**: Build admin dashboard for managing leads
3. **Email Templates**: Create branded email templates
4. **Automation**: Set up automated follow-up sequences
5. **A/B Testing**: Test different form layouts and copy

## Support

For technical support or questions about the integration, contact the development team or refer to the Supabase documentation.