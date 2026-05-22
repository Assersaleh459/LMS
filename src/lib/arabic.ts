import type { AttendanceStatus, GradeType } from '../types/enums'

// Format date in Arabic Egyptian locale
export function formatDateAr(date: Date): string {
  return date.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })
}

// Format date short (e.g. "٩ مايو")
export function formatDateShortAr(date: Date): string {
  return date.toLocaleDateString('ar-EG', {
    month: 'long',
    day:   'numeric',
  })
}

// Convert Western digits to Arabic-Indic numerals (for young students)
export function toArabicNumerals(n: number): string {
  return n.toString().replace(/[0-9]/g, d =>
    '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]
  )
}

// MoE attendance status labels (Arabic)
export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present:          'حاضر',
  absent:           'غائب',
  late:             'متأخر',
  excused:          'غياب بعذر',
  early_departure:  'انصراف مبكر',
}

// MoE grade type labels (Arabic) — note: شفهي (not شفوي)
export const GRADE_TYPE_LABELS: Record<GradeType, string> = {
  written:   'تحريري',
  oral:      'شفهي',
  practical: 'عملي',
  activity:  'نشاط',
  exam:      'امتحان',
  monthly:   'شهري',
  final:     'نهائي',
}

// Egyptian colloquial error messages
export const ERROR_MESSAGES = {
  noInternet:  'ماعدنيش إنترنت — محفوظ الشغل وبعتهولك الإنترنت يرجع',
  sessionExp:  'انتهت الجلسة — اضغط هنا لتسجيل الدخول من جديد',
  saveSuccess: 'تم الحفظ ✓',
  saveFailed:  'حصل مشكلة — حاول تاني',
  loading:     'جاري التحميل...',
  offline:     'أنت غير متصل — البيانات محفوظة محلياً',
}

// Format "last updated X minutes ago" for offline banner
export function formatLastUpdated(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1)  return 'آخر تحديث منذ لحظات'
  if (diffMins < 60) return `آخر تحديث منذ ${toArabicNumerals(diffMins)} دقيقة`
  const diffHours = Math.floor(diffMins / 60)
  return `آخر تحديث منذ ${toArabicNumerals(diffHours)} ساعة`
}
