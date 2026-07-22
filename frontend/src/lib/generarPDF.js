import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * generarCertificadoPDF
 * Genera un PDF en el browser sin backend usando jsPDF.
 *
 * TODO producción: reemplazar firma imagen por token .p12 del BCE
 * TODO producción: agregar QR de validación
 *
 * @param {object} datos
 * @returns {jsPDF} instancia del documento
 */
export function generarCertificadoPDF(datos) {
  const {
    tipo,
    paciente_nombre,
    paciente_cedula,
    medico_nombre     = 'Médico responsable',
    medico_especialidad = '',
    motivo            = '',
    dias_reposo,
    procedimiento,
    fecha_procedimiento,
    observaciones     = '',
    fecha_emision     = format(new Date(), 'dd/MM/yyyy'),
    fecha_caducidad,
    consultorio_nombre = 'Consultorio Médico',
    consultorio_ruc,
    consultorio_direccion,
    consultorio_telefono,
    firma_url,          // URL de imagen de firma desde Supabase Storage
  } = datos

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210   // page width
  const PH = 297   // page height
  const ML = 20    // margin left
  const MR = 20    // margin right
  const TW = PW - ML - MR  // text width

  // ── Colores ────────────────────────────────────────────────
  const NAVY  = [15,  27,  45]
  const TEAL  = [13,  148, 136]
  const GRAY  = [100, 100, 100]
  const LGRAY = [240, 240, 240]

  // ── Header ─────────────────────────────────────────────────
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, PW, 28, 'F')

  // Logo M+
  doc.setFillColor(...TEAL)
  doc.roundedRect(ML, 7, 14, 14, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('M+', ML + 2.5, 16.5)

  // Nombre consultorio
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(consultorio_nombre, ML + 18, 14)

  // Info consultorio
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  const infoLinea = [
    consultorio_ruc       ? `RUC: ${consultorio_ruc}` : '',
    consultorio_direccion ? consultorio_direccion : '',
    consultorio_telefono  ? `Tel: ${consultorio_telefono}` : '',
  ].filter(Boolean).join('  ·  ')
  if (infoLinea) doc.text(infoLinea, ML + 18, 20)

  // MediDesk badge
  doc.setTextColor(...TEAL)
  doc.setFontSize(7)
  doc.text('Powered by MediDesk', PW - MR - 28, 23)

  // ── Línea separadora teal ───────────────────────────────────
  doc.setDrawColor(...TEAL)
  doc.setLineWidth(1)
  doc.line(0, 28, PW, 28)

  // ── Título del certificado ──────────────────────────────────
  const TITULOS = {
    REPOSO:        'CERTIFICADO DE REPOSO MÉDICO',
    APTITUD:       'CERTIFICADO DE APTITUD FÍSICA',
    PROCEDIMIENTO: 'CERTIFICADO DE PROCEDIMIENTO ESTÉTICO',
    GENERICO:      'CERTIFICADO MÉDICO',
  }

  let y = 44
  doc.setTextColor(...NAVY)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(TITULOS[tipo] ?? 'CERTIFICADO MÉDICO', PW / 2, y, { align: 'center' })

  y += 4
  doc.setDrawColor(...TEAL)
  doc.setLineWidth(0.8)
  doc.line(ML, y, PW - MR, y)

  // ── Cuerpo ──────────────────────────────────────────────────
  y += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text('El médico firmante certifica que:', ML, y)

  // Datos del paciente
  y += 8
  doc.setFillColor(...LGRAY)
  doc.roundedRect(ML, y - 5, TW, 20, 2, 2, 'F')

  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('PACIENTE:', ML + 4, y + 1)
  doc.setFont('helvetica', 'normal')
  doc.text(paciente_nombre?.toUpperCase() ?? '', ML + 28, y + 1)

  if (paciente_cedula) {
    doc.setFont('helvetica', 'bold')
    doc.text('CÉDULA / ID:', ML + 4, y + 8)
    doc.setFont('helvetica', 'normal')
    doc.text(paciente_cedula, ML + 32, y + 8)
  }

  y += 24

  // Contenido según tipo
  if (tipo === 'REPOSO' && motivo) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...NAVY)
    doc.text('MOTIVO / DIAGNÓSTICO:', ML, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY)
    const motivoLines = doc.splitTextToSize(motivo, TW)
    doc.text(motivoLines, ML, y)
    y += motivoLines.length * 5 + 4

    if (dias_reposo) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...NAVY)
      doc.text(`DÍAS DE REPOSO: `, ML, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...TEAL)
      doc.text(`${dias_reposo} día${dias_reposo > 1 ? 's' : ''}`, ML + 40, y)
      y += 8
    }
  }

  if (tipo === 'PROCEDIMIENTO') {
    if (procedimiento) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...NAVY)
      doc.text('PROCEDIMIENTO REALIZADO:', ML, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRAY)
      doc.text(doc.splitTextToSize(procedimiento, TW), ML, y)
      y += 10
    }
    if (fecha_procedimiento) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...NAVY)
      doc.text('FECHA DEL PROCEDIMIENTO:', ML, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRAY)
      doc.text(fecha_procedimiento, ML + 58, y)
      y += 8
    }
  }

  if (observaciones) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...NAVY)
    doc.text('OBSERVACIONES:', ML, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY)
    const obsLines = doc.splitTextToSize(observaciones, TW)
    doc.text(obsLines, ML, y)
    y += obsLines.length * 5 + 4
  }

  // ── Fechas ──────────────────────────────────────────────────
  y += 4
  doc.setDrawColor(...LGRAY)
  doc.setLineWidth(0.3)
  doc.line(ML, y, PW - MR, y)
  y += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...NAVY)
  doc.text('Fecha de emisión:', ML, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text(fecha_emision, ML + 40, y)

  if (fecha_caducidad) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(239, 68, 68)  // red
    doc.text('Válido hasta:', PW / 2, y)
    doc.setFont('helvetica', 'normal')
    doc.text(fecha_caducidad, PW / 2 + 30, y)
  }

  // ── Firma ───────────────────────────────────────────────────
  y = PH - 65
  const firmaX = PW / 2 - 30

  // TODO producción: cargar firma_url desde Supabase Storage y añadirla aquí
  // if (firma_url) { doc.addImage(firmaImagen, 'PNG', firmaX, y - 20, 60, 20) }

  doc.setDrawColor(...GRAY)
  doc.setLineWidth(0.5)
  doc.line(firmaX, y, firmaX + 60, y)

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...NAVY)
  doc.text(medico_nombre, PW / 2, y, { align: 'center' })

  if (medico_especialidad) {
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.text(medico_especialidad, PW / 2, y, { align: 'center' })
  }

  // ── Footer ──────────────────────────────────────────────────
  doc.setFillColor(...LGRAY)
  doc.rect(0, PH - 14, PW, 14, 'F')
  doc.setTextColor(...GRAY)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Documento generado el ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })} · MediDesk · ${consultorio_nombre}`,
    PW / 2, PH - 6, { align: 'center' }
  )

  return doc
}

/**
 * Descarga el PDF directamente en el navegador
 */
export function descargarPDF(datos, nombreArchivo) {
  const doc = generarCertificadoPDF(datos)
  doc.save(nombreArchivo ?? `certificado_${Date.now()}.pdf`)
}

/**
 * Abre el PDF en una nueva pestaña (para imprimir)
 */
export function imprimirPDF(datos) {
  const doc = generarCertificadoPDF(datos)
  const url = doc.output('bloburl')
  window.open(url, '_blank')
}

/**
 * Retorna el PDF como base64 (para guardar en Supabase Storage)
 */
export function pdfABase64(datos) {
  const doc = generarCertificadoPDF(datos)
  return doc.output('datauristring').split(',')[1]
}
