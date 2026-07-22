import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ClipboardList, Camera, Plus, ArrowLeft,
  ChevronDown, ChevronUp, Trash2, Upload,
  AlertCircle, Scale, Thermometer, Heart,
} from 'lucide-react'
import { useDropzone }   from 'react-dropzone'
import { usePaciente }   from '@/hooks/usePacientes'
import {
  useConsultas, useCrearConsulta,
  useFotos, useSubirFoto, useEliminarFoto,
} from '@/hooks/useHCE'
import { Modal }         from '@/components/ui/Modal'
import { EmptyState }    from '@/components/ui/EmptyState'
import { SectionLoader, TableSkeleton } from '@/components/ui/Spinner'
import { format }        from 'date-fns'
import { es }            from 'date-fns/locale'

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { id: 'consultas', label: 'Consultas clínicas', icon: ClipboardList },
  { id: 'fotos',     label: 'Fotos Before/After',  icon: Camera },
]

// ── Formulario nueva consulta ─────────────────────────────────
const FORM_VACIO = {
  fecha: format(new Date(), 'yyyy-MM-dd'),
  motivo: '', anamnesis: '', examen_fisico: '',
  diagnostico: '', tratamiento: '', observaciones: '',
  peso_kg: '', talla_cm: '', presion: '', temperatura: '',
  medico_nombre: '',
}

function FormConsulta({ pacienteId, onSubmit, onCancel, loading }) {
  const [form,   setForm]   = useState(FORM_VACIO)
  const [error,  setError]  = useState('')
  const [seccion, setSeccion] = useState('subjetivo') // subjetivo | objetivo | plan

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.motivo.trim()) { setError('El motivo de consulta es obligatorio'); return }
    onSubmit({ ...form, paciente_id: pacienteId })
  }

  const secciones = [
    { id: 'subjetivo', label: 'Subjetivo (S)' },
    { id: 'objetivo',  label: 'Objetivo (O)'  },
    { id: 'plan',      label: 'Plan (P)'       },
  ]

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200
                      rounded-xl px-3 py-2 flex items-center gap-2">
          <AlertCircle size={13} />{error}
        </p>
      )}

      {/* Fecha + Médico */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">Fecha</label>
          <input type="date" className="input" value={form.fecha}
            onChange={e => set('fecha', e.target.value)} disabled={loading} />
        </div>
        <div>
          <label className="input-label">Médico responsable</label>
          <input type="text" className="input" placeholder="Dr. Nombre"
            value={form.medico_nombre}
            onChange={e => set('medico_nombre', e.target.value)} disabled={loading} />
        </div>
      </div>

      {/* Constantes vitales */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Constantes vitales (opcional)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'peso_kg',     icon: Scale,       label: 'Peso (kg)',    placeholder: '65.5' },
            { key: 'talla_cm',    icon: ChevronUp,   label: 'Talla (cm)',   placeholder: '170' },
            { key: 'presion',     icon: Heart,        label: 'Presión',      placeholder: '120/80' },
            { key: 'temperatura', icon: Thermometer, label: 'Temp. (°C)',   placeholder: '36.5' },
          ].map(({ key, icon: Icon, label, placeholder }) => (
            <div key={key}>
              <label className="input-label flex items-center gap-1">
                <Icon size={11} />{label}
              </label>
              <input type="text" className="input" placeholder={placeholder}
                value={form[key]}
                onChange={e => set(key, e.target.value)} disabled={loading} />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs SOAP */}
      <div className="flex gap-1 border-b border-gray-200">
        {secciones.map(sec => (
          <button key={sec.id} type="button" onClick={() => setSeccion(sec.id)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors
                        ${seccion === sec.id
                          ? 'border-teal-600 text-teal-600'
                          : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {sec.label}
          </button>
        ))}
      </div>

      {/* Contenido por sección */}
      {seccion === 'subjetivo' && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="input-label">Motivo de consulta <span className="text-red-500">*</span></label>
            <input type="text" className="input"
              placeholder="Ej. Dolor en zona operada, control post-operatorio..."
              value={form.motivo}
              onChange={e => set('motivo', e.target.value)} disabled={loading} />
          </div>
          <div>
            <label className="input-label">Anamnesis</label>
            <textarea className="input resize-none" rows={4}
              placeholder="Historia del padecimiento actual, antecedentes relevantes..."
              value={form.anamnesis}
              onChange={e => set('anamnesis', e.target.value)} disabled={loading} />
          </div>
        </div>
      )}

      {seccion === 'objetivo' && (
        <div>
          <label className="input-label">Examen físico / hallazgos</label>
          <textarea className="input resize-none" rows={5}
            placeholder="Describe los hallazgos del examen físico..."
            value={form.examen_fisico}
            onChange={e => set('examen_fisico', e.target.value)} disabled={loading} />
        </div>
      )}

      {seccion === 'plan' && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="input-label">Diagnóstico</label>
            <textarea className="input resize-none" rows={2}
              placeholder="Diagnóstico principal y diferenciales..."
              value={form.diagnostico}
              onChange={e => set('diagnostico', e.target.value)} disabled={loading} />
          </div>
          <div>
            <label className="input-label">Tratamiento / indicaciones</label>
            <textarea className="input resize-none" rows={3}
              placeholder="Medicamentos, procedimientos, indicaciones al paciente..."
              value={form.tratamiento}
              onChange={e => set('tratamiento', e.target.value)} disabled={loading} />
          </div>
          <div>
            <label className="input-label">Observaciones adicionales</label>
            <textarea className="input resize-none" rows={2}
              placeholder="Notas adicionales, próxima cita..."
              value={form.observaciones}
              onChange={e => set('observaciones', e.target.value)} disabled={loading} />
          </div>
        </div>
      )}

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
            : <><Plus size={15} /> Registrar consulta</>}
        </button>
      </div>
    </form>
  )
}

