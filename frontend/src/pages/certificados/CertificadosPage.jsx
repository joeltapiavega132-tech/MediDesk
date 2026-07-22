import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Plus, Download, Printer,
  Search, Eye, AlertCircle, ChevronDown,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase }          from '@/lib/supabase'
import { usePacientes }      from '@/hooks/usePacientes'
import { Modal }             from '@/components/ui/Modal'
import { Badge }             from '@/components/ui/Badge'
import { EmptyState }        from '@/components/ui/EmptyState'
import { TableSkeleton }     from '@/components/ui/Spinner'
import { descargarPDF, imprimirPDF, pdfABase64 } from '@/lib/generarPDF'
import { TIPO_CERTIFICADO }  from '@/lib/constants'
import { format }            from 'date-fns'
import { es }                from 'date-fns/locale'
import toast                 from 'react-hot-toast'

// ── Hook certificados ─────────────────────────────────────────
function useCertificados() {
  return useQuery({
    queryKey: ['certificados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificados')
        .select('*, pacientes(id, nombre, cedula, correo)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 3,
  })
}

function useCrearCertificado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (datos) => {
      const { data, error } = await supabase
        .from('certificados')
        .insert(datos)
        .select('*, pacientes(id, nombre, cedula, correo)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificados'] })
      toast.success('Certificado registrado')
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  })
}

// ── Formulario dinámico ───────────────────────────────────────
const FORM_VACIO = {
  paciente_id:         '',
  tipo:                'REPOSO',
  motivo:              '',
  dias_reposo:         '',
  procedimiento:       '',
  fecha_procedimiento: '',
  observaciones:       '',
  fecha_emision:       format(new Date(), 'yyyy-MM-dd'),
  fecha_caducidad:     '',
  medico_nombre:       '',
}

