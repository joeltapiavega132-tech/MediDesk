// ─────────────────────────────────────────────────────────────
// ROLES
// Para producción: estos valores deben coincidir exactamente
// con los que se insertan en la tabla `perfiles.rol` de Supabase
// ─────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:     'admin',
  MEDICO:    'medico',
  ASISTENTE: 'asistente',
  PACIENTE:  'paciente',
}

// Permisos por módulo — cambiar aquí afecta todo el sistema
export const PERMISOS = {
  agenda:        [ROLES.ADMIN, ROLES.MEDICO, ROLES.ASISTENTE],
  pacientes:     [ROLES.ADMIN, ROLES.MEDICO, ROLES.ASISTENTE],
  certificados:  [ROLES.ADMIN, ROLES.MEDICO, ROLES.ASISTENTE],
  contabilidad:  [ROLES.ADMIN],
  facturacion:   [ROLES.ADMIN],
  configuracion: [ROLES.ADMIN],
  hce:           [ROLES.ADMIN, ROLES.MEDICO],
  portal:        [ROLES.PACIENTE],
}

// ─────────────────────────────────────────────────────────────
// ESTADOS DE CITA
// ─────────────────────────────────────────────────────────────
export const ESTADO_CITA = {
  AGENDADA:   { label: 'Agendada',   badge: 'badge-info',    color: '#2563EB' },
  CONFIRMADA: { label: 'Confirmada', badge: 'badge-teal',    color: '#0D9488' },
  ATENDIDA:   { label: 'Atendida',   badge: 'badge-success', color: '#10B981' },
  CANCELADA:  { label: 'Cancelada',  badge: 'badge-danger',  color: '#EF4444' },
  NO_ASISTIO: { label: 'No asistió', badge: 'badge-warning', color: '#F59E0B' },
}

// ─────────────────────────────────────────────────────────────
// TIPOS DE CERTIFICADO
// ─────────────────────────────────────────────────────────────
export const TIPO_CERTIFICADO = {
  REPOSO:        { label: 'Reposo médico',          campos: ['motivo', 'dias_reposo', 'fecha_caducidad'] },
  APTITUD:       { label: 'Aptitud física',          campos: ['observaciones'] },
  PROCEDIMIENTO: { label: 'Procedimiento estético',  campos: ['procedimiento', 'fecha_procedimiento', 'observaciones'] },
  GENERICO:      { label: 'Certificado genérico',    campos: ['motivo', 'observaciones'] },
}

// ─────────────────────────────────────────────────────────────
// CATEGORÍAS CONTABILIDAD
// ─────────────────────────────────────────────────────────────
export const CATEGORIA_INGRESO = [
  'Consulta general',
  'Cirugía estética',
  'Tratamiento láser',
  'Cuidado de piel',
  'Certificado médico',
  'Telemedicina',       // Listo para cuando se active
  'Otro',
]

export const CATEGORIA_EGRESO = [
  'Insumos médicos',
  'Arriendo',
  'Sueldos',
  'Servicios básicos',
  'Equipos',
  'Software / Suscripciones',
  'Marketing',
  'Otro',
]

// ─────────────────────────────────────────────────────────────
// RUTAS
// ─────────────────────────────────────────────────────────────
export const ROUTES = {
  LOGIN:             '/login',
  DASHBOARD:         '/',
  AGENDA:            '/agenda',
  PACIENTES:         '/pacientes',
  PACIENTE_NUEVO:    '/pacientes/nuevo',
  PACIENTE_DETALLE:  '/pacientes/:id',
  HCE:               '/pacientes/:id/hce',
  CERTIFICADOS:      '/certificados',
  CERTIFICADO_NUEVO: '/certificados/nuevo',
  CONTABILIDAD:      '/contabilidad',
  FACTURACION:       '/facturacion',       // desactivado en prototipo
  CONFIGURACION:     '/configuracion',
  // Portal del paciente (rutas separadas)
  PORTAL:            '/portal',
  PORTAL_CITAS:      '/portal/citas',
  PORTAL_HISTORIAL:  '/portal/historial',
}

// ─────────────────────────────────────────────────────────────
// FEATURE FLAGS
// Cambiar a true cuando el módulo esté listo para producción
// ─────────────────────────────────────────────────────────────
export const FEATURES = {
  FACTURACION_SRI:   false,   // Activar con Datil API
  TELEMEDICINA:      false,   // Activar con Twilio / Daily.co
  WHATSAPP_API:      false,   // Activar con Meta Business API
  PAGOS_ONLINE:      false,   // Activar con PayPhone / Stripe
  FIRMA_DIGITAL:     false,   // Activar con token .p12 BCE
  RECORDATORIO_SMS:  false,   // Activar con Twilio SMS
  PORTAL_PACIENTE:   true,    // Ya disponible en prototipo
  HCE:               true,    // Ya disponible en prototipo
}

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN APP
// ─────────────────────────────────────────────────────────────
export const APP_CONFIG = {
  nombre:    'MediDesk',
  version:   '0.1.0-prototype',
  pais:      'EC',
  moneda:    'USD',
  zona_horaria: 'America/Guayaquil',
  idioma:    'es-EC',
}
