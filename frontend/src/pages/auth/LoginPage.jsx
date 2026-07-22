import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Stethoscope, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ROLES } from '@/lib/constants'
import toast from 'react-hot-toast'

export function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const { login, rol } = useAuth()
  const navigate       = useNavigate()
  const location       = useLocation()

  // Redirigir al origen o al dashboard correspondiente según rol
  function redirectAfterLogin(rol) {
    const from = location.state?.from?.pathname
    if (from && from !== '/login') return navigate(from, { replace: true })
    if (rol === ROLES.PACIENTE) return navigate('/portal', { replace: true })
    navigate('/', { replace: true })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Completa todos los campos')
      return
    }
    setLoading(true)
    try {
      const { user } = await login(email.trim(), password)
      // El perfil se carga en AuthContext — esperamos un tick
      // La redirección ocurre cuando el contexto actualiza el rol
      toast.success('Bienvenido/a')
      // Pequeño delay para que AuthContext cargue el perfil
      setTimeout(() => redirectAfterLogin(rol), 300)
    } catch (err) {
      const msg = err.message?.includes('Invalid login')
        ? 'Correo o contraseña incorrectos'
        : 'Error al ingresar. Intenta de nuevo.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1829] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.04]"
           style={{
             backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
             backgroundSize: '24px 24px',
           }} />

      {/* Glow teal */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96
                      bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-teal-600
                          items-center justify-center mb-4 shadow-lg shadow-teal-600/30">
            <Stethoscope size={28} className="text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">MediDesk</h1>
          <p className="text-slate-500 text-sm mt-1">Sistema de gestión del consultorio</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-gray-900 text-lg font-semibold mb-6">Iniciar sesión</h2>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600
                            bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label className="input-label">Correo electrónico</label>
              <input
                type="email"
                className="input"
                placeholder="usuario@consultorio.ec"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
            </div>

            <div>
              <label className="input-label">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-1 text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          ¿Problemas para ingresar? Contacta al administrador.
        </p>
      </div>
    </div>
  )
}
