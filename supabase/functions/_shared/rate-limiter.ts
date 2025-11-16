import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

/**
 * Check and enforce rate limiting for an endpoint
 * @param req - The request object to extract client IP
 * @param endpoint - The endpoint/function name
 * @param maxRequests - Maximum requests allowed in window
 * @param windowMinutes - Time window in minutes
 * @returns true if allowed, throws error if rate limited
 */
export async function checkRateLimit(
  req: Request,
  endpoint: string,
  maxRequests: number = 10,
  windowMinutes: number = 60
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client identifier (IP address or fallback)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip')
      || 'unknown';

    // Call the database function to check rate limit
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: clientIp,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request (fail open)
      return;
    }

    // If data is false, rate limit exceeded
    if (data === false) {
      throw new Error(`Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMinutes} minutes.`);
    }
  } catch (error) {
    // If it's our rate limit error, re-throw it
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      throw error;
    }
    // Otherwise log and continue (fail open)
    console.error('Rate limiter error:', error);
  }
}

