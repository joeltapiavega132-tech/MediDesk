import { useState, useMemo } from 'react'
import {
  DollarSign, TrendingUp, TrendingDown, Plus,
  Trash2, Search, ChevronLeft, ChevronRight,
  Download, AlertCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import { useTransacciones, useCrearTransaccion, useEliminarTransaccion } from '@/hooks/useTransacciones'
import { Modal }        from '@/components/ui/Modal'
import { Badge }        from '@/components/ui/Badge'
import { EmptyState }   from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Spinner'
import { CATEGORIA_INGRESO, CATEGORIA_EGRESO } from '@/lib/constants'
import { descargarPDF } from '@/lib/generarPDF'
import { format, addMonths, subMonths, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

// ── Colores gráficas ──────────────────────────────────────────
const COLORES_CATEGORIAS = [
  '#0D9488','#2563EB','#7C3AED','#059669',
  '#D97706','#EF4444','#EC4899','#6B7280',
]

// ── Formulario transacción ────────────────────────────────────
const FORM_VACIO = {
  tipo:        'INGRESO',
  monto:       '',
  categoria:   '',
  descripcion: '',
  fecha:       format(new Date(), 'yyyy-MM-dd'),
}

function FormTransaccion({ onSubmit, onCancel, loading }) {
  const [form,  setForm]  = useState(FORM_VACIO)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  const categorias = form.tipo === 'INGRESO' ? CATEGORIA_INGRESO : CATEGORIA_EGRESO

  // Resetear categoría al cambiar tipo
  function setTipo(tipo) {
    setForm(f => ({ ...f, tipo, categoria: '' }))
  }

  function validate() {
    if (!form.monto || Number(form.monto) <= 0) return 'El monto debe ser mayor a 0'
    if (!form.categoria) return 'Selecciona una categoría'
    if (!form.fecha)     return 'Selecciona una fecha'
    return ''
  }

  function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    onSubmit({ ...form, monto: Number(form.monto) })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200
                      rounded-xl px-3 py-2 flex items-center gap-2">
          <AlertCircle size={13} />{error}
        </p>
      )}

      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2">
        {['INGRESO','EGRESO'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`py-2.5 rounded-xl text-sm font-semibold border transition-all
                        ${form.tipo === t
                          ? t === 'INGRESO'
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-red-500 text-white border-red-500'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            {t === 'INGRESO' ? '↑ Ingreso' : '↓ Egreso'}
          </button>
        ))}
      </div>

      {/* Monto + fecha */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">Monto (USD) <span className="text-red-500">*</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
            <input
              type="number"
              className="input pl-7"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={form.monto}
              onChange={e => set('monto', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label className="input-label">Fecha <span className="text-red-500">*</span></label>
          <input
            type="date"
            className="input"
            value={form.fecha}
            onChange={e => set('fecha', e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Categoría */}
      <div>
        <label className="input-label">Categoría <span className="text-red-500">*</span></label>
        <select
          className="input"
          value={form.categoria}
          onChange={e => set('categoria', e.target.value)}
          disabled={loading}
        >
          <option value="">— Seleccionar —</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Descripción */}
      <div>
        <label className="input-label">Descripción (opcional)</label>
        <input
          type="text"
          className="input"
          placeholder="Detalle de la transacción..."
          value={form.descripcion}
          onChange={e => set('descripcion', e.target.value)}
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
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </span>
            : <><Plus size={15} /> Registrar</>}
        </button>
      </div>
    </form>
  )
}

// ── Exportar reporte PDF ──────────────────────────────────────
function exportarReportePDF(transacciones, mes) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const ML = 20, PW = 210, TW = PW - ML*2

  const ingresos = transacciones.filter(t => t.tipo === 'INGRESO').reduce((s,t) => s + Number(t.monto), 0)
  const egresos  = transacciones.filter(t => t.tipo === 'EGRESO' ).reduce((s,t) => s + Number(t.monto), 0)
  const balance  = ingresos - egresos
  const mesLabel = format(mes, "MMMM 'de' yyyy", { locale: es })

  // Header
  doc.setFillColor(15, 27, 45)
  doc.rect(0, 0, PW, 24, 'F')
  doc.setTextColor(255,255,255)
  doc.setFont('helvetica','bold')
  doc.setFontSize(13)
  doc.text('MediDesk — Reporte de Contabilidad', ML, 15)
  doc.setFontSize(9)
  doc.setFont('helvetica','normal')
  doc.setTextColor(13,148,136)
  doc.text(`Período: ${mesLabel}`, PW - ML, 15, { align: 'right' })

  let y = 36
  // Resumen
  const resumen = [
    { label: 'Total ingresos', valor: ingresos, color: [16, 185, 129] },
    { label: 'Total egresos',  valor: egresos,  color: [239, 68, 68] },
    { label: 'Balance neto',   valor: balance,  color: balance >= 0 ? [13,148,136] : [239,68,68] },
  ]
  resumen.forEach((r, i) => {
    const x = ML + i * 58
    doc.setFillColor(240,240,240)
    doc.roundedRect(x, y, 52, 18, 2, 2, 'F')
    doc.setTextColor(...r.color)
    doc.setFont('helvetica','bold')
    doc.setFontSize(11)
    doc.text(`$${r.valor.toFixed(2)}`, x + 26, y + 11, { align: 'center' })
    doc.setTextColor(100,100,100)
    doc.setFont('helvetica','normal')
    doc.setFontSize(7)
    doc.text(r.label, x + 26, y + 16, { align: 'center' })
  })

  y += 28
  // Tabla
  doc.setFillColor(15,27,45)
  doc.rect(ML, y, TW, 8, 'F')
  doc.setTextColor(255,255,255)
  doc.setFont('helvetica','bold')
  doc.setFontSize(8)
  doc.text('Fecha',       ML+2, y+5.5)
  doc.text('Tipo',        ML+22, y+5.5)
  doc.text('Categoría',   ML+42, y+5.5)
  doc.text('Descripción', ML+82, y+5.5)
  doc.text('Monto',       PW-ML-2, y+5.5, { align: 'right' })

  y += 8
  transacciones.forEach((t, i) => {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.setFillColor(i%2===0 ? 249 : 255, i%2===0 ? 250 : 255, i%2===0 ? 251 : 255)
    doc.rect(ML, y, TW, 7, 'F')
    doc.setTextColor(80,80,80)
    doc.setFont('helvetica','normal')
    doc.setFontSize(7.5)
    doc.text(t.fecha ?? '', ML+2, y+4.5)
    doc.setTextColor(t.tipo==='INGRESO' ? 16 : 239, t.tipo==='INGRESO' ? 185 : 68, t.tipo==='INGRESO' ? 129 : 68)
    doc.text(t.tipo, ML+22, y+4.5)
    doc.setTextColor(80,80,80)
    doc.text(t.categoria ?? '', ML+42, y+4.5)
    doc.text((t.descripcion ?? '').substring(0,35), ML+82, y+4.5)
    doc.setTextColor(t.tipo==='INGRESO' ? 16 : 239, t.tipo==='INGRESO' ? 185 : 68, t.tipo==='INGRESO' ? 129 : 68)
    doc.text(`$${Number(t.monto).toFixed(2)}`, PW-ML-2, y+4.5, { align: 'right' })
    y += 7
  })

  // Footer
  doc.setFillColor(240,240,240)
  doc.rect(0, 287, PW, 10, 'F')
  doc.setTextColor(150,150,150)
  doc.setFontSize(7)
  doc.text(`Generado el ${format(new Date(),"d 'de' MMMM 'de' yyyy",{locale:es})} · MediDesk`, PW/2, 293, { align: 'center' })

  doc.save(`reporte_contabilidad_${format(mes,'yyyy-MM')}.pdf`)
  toast.success('Reporte exportado')
}

// ── Página principal ──────────────────────────────────────────
export function ContabilidadPage() {
  const [mes,          setMes]          = useState(new Date())
  const [modalNuevo,   setModalNuevo]   = useState(false)
  const [confirmarDel, setConfirmarDel] = useState(null)
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroTipo,   setFiltroTipo]   = useState('TODOS')

  const { data: transacciones = [], isLoading } = useTransacciones(mes)
  const crearMutation   = useCrearTransaccion()
  const eliminarMutation = useEliminarTransaccion()

  // Cálculos
  const ingresos = useMemo(() =>
    transacciones.filter(t => t.tipo === 'INGRESO').reduce((s,t) => s + Number(t.monto), 0),
    [transacciones])
  const egresos = useMemo(() =>
    transacciones.filter(t => t.tipo === 'EGRESO').reduce((s,t) => s + Number(t.monto), 0),
    [transacciones])
  const balance = ingresos - egresos

  // Filtrar tabla
  const filtradas = useMemo(() => transacciones.filter(t => {
    const matchTipo  = filtroTipo === 'TODOS' || t.tipo === filtroTipo
    const matchBusq  = !busqueda ||
      t.categoria?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    return matchTipo && matchBusq
  }), [transacciones, filtroTipo, busqueda])

  // Datos para gráfica de categorías
  const dataDonut = useMemo(() => {
    const mapa = {}
    transacciones.filter(t => t.tipo === 'INGRESO').forEach(t => {
      mapa[t.categoria] = (mapa[t.categoria] ?? 0) + Number(t.monto)
    })
    return Object.entries(mapa).map(([name, value]) => ({ name, value }))
  }, [transacciones])

  async function handleCrear(form) {
    await crearMutation.mutateAsync(form)
    setModalNuevo(false)
  }

  async function handleEliminar() {
    if (!confirmarDel) return
    await eliminarMutation.mutateAsync(confirmarDel.id)
    setConfirmarDel(null)
  }

  const fmtUSD = v => `$${Number(v).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`
  const mesLabel = format(mes, "MMMM yyyy", { locale: es })

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Contabilidad</h1>
          <p className="page-subtitle capitalize">{mesLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportarReportePDF(transacciones, mes)}
            className="btn-secondary"
            disabled={transacciones.length === 0}
          >
            <Download size={15} /> Exportar PDF
          </button>
          <button onClick={() => setModalNuevo(true)} className="btn-primary">
            <Plus size={15} /> Registrar
          </button>
        </div>
      </div>

      {/* Navegador de mes */}
      <div className="flex items-center gap-3">
        <button onClick={() => setMes(m => subMonths(m,1))} className="btn-secondary p-2">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-gray-700 capitalize min-w-32 text-center">
          {mesLabel}
        </span>
        <button
          onClick={() => setMes(m => addMonths(m,1))}
          className="btn-secondary p-2"
          disabled={startOfMonth(addMonths(mes,1)) > startOfMonth(new Date())}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Cards resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Ingresos',  valor: ingresos, icon: TrendingUp,   color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Egresos',   valor: egresos,  icon: TrendingDown, color: 'text-red-500',   bg: 'bg-red-50'   },
          { label: 'Balance',   valor: balance,  icon: DollarSign,
            color: balance >= 0 ? 'text-teal-600' : 'text-red-500',
            bg:    balance >= 0 ? 'bg-teal-50'    : 'bg-red-50' },
        ].map(({ label, valor, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{fmtUSD(valor)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfica de ingresos por categoría */}
      {dataDonut.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Ingresos por categoría — {mesLabel}
          </h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataDonut}
                  dataKey="value"
                  nameKey="name"
                  cx="35%"
                  cy="50%"
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {dataDonut.map((_, i) => (
                    <Cell key={i} fill={COLORES_CATEGORIAS[i % COLORES_CATEGORIAS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={v => [fmtUSD(v), 'Ingreso']}
                  contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #E5E7EB' }}
                />
                <Legend
                  layout="vertical" align="right" verticalAlign="middle"
                  iconType="circle" iconSize={8}
                  formatter={name => <span style={{ fontSize: 11, color: '#6B7280' }}>{name}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filtros + tabla */}
      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-gray-900">Transacciones</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro tipo */}
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-medium">
              {['TODOS','INGRESO','EGRESO'].map(t => (
                <button
                  key={t}
                  onClick={() => setFiltroTipo(t)}
                  className={`px-3 py-1.5 transition-colors
                              ${filtroTipo === t
                                ? 'bg-teal-600 text-white'
                                : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {t === 'TODOS' ? 'Todos' : t === 'INGRESO' ? '↑ Ingresos' : '↓ Egresos'}
                </button>
              ))}
            </div>
            {/* Buscador */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-8 py-1.5 text-xs w-44"
                placeholder="Buscar..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filtradas.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="Sin transacciones"
            description={busqueda ? `Sin resultados para "${busqueda}"` : 'Registra el primer movimiento del mes'}
            action={!busqueda && (
              <button onClick={() => setModalNuevo(true)} className="btn-primary">
                <Plus size={15} /> Registrar
              </button>
            )}
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th className="text-right">Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(t => (
                  <tr key={t.id}>
                    <td className="text-xs text-gray-500 font-mono w-20">
                      {t.fecha ? format(new Date(t.fecha + 'T12:00:00'), 'd MMM', { locale: es }) : '—'}
                    </td>
                    <td className="w-24">
                      <Badge variant={t.tipo === 'INGRESO' ? 'success' : 'danger'}>
                        {t.tipo === 'INGRESO' ? '↑ Ingreso' : '↓ Egreso'}
                      </Badge>
                    </td>
                    <td className="text-sm text-gray-600">{t.categoria}</td>
                    <td className="text-sm text-gray-400">{t.descripcion || '—'}</td>
                    <td className={`text-sm font-bold text-right ${
                      t.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {t.tipo === 'INGRESO' ? '+' : '-'}{fmtUSD(t.monto)}
                    </td>
                    <td className="w-10">
                      <button
                        onClick={() => setConfirmarDel(t)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300
                                   hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totales */}
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Total del período
                  </td>
                  <td className={`px-4 py-3 text-base font-bold text-right ${
                    balance >= 0 ? 'text-teal-600' : 'text-red-500'
                  }`}>
                    {balance >= 0 ? '+' : ''}{fmtUSD(balance)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal nueva transacción */}
      <Modal
        open={modalNuevo}
        onClose={() => setModalNuevo(false)}
        title="Registrar transacción"
        size="md"
      >
        <FormTransaccion
          onSubmit={handleCrear}
          onCancel={() => setModalNuevo(false)}
          loading={crearMutation.isPending}
        />
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal
        open={!!confirmarDel}
        onClose={() => setConfirmarDel(null)}
        title="Eliminar transacción"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmarDel(null)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleEliminar}
              className="btn-danger"
              disabled={eliminarMutation.isPending}
            >
              {eliminarMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          ¿Eliminar la transacción de{' '}
          <strong>{fmtUSD(confirmarDel?.monto ?? 0)}</strong> —{' '}
          {confirmarDel?.categoria}?
          <br />
          <span className="text-gray-400 text-xs">Esta acción no se puede deshacer.</span>
        </p>
      </Modal>

    </div>
  )
}
