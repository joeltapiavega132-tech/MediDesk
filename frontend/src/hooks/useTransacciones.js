import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import toast from 'react-hot-toast'

const KEY = 'transacciones'

export function useTransacciones(mes = new Date()) {
  const inicio = format(startOfMonth(mes), 'yyyy-MM-dd')
  const fin    = format(endOfMonth(mes),   'yyyy-MM-dd')

  return useQuery({
    queryKey: [KEY, inicio, fin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .gte('fecha', inicio)
        .lte('fecha', fin)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 3,
  })
}

export function useCrearTransaccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (datos) => {
      const { data, error } = await supabase
        .from('transacciones')
        .insert(datos)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success(`${data.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'} registrado`)
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  })
}

export function useEliminarTransaccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('transacciones').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Transacción eliminada')
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  })
}
