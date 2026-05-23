import { AuthProvider }  from './app/providers/AuthProvider'
import { SchoolProvider } from './app/providers/SchoolProvider'
import { LangProvider }   from './app/providers/LangProvider'
import { Router }         from './app/Router'

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <SchoolProvider>
          <Router />
        </SchoolProvider>
      </AuthProvider>
    </LangProvider>
  )
}
