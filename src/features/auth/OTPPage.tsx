import { Navigate } from 'react-router-dom'

// OTP login removed — app now uses email + password
export function OTPPage() {
  return <Navigate to="/login" replace />
}

OTPPage.displayName = 'OTPPage'
