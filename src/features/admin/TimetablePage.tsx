import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { useSchool } from '../../app/providers/SchoolProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

const DAYS = [0, 1, 2, 3, 4] // Sun–Thu (Egyptian school week)
const DAY_KEYS = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu']
const MAX_PERIODS = 8

interface Subject { id: string; name_ar: string }
interface Teacher { id: string; full_name_ar: string }
interface Slot {
  id?: string
  day_of_week: number
  period_num: number
  subject_id: string | null
  teacher_id: string | null
  start_time: string | null
  end_time: string | null
}

type SlotMap = Record<string, Slot> // key = `${day}-${period}`

interface ClassOption { grade: number; section: string }

export function TimetablePage() {
  const auth     = useContext(AuthContext)
  const { t, fa } = useLang()
  const { school } = useSchool()
  const navigate = useNavigate()

  const isAdmin = auth?.role === 'school_admin' || auth?.role === 'chain_admin' || auth?.role === 'it_admin'

  const [classes,   setClasses]   = useState<ClassOption[]>([])
  const [subjects,  setSubjects]  = useState<Subject[]>([])
  const [teachers,  setTeachers]  = useState<Teacher[]>([])
  const [slots,     setSlots]     = useState<SlotMap>({})
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [editOpen,  setEditOpen]  = useState(false)
  const [editSlot,  setEditSlot]  = useState<{ day: number; period: number } | null>(null)

  const [selGrade,   setSelGrade]   = useState<number | null>(null)
  const [selSection, setSelSection] = useState<string | null>(null)

  useEffect(() => {
    if (!auth?.schoolId) return
    Promise.all([
      supabase.from('v_student_card').select('grade_year, section').eq('school_id', auth.schoolId),
      supabase.from('subjects').select('id, name_ar').eq('school_id', auth.schoolId),
      (supabase as any).from('users').select('id, full_name_ar').eq('school_id', auth.schoolId)
        .in('role', ['subject_teacher', 'homeroom_teacher']),
    ]).then(([classRes, subRes, teachRes]) => {
      if (classRes.data) {
        const map: Record<string, ClassOption> = {}
        for (const r of classRes.data) {
          if (r.grade_year === null || r.section === null) continue
          const key = `${r.grade_year}:${r.section}`
          if (!map[key]) map[key] = { grade: r.grade_year as number, section: r.section as string }
        }
        const list = Object.values(map)
          .filter((c): c is ClassOption => c.grade !== null && c.section !== null)
          .sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section))
        setClasses(list)
        if (list.length > 0) { setSelGrade(list[0].grade); setSelSection(list[0].section) }
      }
      if (subRes.data) setSubjects(subRes.data as Subject[])
      if (teachRes.data) setTeachers(teachRes.data as Teacher[])
      setLoading(false)
    })
  }, [auth?.schoolId])

  useEffect(() => {
    if (!auth?.schoolId || selGrade === null || !selSection) return
    setLoading(true);
    (supabase as any).from('timetable_slots')
      .select('*')
      .eq('school_id', auth.schoolId)
      .eq('grade_year', selGrade)
      .eq('section', selSection)
      .then(({ data }: { data: (Slot & { id: string })[] | null }) => {
        const map: SlotMap = {}
        if (data) {
          for (const s of data) map[`${s.day_of_week}-${s.period_num}`] = s
        }
        setSlots(map)
        setLoading(false)
      })
  }, [auth?.schoolId, selGrade, selSection])

  function openEdit(day: number, period: number) {
    if (!isAdmin) return
    setEditSlot({ day, period })
    setEditOpen(true)
  }

  function getSlot(day: number, period: number): Slot {
    return slots[`${day}-${period}`] ?? { day_of_week: day, period_num: period, subject_id: null, teacher_id: null, start_time: null, end_time: null }
  }

  function updateDraft(day: number, period: number, patch: Partial<Slot>) {
    const key = `${day}-${period}`
    setSlots(prev => ({ ...prev, [key]: { ...getSlot(day, period), ...prev[key], ...patch } }))
  }

  async function saveAll() {
    if (!auth?.schoolId || selGrade === null || !selSection) return
    setSaving(true)
    const rows = Object.values(slots).map(s => ({
      ...s,
      school_id: auth.schoolId,
      grade_year: selGrade,
      section: selSection,
    }))
    await (supabase as any).from('timetable_slots').upsert(rows, {
      onConflict: 'school_id,grade_year,section,day_of_week,period_num',
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const currentSlot = editSlot ? getSlot(editSlot.day, editSlot.period) : null

  return (
    <PageWrapper>
      <AppBar
        title={t('timetable')}
        subtitle={school?.name_ar ?? ''}
        onBack={() => navigate(-1)}
      />

      {/* Class selector */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <select
          value={selGrade !== null && selSection ? `${selGrade}:${selSection}` : ''}
          onChange={e => {
            const [g, s] = e.target.value.split(':')
            setSelGrade(Number(g))
            setSelSection(s)
          }}
          className={`w-full px-3 py-2 rounded-xl border border-gray-200 text-sm ${fa} bg-white focus:outline-none focus:ring-2 focus:ring-teal-400`}
        >
          {classes.map(c => (
            <option key={`${c.grade}:${c.section}`} value={`${c.grade}:${c.section}`}>
              {t('grade_label')} {c.grade} — {c.section}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-28">
          {/* Day headers */}
          <div className="min-w-[600px]">
            <div className="grid grid-cols-6 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
              <div className="py-2 px-2 text-xs text-gray-400 font-bold text-center">{t('timetable_period')}</div>
              {DAYS.map((d, i) => (
                <div key={d} className="py-2 px-1 text-xs font-bold text-gray-700 text-center">{t(DAY_KEYS[i])}</div>
              ))}
            </div>

            {/* Period rows */}
            {Array.from({ length: MAX_PERIODS }, (_, i) => i + 1).map(period => (
              <div key={period} className="grid grid-cols-6 border-b border-gray-50 min-h-[60px]">
                <div className="flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-50 border-r border-gray-100">
                  {period}
                </div>
                {DAYS.map(day => {
                  const slot = getSlot(day, period)
                  const subject = subjects.find(s => s.id === slot.subject_id)
                  const teacher = teachers.find(t => t.id === slot.teacher_id)
                  const isEmpty = !slot.subject_id

                  return (
                    <button
                      key={day}
                      onClick={() => openEdit(day, period)}
                      disabled={!isAdmin}
                      className={`p-1.5 text-right border-r border-gray-50 transition-colors ${
                        isEmpty
                          ? 'bg-white hover:bg-gray-50'
                          : 'bg-teal/5 hover:bg-teal/10'
                      } ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {subject ? (
                        <div className="space-y-0.5">
                          <p className={`text-xs font-bold text-teal leading-tight ${fa}`}>{subject.name_ar}</p>
                          {teacher && (
                            <p className={`text-[10px] text-gray-400 leading-tight ${fa}`}>{teacher.full_name_ar}</p>
                          )}
                          {slot.start_time && (
                            <p className="text-[10px] text-gray-300 leading-tight ltr">{slot.start_time}–{slot.end_time}</p>
                          )}
                        </div>
                      ) : (
                        isAdmin && <span className="text-gray-200 text-lg">+</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save button — admin only */}
      {isAdmin && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-gray-100">
          <button
            onClick={saveAll}
            disabled={saving}
            className={`w-full py-3.5 rounded-2xl font-bold text-white text-sm ${fa} transition-colors ${
              saved ? 'bg-green-500' : 'bg-teal hover:bg-teal/90'
            } disabled:opacity-50`}
          >
            {saved ? `✓ ${t('timetable_saved')}` : saving ? t('saving') : t('save')}
          </button>
        </div>
      )}

      {/* Edit slot bottom sheet */}
      {editOpen && editSlot && currentSlot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className={`font-bold text-gray-800 text-base ${fa}`}>
                {t(DAY_KEYS[DAYS.indexOf(editSlot.day)])} — {t('timetable_period')} {editSlot.period}
              </p>
              <button
                onClick={() => setEditOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl leading-none"
              >×</button>
            </div>

            {/* Subject */}
            <div>
              <label className={`block text-sm font-bold text-gray-600 mb-1 ${fa}`}>{t('timetable_subject')}</label>
              <select
                value={currentSlot.subject_id ?? ''}
                onChange={e => updateDraft(editSlot.day, editSlot.period, { subject_id: e.target.value || null })}
                className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm ${fa} focus:outline-none focus:ring-2 focus:ring-teal-400`}
              >
                <option value="">{t('no_teacher')}</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
              </select>
            </div>

            {/* Teacher */}
            <div>
              <label className={`block text-sm font-bold text-gray-600 mb-1 ${fa}`}>{t('timetable_teacher')}</label>
              <select
                value={currentSlot.teacher_id ?? ''}
                onChange={e => updateDraft(editSlot.day, editSlot.period, { teacher_id: e.target.value || null })}
                className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm ${fa} focus:outline-none focus:ring-2 focus:ring-teal-400`}
              >
                <option value="">{t('no_teacher')}</option>
                {teachers.map(tc => <option key={tc.id} value={tc.id}>{tc.full_name_ar}</option>)}
              </select>
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-bold text-gray-600 mb-1 ${fa}`}>{t('timetable_from')}</label>
                <input
                  type="time"
                  value={currentSlot.start_time ?? ''}
                  onChange={e => updateDraft(editSlot.day, editSlot.period, { start_time: e.target.value || null })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  dir="ltr"
                />
              </div>
              <div>
                <label className={`block text-sm font-bold text-gray-600 mb-1 ${fa}`}>{t('timetable_to')}</label>
                <input
                  type="time"
                  value={currentSlot.end_time ?? ''}
                  onChange={e => updateDraft(editSlot.day, editSlot.period, { end_time: e.target.value || null })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Clear button */}
            {currentSlot.subject_id && (
              <button
                onClick={() => {
                  updateDraft(editSlot.day, editSlot.period, { subject_id: null, teacher_id: null, start_time: null, end_time: null })
                  setEditOpen(false)
                }}
                className={`w-full py-3 rounded-xl border border-red-200 text-red-600 text-sm font-bold ${fa}`}
              >
                {t('delete')}
              </button>
            )}

            <button
              onClick={() => setEditOpen(false)}
              className={`w-full py-3.5 rounded-2xl bg-teal text-white font-bold text-sm ${fa}`}
            >
              {t('save')}
            </button>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

TimetablePage.displayName = 'TimetablePage'
