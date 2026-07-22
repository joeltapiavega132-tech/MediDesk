import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  parsearCSV, detectarMapeo, aplicarMapeo
} from '@/lib/csvParser'
import toast from 'react-hot-toast'

/**
 * useImportCSV
 * Maneja todo el flujo de importación:
 * 1. parsear → 2. mapear columnas → 3. previsualizar → 4. importar en lote
 */
export function useImportCSV() {
  const qc = useQueryClient()

  // Estado del flujo
  const [paso,          setPaso]          = useState('idle')  // idle | mapeo | preview | importando | listo
  const [headers,       setHeaders]       = useState([])
  const [filasCrudas,   setFilasCrudas]   = useState([])
  const [mapeo,         setMapeo]         = useState({})
  const [preview,       setPreview]       = useState([])      // { registro, advertencias, valido }
  const [resultado,     setResultado]     = useState(null)    // { ok, errores, total }

  // Paso 1: leer y parsear el archivo
  const cargarArchivo = useCallback((file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'txt'].includes(ext)) {
      toast.error('Solo se aceptan archivos .csv')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const { headers, filas } = parsearCSV(e.target.result)
        if (headers.length === 0) throw new Error('No se encontraron columnas')
        setHeaders(headers)
        setFilasCrudas(filas)
        setMapeo(detectarMapeo(headers))
        setPaso('mapeo')
      } catch (err) {
        toast.error(`Error al leer el archivo: ${err.message}`)
      }
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  // Paso 2: actualizar mapeo manual de una columna
  const actualizarMapeo = useCallback((colCSV, campoDestino) => {
    setMapeo(m => ({ ...m, [colCSV]: campoDestino }))
  }, [])

  // Paso 3: generar preview con el mapeo actual
  const generarPreview = useCallback(() => {
    const resultados = aplicarMapeo(filasCrudas, mapeo)
    setPreview(resultados)
    setPaso('preview')
  }, [filasCrudas, mapeo])

  // Paso 4: importar en Supabase en lotes de 50
  const importarMutation = useMutation({
    mutationFn: async () => {
      const validos = preview.filter(p => p.valido).map(p => p.registro)
      if (validos.length === 0) throw new Error('No hay registros válidos para importar')

      const LOTE = 50
      let ok = 0
      const errores = []

      for (let i = 0; i < validos.length; i += LOTE) {
        const lote = validos.slice(i, i + LOTE)
        const { data, error } = await supabase
          .from('pacientes')
          .upsert(lote, {
            onConflict: 'cedula',       // si ya existe la cédula, actualiza
            ignoreDuplicates: false,
          })
          .select('id')

        if (error) {
          errores.push(`Lote ${Math.floor(i/LOTE)+1}: ${error.message}`)
        } else {
          ok += data?.length ?? lote.length
        }
      }

      return { ok, errores, total: validos.length }
    },
    onSuccess: (data) => {
      setResultado(data)
      setPaso('listo')
      qc.invalidateQueries({ queryKey: ['pacientes'] })
      if (data.errores.length === 0) {
        toast.success(`${data.ok} pacientes importados correctamente`)
      } else {
        toast.error(`${data.ok} importados, ${data.errores.length} con error`)
      }
    },
    onError: (e) => toast.error(`Error de importación: ${e.message}`),
  })

  function reiniciar() {
    setPaso('idle')
    setHeaders([])
    setFilasCrudas([])
    setMapeo({})
    setPreview([])
    setResultado(null)
  }

  // Advertencias totales del preview
  const todasAdvertencias = preview.flatMap(p => p.advertencias)
  const totalValidos      = preview.filter(p => p.valido).length
  const totalInvalidos    = preview.filter(p => !p.valido).length

  return {
    paso, headers, mapeo, preview, resultado,
    totalValidos, totalInvalidos, todasAdvertencias,
    cargando: importarMutation.isPending,
    cargarArchivo, actualizarMapeo, generarPreview,
    importar: () => importarMutation.mutate(),
    reiniciar,
  }
}
