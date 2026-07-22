import { Router } from 'express'
import { generarCertificadoPDF } from '../controllers/certificados.js'
export const certificadosRouter = Router()
certificadosRouter.post('/generar', generarCertificadoPDF)
