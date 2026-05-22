import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL') ?? ''
const WHATSAPP_TOKEN   = Deno.env.get('WHATSAPP_TOKEN') ?? ''
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const { student_id, subject_id }: { student_id: string; subject_id: string } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const [studentRes, subjectRes, latestGradeRes] = await Promise.all([
      supabase.from('v_student_card').select('full_name_ar, parent_whatsapp').eq('id', student_id).single(),
      supabase.from('subjects').select('name_ar').eq('id', subject_id).single(),
      supabase.from('grade_entries').select('total_grade, grade_type')
        .eq('student_id', student_id).eq('subject_id', subject_id)
        .order('created_at', { ascending: false }).limit(1).single(),
    ])

    const student    = studentRes.data
    const subject    = subjectRes.data
    const gradeEntry = latestGradeRes.data

    if (!student?.parent_whatsapp || !subject || !gradeEntry) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    const message =
      `📊 درجة جديدة — ${subject.name_ar}\n` +
      `الطالب: ${student.full_name_ar}\n` +
      `الدرجة: ${gradeEntry.total_grade}`

    if (WHATSAPP_API_URL && WHATSAPP_TOKEN) {
      await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: student.parent_whatsapp.replace('+', ''),
          type: 'text',
          text: { body: message },
        }),
      })
    }

    return new Response(JSON.stringify({ sent: 1 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
