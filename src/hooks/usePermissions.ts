import { useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from '../app/providers/AuthProvider'

const FULL_ACCESS_ROLES = new Set(['school_admin', 'it_admin'])

type PermSet = Set<string>

let _cache: { schoolId: string; role: string; customRoleId: string | null; perms: PermSet } | null = null

export function usePermissions() {
  const auth = useContext(AuthContext)
  const [perms,   setPerms]   = useState<PermSet>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth?.schoolId || !auth?.role) return

    if (FULL_ACCESS_ROLES.has(auth.role)) {
      setPerms(new Set(['*']))
      setLoading(false)
      return
    }

    const customRoleId = (auth.profile as any)?.custom_role_id ?? null

    if (
      _cache &&
      _cache.schoolId    === auth.schoolId &&
      _cache.role        === auth.role &&
      _cache.customRoleId === customRoleId
    ) {
      setPerms(_cache.perms)
      setLoading(false)
      return
    }

    const query = customRoleId
      ? (supabase as any)
          .from('custom_role_permissions')
          .select('feature, can_access')
          .eq('custom_role_id', customRoleId)
      : (supabase as any)
          .from('role_permissions')
          .select('feature, can_access')
          .eq('school_id', auth.schoolId)
          .eq('role', auth.role)

    query.then(({ data }: { data: { feature: string; can_access: boolean }[] | null }) => {
      const set = new Set<string>(
        (data ?? []).filter(r => r.can_access).map(r => r.feature)
      )
      _cache = { schoolId: auth.schoolId!, role: auth.role!, customRoleId, perms: set }
      setPerms(set)
      setLoading(false)
    })
  }, [auth?.schoolId, auth?.role, (auth?.profile as any)?.custom_role_id])

  function can(feature: string): boolean {
    if (perms.has('*')) return true
    return perms.has(feature)
  }

  return { can, loading }
}
