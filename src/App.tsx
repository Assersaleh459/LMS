import { AuthProvider }   from './app/providers/AuthProvider'
import { SchoolProvider }  from './app/providers/SchoolProvider'
import { RTLProvider }     from './app/providers/RTLProvider'
import { LangProvider }    from './app/providers/LangProvider'
import { Router }          from './app/Router'

export default function App() {
  return (
    <LangProvider>
      <RTLProvider>
        <AuthProvider>
          <SchoolProvider>
            <Router />
          </SchoolProvider>
        </AuthProvider>
      </RTLProvider>
    </LangProvider>
  )
}
