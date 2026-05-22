import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL') ?? ''
const WHATSAPP_TOKEN   = Deno.env.get('WHATSAPP_TOKEN') ?? ''
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const { assignment_id }: { assignment_id: string } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Get assignment details
    const { data: assignment } = await supabase
      .from('assignments')
      .select('title_ar, due_date, grade_year, section, max_grade, subjects(name_ar), schools(name_ar)')
      .eq('id', assignment_id)
      .single()

    if (!assignment) return new Response('Assignment not found', { status: 404 })

    // Get all parents of students in this class
    const { data: students } = await supabase
      .from('v_student_card')
      .select('parent_whatsapp, parent_name_ar')
      .eq('grade_year', assignment.grade_year)
      .eq('section', assignment.section)
      .not('parent_whatsapp', 'is', null)

    if (!students?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

    let sent = 0
    const seen = new Set<string>()

    for (const s of students) {
      if (!s.parent_whatsapp || seen.has(s.parent_whatsapp)) continue
      seen.add(s.parent_whatsapp)

      const subjectName = (assignment.subjects as unknown as { name_ar: string } | null)?.name_ar ?? ''
      const message =
        `📚 واجب جديد — ${subjectName}\n` +
        `${assignment.title_ar}\n` +
        `الدرجة: ${assignment.max_grade} | الاستحقاق: ${assignment.due_date}`

      if (WHATSAPP_API_URL && WHATSAPP_TOKEN) {
        await fetch(WHATSAPP_API_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: s.parent_whatsapp.replace('+', ''),
            type: 'text',
            text: { body: message },
          }),
        })
      }
      sent++
    }

    return new Response(JSON.stringify({ sent }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
