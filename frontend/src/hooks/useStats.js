import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

// ── Stats del día + mes actual ─────────────────────────────────────────────
export function useStatsHoy() {
  const hoy = format(new Date(), 'yyyy-MM-dd')
  const inicioMes = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const finMes    = format(endOfMonth(new Date()),   'yyyy-MM-dd')

  return useQuery({
    queryKey: ['stats', 'hoy', hoy],
    queryFn: async () => {
      const [citas, pacientes, certificados, transacciones] = await Promise.all([
        supabase
          .from('citas')
          .select('id, estado')
          .gte('fecha_hora', `${hoy}T00:00:00`)
          .lte('fecha_hora', `${hoy}T23:59:59`),

        supabase
          .from('pacientes')
          .select('id', { count: 'exact', head: true }),

        supabase
          .from('certificados')
          .select('id', { count: 'exact', head: true })
          .gte('fecha_emision', inicioMes)
          .lte('fecha_emision', finMes),

        supabase
          .from('transacciones')
          .select('tipo, monto')
          .gte('fecha', inicioMes)
          .lte('fecha', finMes),
      ])

      const txs = transacciones.data ?? []
      const ingresos = txs.filter(t => t.tipo === 'INGRESO').reduce((s, t) => s + Number(t.monto), 0)
      const egresos  = txs.filter(t => t.tipo === 'EGRESO' ).reduce((s, t) => s + Number(t.monto), 0)
      const citasArr = citas.data ?? []

      return {
        citasHoy:        citasArr.length,
        citasAtendidas:  citasArr.filter(c => c.estado === 'ATENDIDA').length,
        citasPendientes: citasArr.filter(c => ['AGENDADA','CONFIRMADA'].includes(c.estado)).length,
        citasCanceladas: citasArr.filter(c => c.estado === 'CANCELADA').length,
        totalPacientes:  pacientes.count ?? 0,
        certificadosMes: certificados.count ?? 0,
        ingresosMes:     ingresos,
        egresosMes:      egresos,
        balanceMes:      ingresos - egresos,
      }
    },
    staleTime: 1000 * 60 * 2,
  })
}

// ── Actividad de los últimos 6 meses (para mini gráfica) ──────────────────
export function useActividadMeses(meses = 6) {
  return useQuery({
    queryKey: ['stats', 'actividad', meses],
    queryFn: async () => {
      const datos = []
      for (let i = meses - 1; i >= 0; i--) {
        const fecha   = subMonths(new Date(), i)
        const inicio  = format(startOfMonth(fecha), 'yyyy-MM-dd')
        const fin     = format(endOfMonth(fecha),   'yyyy-MM-dd')
        const label   = format(fecha, 'MMM', { locale: { code: 'es' } })

        const [citas, ingresos] = await Promise.all([
          supabase
            .from('citas')
            .select('id', { count: 'exact', head: true })
            .gte('fecha_hora', `${inicio}T00:00:00`)
            .lte('fecha_hora', `${fin}T23:59:59`),
          supabase
            .from('transacciones')
            .select('monto')
            .eq('tipo', 'INGRESO')
            .gte('fecha', inicio)
            .lte('fecha', fin),
        ])

        const totalIngresos = (ingresos.data ?? []).reduce((s, t) => s + Number(t.monto), 0)

        datos.push({
          mes:      label.charAt(0).toUpperCase() + label.slice(1),
          citas:    citas.count ?? 0,
          ingresos: totalIngresos,
        })
      }
      return datos
    },
    staleTime: 1000 * 60 * 10,
  })
}

// ── Distribución de citas por estado (para el mes actual) ─────────────────
export function useDistribucionEstados() {
  const inicioMes = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const finMes    = format(endOfMonth(new Date()),   'yyyy-MM-dd')

  return useQuery({
    queryKey: ['stats', 'estados', inicioMes],
    queryFn: async () => {
      const { data } = await supabase
        .from('citas')
        .select('estado')
        .gte('fecha_hora', `${inicioMes}T00:00:00`)
        .lte('fecha_hora', `${finMes}T23:59:59`)

      const conteo = { AGENDADA: 0, CONFIRMADA: 0, ATENDIDA: 0, CANCELADA: 0, NO_ASISTIO: 0 }
      for (const c of data ?? []) {
        if (conteo[c.estado] !== undefined) conteo[c.estado]++
      }
      return Object.entries(conteo).map(([estado, total]) => ({ estado, total }))
    },
    staleTime: 1000 * 60 * 5,
  })
}
