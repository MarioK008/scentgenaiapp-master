import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  email: string;
  waitlistId?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, waitlistId }: EmailRequest = await req.json();
    console.log(`Sending welcome email to: ${email}`);

    const apiToken = Deno.env.get('FORWARDEMAIL_API_KEY');
    if (!apiToken) {
      throw new Error('FORWARDEMAIL_API_KEY not configured');
    }

    // Base64 encode "API_TOKEN:" for Basic Auth
    const auth = btoa(`${apiToken}:`);

    // HTML Email Template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#0E2A47; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0E2A47;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#1C3B63; border-radius:24px; max-width:600px;">
          <!-- Header Section -->
          <tr>
            <td align="center" style="padding:40px 40px 20px;">
              <h1 style="color:#F7B731; font-family:'Playfair Display',serif; font-size:36px; margin:0;">ScentGenAI</h1>
            </td>
          </tr>
          
          <!-- Content Section -->
          <tr>
            <td style="padding:20px 40px 40px;">
              <h2 style="color:#FFFFFF; font-size:28px; margin:0 0 20px; text-align:center; font-weight:600;">
                Welcome to ScentGenAI!
              </h2>
              
              <p style="color:#B0C4DE; font-size:16px; line-height:1.6; margin:0 0 20px;">
                Thank you for joining our early access waitlist. You're now among the first to discover 
                a smarter way to explore, organize, and understand perfume through AI.
              </p>
              
              <!-- What's Next Section -->
              <div style="background:linear-gradient(135deg, #FF2E92 0%, #F7B731 100%); border-radius:12px; padding:24px; margin:20px 0;">
                <h3 style="color:#FFFFFF; font-size:20px; margin:0 0 16px; font-weight:600;">What's Next?</h3>
                <ul style="color:#FFFFFF; font-size:14px; line-height:1.8; margin:0; padding-left:20px;">
                  <li>We'll notify you when early access opens</li>
                  <li>You'll get exclusive first look at new features</li>
                  <li>Join a community of fragrance lovers</li>
                </ul>
              </div>
              
              <p style="color:#B0C4DE; font-size:14px; line-height:1.6; margin:20px 0 0;">
                Have questions? Reply to this email anytime.
              </p>
              
              <p style="color:#B0C4DE; font-size:14px; margin:20px 0 0;">
                Best regards,<br>
                <strong style="color:#F7B731;">The ScentGenAI Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px; border-top:1px solid rgba(247, 183, 49, 0.2); text-align:center;">
              <p style="color:#B0C4DE; font-size:12px; margin:0;">
                © 2025 ScentGenAI. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Plain text fallback
    const textContent = `
Welcome to ScentGenAI Early Access!

Thank you for joining our waitlist. You're now among the first to discover a smarter way to explore, organize, and understand perfume through AI.

What's Next?
→ We'll notify you when early access opens
→ You'll get exclusive first look at new features
→ Join a community of fragrance lovers

Have questions? Reply to this email anytime.

Best regards,
The ScentGenAI Team

© 2025 ScentGenAI. All rights reserved.
`;

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
        subject: 'Welcome to ScentGenAI Early Access! 🎉',
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
    console.error('Error sending welcome email:', error);

    // Update waitlist entry to failed if ID provided
    if (error.waitlistId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabase
          .from('waitlist')
          .update({ welcome_email_status: 'failed' })
          .eq('id', error.waitlistId);
      } catch (updateError) {
        console.error('Failed to update waitlist status:', updateError);
      }
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
