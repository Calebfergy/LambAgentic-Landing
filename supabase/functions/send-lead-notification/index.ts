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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
        source: 'website'
      }])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save lead information' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare email content
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

    // Send email notification using a simple email service
    // Note: In production, you'd want to use a proper email service like SendGrid, Resend, etc.
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
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

    let emailSent = false;
    if (emailResponse.ok) {
      emailSent = true;
    } else {
      console.error('Email sending failed:', await emailResponse.text());
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        leadId: lead.id,
        emailSent,
        message: 'Lead saved successfully' + (emailSent ? ' and notification sent' : ' but email notification failed')
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});