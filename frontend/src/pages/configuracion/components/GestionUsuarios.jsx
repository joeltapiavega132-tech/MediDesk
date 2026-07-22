import { useState } from 'react'
import {
  UserPlus, Shield, ShieldOff, ChevronDown,
  AlertCircle, Eye, EyeOff, CheckCircle2,
} from 'lucide-react'
import {
  useUsuarios, useCrearUsuario,
  useToggleUsuario, useCambiarRol,
} from '@/hooks/useUsuarios'
import { useAuth }       from '@/context/AuthContext'
import { Modal }         from '@/components/ui/Modal'
import { Badge }         from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Spinner'
import { format }        from 'date-fns'
import { es }            from 'date-fns/locale'

// ── Configuración de roles ────────────────────────────────────
const ROLES_ASIGNABLES = [
  { value: 'medico',        label: 'Médico',        desc: 'Accede a agenda, pacientes, HCE y certificados' },
  { value: 'asistente',     label: 'Asistente',     desc: 'Agenda, pacientes y certificados. Sin contabilidad' },
  { value: 'recepcionista', label: 'Recepcionista',  desc: 'Solo agenda y vista de pacientes' },
  { value: 'paciente',      label: 'Paciente',       desc: 'Acceso al portal del paciente' },
]

const BADGE_ROL = {
  admin:         'danger',
  medico:        'teal',
  asistente:     'info',
  recepcionista: 'neutral',
  paciente:      'purple',
}

const LABEL_ROL = {
  admin: 'Admin', medico: 'Médico', asistente: 'Asistente',
  recepcionista: 'Recepcionista', paciente: 'Paciente',
}

// ── Formulario de nuevo usuario ───────────────────────────────
const FORM_VACIO = { nombre: '', correo: '', password: '', rol: 'asistente' }

function FormNuevoUsuario({ onSubmit, onCancel, loading }) {
  const [form,     setForm]     = useState(FORM_VACIO)
  const [errors,   setErrors]   = useState({})
  const [showPass, setShowPass] = useState(false)

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }

  function validate() {
    const err = {}
    if (!form.nombre.trim())  err.nombre  = 'El nombre es obligatorio'
    if (!form.correo.trim())  err.correo  = 'El correo es obligatorio'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
                              err.correo  = 'Correo inválido'
    if (!form.password)       err.password = 'La contraseña es obligatoria'
    if (form.password.length < 8)
                              err.password = 'Mínimo 8 caracteres'
    return err
  }

  function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length) { setErrors(err); return }
    onSubmit(form)
  }

  const rolSeleccionado = ROLES_ASIGNABLES.find(r => r.value === form.rol)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

      {/* Nombre */}
      <div>
        <label className="input-label">Nombre completo <span className="text-red-500">*</span></label>
        <input
          type="text"
          className={`input ${errors.nombre ? 'border-red-400' : ''}`}
          placeholder="Ej. Dra. Carmen López"
          value={form.nombre}
          onChange={e => set('nombre', e.target.value)}
          disabled={loading}
        />
        {errors.nombre && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.nombre}</p>}
      </div>

      {/* Correo */}
      <div>
        <label className="input-label">Correo electrónico <span className="text-red-500">*</span></label>
        <input
          type="email"
          className={`input ${errors.correo ? 'border-red-400' : ''}`}
          placeholder="medico@consultorio.ec"
          value={form.correo}
          onChange={e => set('correo', e.target.value)}
          disabled={loading}
        />
        {errors.correo && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.correo}</p>}
      </div>

      {/* Contraseña */}
      <div>
        <label className="input-label">Contraseña temporal <span className="text-red-500">*</span></label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            className={`input pr-10 ${errors.password ? 'border-red-400' : ''}`}
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPass(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.password}</p>}
        <p className="text-xs text-gray-400 mt-1">
          El usuario puede cambiarla después desde su perfil.
        </p>
      </div>

      {/* Rol */}
      <div>
        <label className="input-label">Rol <span className="text-red-500">*</span></label>
        <div className="relative">
          <select
            className="input appearance-none pr-9"
            value={form.rol}
            onChange={e => set('rol', e.target.value)}
            disabled={loading}
          >
            {ROLES_ASIGNABLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2
                                             text-gray-400 pointer-events-none" />
        </div>
        {rolSeleccionado && (
          <p className="text-xs text-gray-400 mt-1">{rolSeleccionado.desc}</p>
        )}
      </div>

      {/* Nota de seguridad */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-xs text-amber-700">
          <strong>Nota:</strong> No puedes crear usuarios con rol <strong>Admin</strong> desde aquí.
          Los admins se crean directamente en el Dashboard de Supabase para mayor seguridad.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading
            ? <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creando...
              </span>
            : <><UserPlus size={15} /> Crear usuario</>
          }
        </button>
      </div>
    </form>
  )
}

