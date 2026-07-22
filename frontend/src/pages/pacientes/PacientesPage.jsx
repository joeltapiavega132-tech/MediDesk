import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Users, Upload } from 'lucide-react'
import { usePacientes, useCrearPaciente } from '@/hooks/usePacientes'
import { EmptyState }    from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Spinner'
import { Modal }         from '@/components/ui/Modal'
import { Badge }         from '@/components/ui/Badge'
import { FormPaciente }  from './components/FormPaciente'
import { ImportadorCSV } from './components/ImportadorCSV'
import { format }        from 'date-fns'
import { es }            from 'date-fns/locale'

export function PacientesPage() {
  const [busqueda,       setBusqueda]       = useState('')
  const [modalNuevo,     setModalNuevo]     = useState(false)
  const [modalImportar,  setModalImportar]  = useState(false)

  const navigate = useNavigate()
  const { data: pacientes = [], isLoading } = usePacientes(busqueda)
  const crearMutation = useCrearPaciente()

  async function handleCrear(datos) {
    await crearMutation.mutateAsync(datos)
    setModalNuevo(false)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle">
            {isLoading ? 'Cargando...'
              : `${pacientes.length} registro${pacientes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalImportar(true)}
            className="btn-secondary"
          >
            <Upload size={15} />
            Importar CSV
          </button>
          <button onClick={() => setModalNuevo(true)} className="btn-primary">
            <UserPlus size={15} />
            Nuevo paciente
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por nombre, cédula o teléfono..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="card">
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : pacientes.length === 0 ? (
          <EmptyState
            icon={Users}
            title={busqueda ? 'Sin resultados' : 'No hay pacientes aún'}
            description={
              busqueda
                ? `No se encontraron pacientes con "${busqueda}"`
                : 'Registra el primer paciente o importa tu base de Excel'
            }
            action={!busqueda && (
              <div className="flex gap-2">
                <button onClick={() => setModalImportar(true)} className="btn-secondary">
                  <Upload size={15} /> Importar CSV
                </button>
                <button onClick={() => setModalNuevo(true)} className="btn-primary">
                  <UserPlus size={15} /> Nuevo paciente
                </button>
              </div>
            )}
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Cédula</th>
                  <th>Contacto</th>
                  <th>LOPDP</th>
                  <th>Registrado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map(p => (
                  <tr
                    key={p.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/pacientes/${p.id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700
                                        flex items-center justify-center text-xs font-bold shrink-0">
                          {p.nombre?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{p.nombre}</p>
                          {p.correo && (
                            <p className="text-xs text-gray-400">{p.correo}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-gray-600">{p.cedula ?? '—'}</td>
                    <td className="text-sm text-gray-500">{p.telefono ?? '—'}</td>
                    <td>
                      <Badge variant={p.consentimiento_lopdp ? 'success' : 'warning'}>
                        {p.consentimiento_lopdp ? 'Firmado' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="text-xs text-gray-400">
                      {p.created_at
                        ? format(new Date(p.created_at), 'd MMM yyyy', { locale: es })
                        : '—'}
                    </td>
                    <td>
                      <span className="text-teal-600 text-xs font-semibold">Ver →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nuevo paciente */}
      <Modal
        open={modalNuevo}
        onClose={() => setModalNuevo(false)}
        title="Registrar nuevo paciente"
        size="lg"
      >
        <FormPaciente
          onSubmit={handleCrear}
          onCancel={() => setModalNuevo(false)}
          loading={crearMutation.isPending}
        />
      </Modal>

      {/* Modal importador CSV */}
      <Modal
        open={modalImportar}
        onClose={() => setModalImportar(false)}
        title="Importar pacientes desde CSV / Excel"
        size="xl"
      >
        <ImportadorCSV onCerrar={() => setModalImportar(false)} />
      </Modal>
    </div>
  )
}
