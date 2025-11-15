import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendEmail } from '../_shared/email-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  email: string;
  username: string;
  userId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, username, userId }: WelcomeEmailRequest = await req.json();
    console.log(`Sending user welcome email to: ${email}`);

    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://scentgenai.app';

    const result = await sendEmail({
      to: email,
      templateKey: 'user_welcome',
      variables: {
        username: username || email.split('@')[0],
        app_url: appUrl,
        user_id: userId
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        logId: result.logId 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending welcome email:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
