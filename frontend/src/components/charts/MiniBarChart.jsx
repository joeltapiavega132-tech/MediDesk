import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'

// Tooltip personalizado
function CustomTooltip({ active, payload, label, formatValue }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{formatValue ? formatValue(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

/**
 * MiniBarChart — gráfica de barras compacta para el dashboard
 * Props:
 *   data:        [{ mes, citas, ingresos }]
 *   dataKey:     'citas' | 'ingresos'
 *   color:       color hex
 *   formatValue: fn(val) → string  (ej. para dinero)
 */
export function MiniBarChart({ data = [], dataKey, color = '#0D9488', label, formatValue }) {
  if (!data.length) return (
    <div className="h-24 flex items-center justify-center text-xs text-gray-300">
      Sin datos
    </div>
  )

  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatValue}
          />
          <Tooltip
            content={<CustomTooltip formatValue={formatValue} />}
            cursor={{ fill: '#F0FDFA' }}
          />
          <Bar
            dataKey={dataKey}
            name={label}
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
