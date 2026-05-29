import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

  try {
    // Verify caller is an admin or IT
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    const { data: { user: caller }, error: jwtErr } = await supabase.auth.getUser(jwt)
    if (jwtErr || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })
    }

    const { data: callerProfile } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', caller.id)
      .single()

    // Only school_admin and it_admin can reset passwords
    const RESET_ROLES = ['school_admin', 'it_admin']
    if (!callerProfile || !RESET_ROLES.includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin or IT only' }), { status: 403, headers: CORS })
    }

    const body: { user_id: string; password: string } = await req.json()
    if (!body.user_id || !body.password || body.password.length < 8) {
      return new Response(JSON.stringify({ error: 'user_id and password (min 8 chars) required' }), { status: 400, headers: CORS })
    }

    // Confirm target user belongs to the same school
    const { data: target } = await supabase
      .from('users')
      .select('school_id, first_name_ar, last_name_ar')
      .eq('id', body.user_id)
      .single()

    if (!target || target.school_id !== callerProfile.school_id) {
      return new Response(JSON.stringify({ error: 'User not found in your school' }), { status: 404, headers: CORS })
    }

    // Reset the password via Admin API
    const { error: updErr } = await supabase.auth.admin.updateUserById(body.user_id, {
      password: body.password,
    })

    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), { status: 500, headers: CORS })
    }

    // Log to system audit
    await supabase.from('system_audit_log').insert({
      school_id:   callerProfile.school_id,
      actor_id:    caller.id,
      actor_role:  callerProfile.role,
      action:      'UPDATE',
      entity_type: 'user',
      entity_id:   body.user_id,
      entity_desc: `${target.first_name_ar} ${target.last_name_ar}`,
      details:     { password_reset: true },
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS })
  }
})
