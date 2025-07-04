import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface LeadData {
  name: string;
  email: string;
  company?: string;
  service?: string;
  message: string;
  phone?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const leadData: LeadData = await req.json();

    // Validate required fields
    if (!leadData.name || !leadData.email || !leadData.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, and message are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert lead into database
    const { data: lead, error: dbError } = await supabaseClient
      .from('leads')
      .insert([{
        name: leadData.name,
        email: leadData.email,
        company: leadData.company || null,
        service: leadData.service || null,
        message: leadData.message,
        phone: leadData.phone || null,
        source: 'website',
        status: 'new'
      }])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save lead information', details: dbError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare email content for notification
    const emailSubject = `New Lead from ${leadData.name} - LambAgentic Website`;
    const emailBody = `
New lead submission from LambAgentic website:

Name: ${leadData.name}
Email: ${leadData.email}
Company: ${leadData.company || 'Not provided'}
Service Interest: ${leadData.service || 'Not specified'}
Phone: ${leadData.phone || 'Not provided'}

Message:
${leadData.message}

Lead ID: ${lead.id}
Submitted: ${new Date(lead.created_at).toLocaleString()}

---
This lead has been automatically saved to your Supabase database.
    `.trim();

    // Try to send email notification (optional - won't fail if email service is not configured)
    let emailSent = false;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (resendApiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'noreply@lambagentic.com',
            to: ['info@lambagentic.com'],
            subject: emailSubject,
            text: emailBody,
            html: emailBody.replace(/\n/g, '<br>'),
          }),
        });

        if (emailResponse.ok) {
          emailSent = true;
          console.log('Email notification sent successfully');
        } else {
          console.error('Email sending failed:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Email service error:', emailError);
      }
    } else {
      console.log('Email service not configured (RESEND_API_KEY not set)');
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        leadId: lead.id,
        emailSent,
        message: 'Lead saved successfully' + (emailSent ? ' and notification sent' : '')
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});