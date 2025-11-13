// FIX: The 'npm:' specifier in the type reference is not always resolved correctly by TypeScript tooling.
// Using a direct URL to the type definition file on a CDN is a more robust way to ensure the Deno runtime types are loaded.
// FIX: Switched to jsdelivr CDN to resolve Deno type definitions, as the unpkg URL was causing resolution failures.
/// <reference types="https://cdn.jsdelivr.net/npm/@supabase/functions-js/dist/edge-runtime.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Securely get secrets from the Supabase environment
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const EMAIL_FROM = Deno.env.get('EMAIL_FROM');
    const PROJECT_NAME = Deno.env.get('PROJECT_NAME'); 

    // Robust validation for all required secrets
    if (!RESEND_API_KEY) {
        throw new Error("Configuration incomplete: The RESEND_API_KEY secret was not found.");
    }
    if (!EMAIL_FROM) {
        throw new Error("Configuration incomplete: The EMAIL_FROM secret (sender's email) was not found.");
    }
    if (!PROJECT_NAME) {
        throw new Error("Configuration incomplete: The PROJECT_NAME secret (association's name) was not found.");
    }

    const { recipients, subject, message } = await req.json()

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !subject || !message) {
      throw new Error("Missing required fields: 'recipients' (must be an array), 'subject', and 'message'.")
    }

    // Use the Resend API to send emails
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: `${PROJECT_NAME} <${EMAIL_FROM}>`, 
            to: recipients,
            subject: subject,
            // Format plain text message into basic HTML to preserve line breaks
            html: `<div style="font-family: sans-serif; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>`,
        }),
    });

    const data = await res.json();
    
    if (!res.ok) {
        console.error('Resend API Error:', data);
        throw new Error(`Email service error: ${data.message || 'Failed to send email.'}`);
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in 'send-email' Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Use 400 for client/configuration errors
    })
  }
})