// ── Componente principal ──────────────────────────────────────
export function GestionUsuarios() {
  const [modalNuevo,   setModalNuevo]   = useState(false)
  const [confirmando,  setConfirmando]  = useState(null) // { id, nombre, activo }

  const { user: authUser } = useAuth()

  const { data: usuarios = [], isLoading } = useUsuarios()
  const crearMutation   = useCrearUsuario()
  const toggleMutation  = useToggleUsuario()
  const rolMutation     = useCambiarRol()

  async function handleCrear(form) {
    await crearMutation.mutateAsync(form)
    setModalNuevo(false)
  }

  async function handleToggle() {
    if (!confirmando) return
    await toggleMutation.mutateAsync({
      id:     confirmando.id,
      activo: !confirmando.activo,
    })
    setConfirmando(null)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Header de la sección */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Usuarios del sistema</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Solo el administrador puede crear, activar o cambiar roles
          </p>
        </div>
        <button onClick={() => setModalNuevo(true)} className="btn-primary">
          <UserPlus size={15} /> Nuevo usuario
        </button>
      </div>

      {/* Tabla de usuarios */}
      <div className="card">
        {isLoading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : usuarios.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  const esSelf   = u.id === authUser?.id
                  const esAdmin  = u.rol === 'admin'

                  return (
                    <tr key={u.id}>
                      {/* Nombre */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                           text-xs font-bold shrink-0
                                           ${u.activo
                                             ? 'bg-teal-100 text-teal-700'
                                             : 'bg-gray-100 text-gray-400'}`}>
                            {u.nombre?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${u.activo ? 'text-gray-900' : 'text-gray-400'}`}>
                              {u.nombre}
                              {esSelf && (
                                <span className="ml-2 text-[10px] font-bold text-teal-600
                                                 bg-teal-50 px-1.5 py-0.5 rounded-full">
                                  Tú
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Rol — editable si no es admin ni self */}
                      <td>
                        {esAdmin || esSelf ? (
                          <Badge variant={BADGE_ROL[u.rol] ?? 'neutral'}>
                            {LABEL_ROL[u.rol] ?? u.rol}
                          </Badge>
                        ) : (
                          <div className="relative w-36">
                            <select
                              value={u.rol}
                              onChange={e => rolMutation.mutate({ id: u.id, rol: e.target.value })}
                              disabled={rolMutation.isPending}
                              className="input py-1 text-xs appearance-none pr-7
                                         border-gray-200 bg-gray-50 font-medium"
                            >
                              {ROLES_ASIGNABLES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2
                                                               -translate-y-1/2 text-gray-400
                                                               pointer-events-none" />
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td>
                        <Badge variant={u.activo ? 'success' : 'neutral'}>
                          {u.activo
                            ? <><CheckCircle2 size={10} /> Activo</>
                            : 'Inactivo'}
                        </Badge>
                      </td>

                      {/* Fecha */}
                      <td className="text-xs text-gray-400">
                        {u.created_at
                          ? format(new Date(u.created_at), "d MMM yyyy", { locale: es })
                          : '—'}
                      </td>

                      {/* Acciones */}
                      <td>
                        {!esSelf && !esAdmin && (
                          <button
                            onClick={() => setConfirmando(u)}
                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5
                                        rounded-lg transition-colors
                                        ${u.activo
                                          ? 'text-red-600 hover:bg-red-50'
                                          : 'text-green-600 hover:bg-green-50'}`}
                          >
                            {u.activo
                              ? <><ShieldOff size={13} /> Desactivar</>
                              : <><Shield    size={13} /> Activar</>}
                          </button>
                        )}
                        {(esSelf || esAdmin) && (
                          <span className="text-xs text-gray-300">—</span>
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

      {/* Modal: Nuevo usuario */}
      <Modal
        open={modalNuevo}
        onClose={() => setModalNuevo(false)}
        title="Crear nuevo usuario"
        size="md"
      >
        <FormNuevoUsuario
          onSubmit={handleCrear}
          onCancel={() => setModalNuevo(false)}
          loading={crearMutation.isPending}
        />
      </Modal>

      {/* Modal: Confirmar activar/desactivar */}
      <Modal
        open={!!confirmando}
        onClose={() => setConfirmando(null)}
        title={confirmando?.activo ? 'Desactivar usuario' : 'Activar usuario'}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setConfirmando(null)}
              className="btn-secondary"
              disabled={toggleMutation.isPending}
            >
              Cancelar
            </button>
            <button
              onClick={handleToggle}
              disabled={toggleMutation.isPending}
              className={confirmando?.activo ? 'btn-danger' : 'btn-primary'}
            >
              {toggleMutation.isPending
                ? 'Procesando...'
                : confirmando?.activo
                  ? 'Sí, desactivar'
                  : 'Sí, activar'}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          {confirmando?.activo
            ? <>¿Desactivar a <strong>{confirmando?.nombre}</strong>? No podrá ingresar al sistema
               hasta que lo reactives.</>
            : <>¿Activar a <strong>{confirmando?.nombre}</strong>? Podrá ingresar al sistema
               con sus credenciales.</>}
        </p>
      </Modal>

    </div>
  )
}
