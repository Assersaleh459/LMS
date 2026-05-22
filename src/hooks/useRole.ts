import { useContext } from 'react'
import { AuthContext } from '../app/providers/AuthProvider'
import type { UserRole } from '../types/enums'

export function useRole(): UserRole | null {
  const ctx = useContext(AuthContext)
  return ctx?.role ?? null
}

export function useIsTeacher(): boolean {
  const role = useRole()
  return role === 'subject_teacher' || role === 'homeroom_teacher'
}

export function useIsStudent(): boolean {
  const role = useRole()
  return role === 'kg_primary_student' || role === 'prep_secondary_student'
}

export function useIsParent(): boolean {
  return useRole() === 'parent'
}

export function useIsAdmin(): boolean {
  const role = useRole()
  return role === 'school_admin' || role === 'it_admin' || role === 'chain_admin'
}
