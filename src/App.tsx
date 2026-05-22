import { AuthProvider }   from './app/providers/AuthProvider'
import { SchoolProvider }  from './app/providers/SchoolProvider'
import { RTLProvider }     from './app/providers/RTLProvider'
import { Router }          from './app/Router'

export default function App() {
  return (
    <RTLProvider>
      <AuthProvider>
        <SchoolProvider>
          <Router />
        </SchoolProvider>
      </AuthProvider>
    </RTLProvider>
  )
}