function FormCertificado({ onSubmit, onCancel, loading }) {
  const [form,  setForm]  = useState(FORM_VACIO)
  const [error, setError] = useState('')
  const { data: pacientes = [] } = usePacientes()

  const tipoConfig = TIPO_CERTIFICADO[form.tipo]

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  function validate() {
    if (!form.paciente_id)   return 'Selecciona un paciente'
    if (!form.medico_nombre) return 'Ingresa el nombre del médico'
    if (form.tipo === 'REPOSO' && !form.motivo) return 'Ingresa el motivo del reposo'
    return ''
  }

  function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200
                      rounded-xl px-3 py-2 flex items-center gap-2">
          <AlertCircle size={13} />{error}
        </p>
      )}

      {/* Tipo de certificado */}
      <div>
        <label className="input-label">Tipo de certificado</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(TIPO_CERTIFICADO).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => set('tipo', key)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left
                          ${form.tipo === key
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'border-gray-200 text-gray-600 hover:border-teal-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Paciente + Médico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="input-label">Paciente <span className="text-red-500">*</span></label>
          <select
            className="input"
            value={form.paciente_id}
            onChange={e => set('paciente_id', e.target.value)}
            disabled={loading}
          >
            <option value="">— Seleccionar —</option>
            {pacientes.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label">Médico responsable <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="input"
            placeholder="Dr. Nombre Apellido"
            value={form.medico_nombre}
            onChange={e => set('medico_nombre', e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Campos dinámicos según tipo */}
      {(form.tipo === 'REPOSO' || form.tipo === 'GENERICO') && (
        <div>
          <label className="input-label">
            Motivo {form.tipo === 'REPOSO' && <span className="text-red-500">*</span>}
          </label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Describe el motivo o diagnóstico..."
            value={form.motivo}
            onChange={e => set('motivo', e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      {form.tipo === 'REPOSO' && (
        <div>
          <label className="input-label">Días de reposo</label>
          <input
            type="number"
            className="input"
            placeholder="Ej. 3"
            min="1"
            max="365"
            value={form.dias_reposo}
            onChange={e => set('dias_reposo', e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      {form.tipo === 'PROCEDIMIENTO' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="input-label">Procedimiento realizado</label>
            <input
              type="text"
              className="input"
              placeholder="Ej. Rinoplastia"
              value={form.procedimiento}
              onChange={e => set('procedimiento', e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="input-label">Fecha del procedimiento</label>
            <input
              type="date"
              className="input"
              value={form.fecha_procedimiento}
              onChange={e => set('fecha_procedimiento', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      )}

      {tipoConfig?.campos.includes('observaciones') && (
        <div>
          <label className="input-label">Observaciones</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Observaciones adicionales..."
            value={form.observaciones}
            onChange={e => set('observaciones', e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      {/* Fechas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="input-label">Fecha de emisión</label>
          <input
            type="date"
            className="input"
            value={form.fecha_emision}
            onChange={e => set('fecha_emision', e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="input-label">Fecha de caducidad (opcional)</label>
          <input
            type="date"
            className="input"
            value={form.fecha_caducidad}
            onChange={e => set('fecha_caducidad', e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading
            ? <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando...
              </span>
            : <><Plus size={15} /> Generar certificado</>}
        </button>
      </div>
    </form>
  )
}

// ── Badge tipo ────────────────────────────────────────────────
const BADGE_TIPO = {
  REPOSO:        'info',
  APTITUD:       'success',
  PROCEDIMIENTO: 'purple',
  GENERICO:      'neutral',
}

// ── Página principal ──────────────────────────────────────────
export function CertificadosPage() {
  const [modalNuevo,   setModalNuevo]   = useState(false)
  const [busqueda,     setBusqueda]     = useState('')

  const { data: certificados = [], isLoading } = useCertificados()
  const crearMutation = useCrearCertificado()
  const { data: pacientes = [] } = usePacientes()

  // Filtrar por búsqueda
  const filtrados = certificados.filter(c =>
    !busqueda ||
    c.pacientes?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.tipo?.toLowerCase().includes(busqueda.toLowerCase())
  )

  async function handleCrear(form) {
    // Buscar datos del paciente seleccionado
    const paciente = pacientes.find(p => p.id === form.paciente_id)

    // Datos para el PDF
    const datosPDF = {
      tipo:                form.tipo,
      paciente_nombre:     paciente?.nombre ?? '',
      paciente_cedula:     paciente?.cedula ?? '',
      medico_nombre:       form.medico_nombre,
      motivo:              form.motivo,
      dias_reposo:         form.dias_reposo ? Number(form.dias_reposo) : undefined,
      procedimiento:       form.procedimiento,
      fecha_procedimiento: form.fecha_procedimiento
        ? format(new Date(form.fecha_procedimiento + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })
        : undefined,
      observaciones:       form.observaciones,
      fecha_emision:       format(new Date(form.fecha_emision + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es }),
      fecha_caducidad:     form.fecha_caducidad
        ? format(new Date(form.fecha_caducidad + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })
        : undefined,
    }

    // Guardar en Supabase
    await crearMutation.mutateAsync({
      paciente_id:     form.paciente_id,
      tipo:            form.tipo,
      motivo:          form.motivo || null,
      fecha_emision:   form.fecha_emision,
      fecha_caducidad: form.fecha_caducidad || null,
      notas_adicionales: form.observaciones || null,
      correo_destino:  paciente?.correo || null,
    })

    // Generar y descargar PDF automáticamente
    descargarPDF(datosPDF, `certificado_${paciente?.nombre?.replace(/\s+/g,'_')}_${Date.now()}.pdf`)

    setModalNuevo(false)
  }

  function handleDescargar(cert) {
    const datosPDF = {
      tipo:            cert.tipo,
      paciente_nombre: cert.pacientes?.nombre ?? '',
      paciente_cedula: cert.pacientes?.cedula ?? '',
      motivo:          cert.motivo ?? '',
      observaciones:   cert.notas_adicionales ?? '',
      fecha_emision:   cert.fecha_emision
        ? format(new Date(cert.fecha_emision + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })
        : '',
      fecha_caducidad: cert.fecha_caducidad
        ? format(new Date(cert.fecha_caducidad + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })
        : undefined,
    }
    descargarPDF(datosPDF, `certificado_${cert.pacientes?.nombre?.replace(/\s+/g,'_')}.pdf`)
  }

  function handleImprimir(cert) {
    const datosPDF = {
      tipo:            cert.tipo,
      paciente_nombre: cert.pacientes?.nombre ?? '',
      paciente_cedula: cert.pacientes?.cedula ?? '',
      motivo:          cert.motivo ?? '',
      observaciones:   cert.notas_adicionales ?? '',
      fecha_emision:   cert.fecha_emision
        ? format(new Date(cert.fecha_emision + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })
        : '',
      fecha_caducidad: cert.fecha_caducidad
        ? format(new Date(cert.fecha_caducidad + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })
        : undefined,
    }
    imprimirPDF(datosPDF)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Certificados Médicos</h1>
          <p className="page-subtitle">{filtrados.length} certificados</p>
        </div>
        <button onClick={() => setModalNuevo(true)} className="btn-primary">
          <Plus size={15} /> Nuevo certificado
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por paciente o tipo..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="card">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No hay certificados aún"
            description="Genera el primer certificado médico del consultorio"
            action={
              <button onClick={() => setModalNuevo(true)} className="btn-primary">
                <Plus size={15} /> Nuevo certificado
              </button>
            }
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Tipo</th>
                  <th>Emisión</th>
                  <th>Caducidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(cert => (
                  <tr key={cert.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700
                                        flex items-center justify-center text-xs font-bold shrink-0">
                          {cert.pacientes?.nombre?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {cert.pacientes?.nombre ?? '—'}
                          </p>
                          {cert.pacientes?.cedula && (
                            <p className="text-xs text-gray-400 font-mono">
                              {cert.pacientes.cedula}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={BADGE_TIPO[cert.tipo] ?? 'neutral'}>
                        {TIPO_CERTIFICADO[cert.tipo]?.label ?? cert.tipo}
                      </Badge>
                    </td>
                    <td className="text-sm text-gray-600">
                      {cert.fecha_emision
                        ? format(new Date(cert.fecha_emision + 'T12:00:00'), "d MMM yyyy", { locale: es })
                        : '—'}
                    </td>
                    <td>
                      {cert.fecha_caducidad ? (
                        <span className={`text-sm ${
                          new Date(cert.fecha_caducidad) < new Date()
                            ? 'text-red-500 font-medium'
                            : 'text-gray-600'
                        }`}>
                          {format(new Date(cert.fecha_caducidad + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                          {new Date(cert.fecha_caducidad) < new Date() && ' · Vencido'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sin caducidad</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDescargar(cert)}
                          className="p-1.5 rounded-lg hover:bg-teal-50 text-gray-400
                                     hover:text-teal-600 transition-colors"
                          title="Descargar PDF"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => handleImprimir(cert)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400
                                     hover:text-blue-600 transition-colors"
                          title="Imprimir"
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nuevo certificado */}
      <Modal
        open={modalNuevo}
        onClose={() => setModalNuevo(false)}
        title="Generar certificado médico"
        size="lg"
      >
        <FormCertificado
          onSubmit={handleCrear}
          onCancel={() => setModalNuevo(false)}
          loading={crearMutation.isPending}
        />
      </Modal>
    </div>
  )
}
