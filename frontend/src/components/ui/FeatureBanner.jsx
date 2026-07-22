import { Lock, Zap } from 'lucide-react'

/**
 * FeatureBanner
 * Mostrar en páginas de módulos desactivados en el prototipo.
 * Cuando se active el módulo, simplemente se elimina este componente.
 */
export function FeatureBanner({ titulo, descripcion, modulo }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">{titulo}</h1>
        <p className="page-subtitle">{modulo}</p>
      </div>
      <div className="card p-10 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
          <Lock size={28} className="text-amber-500" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            Módulo disponible en producción
          </h2>
          <p className="text-sm text-gray-400 max-w-sm">{descripcion}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-teal-600 font-medium
                        bg-teal-50 px-3 py-2 rounded-lg">
          <Zap size={13} />
          Se activa conectando la API correspondiente — sin cambios en el código
        </div>
      </div>
    </div>
  )
}
