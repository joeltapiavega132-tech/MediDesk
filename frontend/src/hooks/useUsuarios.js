import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const KEY = 'usuarios'

// ── Listar todos los perfiles (solo admin) ────────────────────
export function useUsuarios() {
  return useQuery({
    queryKey: [KEY, 'lista'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfiles')
        .select('id, nombre, rol, activo, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}

// ── Crear usuario via Edge Function ──────────────────────────
export function useCrearUsuario() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ nombre, correo, password, rol }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No hay sesión activa')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crear-usuario`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ nombre, correo, password, rol }),
        }
      )

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al crear el usuario')
      return json.usuario
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success(`Usuario ${data.nombre} creado correctamente`)
    },
    onError: (e) => toast.error(e.message),
  })
}

// ── Activar / desactivar usuario ─────────────────────────────
export function useToggleUsuario() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, activo }) => {
      const { error } = await supabase
        .from('perfiles')
        .update({ activo })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success(vars.activo ? 'Usuario activado' : 'Usuario desactivado')
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  })
}

// ── Cambiar rol de un usuario ─────────────────────────────────
export function useCambiarRol() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, rol }) => {
      const { error } = await supabase
        .from('perfiles')
        .update({ rol })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Rol actualizado')
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  })
}
