type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'navy' | 'gray'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  green:  'bg-green-100 text-green-800',
  red:    'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue:   'bg-blue-100 text-blue-800',
  navy:   'bg-navy/10 text-navy',
  gray:   'bg-gray-100 text-gray-600',
}

interface BadgeProps {
  label:    string
  variant?: BadgeVariant
  dot?:     boolean
}

export function Badge({ label, variant = 'gray', dot = false }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium font-arabic ${VARIANT_CLASSES[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'green' ? 'bg-green-500' : variant === 'red' ? 'bg-red-500' : 'bg-current'}`} />}
      {label}
    </span>
  )
}

Badge.displayName = 'Badge'
