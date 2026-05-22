interface AvatarProps {
  name:    string
  url?:    string | null
  size?:   'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }

export function Avatar({ name, url, size = 'md' }: AvatarProps) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('')
  return (
    <div className={`${SIZE_CLASSES[size]} rounded-full flex-shrink-0 overflow-hidden`}>
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-teal/20 flex items-center justify-center">
          <span className="text-teal font-bold font-arabic">{initials}</span>
        </div>
      )}
    </div>
  )
}

Avatar.displayName = 'Avatar'
