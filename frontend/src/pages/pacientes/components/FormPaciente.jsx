import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

const CAMPOS = [
  { key: 'nombre',           label: 'Nombre completo',    type: 'text',  required: true,  placeholder: 'Ej. María Torres López' },
  { key: 'cedula',           label: 'Cédula / Pasaporte', type: 'text',  required: false, placeholder: '1712345678' },
  { key: 'fecha_nacimiento', label: 'Fecha de nacimiento',type: 'date',  required: false },
  { key: 'telefono',         label: 'Teléfono',           type: 'tel',   required: false, placeholder: '0987001122' },
  { key: 'correo',           label: 'Correo electrónico', type: 'email', required: false, placeholder: 'paciente@email.com' },
  { key: 'direccion',        label: 'Dirección',          type: 'text',  required: false, placeholder: 'Quito, Ecuador' },
]

const INICIAL = {
  nombre: '', cedula: '', fecha_nacimiento: '',
  telefono: '', correo: '', direccion: '', notas: '',
  consentimiento_lopdp: false,
}

export function FormPaciente({ inicial = {}, onSubmit, onCancel, loading }) {
  const [form,   setForm]   = useState({ ...INICIAL, ...inicial })
  const [errors, setErrors] = useState({})

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }))
  }

  function validate() {
    const err = {}
    if (!form.nombre.trim()) err.nombre = 'El nombre es obligatorio'
    if (form.cedula && !/^\d{10,13}$/.test(form.cedula.replace(/\s/g,'')))
      err.cedula = 'Cédula inválida (10 dígitos para Ecuador)'
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      err.correo = 'Correo inválido'
    if (!form.consentimiento_lopdp)
      err.consentimiento_lopdp = 'El paciente debe aceptar el tratamiento de sus datos (LOPDP)'
    return err
  }

  function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length > 0) { setErrors(err); return }
    const data = Object.fromEntries(
      Object.entries(form).filter(([_, v]) => v !== '' && v !== false)
    )
    if (form.consentimiento_lopdp) {
      data.consentimiento_lopdp = true
      data.consentimiento_fecha = new Date().toISOString()
    }
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CAMPOS.map(({ key, label, type, required, placeholder }) => (
          <div key={key} className={key === 'nombre' || key === 'direccion' ? 'sm:col-span-2' : ''}>
            <label className="input-label">
              {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              type={type}
              className={`input ${errors[key] ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder={placeholder}
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              disabled={loading}
            />
            {errors[key] && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />{errors[key]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div>
        <label className="input-label">Notas internas (opcional)</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Alergias, observaciones, referencias..."
          value={form.notas}
          onChange={e => set('notas', e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Consentimiento LOPDP */}
      <div className={`rounded-xl border p-4 ${
        errors.consentimiento_lopdp ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
      }`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 accent-teal-600"
            checked={form.consentimiento_lopdp}
            onChange={e => set('consentimiento_lopdp', e.target.checked)}
            disabled={loading}
          />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Consentimiento de datos (LOPDP Ecuador)<span className="text-red-500 ml-0.5">*</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              El paciente autoriza el tratamiento de sus datos personales con fines médicos,
              conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador.
              {/* TODO producción: reemplazar con enlace a política de privacidad completa del cliente */}
            </p>
          </div>
        </label>
        {errors.consentimiento_lopdp && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1 ml-7">
            <AlertCircle size={12} />{errors.consentimiento_lopdp}
          </p>
        )}
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
            : inicial?.nombre ? 'Guardar cambios' : 'Registrar paciente'}
        </button>
      </div>
    </form>
  )
}
