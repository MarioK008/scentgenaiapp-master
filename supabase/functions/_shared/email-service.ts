import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

interface SendEmailParams {
  to: string;
  templateKey: string;
  variables?: Record<string, string>;
}

interface EmailTemplate {
  subject: string;
  html_content: string;
  text_content: string;
}

/**
 * Unified email sending service using ForwardEmail API
 * Fetches templates from DB, replaces variables, and sends via ForwardEmail
 */
export async function sendEmail({ to, templateKey, variables = {} }: SendEmailParams): Promise<{
  success: boolean;
  error?: string;
  logId?: string;
}> {
  try {
    const apiToken = Deno.env.get('FORWARDEMAIL_API_KEY');
    if (!apiToken) {
      throw new Error('FORWARDEMAIL_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch template from database
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('subject, html_content, text_content')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Template fetch error:', templateError);
      throw new Error(`Template '${templateKey}' not found or inactive`);
    }

    // Replace variables in template
    const emailVariables = { email: to, ...variables };
    const subject = replaceVariables(template.subject, emailVariables);
    const htmlContent = replaceVariables(template.html_content, emailVariables);
    const textContent = replaceVariables(template.text_content, emailVariables);

    // Create email log entry
    const { data: logEntry, error: logError } = await supabase
      .from('email_logs')
      .insert({
        recipient_email: to,
        template_key: templateKey,
        subject: subject,
        status: 'pending',
        metadata: { variables: emailVariables }
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Failed to create email log:', logError);
    }

    const logId = logEntry?.id;

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
        to: to,
        subject: subject,
        text: textContent,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('ForwardEmail API error:', errorText);
      
      // Update log with failure
      if (logId) {
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            error_message: `API Error: ${emailResponse.status} - ${errorText}`
          })
          .eq('id', logId);
      }

      throw new Error(`Failed to send email: ${emailResponse.status}`);
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult);

    // Update log with success
    if (logId) {
      await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', logId);
    }

    return { success: true, logId };

  } catch (error: any) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Replace template variables like {{variable_name}}
 */
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}
