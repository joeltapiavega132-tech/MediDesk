import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const KEY_HCE   = 'hce'
const KEY_FOTOS = 'fotos'

// ── Consultas clínicas del paciente ──────────────────────────
export function useConsultas(pacienteId) {
  return useQuery({
    queryKey: [KEY_HCE, 'consultas', pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hce_consultas')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!pacienteId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCrearConsulta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (datos) => {
      const { data, error } = await supabase
        .from('hce_consultas')
        .insert(datos)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY_HCE, 'consultas', data.paciente_id] })
      toast.success('Consulta registrada en HCE')
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  })
}

// ── Fotos Before/After ────────────────────────────────────────
export function useFotos(pacienteId) {
  return useQuery({
    queryKey: [KEY_FOTOS, pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fotos_paciente')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!pacienteId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSubirFoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ pacienteId, tipo, procedimiento, archivo }) => {
      // 1. Subir imagen a Supabase Storage
      const ext      = archivo.name.split('.').pop()
      const fileName = `${pacienteId}/${Date.now()}_${tipo}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, archivo, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('fotos')
        .getPublicUrl(fileName)

      // 3. Registrar en la tabla
      const { data, error } = await supabase
        .from('fotos_paciente')
        .insert({
          paciente_id:  pacienteId,
          tipo,
          procedimiento,
          url:          publicUrl,
          fecha:        new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY_FOTOS, data.paciente_id] })
      toast.success('Foto subida correctamente')
    },
    onError: (e) => toast.error(`Error al subir foto: ${e.message}`),
  })
}

export function useEliminarFoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pacienteId, url }) => {
      // Eliminar de Storage
      const path = url.split('/fotos/')[1]
      if (path) {
        await supabase.storage.from('fotos').remove([path])
      }
      // Eliminar registro
      const { error } = await supabase.from('fotos_paciente').delete().eq('id', id)
      if (error) throw error
      return { pacienteId }
    },
    onSuccess: ({ pacienteId }) => {
      qc.invalidateQueries({ queryKey: [KEY_FOTOS, pacienteId] })
      toast.success('Foto eliminada')
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  })
}
