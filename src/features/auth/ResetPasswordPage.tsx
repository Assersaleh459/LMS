import { useNavigate } from 'react-router-dom'
import { useLang } from '../../app/providers/LangProvider'

export function ResetPasswordPage() {
  const { fa } = useLang()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-8">
        <svg className="w-9 h-9 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h1 className={`text-white text-xl font-bold ${fa} mb-3`}>تغيير كلمة المرور غير متاح</h1>
      <p className={`text-white/60 text-sm ${fa} max-w-xs leading-relaxed`}>
        لا يمكن تغيير كلمة المرور بشكل مستقل. تواصل مع مدير المدرسة أو مسؤول IT لإعادة تعيين كلمة مرورك.
      </p>
      <button
        onClick={() => navigate('/login')}
        className={`mt-8 px-6 py-3 rounded-xl bg-teal text-white font-bold ${fa} text-sm`}
      >
        العودة لتسجيل الدخول
      </button>
    </div>
  )
}

ResetPasswordPage.displayName = 'ResetPasswordPage'
