interface Option {
  value: string
  label: string
  icon?: string
}

interface TypeSelectorProps {
  options:   Option[]
  value:     string
  onChange:  (value: string) => void
  columns?:  2 | 3
}

export function TypeSelector({ options, value, onChange, columns = 3 }: TypeSelectorProps) {
  return (
    <div className={`grid gap-3 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
            value === opt.value
              ? 'border-teal bg-teal/10 text-teal'
              : 'border-gray-200 bg-white text-gray-600 hover:border-teal/40'
          }`}
        >
          {opt.icon && <span className="text-2xl">{opt.icon}</span>}
          <span className="text-xs font-arabic font-medium">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

TypeSelector.displayName = 'TypeSelector'
