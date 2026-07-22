import { useState, useCallback, useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import {
  format, parse, startOfWeek, getDay,
  startOfDay, endOfDay, addMinutes,
  startOfMonth, endOfMonth,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus, ChevronLeft, ChevronRight,
  CalendarDays, Clock, User, Stethoscope,
} from 'lucide-react'
import { useCitasSemana, useCrearCita, useActualizarEstadoCita } from '@/hooks/useCitas'
import { usePacientes }  from '@/hooks/usePacientes'
import { Modal }         from '@/components/ui/Modal'
import { Badge }         from '@/components/ui/Badge'
import { ESTADO_CITA }   from '@/lib/constants'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// ── Localización español ───────────────────────────────────────
const locales = { es }
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay, locales,
})

const MENSAJES = {
  next: 'Siguiente', previous: 'Anterior', today: 'Hoy',
  month: 'Mes', week: 'Semana', day: 'Día', agenda: 'Lista',
  date: 'Fecha', time: 'Hora', event: 'Cita',
  noEventsInRange: 'No hay citas en este período',
  showMore: total => `+ ${total} más`,
}

// Colores por tipo de servicio
const COLORES_SERVICIO = {
  'Consulta general':       '#0D9488',
  'Cirugía estética':       '#7C3AED',
  'Tratamiento láser':      '#2563EB',
  'Cuidado de piel':        '#059669',
  'Control post-operatorio':'#D97706',
  'Certificado médico':     '#6B7280',
}

const BADGE_MAP = {
  AGENDADA: 'info', CONFIRMADA: 'teal', ATENDIDA: 'success',
  CANCELADA: 'danger', NO_ASISTIO: 'warning',
}

// Formulario inicial
const FORM_VACIO = {
  paciente_id:      '',
  tipo_servicio:    'Consulta general',
  fecha_hora:       '',
  duracion_minutos: 30,
  notas:            '',
}

const SERVICIOS = [
  'Consulta general', 'Cirugía estética', 'Tratamiento láser',
  'Cuidado de piel', 'Control post-operatorio', 'Certificado médico', 'Otro',
]

const DURACIONES = [15, 30, 45, 60, 90, 120]

// ── Componente evento en el calendario ────────────────────────
function EventoCalendario({ event }) {
  return (
    <div className="text-xs leading-tight px-1 truncate">
      <span className="font-semibold">{event.title}</span>
    </div>
  )
}

// ── Modal detalle de cita ─────────────────────────────────────
function DetalleCita({ cita, onClose, onCambiarEstado }) {
  if (!cita) return null
  const estado = ESTADO_CITA[cita.estado]

  return (
    <div className="flex flex-col gap-4">
      {/* Info principal */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700
                        flex items-center justify-center text-lg font-bold shrink-0">
          {cita.pacienteNombre?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{cita.pacienteNombre}</p>
          <p className="text-sm text-gray-500">{cita.tipo_servicio}</p>
        </div>
      </div>

      {/* Detalles */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: CalendarDays, label: 'Fecha',
            value: format(new Date(cita.fecha_hora), "EEEE d 'de' MMMM", { locale: es }) },
          { icon: Clock, label: 'Hora',
            value: `${format(new Date(cita.fecha_hora), 'HH:mm')} · ${cita.duracion_minutos} min` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
              <Icon size={13} /><span className="text-xs">{label}</span>
            </div>
            <p className="text-sm font-medium text-gray-800 capitalize">{value}</p>
          </div>
        ))}
      </div>

      {cita.notas && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-700"><strong>Notas:</strong> {cita.notas}</p>
        </div>
      )}

      {/* Estado actual */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Estado</span>
        {estado && <Badge variant={BADGE_MAP[cita.estado]}>{estado.label}</Badge>}
      </div>

      {/* Cambiar estado */}
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
          Cambiar estado
        </p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(ESTADO_CITA).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => onCambiarEstado(cita.id, key)}
              disabled={cita.estado === key}
              className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all
                          ${cita.estado === key
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-600'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onClose} className="btn-secondary">Cerrar</button>
      </div>
    </div>
  )
}

