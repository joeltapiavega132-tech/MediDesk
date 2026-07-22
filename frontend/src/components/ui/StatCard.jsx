export function StatCard({ label, value, icon: Icon, color = 'teal', trend, onClick }) {
  const paleta = {
    teal:   'bg-teal-50 text-teal-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-500',
    blue:   'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    slate:  'bg-slate-100 text-slate-600',
  }

  return (
    <div
      className={`card p-5 flex flex-col gap-2 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${paleta[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value ?? '—'}</p>
      {trend && <p className="text-xs text-gray-400">{trend}</p>}
    </div>
  )
}
