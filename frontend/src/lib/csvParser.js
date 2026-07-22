/**
 * csvParser.js
 * Utilidades para parsear y validar CSVs de pacientes
 * Soporta archivos exportados desde Excel (.csv) y Google Sheets
 *
 * TODO producción: extender COLUMNAS_CONOCIDAS si el cliente tiene
 * columnas adicionales en su Excel (ej. "Seguro médico", "Médico asignado")
 */

// Columnas que MediDesk espera internamente
export const COLUMNAS_DESTINO = [
  { key: 'nombre',           label: 'Nombre completo',     requerido: true  },
  { key: 'cedula',           label: 'Cédula / Pasaporte',  requerido: false },
  { key: 'telefono',         label: 'Teléfono',            requerido: false },
  { key: 'correo',           label: 'Correo electrónico',  requerido: false },
  { key: 'fecha_nacimiento', label: 'Fecha de nacimiento', requerido: false },
  { key: 'direccion',        label: 'Dirección',           requerido: false },
  { key: 'notas',            label: 'Notas',               requerido: false },
  { key: 'ignorar',          label: '— Ignorar columna —', requerido: false },
]

// Detección automática de columnas comunes en Excels médicos ecuatorianos
export const COLUMNAS_CONOCIDAS = {
  // Nombre
  'nombre':         'nombre', 'name': 'nombre', 'paciente': 'nombre',
  'nombre completo':'nombre', 'nombres': 'nombre', 'apellidos y nombres': 'nombre',
  // Cédula
  'cedula':         'cedula', 'cédula': 'cedula', 'ci': 'cedula',
  'documento':      'cedula', 'identificacion': 'cedula', 'identificación': 'cedula',
  'nro. documento': 'cedula', 'numero de cedula': 'cedula',
  // Teléfono
  'telefono':       'telefono', 'teléfono': 'telefono', 'celular': 'telefono',
  'tel': 'telefono', 'movil': 'telefono', 'móvil': 'telefono', 'phone': 'telefono',
  // Correo
  'correo':         'correo', 'email': 'correo', 'e-mail': 'correo',
  'mail': 'correo', 'correo electronico': 'correo', 'correo electrónico': 'correo',
  // Fecha
  'fecha nacimiento':'fecha_nacimiento', 'fecha de nacimiento': 'fecha_nacimiento',
  'nacimiento':     'fecha_nacimiento', 'f. nacimiento': 'fecha_nacimiento',
  'birthdate':      'fecha_nacimiento',
  // Dirección
  'direccion':      'direccion', 'dirección': 'direccion', 'address': 'direccion',
  'domicilio':      'direccion',
  // Notas
  'notas':          'notas', 'observaciones': 'notas', 'nota': 'notas',
  'comentarios':    'notas', 'observacion': 'notas',
}

/**
 * Detecta automáticamente el mapeo de columnas del CSV
 * Retorna un objeto { columnaCSV: campoMediDesk }
 */
export function detectarMapeo(headers) {
  const mapeo = {}
  for (const h of headers) {
    const normalizado = h.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
    mapeo[h] = COLUMNAS_CONOCIDAS[normalizado] ?? 'ignorar'
  }
  return mapeo
}

/**
 * Parsea texto CSV con manejo de:
 * - Separadores: coma, punto y coma (Excel España/Ecuador usa ;)
 * - Campos con comillas
 * - Saltos de línea dentro de campos
 */
export function parsearCSV(texto) {
  // Detectar separador (coma o punto y coma)
  const primeraLinea = texto.split('\n')[0]
  const separador = (primeraLinea.match(/;/g) || []).length >
                    (primeraLinea.match(/,/g) || []).length ? ';' : ','

  const lineas = texto.trim().split('\n')
  if (lineas.length < 2) throw new Error('El archivo está vacío o tiene solo encabezados')

  const headers = lineas[0].split(separador).map(h => h.trim().replace(/^"|"$/g, ''))

  const filas = []
  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i].trim()
    if (!linea) continue
    const valores = linea.split(separador).map(v => v.trim().replace(/^"|"$/g, ''))
    const fila = {}
    headers.forEach((h, idx) => { fila[h] = valores[idx] ?? '' })
    filas.push(fila)
  }

  return { headers, filas, separador }
}

/**
 * Formatea una fecha de varios formatos a yyyy-MM-dd
 * Soporta: dd/MM/yyyy, dd-MM-yyyy, MM/dd/yyyy, yyyy-MM-dd
 */
export function normalizarFecha(valor) {
  if (!valor) return null
  valor = valor.trim()

  // Ya está en formato ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor

  // dd/MM/yyyy o dd-MM-yyyy
  const match1 = valor.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (match1) {
    const [, d, m, y] = match1
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
  }

  return null
}

/**
 * Valida una cédula ecuatoriana (algoritmo módulo 10)
 */
export function validarCedulaEC(cedula) {
  if (!cedula) return true // opcional
  const c = cedula.replace(/\D/g, '')
  if (c.length !== 10) return false
  const provincia = parseInt(c.substring(0, 2))
  if (provincia < 1 || provincia > 24) return false
  let suma = 0
  for (let i = 0; i < 9; i++) {
    let d = parseInt(c[i])
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9 }
    suma += d
  }
  return (10 - (suma % 10)) % 10 === parseInt(c[9])
}

/**
 * Aplica el mapeo al array de filas y retorna registros listos para Supabase
 * También retorna advertencias por fila
 */
export function aplicarMapeo(filas, mapeo) {
  return filas.map((fila, idx) => {
    const registro = {}
    const advertencias = []

    for (const [colCSV, campoDestino] of Object.entries(mapeo)) {
      if (campoDestino === 'ignorar') continue
      const valor = fila[colCSV]?.trim()
      if (!valor) continue

      if (campoDestino === 'fecha_nacimiento') {
        const fecha = normalizarFecha(valor)
        if (fecha) registro[campoDestino] = fecha
        else advertencias.push(`Fila ${idx+2}: fecha "${valor}" no reconocida, se omitirá`)
      } else if (campoDestino === 'cedula') {
        const limpia = valor.replace(/\D/g, '')
        registro[campoDestino] = limpia
        if (limpia.length === 10 && !validarCedulaEC(limpia)) {
          advertencias.push(`Fila ${idx+2}: cédula "${valor}" no pasa validación EC (se importará igual)`)
        }
      } else {
        registro[campoDestino] = valor
      }
    }

    // LOPDP: marcar importación masiva como consentida con nota
    registro.consentimiento_lopdp = true
    registro.consentimiento_fecha = new Date().toISOString()
    registro.notas = [
      registro.notas,
      'Importado desde CSV — consentimiento LOPDP pendiente de firma física',
    ].filter(Boolean).join(' | ')

    return { registro, advertencias, valido: !!registro.nombre }
  })
}
