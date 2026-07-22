import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const KEY = 'citas'

// ── Citas de un día específico (Dashboard) ────────────────────
export function useCitas(fecha = null) {
  return useQuery({
    queryKey: [KEY, 'dia', fecha],
    queryFn: async () => {
      let q = supabase
        .from('citas')
        .select('*, pacientes(id, nombre, telefono, correo)')
        .order('fecha_hora', { ascending: true })

      if (fecha) {
        q = q
          .gte('fecha_hora', `${fecha}T00:00:00`)
          .lte('fecha_hora', `${fecha}T23:59:59`)
      }
      const { data, error } = await q
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// ── Citas de un rango (Agenda / calendario) ───────────────────
export function useCitasSemana(fechaInicio, fechaFin) {
  return useQuery({
    queryKey: [KEY, 'rango', fechaInicio, fechaFin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citas')
        .select('*, pacientes(id, nombre, telefono, correo)')
        .gte('fecha_hora', fechaInicio)
        .lte('fecha_hora', fechaFin)
        .order('fecha_hora', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!(fechaInicio && fechaFin),
    staleTime: 1000 * 60 * 2,
  })
}

// ── Crear cita ────────────────────────────────────────────────
export function useCrearCita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (cita) => {
      const { data, error } = await supabase
        .from('citas')
        .insert(cita)
        .select('*, pacientes(nombre)')
        .single()
      if (error) throw error
      return data
    },
        onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: [KEY] })
        qc.invalidateQueries({ queryKey: ['pacientes'] })  // <- agregar esta línea
        toast.success(`Cita agendada para ${data.pacientes?.nombre ?? 'el paciente'}`)
      },
    onError: (e) => toast.error(`Error al agendar: ${e.message}`),
  })
}

// ── Actualizar estado ─────────────────────────────────────────
export function useActualizarEstadoCita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, estado }) => {
      const { data, error } = await supabase
        .from('citas')
        .update({ estado })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Estado actualizado')
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  })
}

// ── Editar cita ───────────────────────────────────────────────
export function useEditarCita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...datos }) => {
      const { data, error } = await supabase
        .from('citas')
        .update(datos)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Cita actualizada')
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  })
}

// ── Eliminar cita ─────────────────────────────────────────────
export function useEliminarCita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('citas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Cita eliminada')
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  })
}
