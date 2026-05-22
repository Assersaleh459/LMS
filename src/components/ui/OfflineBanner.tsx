import { useEffect, useState } from 'react'
import { formatLastUpdated } from '../../lib/arabic'

export function OfflineBanner() {
  const [isOnline,     setIsOnline]     = useState(navigator.onLine)
  const [lastUpdated,  setLastUpdated]  = useState(new Date())

  useEffect(() => {
    const goOnline  = () => { setIsOnline(true);  setLastUpdated(new Date()) }
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline) }
  }, [])

  if (isOnline) return null

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2">
      <svg className="w-4 h-4 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-yellow-800 text-xs font-arabic">
        غير متصل — {formatLastUpdated(lastUpdated)}
      </p>
    </div>
  )
}

OfflineBanner.displayName = 'OfflineBanner'
