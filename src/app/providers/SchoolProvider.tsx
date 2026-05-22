import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import type { School } from '../../types/domain'
import { AuthContext } from './AuthProvider'

type SchoolState = {
  school: School | null
  loading: boolean
}

const SchoolContext = createContext<SchoolState>({ school: null, loading: true })

export function SchoolProvider({ children }: { children: ReactNode }) {
  const auth = useContext(AuthContext)
  const [school,  setSchool]  = useState<School | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth?.schoolId) { setLoading(false); return }

    supabase
      .from('schools')
      .select('*')
      .eq('id', auth.schoolId)
      .single()
      .then(({ data }) => {
        if (data) setSchool(data as School)
        setLoading(false)
      })
  }, [auth?.schoolId])

  return (
    <SchoolContext.Provider value={{ school, loading }}>
      {children}
    </SchoolContext.Provider>
  )
}

export function useSchool() {
  return useContext(SchoolContext)
}
