import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props  { children: ReactNode }
interface State  { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-lms-bg flex flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="text-6xl">⚠️</span>
          <p className="font-bold text-gray-800 text-lg font-arabic">حدث خطأ غير متوقع</p>
          <p className="text-gray-500 text-sm font-arabic">يرجى تحديث الصفحة أو التواصل مع الدعم الفني</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-3 bg-teal text-white rounded-xl font-bold font-arabic text-sm"
          >
            تحديث الصفحة
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-4 text-left text-xs text-red-600 bg-red-50 p-4 rounded-xl max-w-lg overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