// ── Card de consulta expandible ───────────────────────────────
function ConsultaCard({ consulta }) {
  const [expandida, setExpandida] = useState(false)

  const vitales = [
    consulta.peso_kg     && `${consulta.peso_kg} kg`,
    consulta.talla_cm    && `${consulta.talla_cm} cm`,
    consulta.presion     && `PA: ${consulta.presion}`,
    consulta.temperatura && `T°: ${consulta.temperatura}°C`,
  ].filter(Boolean)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpandida(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3
                   hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700
                          flex items-center justify-center shrink-0">
            <ClipboardList size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{consulta.motivo}</p>
            <p className="text-xs text-gray-400">
              {consulta.fecha
                ? format(new Date(consulta.fecha + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })
                : '—'}
              {consulta.medico_nombre && ` · ${consulta.medico_nombre}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {vitales.length > 0 && (
            <div className="hidden sm:flex gap-2">
              {vitales.map((v, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {v}
                </span>
              ))}
            </div>
          )}
          {expandida ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Contenido expandido */}
      {expandida && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Anamnesis',       value: consulta.anamnesis },
              { label: 'Examen físico',   value: consulta.examen_fisico },
              { label: 'Diagnóstico',     value: consulta.diagnostico },
              { label: 'Tratamiento',     value: consulta.tratamiento },
              { label: 'Observaciones',   value: consulta.observaciones },
            ].filter(f => f.value).map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {label}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Subidor de fotos con Dropzone ─────────────────────────────
function SubidorFoto({ pacienteId, onClose }) {
  const [tipo,         setTipo]         = useState('ANTES')
  const [procedimiento,setProcedimiento] = useState('')
  const [archivo,      setArchivo]      = useState(null)
  const [preview,      setPreview]      = useState(null)

  const subirMutation = useSubirFoto()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpg','.jpeg','.png','.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: ([file]) => {
      if (!file) return
      setArchivo(file)
      setPreview(URL.createObjectURL(file))
    },
    onDropRejected: () => toast.error('Archivo inválido. Máximo 5MB, solo imágenes.'),
  })

  async function handleSubir() {
    if (!archivo) return
    await subirMutation.mutateAsync({ pacienteId, tipo, procedimiento, archivo })
    onClose()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2">
        {['ANTES','DESPUES'].map(t => (
          <button key={t} type="button" onClick={() => setTipo(t)}
            className={`py-2.5 rounded-xl text-sm font-semibold border transition-all
                        ${tipo === t
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'border-gray-200 text-gray-600 hover:border-teal-400'}`}>
            {t === 'ANTES' ? '📷 Antes' : '✨ Después'}
          </button>
        ))}
      </div>

      {/* Procedimiento */}
      <div>
        <label className="input-label">Procedimiento (opcional)</label>
        <input type="text" className="input"
          placeholder="Ej. Rinoplastia, Láser CO2..."
          value={procedimiento}
          onChange={e => setProcedimiento(e.target.value)} />
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
                    transition-all
                    ${isDragActive
                      ? 'border-teal-400 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Upload size={22} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra o haz click para seleccionar'}
            </p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP · Máximo 5MB</p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">Cancelar</button>
        <button
          onClick={handleSubir}
          disabled={!archivo || subirMutation.isPending}
          className="btn-primary"
        >
          {subirMutation.isPending
            ? <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Subiendo...
              </span>
            : <><Upload size={15} /> Subir foto</>}
        </button>
      </div>
    </div>
  )
}

// ── Galería de fotos ──────────────────────────────────────────
function GaleriaFotos({ pacienteId }) {
  const [modalSubir,    setModalSubir]    = useState(false)
  const [fotoComparar,  setFotoComparar]  = useState(null)
  const [confirmarDel,  setConfirmarDel]  = useState(null)

  const { data: fotos = [], isLoading } = useFotos(pacienteId)
  const eliminarMutation = useEliminarFoto()

  const fotosAntes   = fotos.filter(f => f.tipo === 'ANTES')
  const fotosDespues = fotos.filter(f => f.tipo === 'DESPUES')

  async function handleEliminar() {
    if (!confirmarDel) return
    await eliminarMutation.mutateAsync({
      id: confirmarDel.id,
      pacienteId,
      url: confirmarDel.url,
    })
    setConfirmarDel(null)
  }

  if (isLoading) return <TableSkeleton rows={2} cols={3} />

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button onClick={() => setModalSubir(true)} className="btn-primary">
          <Camera size={15} /> Subir foto
        </button>
      </div>

      {fotos.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="Sin fotos registradas"
          description="Sube fotos de antes y después de los procedimientos"
          action={
            <button onClick={() => setModalSubir(true)} className="btn-primary">
              <Camera size={15} /> Subir primera foto
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Antes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Antes ({fotosAntes.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {fotosAntes.map(foto => (
                <div key={foto.id} className="relative group">
                  <img
                    src={foto.url}
                    alt="Antes"
                    className="w-full h-40 object-cover rounded-xl border border-gray-200
                               cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setFotoComparar(foto)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20
                                  rounded-xl transition-all flex items-end p-2 opacity-0
                                  group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmarDel(foto) }}
                      className="p-1.5 bg-red-500 text-white rounded-lg"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {foto.procedimiento && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{foto.procedimiento}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {foto.fecha ? format(new Date(foto.fecha + 'T12:00:00'), "d MMM yyyy", { locale: es }) : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Después */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              Después ({fotosDespues.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {fotosDespues.map(foto => (
                <div key={foto.id} className="relative group">
                  <img
                    src={foto.url}
                    alt="Después"
                    className="w-full h-40 object-cover rounded-xl border border-gray-200
                               cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setFotoComparar(foto)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20
                                  rounded-xl transition-all flex items-end p-2 opacity-0
                                  group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmarDel(foto) }}
                      className="p-1.5 bg-red-500 text-white rounded-lg"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {foto.procedimiento && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{foto.procedimiento}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {foto.fecha ? format(new Date(foto.fecha + 'T12:00:00'), "d MMM yyyy", { locale: es }) : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal subir foto */}
      <Modal open={modalSubir} onClose={() => setModalSubir(false)}
             title="Subir foto Before/After" size="md">
        <SubidorFoto pacienteId={pacienteId} onClose={() => setModalSubir(false)} />
      </Modal>

      {/* Modal foto ampliada */}
      <Modal open={!!fotoComparar} onClose={() => setFotoComparar(null)}
             title={`Foto — ${fotoComparar?.tipo === 'ANTES' ? 'Antes' : 'Después'}`} size="lg">
        {fotoComparar && (
          <div className="flex flex-col items-center gap-3">
            <img src={fotoComparar.url} alt="Foto"
                 className="max-h-96 w-full object-contain rounded-xl" />
            {fotoComparar.procedimiento && (
              <p className="text-sm text-gray-600">{fotoComparar.procedimiento}</p>
            )}
          </div>
        )}
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal open={!!confirmarDel} onClose={() => setConfirmarDel(null)}
             title="Eliminar foto" size="sm"
             footer={
               <>
                 <button onClick={() => setConfirmarDel(null)} className="btn-secondary">Cancelar</button>
                 <button onClick={handleEliminar} className="btn-danger"
                         disabled={eliminarMutation.isPending}>
                   {eliminarMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                 </button>
               </>
             }>
        <p className="text-sm text-gray-600">
          ¿Eliminar esta foto? La imagen se borrará permanentemente.
        </p>
      </Modal>
    </div>
  )
}

// ── Página principal HCE ──────────────────────────────────────
export function HCEPage() {
  const { id: pacienteId } = useParams()
  const [tabActiva,     setTabActiva]     = useState('consultas')
  const [modalConsulta, setModalConsulta] = useState(false)

  const { data: paciente, isLoading: loadingPac } = usePaciente(pacienteId)
  const { data: consultas = [], isLoading: loadingCons } = useConsultas(pacienteId)
  const crearMutation = useCrearConsulta()

  if (loadingPac) return <SectionLoader />

  async function handleCrearConsulta(datos) {
    await crearMutation.mutateAsync(datos)
    setModalConsulta(false)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/pacientes" className="hover:text-teal-600">Pacientes</Link>
        <span>/</span>
        <Link to={`/pacientes/${pacienteId}`} className="hover:text-teal-600">
          {paciente?.nombre}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Historia Clínica</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Historia Clínica Electrónica</h1>
          <p className="page-subtitle">{paciente?.nombre}</p>
        </div>
        {tabActiva === 'consultas' && (
          <button onClick={() => setModalConsulta(true)} className="btn-primary">
            <Plus size={15} /> Nueva consulta
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setTabActiva(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                        border-b-2 -mb-px transition-colors
                        ${tabActiva === tab.id
                          ? 'border-teal-600 text-teal-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tabActiva === 'consultas' && (
        <div className="flex flex-col gap-3">
          {loadingCons ? (
            <TableSkeleton rows={3} cols={1} />
          ) : consultas.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={ClipboardList}
                title="Sin consultas registradas"
                description="Registra la primera consulta clínica de este paciente"
                action={
                  <button onClick={() => setModalConsulta(true)} className="btn-primary">
                    <Plus size={15} /> Nueva consulta
                  </button>
                }
              />
            </div>
          ) : (
            consultas.map(c => <ConsultaCard key={c.id} consulta={c} />)
          )}
        </div>
      )}

      {tabActiva === 'fotos' && (
        <div className="card p-5">
          <GaleriaFotos pacienteId={pacienteId} />
        </div>
      )}

      {/* Modal nueva consulta */}
      <Modal open={modalConsulta} onClose={() => setModalConsulta(false)}
             title="Registrar consulta clínica" size="lg">
        <FormConsulta
          pacienteId={pacienteId}
          onSubmit={handleCrearConsulta}
          onCancel={() => setModalConsulta(false)}
          loading={crearMutation.isPending}
        />
      </Modal>
    </div>
  )
}
