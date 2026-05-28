import { useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from '../app/providers/AuthProvider'

export function useUnreadCount() {
  const auth = useContext(AuthContext)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const userId = auth?.profile?.id
    if (!userId) return

    // Initial fetch
    ;(supabase as any)
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .then(({ count: c }: { count: number | null }) => setCount(c ?? 0))

    // Real-time subscription — fires on every insert/update to notifications
    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => {
          // Re-fetch count on any change
          ;(supabase as any)
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false)
            .then(({ count: c }: { count: number | null }) => setCount(c ?? 0))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [auth?.profile?.id])

  return count
}
