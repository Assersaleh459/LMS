import { BottomNav } from './BottomNav'

interface PageWrapperProps {
  children:    React.ReactNode
  hasBottomNav?: boolean
}

export function PageWrapper({ children, hasBottomNav = true }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-lms-bg flex flex-col font-arabic">
      <main className={`flex-1 ${hasBottomNav ? 'pb-20' : ''}`}>
        {children}
      </main>
      {hasBottomNav && <BottomNav />}
    </div>
  )
}

PageWrapper.displayName = 'PageWrapper'
