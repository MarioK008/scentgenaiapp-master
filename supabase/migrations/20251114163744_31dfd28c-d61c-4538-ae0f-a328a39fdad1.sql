-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage templates
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read active templates (for edge functions)
CREATE POLICY "Service role can read templates"
ON public.email_templates
FOR SELECT
USING (is_active = true);

-- Add updated_at trigger
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert default templates
INSERT INTO public.email_templates (template_key, name, description, subject, html_content, text_content, variables) VALUES
(
  'welcome',
  'Welcome Email',
  'Sent when a user joins the waitlist',
  'Welcome to ScentGenAI Early Access! 🎉',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#0E2A47; font-family:''Inter'',-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0E2A47;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#1C3B63; border-radius:24px; max-width:600px;">
          <tr>
            <td align="center" style="padding:40px 40px 20px;">
              <h1 style="color:#F7B731; font-family:''Playfair Display'',serif; font-size:36px; margin:0;">ScentGenAI</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 40px;">
              <h2 style="color:#FFFFFF; font-size:28px; margin:0 0 20px; text-align:center; font-weight:600;">
                Welcome to ScentGenAI!
              </h2>
              <p style="color:#B0C4DE; font-size:16px; line-height:1.6; margin:0 0 20px;">
                Thank you for joining our early access waitlist. You''re now among the first to discover 
                a smarter way to explore, organize, and understand perfume through AI.
              </p>
              <div style="background:linear-gradient(135deg, #FF2E92 0%, #F7B731 100%); border-radius:12px; padding:24px; margin:20px 0;">
                <h3 style="color:#FFFFFF; font-size:20px; margin:0 0 16px; font-weight:600;">What''s Next?</h3>
                <ul style="color:#FFFFFF; font-size:14px; line-height:1.8; margin:0; padding-left:20px;">
                  <li>We''ll notify you when early access opens</li>
                  <li>You''ll get exclusive first look at new features</li>
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
</html>',
  'Welcome to ScentGenAI Early Access!

Thank you for joining our waitlist. You''re now among the first to discover a smarter way to explore, organize, and understand perfume through AI.

What''s Next?
→ We''ll notify you when early access opens
→ You''ll get exclusive first look at new features
→ Join a community of fragrance lovers

Have questions? Reply to this email anytime.

Best regards,
The ScentGenAI Team

© 2025 ScentGenAI. All rights reserved.',
  '["email"]'::jsonb
),
(
  'launch_notification',
  'Launch Notification',
  'Sent when the platform launches to waitlist users',
  '🚀 ScentGenAI is Live - Your Early Access is Ready!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#0E2A47; font-family:''Inter'',-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0E2A47;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#1C3B63; border-radius:24px; max-width:600px;">
          <tr>
            <td align="center" style="padding:40px 40px 20px;">
              <h1 style="color:#F7B731; font-family:''Playfair Display'',serif; font-size:36px; margin:0;">ScentGenAI</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 40px;">
              <h2 style="color:#FFFFFF; font-size:28px; margin:0 0 20px; text-align:center; font-weight:600;">
                🚀 We''re Live!
              </h2>
              <p style="color:#B0C4DE; font-size:16px; line-height:1.6; margin:0 0 20px;">
                The wait is over! ScentGenAI is now live and your early access account is ready.
              </p>
              <div style="text-align:center; margin:30px 0;">
                <a href="{{loginUrl}}" style="display:inline-block; background:linear-gradient(135deg, #FF2E92 0%, #F7B731 100%); color:#FFFFFF; text-decoration:none; padding:16px 40px; border-radius:28px; font-weight:600; font-size:16px;">
                  Access Your Account
                </a>
              </div>
              <div style="background:#1C3B63; border-left:4px solid #F7B731; padding:20px; margin:20px 0; border-radius:8px;">
                <h3 style="color:#F7B731; font-size:18px; margin:0 0 12px;">What You Can Do Now:</h3>
                <ul style="color:#B0C4DE; font-size:14px; line-height:1.8; margin:0; padding-left:20px;">
                  <li>Build and organize your personal perfume collection</li>
                  <li>Get AI-powered fragrance recommendations</li>
                  <li>Chat with your personal scent assistant</li>
                  <li>Discover new fragrances based on your preferences</li>
                </ul>
              </div>
              <p style="color:#B0C4DE; font-size:14px; margin:20px 0 0;">
                Welcome to your personal scent universe,<br>
                <strong style="color:#F7B731;">The ScentGenAI Team</strong>
              </p>
            </td>
          </tr>
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
</html>',
  '🚀 ScentGenAI is Live - Your Early Access is Ready!

The wait is over! ScentGenAI is now live and your early access account is ready.

Access your account here: {{loginUrl}}

What You Can Do Now:
→ Build and organize your personal perfume collection
→ Get AI-powered fragrance recommendations
→ Chat with your personal scent assistant
→ Discover new fragrances based on your preferences

Welcome to your personal scent universe,
The ScentGenAI Team

© 2025 ScentGenAI. All rights reserved.',
  '["email", "loginUrl"]'::jsonb
),
(
  'feature_update',
  'Feature Update',
  'Sent when announcing new features or updates',
  '✨ New Features in ScentGenAI',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#0E2A47; font-family:''Inter'',-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0E2A47;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#1C3B63; border-radius:24px; max-width:600px;">
          <tr>
            <td align="center" style="padding:40px 40px 20px;">
              <h1 style="color:#F7B731; font-family:''Playfair Display'',serif; font-size:36px; margin:0;">ScentGenAI</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 40px;">
              <h2 style="color:#FFFFFF; font-size:28px; margin:0 0 20px; text-align:center; font-weight:600;">
                ✨ What''s New
              </h2>
              <p style="color:#B0C4DE; font-size:16px; line-height:1.6; margin:0 0 20px;">
                We''ve been working hard to make ScentGenAI even better. Here''s what''s new:
              </p>
              <div style="background:linear-gradient(135deg, #FF2E92 0%, #F7B731 100%); border-radius:12px; padding:24px; margin:20px 0;">
                <h3 style="color:#FFFFFF; font-size:20px; margin:0 0 16px; font-weight:600;">{{featureTitle}}</h3>
                <p style="color:#FFFFFF; font-size:14px; line-height:1.8; margin:0;">
                  {{featureDescription}}
                </p>
              </div>
              <div style="text-align:center; margin:30px 0;">
                <a href="{{ctaUrl}}" style="display:inline-block; background:rgba(255,255,255,0.1); color:#FFFFFF; text-decoration:none; padding:14px 32px; border-radius:28px; font-weight:600; font-size:14px; border:1px solid rgba(247,183,49,0.3);">
                  Try It Now
                </a>
              </div>
              <p style="color:#B0C4DE; font-size:14px; margin:20px 0 0;">
                Happy exploring,<br>
                <strong style="color:#F7B731;">The ScentGenAI Team</strong>
              </p>
            </td>
          </tr>
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
</html>',
  '✨ What''s New in ScentGenAI

We''ve been working hard to make ScentGenAI even better. Here''s what''s new:

{{featureTitle}}
{{featureDescription}}

Try it now: {{ctaUrl}}

Happy exploring,
The ScentGenAI Team

© 2025 ScentGenAI. All rights reserved.',
  '["email", "featureTitle", "featureDescription", "ctaUrl"]'::jsonb
);

-- Add comment
COMMENT ON TABLE public.email_templates IS 'Stores email templates for various notification types';