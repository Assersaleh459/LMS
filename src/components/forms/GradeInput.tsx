interface GradeInputProps {
  value:     string
  max:       number
  onChange:  (value: string) => void
  disabled?: boolean
}

function gradeColor(value: string, max: number): string {
  const n = parseFloat(value)
  if (isNaN(n)) return 'border-gray-200'
  const pct = (n / max) * 100
  if (pct >= 65) return 'border-green-400 bg-green-50 text-green-900'
  if (pct >= 50) return 'border-yellow-400 bg-yellow-50 text-yellow-900'
  return 'border-red-400 bg-red-50 text-red-900'
}

export function GradeInput({ value, max, onChange, disabled }: GradeInputProps) {
  function handleChange(raw: string) {
    if (raw === '' || raw === '-') { onChange(raw); return }
    const n = parseFloat(raw)
    if (isNaN(n)) { onChange(raw); return }
    if (n < 0)   { onChange('0');       return }
    if (n > max) { onChange(String(max)); return }
    onChange(raw)
  }

  return (
    <input
      type="number"
      value={value}
      onChange={e => handleChange(e.target.value)}
      min={0}
      max={max}
      step={0.5}
      disabled={disabled}
      dir="ltr"
      className={`w-16 h-10 rounded-lg border-2 text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-40 transition-colors ${gradeColor(value, max)}`}
      placeholder={`/${max}`}
    />
  )
}

GradeInput.displayName = 'GradeInput'
