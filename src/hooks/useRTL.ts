import { useEffect } from 'react'

export function useRTL(): void {
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'rtl')
    document.documentElement.setAttribute('lang', 'ar')
  }, [])
}
