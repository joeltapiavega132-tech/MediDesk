import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit2, Phone, Mail, MapPin,
  CalendarDays, FileText, Camera, ClipboardList,
  CheckCircle2, AlertCircle,
} from 'lucide-react'
import { usePaciente, useEditarPaciente } from '@/hooks/usePacientes'
import { SectionLoader }  from '@/components/ui/Spinner'
import { Modal }          from '@/components/ui/Modal'
import { Badge }          from '@/components/ui/Badge'
import { EmptyState }     from '@/components/ui/EmptyState'
import { FormPaciente }   from './components/FormPaciente'
import { ESTADO_CITA }    from '@/lib/constants'
import { format }         from 'date-fns'
import { es }             from 'date-fns/locale'

const BADGE_MAP = {
  AGENDADA: 'info', CONFIRMADA: 'teal', ATENDIDA: 'success',
  CANCELADA: 'danger', NO_ASISTIO: 'warning',
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon size={15} className="text-gray-400 shrink-0" />
      <span className="text-gray-500 w-28 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}

export function PacienteDetallePage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [modalEdit, setModalEdit] = useState(false)

  const { data: paciente, isLoading, isError } = usePaciente(id)
  const editarMutation = useEditarPaciente()

  async function handleEditar(datos) {
    await editarMutation.mutateAsync({ id, ...datos })
    setModalEdit(false)
  }

  if (isLoading) return <SectionLoader />
  if (isError || !paciente) return (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertCircle size={40} className="text-red-300 mb-3" />
      <p className="text-gray-500">Paciente no encontrado</p>
      <button onClick={() => navigate('/pacientes')} className="btn-secondary mt-4">
        <ArrowLeft size={15} /> Volver
      </button>
    </div>
  )

  const citas        = paciente.citas        ?? []
  const certificados = paciente.certificados ?? []
  const hceUrl       = `/hce/${id}`

  return (
    <div className="flex flex-col gap-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/pacientes" className="hover:text-teal-600 flex items-center gap-1">
          <ArrowLeft size={14} /> Pacientes
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{paciente.nombre}</span>
      </div>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700
                            flex items-center justify-center text-2xl font-bold shrink-0">
              {paciente.nombre?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{paciente.nombre}</h1>
              <div className="flex items-center gap-2 mt-1">
                {paciente.cedula && (
                  <span className="text-sm text-gray-500 font-mono">{paciente.cedula}</span>
                )}
                <Badge variant={paciente.consentimiento_lopdp ? 'success' : 'warning'}>
                  {paciente.consentimiento_lopdp
                    ? <><CheckCircle2 size={10} /> LOPDP firmado</>
                    : <><AlertCircle size={10} /> LOPDP pendiente</>}
                </Badge>
              </div>
            </div>
          </div>
          <button onClick={() => setModalEdit(true)} className="btn-secondary shrink-0">
            <Edit2 size={14} /> Editar
          </button>
        </div>

        <div className="border-t border-gray-100 mt-5 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={Phone}        label="Teléfono"   value={paciente.telefono} />
          <InfoRow icon={Mail}         label="Correo"     value={paciente.correo} />
          <InfoRow icon={MapPin}       label="Dirección"  value={paciente.direccion} />
          <InfoRow icon={CalendarDays} label="Nacimiento"
            value={paciente.fecha_nacimiento
              ? format(new Date(paciente.fecha_nacimiento + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })
              : null} />
        </div>

        {paciente.notas && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <span className="font-semibold">Notas: </span>{paciente.notas}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Citas */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-900">Citas</h2>
              <Badge variant="neutral">{citas.length}</Badge>
            </div>
            <Link to="/agenda" className="text-xs text-teal-600 hover:underline">
              Nueva cita →
            </Link>
          </div>
          {citas.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Sin citas registradas" />
          ) : (
            <div className="divide-y divide-gray-100">
              {citas.slice(0, 6).map(cita => {
                const estado = ESTADO_CITA[cita.estado]
                return (
                  <div key={cita.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{cita.tipo_servicio}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(cita.fecha_hora), "d MMM yyyy · HH:mm", { locale: es })}
                      </p>
                    </div>
                    {estado && <Badge variant={BADGE_MAP[cita.estado]}>{estado.label}</Badge>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Certificados */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-purple-600" />
              <h2 className="text-sm font-semibold text-gray-900">Certificados</h2>
              <Badge variant="neutral">{certificados.length}</Badge>
            </div>
            <Link to="/certificados" className="text-xs text-teal-600 hover:underline">
              Emitir →
            </Link>
          </div>
          {certificados.length === 0 ? (
            <EmptyState icon={FileText} title="Sin certificados emitidos" />
          ) : (
            <div className="divide-y divide-gray-100">
              {certificados.slice(0, 6).map(cert => (
                <div key={cert.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{cert.tipo}</p>
                    <p className="text-xs text-gray-400">
                      Emitido: {format(new Date(cert.fecha_emision), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HCE */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-green-600" />
              <h2 className="text-sm font-semibold text-gray-900">Historia Clínica (HCE)</h2>
            </div>
          </div>
          <div className="px-6 py-8 flex flex-col items-center gap-3 text-center">
            <ClipboardList size={28} className="text-gray-200" />
            <p className="text-sm text-gray-500">Registra las consultas y evolución clínica</p>
            <a href={hceUrl} className="btn-primary inline-flex items-center gap-2">
              <ClipboardList size={15} /> Abrir HCE
            </a>
          </div>
        </div>

        {/* Fotos */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Fotos Before/After</h2>
            </div>
          </div>
          <div className="px-6 py-8 flex flex-col items-center gap-3 text-center">
            <Camera size={28} className="text-gray-200" />
            <p className="text-sm text-gray-500">Las fotos se gestionan desde la HCE</p>
            <a href={hceUrl} className="btn-secondary inline-flex items-center gap-2">
              <Camera size={15} /> Ir a fotos
            </a>
          </div>
        </div>

      </div>

      {/* Modal editar */}
      <Modal
        open={modalEdit}
        onClose={() => setModalEdit(false)}
        title="Editar paciente"
        size="lg"
      >
        <FormPaciente
          inicial={paciente}
          onSubmit={handleEditar}
          onCancel={() => setModalEdit(false)}
          loading={editarMutation.isPending}
        />
      </Modal>
    </div>
  )
}
