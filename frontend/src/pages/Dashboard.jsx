import { useNavigate, Link } from 'react-router-dom'
import {
  CalendarDays, Users, FileText, DollarSign,
  Clock, ArrowRight, TrendingUp, UserPlus,
  TrendingDown, Minus,
} from 'lucide-react'
import { StatCard }           from '@/components/ui/StatCard'
import { TableSkeleton }      from '@/components/ui/Spinner'
import { Badge }              from '@/components/ui/Badge'
import { MiniBarChart }       from '@/components/charts/MiniBarChart'
import { DonutEstados }       from '@/components/charts/DonutEstados'
import { useAuth }            from '@/context/AuthContext'
import { useCitas }           from '@/hooks/useCitas'
import { useStatsHoy, useActividadMeses, useDistribucionEstados } from '@/hooks/useStats'
import { ESTADO_CITA }        from '@/lib/constants'
import { format }             from 'date-fns'
import { es }                 from 'date-fns/locale'

const BADGE_MAP = {
  AGENDADA: 'info', CONFIRMADA: 'teal', ATENDIDA: 'success',
  CANCELADA: 'danger', NO_ASISTIO: 'warning',
}

function BalanceBadge({ valor }) {
  if (valor > 0) return (
    <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
      <TrendingUp size={12} /> Positivo
    </span>
  )
  if (valor < 0) return (
    <span className="flex items-center gap-1 text-xs text-red-500 font-semibold">
      <TrendingDown size={12} /> Negativo
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
      <Minus size={12} /> Neutro
    </span>
  )
}

