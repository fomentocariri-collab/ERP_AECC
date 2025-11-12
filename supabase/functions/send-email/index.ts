// FIX: Updated Supabase Edge Function type reference to use a stable URL from esm.sh, which correctly provides Deno's global types and resolves 'env' property errors.
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Estes valores devem ser configurados nos "Secrets" do seu projeto Supabase.
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'onboarding@resend.dev';


serve(async (req) => {
  // Trata a requisição pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
        throw new Error("A chave da API Resend (RESEND_API_KEY) não está configurada nos Segredos (Secrets) da Edge Function.");
    }

    const { recipients, subject, message } = await req.json()

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !subject || !message) {
      throw new Error("Campos obrigatórios ausentes: 'recipients' (deve ser um array), 'subject', e 'message'.")
    }

    // Usa a API do Resend para enviar os e-mails
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: `ERP AECC <${EMAIL_FROM}>`, // O remetente que aparecerá no e-mail
            to: recipients,
            subject: subject,
            // Formata a mensagem de texto simples para um HTML básico para manter as quebras de linha
            html: `<div style="font-family: sans-serif; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>`,
        }),
    });

    const data = await res.json();
    
    // Se a API do Resend retornar um erro, repassa a mensagem de erro.
    if (!res.ok) {
        console.error('Resend API Error:', data);
        throw new Error(data.message || 'Falha ao enviar o e-mail através do serviço.');
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