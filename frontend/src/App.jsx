import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }   from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout }      from '@/components/layout/AppLayout'

// Auth
import { LoginPage }           from '@/pages/auth/LoginPage'
// Páginas
import { Dashboard }           from '@/pages/Dashboard'
import { PacientesPage }       from '@/pages/pacientes/PacientesPage'
import { PacienteDetallePage } from '@/pages/pacientes/PacienteDetallePage'
import { AgendaPage }          from '@/pages/agenda/AgendaPage'
import { CertificadosPage }    from '@/pages/certificados/CertificadosPage'
import { ContabilidadPage }    from '@/pages/contabilidad/ContabilidadPage'
import { FacturacionPage }     from '@/pages/facturacion/FacturacionPage'
import { ConfiguracionPage }   from '@/pages/configuracion/ConfiguracionPage'
import { HCEPage }             from '@/pages/hce/HCEPage'

// TODO Sprint 7: import { PortalLayout } from '@/pages/portal/PortalLayout'

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* ── Pública ───────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ── App interna ───────────────────────── */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

          <Route path="/" element={<Dashboard />} />

          {/* Agenda */}
          <Route path="/agenda" element={
            <ProtectedRoute modulo="agenda"><AgendaPage /></ProtectedRoute>
          } />

          {/* Pacientes */}
          <Route path="/pacientes" element={
            <ProtectedRoute modulo="pacientes"><PacientesPage /></ProtectedRoute>
          } />
          <Route path="/pacientes/:id" element={
            <ProtectedRoute modulo="pacientes"><PacienteDetallePage /></ProtectedRoute>
          } />

          {/* Certificados */}
          <Route path="/certificados" element={
            <ProtectedRoute modulo="certificados"><CertificadosPage /></ProtectedRoute>
          } />

           {/* HCE */}
          <Route path="/hce/:id" element={<HCEPage />} />

          {/* Contabilidad */}
          <Route path="/contabilidad" element={
            <ProtectedRoute modulo="contabilidad"><ContabilidadPage /></ProtectedRoute>
          } />

          {/* Facturación — feature flag */}
          <Route path="/facturacion" element={
            <ProtectedRoute modulo="facturacion"><FacturacionPage /></ProtectedRoute>
          } />

          {/* Configuración — solo admin */}
          <Route path="/configuracion" element={
            <ProtectedRoute modulo="configuracion"><ConfiguracionPage /></ProtectedRoute>
          } />

        </Route>

        {/* ── Portal del paciente — Sprint 7 ────── */}
        {/* <Route path="/portal" element={
          <ProtectedRoute modulo="portal"><PortalLayout /></ProtectedRoute>
        }>
          <Route index element={<PortalHome />} />
          <Route path="citas" element={<PortalCitas />} />
          <Route path="historial" element={<PortalHistorial />} />
        </Route> */}

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AuthProvider>
  )
}
