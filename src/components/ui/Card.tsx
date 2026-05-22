interface CardProps {
  children:  React.ReactNode
  className?: string
  onClick?:  () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${onClick ? 'w-full text-right hover:shadow-md active:scale-[0.98] transition-all' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}

Card.displayName = 'Card'
