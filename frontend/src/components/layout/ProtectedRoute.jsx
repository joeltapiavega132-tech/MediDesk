import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/ui/Spinner'

/**
 * ProtectedRoute
 * 
 * Props:
 *   - roles: string[] — roles permitidos (si no se pasa, solo requiere auth)
 *   - modulo: string  — clave de PERMISOS para verificar acceso
 * 
 * Ejemplo:
 *   <ProtectedRoute roles={['admin']} />
 *   <ProtectedRoute modulo="contabilidad" />
 */
export function ProtectedRoute({ children, roles, modulo }) {
  const { user, loading, puedeAcceder, rol } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />

  // No autenticado → login
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  // Verificar por módulo
  if (modulo && !puedeAcceder(modulo)) {
    return <Navigate to="/" replace />
  }

  // Verificar por roles explícitos
  if (roles && !roles.includes(rol)) {
    return <Navigate to="/" replace />
  }

  return children
}
