-- Create email_logs table for tracking all emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  template_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all email logs
CREATE POLICY "Admins can view email logs"
  ON public.email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Service role can insert logs
CREATE POLICY "Service role can insert logs"
  ON public.email_logs
  FOR INSERT
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);

-- Insert default email templates if they don't exist
INSERT INTO public.email_templates (template_key, name, subject, description, html_content, text_content, variables, is_active)
VALUES 
  (
    'welcome',
    'Welcome to Waitlist',
    'Welcome to ScentGenAI Early Access! 🎉',
    'Email sent when user joins the waitlist',
    '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Inter, -apple-system, sans-serif; background: #0E2A47; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #1C3B63; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { color: #F7B731; font-size: 32px; font-weight: bold; margin-bottom: 10px; }
    .title { color: #FFFFFF; font-size: 28px; font-weight: bold; margin: 20px 0; }
    .content { color: #B0C4DE; line-height: 1.6; margin: 20px 0; }
    .button { display: inline-block; background: linear-gradient(to right, #FF2E92, #F7B731); color: white; padding: 14px 32px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
    .footer { text-align: center; color: #B0C4DE; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #FF2E92; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ScentGenAI</div>
      <div class="title">You''re on the List! 🎉</div>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>Welcome to <strong>ScentGenAI Early Access</strong>! You''re among the first to explore your personal scent universe powered by AI.</p>
      <p>We''re preparing an exclusive experience that combines:</p>
      <ul>
        <li>🌸 <strong>Personal Collection Management</strong> - Track every fragrance you own</li>
        <li>🤖 <strong>AI-Powered Recommendations</strong> - Discover scents tailored to your taste</li>
        <li>💬 <strong>Intelligent Chat Assistant</strong> - Ask anything about perfumes</li>
        <li>📊 <strong>Deep Fragrance Insights</strong> - Understand notes, accords, and more</li>
      </ul>
      <p>We''ll notify you as soon as early access opens. Get ready to experience fragrance like never before!</p>
      <p style="margin-top: 30px;">Stay tuned,<br><strong>The ScentGenAI Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 ScentGenAI. Your Personal Scent AIssistant.</p>
      <p>You received this email because you signed up for early access at scentgenai.app</p>
    </div>
  </div>
</body>
</html>',
    'Welcome to ScentGenAI Early Access!

Hi there,

You''re on the waitlist for ScentGenAI - your personal scent AIssistant powered by AI.

We''re preparing an exclusive experience that combines:
- Personal Collection Management
- AI-Powered Recommendations  
- Intelligent Chat Assistant
- Deep Fragrance Insights

We''ll notify you when early access opens!

Stay tuned,
The ScentGenAI Team

---
© 2025 ScentGenAI
You received this email because you signed up at scentgenai.app',
    '["email"]'::jsonb,
    true
  ),
  (
    'user_welcome',
    'Welcome New User',
    'Welcome to ScentGenAI! Let''s Get Started 🌸',
    'Email sent when user creates an account',
    '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Inter, -apple-system, sans-serif; background: #0E2A47; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #1C3B63; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { color: #F7B731; font-size: 32px; font-weight: bold; margin-bottom: 10px; }
    .title { color: #FFFFFF; font-size: 28px; font-weight: bold; margin: 20px 0; }
    .content { color: #B0C4DE; line-height: 1.6; margin: 20px 0; }
    .button { display: inline-block; background: linear-gradient(to right, #FF2E92, #F7B731); color: white; padding: 14px 32px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: 600; }
    .feature-box { background: #0E2A47; padding: 15px; border-radius: 12px; margin: 15px 0; border-left: 3px solid #FF2E92; }
    .footer { text-align: center; color: #B0C4DE; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #FF2E92; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ScentGenAI</div>
      <div class="title">Welcome to Your Scent Journey! ✨</div>
    </div>
    <div class="content">
      <p>Hi <strong>{{username}}</strong>,</p>
      <p>Your account is ready! You now have access to your personal AI-powered fragrance assistant.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{app_url}}/dashboard" class="button">Go to Dashboard</a>
      </div>

      <p><strong>Here''s what you can do now:</strong></p>
      
      <div class="feature-box">
        <strong>🌸 Build Your Collection</strong><br>
        Add perfumes you own or wish to buy. Track everything in one place.
      </div>
      
      <div class="feature-box">
        <strong>💬 Chat with AI</strong><br>
        Ask about notes, brands, recommendations - your AI assistant knows fragrances.
      </div>
      
      <div class="feature-box">
        <strong>🔍 Discover New Scents</strong><br>
        Get personalized recommendations based on what you love.
      </div>

      <p style="margin-top: 30px;">Need help? Just reply to this email or visit our support page.</p>
      
      <p>Happy scent hunting!<br><strong>The ScentGenAI Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 ScentGenAI. Your Personal Scent AIssistant.</p>
      <p><a href="{{app_url}}/profile" style="color: #FF2E92;">Manage Your Profile</a></p>
    </div>
  </div>
</body>
</html>',
    'Welcome to ScentGenAI!

Hi {{username}},

Your account is ready! You now have access to your personal AI-powered fragrance assistant.

Visit your dashboard: {{app_url}}/dashboard

Here''s what you can do now:
- Build Your Collection: Add perfumes you own or wish to buy
- Chat with AI: Ask about notes, brands, recommendations
- Discover New Scents: Get personalized recommendations

Need help? Just reply to this email.

Happy scent hunting!
The ScentGenAI Team

---
© 2025 ScentGenAI
Manage your profile: {{app_url}}/profile',
    '["email", "username", "app_url"]'::jsonb,
    true
  ),
  (
    'password_reset',
    'Password Reset Request',
    'Reset Your ScentGenAI Password 🔐',
    'Email sent when user requests password reset',
    '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Inter, -apple-system, sans-serif; background: #0E2A47; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #1C3B63; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { color: #F7B731; font-size: 32px; font-weight: bold; margin-bottom: 10px; }
    .title { color: #FFFFFF; font-size: 28px; font-weight: bold; margin: 20px 0; }
    .content { color: #B0C4DE; line-height: 1.6; margin: 20px 0; }
    .button { display: inline-block; background: linear-gradient(to right, #FF2E92, #F7B731); color: white; padding: 14px 32px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: 600; }
    .alert { background: #FF2E92; color: white; padding: 15px; border-radius: 12px; margin: 20px 0; }
    .footer { text-align: center; color: #B0C4DE; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #FF2E92; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ScentGenAI</div>
      <div class="title">Reset Your Password 🔐</div>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>We received a request to reset your password for your ScentGenAI account.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{reset_url}}" class="button">Reset Password</a>
      </div>

      <div class="alert">
        ⚠️ This link expires in 1 hour for security.
      </div>

      <p>If you didn''t request this, you can safely ignore this email. Your password will not be changed.</p>
      
      <p style="margin-top: 30px;">Stay secure,<br><strong>The ScentGenAI Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 ScentGenAI. Your Personal Scent AIssistant.</p>
      <p>If you''re having trouble with the button, copy and paste this URL:<br>{{reset_url}}</p>
    </div>
  </div>
</body>
</html>',
    'Reset Your ScentGenAI Password

Hi there,

We received a request to reset your password.

Reset your password here: {{reset_url}}

⚠️ This link expires in 1 hour.

If you didn''t request this, ignore this email.

Stay secure,
The ScentGenAI Team

---
© 2025 ScentGenAI
Link: {{reset_url}}',
    '["email", "reset_url"]'::jsonb,
    true
  ),
  (
    'admin_new_user',
    'Admin: New User Registration',
    '🆕 New User Registered: {{username}}',
    'Internal notification when new user signs up',
    '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: monospace; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border: 2px solid #FF2E92; }
    h1 { color: #0E2A47; }
    .info { background: #f0f0f0; padding: 10px; margin: 10px 0; border-left: 4px solid #F7B731; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🆕 New User Registration</h1>
    <div class="info">
      <strong>Email:</strong> {{email}}<br>
      <strong>Username:</strong> {{username}}<br>
      <strong>Registered:</strong> {{timestamp}}<br>
      <strong>User ID:</strong> {{user_id}}
    </div>
    <p>A new user has joined ScentGenAI!</p>
  </div>
</body>
</html>',
    'NEW USER REGISTRATION

Email: {{email}}
Username: {{username}}
Registered: {{timestamp}}
User ID: {{user_id}}

A new user has joined ScentGenAI!',
    '["email", "username", "timestamp", "user_id"]'::jsonb,
    true
  )
ON CONFLICT (template_key) DO NOTHING;