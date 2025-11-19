// Fix Deno types error
declare const Deno: any;

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const { email, password, name, role } = await req.json()

    if (!email || !password || !name || !role) {
      throw new Error("Missing required fields: email, password, name, role")
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    })

    if (authError) throw authError
    if (!user) throw new Error("User creation failed")

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        name: name,
        role: role,
        email: email,
        avatar_url: `https://i.pravatar.cc/150?u=${email}`
      })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      throw profileError
    }

    return new Response(JSON.stringify({ user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})