import { FeatureBanner } from '@/components/ui/FeatureBanner'

// TODO Sprint producción: importar componentes reales
// import { FacturasList } from './components/FacturasList'
// import { NuevaFactura } from './components/NuevaFactura'

export function FacturacionPage() {
  return (
    <FeatureBanner
      titulo="Facturación SRI"
      modulo="Integración con Datil API — Ecuador"
      descripcion="Este módulo emite facturas electrónicas válidas ante el SRI.
                   Se activa conectando las credenciales de Datil API en Configuración.
                   No requiere cambios en el código — solo activar el feature flag."
    />
  )
}
