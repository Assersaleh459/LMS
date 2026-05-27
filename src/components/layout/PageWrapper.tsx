import { SideNav } from './SideNav'
import { useLang } from '../../app/providers/LangProvider'

interface PageWrapperProps {
  children:     React.ReactNode
  hasNav?:      boolean
}

export function PageWrapper({ children, hasNav = true }: PageWrapperProps) {
  const { fa } = useLang()
  return (
    <div className={`min-h-screen bg-lms-bg flex flex-col ${fa}`}>
      <div className="flex flex-1 overflow-hidden">
        {hasNav && <SideNav />}
        <main className="flex-1 overflow-y-auto min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}

PageWrapper.displayName = 'PageWrapper'
