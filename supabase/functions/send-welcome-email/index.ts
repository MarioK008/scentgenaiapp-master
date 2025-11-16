import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { sendEmail } from '../_shared/email-service.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';

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

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Rate limiting - 10 requests per IP per hour
    await checkRateLimit(req, 'send-welcome-email', 10, 60);

    const { email, waitlistId, templateKey = 'welcome', variables = {} }: EmailRequest = await req.json();
    console.log(`Sending ${templateKey} email to: ${email}`);

    // Use unified email service
    const result = await sendEmail({
      to: email,
      templateKey: templateKey,
      variables: variables
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    // Update waitlist entry if ID provided
    if (waitlistId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
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
