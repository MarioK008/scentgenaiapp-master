import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendEmail } from '../_shared/email-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetUrl }: PasswordResetRequest = await req.json();
    console.log(`Sending password reset email to: ${email}`);

    const result = await sendEmail({
      to: email,
      templateKey: 'password_reset',
      variables: {
        reset_url: resetUrl
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset email sent successfully',
        logId: result.logId 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending password reset email:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
