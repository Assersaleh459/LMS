import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function OTPPage() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const { loading, error, verifyOTP, sendOTP } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const phone: string = location.state?.phone ?? ''

  function handleDigit(index: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const updated = [...digits]
    updated[index] = value
    setDigits(updated)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const token = digits.join('')
    if (token.length < 6) return
    const ok = await verifyOTP(phone, token)
    if (ok) navigate('/')
  }

  async function handleResend() {
    await sendOTP(phone)
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-12">
      <div className="w-24 h-24 rounded-2xl bg-teal flex items-center justify-center mb-8">
        <span className="text-white text-4xl font-bold font-arabic">م</span>
      </div>

      <h1 className="text-white text-2xl font-bold font-arabic mb-2 text-center">
        أدخل كود التحقق
      </h1>
      <p className="text-white/60 text-sm font-arabic mb-1 text-center">
        تم إرسال كود مكون من 6 أرقام إلى
      </p>
      <p className="text-teal-light text-sm font-mono mb-10 text-center" dir="ltr">
        {phone}
      </p>

      <form onSubmit={handleVerify} className="w-full max-w-sm">
        {/* OTP digit inputs — LTR order */}
        <div className="flex gap-2 justify-center mb-6" dir="ltr">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 rounded-xl bg-white/10 border border-white/20 text-white text-center text-2xl font-bold focus:outline-none focus:border-teal-light focus:ring-2 focus:ring-teal-light/30 caret-teal-light"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm font-arabic text-center mb-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || digits.join('').length < 6}
          className="w-full py-4 rounded-xl bg-teal text-white font-bold font-arabic text-lg disabled:opacity-50 hover:bg-teal-light transition-colors"
        >
          {loading ? 'جاري التحقق...' : 'تأكيد'}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="w-full mt-4 py-3 text-white/60 font-arabic text-sm hover:text-white transition-colors"
        >
          لم يصلني الكود — أعد الإرسال
        </button>
      </form>
    </div>
  )
}

OTPPage.displayName = 'OTPPage'
