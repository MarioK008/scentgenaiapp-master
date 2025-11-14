import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insert into waitlist
    const { data, error } = await supabase
      .from('waitlist')
      .insert({ 
        email: email.toLowerCase().trim(),
        metadata: {
          source: 'landing_page',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate email error
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ 
            error: 'This email is already on the waitlist',
            message: 'You\'re already registered! We\'ll notify you when we launch.' 
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to join waitlist' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('New waitlist signup:', email);

    // Send welcome email in background (non-blocking)
    const waitlistId = data?.id;
    if (waitlistId) {
      // Fire and forget - don't block the response
      supabase.functions.invoke('send-welcome-email', {
        body: { email, waitlistId }
      }).then(({ error: emailError }) => {
        if (emailError) {
          console.error('Failed to send welcome email:', emailError);
        } else {
          console.log('Welcome email sent successfully to:', email);
        }
      }).catch(err => {
        console.error('Error invoking send-welcome-email:', err);
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully joined the waitlist!',
        data 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
