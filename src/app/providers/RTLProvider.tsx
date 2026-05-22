import { useEffect, type ReactNode } from 'react'

export function RTLProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'rtl')
    document.documentElement.setAttribute('lang', 'ar')
  }, [])

  return <>{children}</>
}
