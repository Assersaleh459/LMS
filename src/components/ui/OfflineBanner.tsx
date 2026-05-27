import { useEffect, useState } from 'react'
import { offlineQueue } from '../../lib/offlineQueue'
import { useLang } from '../../app/providers/LangProvider'

export function OfflineBanner() {
  const { t, fa } = useLang()
  const [isOnline,  setIsOnline]  = useState(navigator.onLine)
  const [syncing,   setSyncing]   = useState(false)
  const [pending,   setPending]   = useState(() => offlineQueue.pendingCount)

  useEffect(() => {
    function handleOffline() { setIsOnline(false) }

    async function handleOnline() {
      setIsOnline(true)
      const count = offlineQueue.pendingCount
      if (count > 0) {
        setSyncing(true)
        await offlineQueue.flush().catch(console.warn)
        setSyncing(false)
      }
      setPending(offlineQueue.pendingCount)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online',  handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online',  handleOnline)
    }
  }, [])

  // Refresh pending count whenever it might change (after mark/save)
  useEffect(() => {
    const id = setInterval(() => setPending(offlineQueue.pendingCount), 2000)
    return () => clearInterval(id)
  }, [])

  if (syncing) {
    return (
      <div className="bg-teal/10 border-b border-teal/30 px-4 py-2 flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-full border-2 border-teal border-t-transparent animate-spin flex-shrink-0" />
        <p className={`text-teal text-xs ${fa}`}>{t('syncing')}</p>
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2">
        <svg className="w-4 h-4 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className={`text-yellow-800 text-xs ${fa}`}>
          {t('offline')}
          {pending > 0 && ` — ${pending} ${t('pending_sync')}`}
        </p>
      </div>
    )
  }

  if (pending > 0) {
    return (
      <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2">
        <svg className="w-4 h-4 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <p className={`text-orange-700 text-xs ${fa}`}>{pending} {t('pending_sync')}</p>
      </div>
    )
  }

  return null
}

OfflineBanner.displayName = 'OfflineBanner'
