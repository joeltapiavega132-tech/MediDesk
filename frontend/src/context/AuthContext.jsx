import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { ROLES, PERMISOS } from '@/lib/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [perfil,  setPerfil]  = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchPerfil = useCallback(async (userId) => {
    try {
      // DESPUÉS
        const { data, error } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', userId)
  .single()
      if (error) throw error
      setPerfil(data)
    } catch (err) {
      console.error('[AuthContext] Error cargando perfil:', err.message)
      setPerfil(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchPerfil(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchPerfil(session.user.id)
      else { setPerfil(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [fetchPerfil])

  // ── Auth actions ────────────────────────────────────────────
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // ── Helpers de rol ───────────────────────────────────────────
  const rol = perfil?.rol ?? null

  const isAdmin     = rol === ROLES.ADMIN
  const isMedico    = rol === ROLES.MEDICO
  const isAsistente = rol === ROLES.ASISTENTE
  const isPaciente  = rol === ROLES.PACIENTE

  // Verifica si el usuario tiene acceso a un módulo
  function puedeAcceder(modulo) {
    if (!rol) return false
    return PERMISOS[modulo]?.includes(rol) ?? false
  }

  // Nombre para mostrar
  const displayName = perfil?.nombre?.split(' ')[0] ?? user?.email ?? 'Usuario'
  const avatarChar  = perfil?.nombre?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <AuthContext.Provider value={{
      user, perfil, loading,
      rol, isAdmin, isMedico, isAsistente, isPaciente,
      displayName, avatarChar,
      login, logout, puedeAcceder,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
