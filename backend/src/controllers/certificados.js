import PDFDocument from 'pdfkit'
import { z } from 'zod'

const CertSchema = z.object({
  tipo:               z.enum(['REPOSO','APTITUD','PROCEDIMIENTO','GENERICO']),
  paciente_nombre:    z.string(),
  paciente_cedula:    z.string().optional(),
  medico_nombre:      z.string(),
  motivo:             z.string().optional(),
  fecha_emision:      z.string(),
  fecha_caducidad:    z.string().optional(),
  notas:              z.string().optional(),
  consultorio_nombre: z.string().default('Consultorio Médico'),
})

const TIPO_LABELS = {
  REPOSO:        'CERTIFICADO DE REPOSO MÉDICO',
  APTITUD:       'CERTIFICADO DE APTITUD FÍSICA',
  PROCEDIMIENTO: 'CERTIFICADO DE PROCEDIMIENTO ESTÉTICO',
  GENERICO:      'CERTIFICADO MÉDICO',
}

export async function generarCertificadoPDF(req, res) {
  try {
    const datos = CertSchema.parse(req.body)
    const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 70, right: 70 } })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="certificado_${Date.now()}.pdf"`)
    doc.pipe(res)

    doc.rect(0, 0, doc.page.width, 80).fill('#0F1B2D')
    doc.fillColor('#0D9488').fontSize(22).font('Helvetica-Bold')
       .text(datos.consultorio_nombre, 70, 22, { align: 'center' })
    doc.fillColor('white').fontSize(9).font('Helvetica')
       .text('Sistema de Gestión Médica · MediDesk', 70, 52, { align: 'center' })
    doc.moveDown(3)

    doc.fillColor('#0F1B2D').fontSize(14).font('Helvetica-Bold')
       .text(TIPO_LABELS[datos.tipo], { align: 'center' })
    doc.moveDown(0.5)
    doc.moveTo(70, doc.y).lineTo(doc.page.width - 70, doc.y)
       .strokeColor('#0D9488').lineWidth(2).stroke()
    doc.moveDown(1.5)

    doc.fillColor('#374151').fontSize(11).font('Helvetica')
       .text('El médico firmante certifica que:')
    doc.moveDown(0.5)
    doc.font('Helvetica-Bold').text('PACIENTE: ', { continued: true })
    doc.font('Helvetica').text(datos.paciente_nombre)
    if (datos.paciente_cedula) {
      doc.font('Helvetica-Bold').text('CÉDULA: ', { continued: true })
      doc.font('Helvetica').text(datos.paciente_cedula)
    }
    doc.moveDown(1)
    if (datos.motivo) {
      doc.font('Helvetica-Bold').text('MOTIVO / DIAGNÓSTICO:')
      doc.moveDown(0.3)
      doc.font('Helvetica').text(datos.motivo, { align: 'justify' })
      doc.moveDown(1)
    }
    if (datos.notas) {
      doc.font('Helvetica').text(datos.notas, { align: 'justify' })
      doc.moveDown(1)
    }

    doc.font('Helvetica-Bold').text('Fecha de emisión: ', { continued: true })
    doc.font('Helvetica').text(datos.fecha_emision)
    if (datos.fecha_caducidad) {
      doc.font('Helvetica-Bold').text('Válido hasta: ', { continued: true })
      doc.font('Helvetica').text(datos.fecha_caducidad)
    }

    doc.moveDown(3)
    doc.moveTo(doc.page.width/2 - 70, doc.y)
       .lineTo(doc.page.width/2 + 70, doc.y)
       .strokeColor('#374151').lineWidth(1).stroke()
    doc.moveDown(0.3)
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F1B2D')
       .text(datos.medico_nombre, { align: 'center' })
    doc.font('Helvetica').fontSize(9).fillColor('#9CA3AF')
       .text('Médico responsable', { align: 'center' })

    doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill('#F3F4F6')
    doc.fillColor('#9CA3AF').fontSize(8)
       .text(`Documento generado el ${new Date().toLocaleDateString('es-EC')} · MediDesk`,
             0, doc.page.height - 26, { align: 'center', width: doc.page.width })
    doc.end()
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Datos inválidos', detalles: err.errors })
    console.error(err)
    res.status(500).json({ error: 'Error generando el PDF' })
  }
}
