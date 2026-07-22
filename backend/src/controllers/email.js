import nodemailer from 'nodemailer'
import { z } from 'zod'

const EmailSchema = z.object({
  destinatario:     z.string().email(),
  nombre_paciente:  z.string(),
  tipo_certificado: z.string(),
  pdf_base64:       z.string(),
  fecha_caducidad:  z.string().optional(),
})

export async function enviarCertificado(req, res) {
  try {
    const datos = EmailSchema.parse(req.body)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    await transporter.sendMail({
      from:    `"${process.env.SMTP_FROM_NAME ?? 'Consultorio MediDesk'}" <${process.env.SMTP_USER}>`,
      to:      datos.destinatario,
      subject: `Tu ${datos.tipo_certificado}`,
      html: `<p>Estimado/a <strong>${datos.nombre_paciente}</strong>, adjunto su <strong>${datos.tipo_certificado}</strong>.${datos.fecha_caducidad ? `<br>Válido hasta: <strong>${datos.fecha_caducidad}</strong>` : ''}</p>`,
      attachments: [{ filename: `certificado.pdf`, content: Buffer.from(datos.pdf_base64, 'base64'), contentType: 'application/pdf' }],
    })
    res.json({ ok: true })
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Datos inválidos' })
    console.error('[EMAIL]', err)
    res.status(500).json({ error: 'Error enviando el correo' })
  }
}
