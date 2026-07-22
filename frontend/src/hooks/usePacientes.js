import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const KEY = 'pacientes'

export function usePacientes(busqueda = '') {
  return useQuery({
    queryKey: [KEY, 'lista', busqueda],
    queryFn: async () => {
      let q = supabase
        .from('pacientes')
        .select('id, nombre, cedula, telefono, correo, consentimiento_lopdp, created_at')
        .order('created_at', { ascending: false })

      if (busqueda.trim()) {
        q = q.or(`nombre.ilike.%${busqueda}%,cedula.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 3,
  })
}

export function usePaciente(id) {
  return useQuery({
    queryKey: [KEY, 'detalle', id],
    queryFn: async () => {
      // DESPUÉS
        const { data, error } = await supabase
          .from('pacientes')
          .select(`
            *,
            citas (id, tipo_servicio, fecha_hora, estado)
          `)
          .eq('id', id)
          .order('fecha_hora', { referencedTable: 'citas', ascending: false })
          .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCrearPaciente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (datos) => {
      const { data, error } = await supabase
        .from('pacientes').insert(datos).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Paciente registrado correctamente')
    },
    onError: (e) => toast.error(`Error al registrar: ${e.message}`),
  })
}

export function useEditarPaciente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...datos }) => {
      const { data, error } = await supabase
        .from('pacientes').update(datos).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Paciente actualizado')
    },
    onError: (e) => toast.error(`Error al actualizar: ${e.message}`),
  })
}

export function useEliminarPaciente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      // TODO producción: implementar soft-delete o anonimización (LOPDP derecho al olvido)
      const { error } = await supabase.from('pacientes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Paciente eliminado')
    },
    onError: (e) => toast.error(`Error al eliminar: ${e.message}`),
  })
}
