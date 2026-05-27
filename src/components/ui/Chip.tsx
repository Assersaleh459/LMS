import { useLang } from '../../app/providers/LangProvider'

interface ChipProps {
  label:     string
  active?:   boolean
  onClick?:  () => void
}

export function Chip({ label, active = false, onClick }: ChipProps) {
  const { fa } = useLang()
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm ${fa} font-medium transition-colors ${
        active
          ? 'bg-teal text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

Chip.displayName = 'Chip'
