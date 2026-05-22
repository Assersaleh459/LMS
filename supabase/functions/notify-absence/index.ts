import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL') ?? ''
const WHATSAPP_TOKEN   = Deno.env.get('WHATSAPP_TOKEN') ?? ''
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body: { absent_student_ids: string[]; date: string } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Fetch absent students with parent WhatsApp numbers
    const { data: students } = await supabase
      .from('v_student_card')
      .select('full_name_ar, parent_whatsapp, parent_name_ar, school_name_ar, grade_year, section')
      .in('id', body.absent_student_ids)

    if (!students?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    let sent = 0
    for (const student of students) {
      if (!student.parent_whatsapp) continue

      const message = `مدرسة ${student.school_name_ar}\n` +
        `السيد/السيدة ${student.parent_name_ar} المحترم/ة\n\n` +
        `نُحيطكم علماً بغياب ابنكم/ابنتكم ${student.full_name_ar} ` +
        `(الصف ${student.grade_year} ${student.section}) اليوم ${body.date}.\n\n` +
        `لأي استفسار يُرجى التواصل مع إدارة المدرسة.`

      // Call WhatsApp Business API
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

      // Mark as notified in DB
      await supabase
        .from('attendance_records')
        .update({ parent_notified: true, notified_at: new Date().toISOString() })
        .eq('student_id', body.absent_student_ids[students.indexOf(student)])
        .eq('attendance_date', body.date)

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
