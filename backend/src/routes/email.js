import { Router } from 'express'
import { enviarCertificado } from '../controllers/email.js'
export const emailRouter = Router()
emailRouter.post('/certificado', enviarCertificado)
