interface ArabicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:   string
  error?:   string
}

export function ArabicInput({ label, error, className = '', ...props }: ArabicInputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 font-arabic text-right">
          {label}
        </label>
      )}
      <input
        dir="rtl"
        className={`w-full px-4 py-3 rounded-xl border text-right font-arabic text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-600 text-xs font-arabic text-right">{error}</p>}
    </div>
  )
}

ArabicInput.displayName = 'ArabicInput'
