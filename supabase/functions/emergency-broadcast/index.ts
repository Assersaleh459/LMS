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
    const body: { school_id: string; message_ar: string } = await req.json()
    if (!body.school_id || !body.message_ar?.trim()) {
      return new Response(JSON.stringify({ error: 'school_id and message_ar required' }), { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Fetch all parent accounts in this school that have a WhatsApp number
    const { data: parents } = await supabase
      .from('users')
      .select('id, whatsapp_phone, first_name_ar')
      .eq('school_id', body.school_id)
      .eq('role', 'parent')
      .not('whatsapp_phone', 'is', null)

    if (!parents?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    let sent = 0
    for (const parent of parents) {
      if (!parent.whatsapp_phone) continue

      if (WHATSAPP_API_URL && WHATSAPP_TOKEN) {
        await fetch(WHATSAPP_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to:                parent.whatsapp_phone.replace('+', ''),
            type:              'text',
            text:              { body: body.message_ar },
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
