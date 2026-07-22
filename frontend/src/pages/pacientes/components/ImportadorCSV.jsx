import { useRef } from 'react'
import {
  Upload, FileText, ArrowRight, Check, AlertTriangle,
  RefreshCw, CheckCircle2, XCircle, ChevronDown, Info,
} from 'lucide-react'
import { useImportCSV }      from '@/hooks/useImportCSV'
import { COLUMNAS_DESTINO }  from '@/lib/csvParser'

// ── Paso 0: Drop zone ──────────────────────────────────────────────────────
function PasoUpload({ onFile }) {
  const inputRef = useRef()

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        className="border-2 border-dashed border-gray-200 rounded-2xl p-10
                   flex flex-col items-center gap-3 cursor-pointer
                   hover:border-teal-400 hover:bg-teal-50 transition-all group"
      >
        <div className="w-14 h-14 rounded-2xl bg-gray-100 group-hover:bg-teal-100
                        flex items-center justify-center transition-colors">
          <Upload size={26} className="text-gray-400 group-hover:text-teal-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">
            Arrastra tu archivo CSV aquí
          </p>
          <p className="text-xs text-gray-400 mt-1">
            o haz click para seleccionar
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={e => onFile(e.target.files[0])}
        />
      </div>

      {/* Instrucciones para exportar desde Excel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-1">
              ¿Cómo exportar desde Excel?
            </p>
            <ol className="text-xs text-blue-600 space-y-0.5 list-decimal list-inside">
              <li>Abre tu archivo Excel con los pacientes</li>
              <li>Archivo → Guardar como → CSV UTF-8 (delimitado por comas)</li>
              <li>Sube ese archivo aquí</li>
            </ol>
            <p className="text-xs text-blue-500 mt-2">
              MediDesk detecta automáticamente las columnas. También funciona con
              exportaciones de Google Sheets y archivos separados por punto y coma (;).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Paso 1: Mapeo de columnas ──────────────────────────────────────────────
function PasoMapeo({ headers, mapeo, onCambiar, onSiguiente, totalFilas }) {
  const opciones = COLUMNAS_DESTINO

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Mapeo de columnas
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalFilas} filas detectadas · Revisa que cada columna apunte al campo correcto
          </p>
        </div>
      </div>

      {/* Tabla de mapeo */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Columna en tu archivo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Campo en MediDesk
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Detección
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {headers.map(col => {
              const campoActual = mapeo[col]
              const autoDetectado = campoActual !== 'ignorar'
              return (
                <tr key={col} className={autoDetectado ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                      {col}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <select
                        value={campoActual}
                        onChange={e => onCambiar(col, e.target.value)}
                        className="input py-1.5 pr-8 text-xs appearance-none"
                      >
                        {opciones.map(o => (
                          <option key={o.key} value={o.key}>{o.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2
                                                         -translate-y-1/2 text-gray-400
                                                         pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {autoDetectado
                      ? <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle2 size={12} /> Auto-detectado
                        </span>
                      : <span className="text-xs text-gray-400 flex items-center gap-1">
                          <XCircle size={12} /> Sin coincidencia
                        </span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button onClick={onSiguiente} className="btn-primary">
          Ver preview <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ── Paso 2: Preview ────────────────────────────────────────────────────────
function PasoPreview({ preview, advertencias, totalValidos, totalInvalidos, onImportar, onVolver, cargando }) {
  const muestra = preview.slice(0, 8)

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total filas',    value: preview.length,  color: 'bg-gray-100 text-gray-700' },
          { label: 'Válidos',        value: totalValidos,    color: 'bg-green-100 text-green-700' },
          { label: 'Sin nombre',     value: totalInvalidos,  color: totalInvalidos > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Advertencias */}
      {advertencias.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-500" />
            <p className="text-xs font-semibold text-amber-700">
              {advertencias.length} advertencia{advertencias.length > 1 ? 's' : ''} — los datos se importarán pero revisa estos casos
            </p>
          </div>
          <ul className="text-xs text-amber-600 space-y-0.5 max-h-20 overflow-y-auto">
            {advertencias.map((a, i) => <li key={i}>• {a}</li>)}
          </ul>
        </div>
      )}

      {/* Preview tabla */}
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          Primeros {muestra.length} registros
        </p>
        <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-gray-500">#</th>
                <th className="px-3 py-2 text-left text-gray-500">Nombre</th>
                <th className="px-3 py-2 text-left text-gray-500">Cédula</th>
                <th className="px-3 py-2 text-left text-gray-500">Teléfono</th>
                <th className="px-3 py-2 text-left text-gray-500">Correo</th>
                <th className="px-3 py-2 text-left text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {muestra.map(({ registro, valido }, i) => (
                <tr key={i} className={valido ? 'bg-white' : 'bg-red-50'}>
                  <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-800">
                    {registro.nombre ?? <span className="text-red-400">Sin nombre</span>}
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-600">{registro.cedula ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{registro.telefono ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{registro.correo ?? '—'}</td>
                  <td className="px-3 py-2">
                    {valido
                      ? <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 size={11} /> OK
                        </span>
                      : <span className="text-red-500 flex items-center gap-1">
                          <XCircle size={11} /> Se omitirá
                        </span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 8 && (
            <p className="text-xs text-center text-gray-400 py-2 bg-gray-50">
              ... y {preview.length - 8} registros más
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onVolver} className="btn-secondary" disabled={cargando}>
          ← Ajustar mapeo
        </button>
        <button
          onClick={onImportar}
          disabled={totalValidos === 0 || cargando}
          className="btn-primary"
        >
          {cargando
            ? <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                 rounded-full animate-spin" />
                Importando...
              </span>
            : <>
                <Upload size={15} />
                Importar {totalValidos} pacientes
              </>
          }
        </button>
      </div>
    </div>
  )
}

// ── Paso 3: Resultado ──────────────────────────────────────────────────────
function PasoListo({ resultado, onReiniciar, onCerrar }) {
  const exitoso = resultado.errores.length === 0

  return (
    <div className="flex flex-col items-center text-center gap-5 py-6">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center
                       ${exitoso ? 'bg-green-100' : 'bg-amber-100'}`}>
        {exitoso
          ? <CheckCircle2 size={32} className="text-green-600" />
          : <AlertTriangle size={32} className="text-amber-500" />}
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900">
          {exitoso ? '¡Importación exitosa!' : 'Importación con advertencias'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          <span className="font-semibold text-green-600">{resultado.ok}</span> de{' '}
          <span className="font-semibold">{resultado.total}</span> pacientes importados
        </p>
      </div>

      {resultado.errores.length > 0 && (
        <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 text-left">
          <p className="text-xs font-semibold text-red-700 mb-2">Errores:</p>
          <ul className="text-xs text-red-600 space-y-1">
            {resultado.errores.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onReiniciar} className="btn-secondary">
          <RefreshCw size={14} /> Importar otro archivo
        </button>
        <button onClick={onCerrar} className="btn-primary">
          <Check size={14} /> Ver pacientes
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export function ImportadorCSV({ onCerrar }) {
  const {
    paso, headers, mapeo, preview, resultado,
    totalValidos, totalInvalidos, todasAdvertencias, cargando,
    cargarArchivo, actualizarMapeo, generarPreview,
    importar, reiniciar,
  } = useImportCSV()

  // Indicador de pasos
  const pasos = ['Archivo', 'Columnas', 'Preview', 'Listo']
  const pasoIdx = { idle: 0, mapeo: 1, preview: 2, listo: 3 }[paso] ?? 0

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper */}
      <div className="flex items-center gap-0">
        {pasos.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${i <= pasoIdx ? 'text-teal-600' : 'text-gray-300'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                               border-2 transition-colors
                               ${i < pasoIdx  ? 'bg-teal-600 border-teal-600 text-white'
                               : i === pasoIdx ? 'border-teal-600 text-teal-600'
                               : 'border-gray-200 text-gray-300'}`}>
                {i < pasoIdx ? <Check size={12} /> : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block">{label}</span>
            </div>
            {i < pasos.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-colors
                               ${i < pasoIdx ? 'bg-teal-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Contenido por paso */}
      {paso === 'idle' && (
        <PasoUpload onFile={cargarArchivo} />
      )}
      {paso === 'mapeo' && (
        <PasoMapeo
          headers={headers}
          mapeo={mapeo}
          onCambiar={actualizarMapeo}
          onSiguiente={generarPreview}
          totalFilas={preview.length || '...'}
        />
      )}
      {paso === 'preview' && (
        <PasoPreview
          preview={preview}
          advertencias={todasAdvertencias}
          totalValidos={totalValidos}
          totalInvalidos={totalInvalidos}
          onImportar={importar}
          onVolver={() => reiniciar()}
          cargando={cargando}
        />
      )}
      {paso === 'listo' && (
        <PasoListo
          resultado={resultado}
          onReiniciar={reiniciar}
          onCerrar={onCerrar}
        />
      )}
    </div>
  )
}
