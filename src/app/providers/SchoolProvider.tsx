import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import type { School } from '../../types/domain'
import { AuthContext } from './AuthProvider'

type SchoolState = {
  school:    School | null
  loading:   boolean
  setSchool: (s: School) => void
}

const SchoolContext = createContext<SchoolState>({ school: null, loading: true, setSchool: () => {} })

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
        if (data) setSchool(data as unknown as School)
        setLoading(false)
      })
  }, [auth?.schoolId])

  return (
    <SchoolContext.Provider value={{ school, loading, setSchool }}>
      {children}
    </SchoolContext.Provider>
  )
}

export function useSchool() {
  return useContext(SchoolContext)
}
