export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div className={`${sizes[size]} animate-spin rounded-full border-2
                     border-gray-200 border-t-teal-600 ${className}`} />
  )
}

export function PageLoader({ text = 'Cargando...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-400">{text}</p>
      </div>
    </div>
  )
}

export function SectionLoader() {
  return (
    <div className="flex justify-center items-center py-20">
      <Spinner size="lg" />
    </div>
  )
}

// Skeleton para tablas
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
