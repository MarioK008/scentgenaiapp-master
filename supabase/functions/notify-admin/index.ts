import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendEmail } from '../_shared/email-service.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminNotificationRequest {
  email: string;
  username: string;
  userId: string;
  timestamp: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Rate limiting - 20 requests per IP per hour (admin notifications)
    await checkRateLimit(req, 'notify-admin', 20, 60);

    const { email, username, userId, timestamp }: AdminNotificationRequest = await req.json();
    console.log(`Sending admin notification for new user: ${email}`);

    // Admin email - you can make this configurable
    const adminEmail = 'admin@scentgenai.app';

    const result = await sendEmail({
      to: adminEmail,
      templateKey: 'admin_new_user',
      variables: {
        email: email,
        username: username,
        user_id: userId,
        timestamp: timestamp
      }
    });

    if (!result.success) {
      console.error('Failed to send admin notification:', result.error);
      // Don't throw - admin notifications are non-critical
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin notification sent',
        logId: result.logId 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending admin notification:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
