// FIX: Added the official Supabase edge-runtime type definitions to resolve Deno global type errors.
/// <reference types="npm:@supabase/functions-js/src/edge-runtime.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'onboarding@resend.dev';


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
        throw new Error("Resend API key is not configured in Edge Function secrets.");
    }

    const { recipients, subject, message } = await req.json()

    if (!recipients || !subject || !message || recipients.length === 0) {
      throw new Error("Missing required fields: recipients, subject, message")
    }

    // Using Resend API to send emails
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: `AECC <${EMAIL_FROM}>`,
            to: recipients,
            subject: subject,
            // Basic HTML formatting for the message body
            html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        }),
    });

    const data = await res.json();
    if (!res.ok) {
        // Forward error from email provider
        throw new Error(data.message || 'Failed to send email');
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
