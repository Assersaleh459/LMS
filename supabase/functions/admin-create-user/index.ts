import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS })
  }

  try {
    // Verify caller is an admin
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

    const ADMIN_ROLES = ['school_admin', 'it_admin', 'chain_admin']
    if (!callerProfile || !ADMIN_ROLES.includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: CORS })
    }

    const body: {
      first_name_ar: string
      last_name_ar:  string
      role:          string
      phone?:        string
      email?:        string
      password?:     string
      grade_year?:   number
      section?:      string
      student_code?: string
    } = await req.json()

    if (!body.first_name_ar || !body.last_name_ar || !body.role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: CORS })
    }
    if (!body.email) {
      return new Response(JSON.stringify({ error: 'Email required' }), { status: 400, headers: CORS })
    }

    // Create Supabase Auth user. Default password if none supplied so account is usable.
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      phone:              body.phone,
      email:              body.email,
      password:           body.password && body.password.length >= 8 ? body.password : 'Madrasati@2025',
      phone_confirm:      true,
      email_confirm:      true,
    })

    if (authErr || !authUser?.user) {
      return new Response(JSON.stringify({ error: authErr?.message ?? 'Auth user creation failed' }), {
        status: 500, headers: CORS,
      })
    }

    const userId = authUser.user.id

    // Insert into users table
    const { error: dbErr } = await supabase.from('users').insert({
      id:           userId,
      school_id:    callerProfile.school_id,
      first_name_ar: body.first_name_ar.trim(),
      last_name_ar:  body.last_name_ar.trim(),
      role:          body.role,
      phone:         body.phone ?? null,
      email:         body.email ?? null,
      is_active:     true,
    })

    if (dbErr) {
      await supabase.auth.admin.deleteUser(userId)
      return new Response(JSON.stringify({ error: dbErr.message }), { status: 500, headers: CORS })
    }

    // Student profile if applicable
    const isStudent = body.role === 'kg_primary_student' || body.role === 'prep_secondary_student'
    if (isStudent) {
      const stage = (body.grade_year ?? 1) <= 2 ? 'kg'
        : (body.grade_year ?? 1) <= 6 ? 'primary'
        : (body.grade_year ?? 1) <= 9 ? 'prep' : 'secondary'

      await supabase.from('student_profiles').insert({
        user_id:        userId,
        student_code:   body.student_code ?? `STU-${userId.slice(0, 6).toUpperCase()}`,
        grade_year:     body.grade_year ?? 1,
        stage,
        section:        body.section ?? 'أ',
        enrollment_date: new Date().toISOString().split('T')[0],
      })
    }

    return new Response(JSON.stringify({ id: userId }), {
      status: 201,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS })
  }
})