// ── Formulario nueva cita ─────────────────────────────────────
function FormNuevaCita({ inicial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ ...FORM_VACIO, ...inicial })
  const [error, setError] = useState('')
  const { data: pacientes = [] } = usePacientes()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.paciente_id) { setError('Selecciona un paciente'); return }
    if (!form.fecha_hora)  { setError('Selecciona fecha y hora'); return }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200
                      rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Paciente */}
      <div>
        <label className="input-label">Paciente <span className="text-red-500">*</span></label>
        <select
          className="input"
          value={form.paciente_id}
          onChange={e => set('paciente_id', e.target.value)}
          disabled={loading}
        >
          <option value="">— Seleccionar paciente —</option>
          {pacientes.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      {/* Servicio + duración */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">Tipo de servicio</label>
          <select
            className="input"
            value={form.tipo_servicio}
            onChange={e => set('tipo_servicio', e.target.value)}
            disabled={loading}
          >
            {SERVICIOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">Duración</label>
          <select
            className="input"
            value={form.duracion_minutos}
            onChange={e => set('duracion_minutos', Number(e.target.value))}
            disabled={loading}
          >
            {DURACIONES.map(d => (
              <option key={d} value={d}>{d} min</option>
            ))}
          </select>
        </div>
      </div>

      {/* Fecha y hora */}
      <div>
        <label className="input-label">Fecha y hora <span className="text-red-500">*</span></label>
        <input
          type="datetime-local"
          className="input"
          value={form.fecha_hora}
          onChange={e => set('fecha_hora', e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Notas */}
      <div>
        <label className="input-label">Notas (opcional)</label>
        <textarea
          className="input resize-none"
          rows={2}
          placeholder="Indicaciones especiales, alergias..."
          value={form.notas}
          onChange={e => set('notas', e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading
            ? <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                 rounded-full animate-spin" />
                Guardando...
              </span>
            : <><Plus size={15} /> Agendar cita</>}
        </button>
      </div>
    </form>
  )
}

// ── Página principal ──────────────────────────────────────────
export function AgendaPage() {
  const [vista,         setVista]         = useState('week')
  const [fechaActual,   setFechaActual]   = useState(new Date())
  const [modalNueva,    setModalNueva]    = useState(false)
  const [modalDetalle,  setModalDetalle]  = useState(null)  // cita seleccionada
  const [slotInicial,   setSlotInicial]   = useState(null)  // fecha al hacer click en slot

  // Rango de la semana/mes visible

  const inicio = format(startOfMonth(fechaActual), "yyyy-MM-dd'T'00:00:00")
  const fin    = format(endOfMonth(fechaActual),   "yyyy-MM-dd'T'23:59:59")

  const { data: citas = [], isLoading } = useCitasSemana(inicio, fin)
  const crearMutation  = useCrearCita()
  const estadoMutation = useActualizarEstadoCita()

  // Convertir citas de Supabase al formato de React Big Calendar
    const eventos = useMemo(() => citas.map(c => ({
    id:             c.id,
    title:          `${c.pacientes?.nombre ?? 'Paciente'} — ${c.tipo_servicio}`,
    start:          new Date(c.fecha_hora),
    end:            addMinutes(new Date(c.fecha_hora), c.duracion_minutos ?? 30),
    resource:       c,
    // Campos extra para el detalle
    pacienteNombre: c.pacientes?.nombre ?? '—',
    tipo_servicio:  c.tipo_servicio,
    duracion_minutos: c.duracion_minutos,
    estado:         c.estado,
    notas:          c.notas,
    fecha_hora:     c.fecha_hora,
  })), [citas])

  // Color por servicio
  const eventPropGetter = useCallback((event) => ({
    style: {
      backgroundColor: COLORES_SERVICIO[event.tipo_servicio] ?? '#0D9488',
      borderRadius: '6px',
      border: 'none',
      color: 'white',
      fontSize: '12px',
      padding: '2px 4px',
    }
  }), [])

  // Click en slot vacío → abrir modal con esa fecha prellenada
  const handleSelectSlot = useCallback(({ start }) => {
    const fechaStr = format(start, "yyyy-MM-dd'T'HH:mm")
    setSlotInicial({ fecha_hora: fechaStr })
    setModalNueva(true)
  }, [])

  // Click en evento → abrir detalle
  const handleSelectEvent = useCallback((event) => {
    setModalDetalle(event)
  }, [])

  async function handleCrearCita(form) {
    await crearMutation.mutateAsync({
      ...form,
      fecha_hora: new Date(form.fecha_hora).toISOString(),
    })
    setModalNueva(false)
    setSlotInicial(null)
  }

  async function handleCambiarEstado(id, estado) {
    await estadoMutation.mutateAsync({ id, estado })
    setModalDetalle(prev => prev ? { ...prev, estado } : null)
  }

  // Estadísticas del día
  const hoy        = format(new Date(), 'yyyy-MM-dd')
  const citasHoy   = citas.filter(c => c.fecha_hora?.startsWith(hoy))
  const atendidas  = citasHoy.filter(c => c.estado === 'ATENDIDA').length
  const pendientes = citasHoy.filter(c => ['AGENDADA','CONFIRMADA'].includes(c.estado)).length

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="page-subtitle">
            Hoy: {citasHoy.length} citas · {atendidas} atendidas · {pendientes} pendientes
          </p>
        </div>
        <button onClick={() => { setSlotInicial(null); setModalNueva(true) }} className="btn-primary">
          <Plus size={15} /> Nueva cita
        </button>
      </div>

      {/* Mini stats del día */}
      {citasHoy.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(ESTADO_CITA).map(([key, { label }]) => {
            const count = citasHoy.filter(c => c.estado === key).length
            if (count === 0) return null
            return (
              <div key={key} className="card px-4 py-3 flex items-center gap-3">
                <Badge variant={BADGE_MAP[key]}>{label}</Badge>
                <span className="text-lg font-bold text-gray-900">{count}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Calendario */}
      <div className="card p-4">
        <div style={{ height: 620 }}>
          <Calendar
            localizer={localizer}
            events={eventos}
            view={vista}
            onView={setVista}
            date={fechaActual}
            onNavigate={setFechaActual}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            eventPropGetter={eventPropGetter}
            components={{ event: EventoCalendario }}
            messages={MENSAJES}
            culture="es"
            formats={{
              dayHeaderFormat: date => format(date, "EEEE d 'de' MMM", { locale: es }),
              dayRangeHeaderFormat: ({ start, end }) =>
                `${format(start, "d MMM", { locale: es })} — ${format(end, "d MMM yyyy", { locale: es })}`,
              monthHeaderFormat: date => format(date, "MMMM yyyy", { locale: es }),
              agendaDateFormat: date => format(date, "EEEE d MMM", { locale: es }),
              timeGutterFormat: date => format(date, 'HH:mm'),
            }}
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
        </div>
      </div>

      {/* Modal nueva cita */}
      <Modal
        open={modalNueva}
        onClose={() => { setModalNueva(false); setSlotInicial(null) }}
        title="Agendar nueva cita"
        size="md"
      >
        <FormNuevaCita
          inicial={slotInicial}
          onSubmit={handleCrearCita}
          onCancel={() => { setModalNueva(false); setSlotInicial(null) }}
          loading={crearMutation.isPending}
        />
      </Modal>

      {/* Modal detalle cita */}
      <Modal
        open={!!modalDetalle}
        onClose={() => setModalDetalle(null)}
        title="Detalle de la cita"
        size="sm"
      >
        <DetalleCita
          cita={modalDetalle}
          onClose={() => setModalDetalle(null)}
          onCambiarEstado={handleCambiarEstado}
        />
      </Modal>
    </div>
  )
}
