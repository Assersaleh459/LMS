interface ChipProps {
  label:     string
  active?:   boolean
  onClick?:  () => void
}

export function Chip({ label, active = false, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-arabic font-medium transition-colors ${
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
