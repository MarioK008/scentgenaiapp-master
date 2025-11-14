import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  email: string;
  waitlistId?: string;
  templateKey?: string;
  variables?: Record<string, string>;
}

// Helper function to replace variables in template
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, waitlistId, templateKey = 'welcome', variables = {} }: EmailRequest = await req.json();
    console.log(`Sending ${templateKey} email to: ${email}`);

    const apiToken = Deno.env.get('FORWARDEMAIL_API_KEY');
    if (!apiToken) {
      throw new Error('FORWARDEMAIL_API_KEY not configured');
    }

    // Fetch template from database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Template fetch error:', templateError);
      throw new Error(`Template '${templateKey}' not found or inactive`);
    }

    console.log(`Using template: ${template.name}`);

    // Replace variables in template
    const templateVars = { email, ...variables };
    const subject = replaceVariables(template.subject, templateVars);
    const htmlContent = replaceVariables(template.html_content, templateVars);
    const textContent = replaceVariables(template.text_content, templateVars);

    // Base64 encode "API_TOKEN:" for Basic Auth
    const auth = btoa(`${apiToken}:`);

    // Send email via ForwardEmail API
    const emailResponse = await fetch('https://forwardemail.net/v1/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'hola@scentgenai.app',
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('ForwardEmail API error:', errorText);
      throw new Error(`Failed to send email: ${emailResponse.status} - ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult);

    // Update waitlist entry if ID provided
    if (waitlistId) {
      await supabase
        .from('waitlist')
        .update({
          email_sent_at: new Date().toISOString(),
          welcome_email_status: 'sent',
        })
        .eq('id', waitlistId);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);

    // Update waitlist entry to failed if ID provided
    try {
      const requestBody = await req.clone().json();
      const { waitlistId } = requestBody;
      
      if (waitlistId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabase
          .from('waitlist')
          .update({ welcome_email_status: 'failed' })
          .eq('id', waitlistId);
      }
    } catch (updateError) {
      console.error('Failed to update waitlist status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
