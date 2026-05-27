import { BottomNav } from './BottomNav'
import { useLang } from '../../app/providers/LangProvider'

interface PageWrapperProps {
  children:    React.ReactNode
  hasBottomNav?: boolean
}

export function PageWrapper({ children, hasBottomNav = true }: PageWrapperProps) {
  const { fa } = useLang()
  return (
    <div className={`min-h-screen bg-lms-bg flex flex-col ${fa}`}>
      <main className={`flex-1 ${hasBottomNav ? 'pb-20' : ''}`}>
        {children}
      </main>
      {hasBottomNav && <BottomNav />}
    </div>
  )
}

PageWrapper.displayName = 'PageWrapper'
