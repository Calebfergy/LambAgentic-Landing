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
    console.log('Edge function called - processing lead notification');
    
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
    console.log('Received lead data:', { 
      name: leadData.name, 
      email: leadData.email, 
      hasMessage: !!leadData.message 
    });

    // Validate required fields
    if (!leadData.name || !leadData.email || !leadData.message) {
      console.error('Validation failed - missing required fields');
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
      console.error('Validation failed - invalid email format:', leadData.email);
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert lead into database
    console.log('Attempting to insert lead into database');
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

    console.log('Lead saved successfully with ID:', lead.id);

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
      console.log('Attempting to send email notification via Resend');
      try {
        const emailPayload = {
          from: 'caleb@lambagentic.com',
          to: ['info@lambagentic.com'],
          subject: emailSubject,
          text: emailBody,
          html: emailBody.replace(/\n/g, '<br>'),
        };
        
        console.log('Resend API payload:', {
          from: emailPayload.from,
          to: emailPayload.to,
          subject: emailPayload.subject,
          textLength: emailPayload.text.length
        });

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        });

        console.log('Resend API response status:', emailResponse.status);
        
        const responseText = await emailResponse.text();
        console.log('Resend API response body:', responseText);

        if (emailResponse.ok) {
          emailSent = true;
          console.log('Email notification sent successfully');
          try {
            const responseData = JSON.parse(responseText);
            console.log('Email ID:', responseData.id);
          } catch (parseError) {
            console.log('Could not parse response as JSON, but email was sent');
          }
        } else {
          console.error('Resend API failed with status:', emailResponse.status);
          console.error('Resend API error response:', responseText);
          
          // Try to parse error details
          try {
            const errorData = JSON.parse(responseText);
            console.error('Resend API error details:', errorData);
          } catch (parseError) {
            console.error('Could not parse Resend error response as JSON');
          }
        }
      } catch (emailError) {
        console.error('Email service error - full error object:', emailError);
        console.error('Email error name:', emailError.name);
        console.error('Email error message:', emailError.message);
        console.error('Email error stack:', emailError.stack);
        
        // Log additional details if available
        if (emailError.cause) {
          console.error('Email error cause:', emailError.cause);
        }
        
        // Check for specific error types
        if (emailError instanceof TypeError) {
          console.error('TypeError occurred - likely network or fetch issue');
        }
        
        if (emailError.code) {
          console.error('Email error code:', emailError.code);
        }
      }
    } else {
      console.log('Email service not configured (RESEND_API_KEY not set)');
    }

    // Return success response
    const response = { 
      success: true, 
      leadId: lead.id,
      emailSent,
      message: 'Lead saved successfully' + (emailSent ? ' and notification sent' : '')
    };
    
    console.log('Returning success response:', response);
    
    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error - full error object:', error);
    console.error('Function error name:', error.name);
    console.error('Function error message:', error.message);
    console.error('Function error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});