export function Dashboard() {
  const { displayName, puedeAcceder } = useAuth()
  const navigate = useNavigate()

  const hoy = format(new Date(), 'yyyy-MM-dd')
  const { data: citasHoy = [],  isLoading: loadingCitas }  = useCitas(hoy)
  const { data: stats,          isLoading: loadingStats }  = useStatsHoy()
  const { data: actividad = [], isLoading: loadingGraf }   = useActividadMeses(6)
  const { data: estados  = [] }                            = useDistribucionEstados()

  const hora    = new Date().getHours()
  const saludo  = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const fmtUSD  = v => `$${Number(v).toLocaleString('es-EC', { minimumFractionDigits: 0 })}`

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">{saludo}, {displayName} 👋</h1>
          <p className="page-subtitle capitalize">
            {format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        {puedeAcceder('pacientes') && (
          <button onClick={() => navigate('/pacientes')} className="btn-primary hidden sm:flex">
            <UserPlus size={16} /> Nuevo paciente
          </button>
        )}
      </div>

      {/* ── Stats cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Citas hoy"
          value={loadingStats ? '...' : stats?.citasHoy ?? 0}
          icon={CalendarDays} color="teal"
          trend={stats
            ? `${stats.citasAtendidas} atendidas · ${stats.citasPendientes} pendientes`
            : undefined}
          onClick={() => navigate('/agenda')}
        />
        <StatCard
          label="Pacientes registrados"
          value={loadingStats ? '...' : stats?.totalPacientes ?? 0}
          icon={Users} color="blue"
          onClick={() => navigate('/pacientes')}
        />
        <StatCard
          label="Certificados este mes"
          value={loadingStats ? '...' : stats?.certificadosMes ?? 0}
          icon={FileText} color="purple"
          onClick={() => navigate('/certificados')}
        />
        <StatCard
          label="Ingresos del mes"
          value={loadingStats ? '...' : fmtUSD(stats?.ingresosMes ?? 0)}
          icon={DollarSign} color="green"
          trend={stats ? (
            <span className="flex items-center gap-2">
              <BalanceBadge valor={stats.balanceMes} />
              <span className="text-gray-400">Egresos: {fmtUSD(stats.egresosMes)}</span>
            </span>
          ) : undefined}
          onClick={puedeAcceder('contabilidad') ? () => navigate('/contabilidad') : undefined}
        />
      </div>

      {/* ── Fila media: citas del día + gráficas ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Citas del día — 2/3 */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Clock size={17} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-900">Citas de hoy</h2>
              {!loadingCitas && citasHoy.length > 0 && (
                <Badge variant="teal">{citasHoy.length}</Badge>
              )}
            </div>
            <Link to="/agenda"
                  className="text-xs text-teal-600 hover:underline font-medium flex items-center gap-1">
              Ver agenda <ArrowRight size={13} />
            </Link>
          </div>

          {loadingCitas ? (
            <TableSkeleton rows={4} cols={4} />
          ) : citasHoy.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays size={32} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No hay citas programadas para hoy</p>
              <button onClick={() => navigate('/agenda')} className="btn-secondary mt-3 text-xs">
                Ir a la agenda
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Paciente</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {citasHoy.map(cita => {
                    const estado = ESTADO_CITA[cita.estado]
                    return (
                      <tr key={cita.id} className="cursor-pointer"
                          onClick={() => navigate('/agenda')}>
                        <td className="font-mono text-xs font-semibold text-gray-500 w-14">
                          {format(new Date(cita.fecha_hora), 'HH:mm')}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700
                                            flex items-center justify-center text-xs font-bold shrink-0">
                              {cita.pacientes?.nombre?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                            <span className="font-medium text-sm">
                              {cita.pacientes?.nombre ?? '—'}
                            </span>
                          </div>
                        </td>
                        <td className="text-gray-500 text-sm">{cita.tipo_servicio}</td>
                        <td>
                          {estado && (
                            <Badge variant={BADGE_MAP[cita.estado]}>{estado.label}</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel derecho — acceso rápido + resumen */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-900">Acceso rápido</h2>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Nueva cita',          to: '/agenda',            modulo: 'agenda' },
                { label: 'Registrar paciente',  to: '/pacientes',         modulo: 'pacientes' },
                { label: 'Emitir certificado',  to: '/certificados/nuevo', modulo: 'certificados' },
                { label: 'Registrar ingreso',   to: '/contabilidad',      modulo: 'contabilidad' },
              ].filter(item => puedeAcceder(item.modulo)).map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm
                             text-gray-700 hover:bg-teal-50 hover:text-teal-700
                             border border-gray-100 hover:border-teal-200 transition-all"
                >
                  {item.label}
                  <ArrowRight size={13} className="text-gray-300" />
                </Link>
              ))}
            </div>
          </div>

          {/* Balance del mes */}
          {puedeAcceder('contabilidad') && (
            <div className="card p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Balance — {format(new Date(), 'MMMM', { locale: es })}
              </h2>
              {[
                { label: 'Ingresos',  value: stats?.ingresosMes, color: 'text-green-600' },
                { label: 'Egresos',   value: stats?.egresosMes,  color: 'text-red-500' },
                { label: 'Balance',   value: stats?.balanceMes,  color: 'text-gray-900', bold: true },
              ].map(({ label, value, color, bold }) => (
                <div key={label} className="flex items-center justify-between py-1.5
                                            border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${color}`}>
                    {loadingStats ? '—' : fmtUSD(value ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Fila inferior: gráficas ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Actividad últimos 6 meses */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Citas — últimos 6 meses
          </h2>
          <p className="text-xs text-gray-400 mb-4">Total de citas agendadas por mes</p>
          {loadingGraf
            ? <div className="h-24 bg-gray-100 animate-pulse rounded-xl" />
            : <MiniBarChart
                data={actividad}
                dataKey="citas"
                label="Citas"
                color="#0D9488"
              />
          }
        </div>

        {/* Ingresos últimos 6 meses */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Ingresos — últimos 6 meses
          </h2>
          <p className="text-xs text-gray-400 mb-4">Total en USD por mes</p>
          {loadingGraf
            ? <div className="h-24 bg-gray-100 animate-pulse rounded-xl" />
            : <MiniBarChart
                data={actividad}
                dataKey="ingresos"
                label="Ingresos"
                color="#10B981"
                formatValue={v => `$${v}`}
              />
          }
        </div>

        {/* Distribución de estados del mes */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Estados de citas este mes
          </h2>
          <p className="text-xs text-gray-400 mb-2">Distribución por estado</p>
          <DonutEstados data={estados} />
        </div>

        {/* Resumen numérico del mes */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Resumen del mes
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Citas hoy',       value: stats?.citasHoy,        color: 'bg-teal-50 text-teal-700' },
              { label: 'Atendidas hoy',   value: stats?.citasAtendidas,  color: 'bg-green-50 text-green-700' },
              { label: 'Canceladas hoy',  value: stats?.citasCanceladas, color: 'bg-red-50 text-red-600' },
              { label: 'Pacientes total', value: stats?.totalPacientes,  color: 'bg-blue-50 text-blue-700' },
              { label: 'Certificados',    value: stats?.certificadosMes, color: 'bg-purple-50 text-purple-700' },
              { label: 'Balance mes',     value: stats ? fmtUSD(stats.balanceMes) : '—',
                color: (stats?.balanceMes ?? 0) >= 0
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl p-3 ${color}`}>
                <p className="text-xs opacity-70 mb-0.5">{label}</p>
                <p className="text-lg font-bold">
                  {loadingStats ? '—' : value ?? 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
