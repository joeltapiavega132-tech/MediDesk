const VARIANTS = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100 text-red-600',
  info:    'bg-blue-100 text-blue-700',
  teal:    'bg-teal-100 text-teal-700',
  neutral: 'bg-gray-100 text-gray-600',
  purple:  'bg-purple-100 text-purple-700',
}

export function Badge({ variant = 'neutral', children, dot = false }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                      text-xs font-semibold ${VARIANTS[variant]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
