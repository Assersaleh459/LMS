import { AuthProvider }   from './app/providers/AuthProvider'
import { SchoolProvider }  from './app/providers/SchoolProvider'
import { LangProvider }    from './app/providers/LangProvider'
import { Router }          from './app/Router'
import { ErrorBoundary }   from './components/ui/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <LangProvider>
        <AuthProvider>
          <SchoolProvider>
            <Router />
          </SchoolProvider>
        </AuthProvider>
      </LangProvider>
    </ErrorBoundary>
  )
}
