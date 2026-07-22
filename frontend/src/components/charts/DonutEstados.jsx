import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORES = {
  ATENDIDA:   '#10B981',
  CONFIRMADA: '#0D9488',
  AGENDADA:   '#2563EB',
  CANCELADA:  '#EF4444',
  NO_ASISTIO: '#F59E0B',
}

const LABELS = {
  ATENDIDA:   'Atendidas',
  CONFIRMADA: 'Confirmadas',
  AGENDADA:   'Agendadas',
  CANCELADA:  'Canceladas',
  NO_ASISTIO: 'No asistió',
}

export function DonutEstados({ data = [] }) {
  const conDatos = data.filter(d => d.total > 0)

  if (!conDatos.length) return (
    <div className="h-32 flex items-center justify-center text-xs text-gray-300">
      Sin citas este mes
    </div>
  )

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={conDatos}
            dataKey="total"
            nameKey="estado"
            cx="40%"
            cy="50%"
            innerRadius={30}
            outerRadius={52}
            paddingAngle={2}
          >
            {conDatos.map(entry => (
              <Cell key={entry.estado} fill={COLORES[entry.estado] ?? '#E5E7EB'} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value, LABELS[name] ?? name]}
            contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #E5E7EB' }}
          />
          <Legend
            iconType="circle"
            iconSize={7}
            formatter={name => <span style={{ fontSize: 10, color: '#6B7280' }}>{LABELS[name] ?? name}</span>}
            layout="vertical"
            align="right"
            verticalAlign="middle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
