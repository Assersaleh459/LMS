import { GRADE_TYPE_LABELS } from '../../lib/arabic'
import type { GradeType } from '../../types/enums'

const TABS: GradeType[] = ['written', 'oral', 'practical', 'activity']

interface GradeTypeTabsProps {
  active:   GradeType
  onChange: (tab: GradeType) => void
}

export function GradeTypeTabs({ active, onChange }: GradeTypeTabsProps) {
  return (
    <div className="flex bg-gray-100 rounded-xl p-1 mx-4 my-3 gap-1">
      {TABS.map(tab => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`flex-1 py-2 rounded-lg text-xs font-arabic font-medium transition-all ${
            active === tab
              ? 'bg-white text-teal shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {GRADE_TYPE_LABELS[tab]}
        </button>
      ))}
    </div>
  )
}

GradeTypeTabs.displayName = 'GradeTypeTabs'
