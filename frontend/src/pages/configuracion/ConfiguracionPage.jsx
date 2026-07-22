import { useState } from 'react'
import { Users, Building2, Stethoscope, ClipboardList } from 'lucide-react'
import { GestionUsuarios } from './components/GestionUsuarios'

const TABS = [
  { id: 'usuarios',   label: 'Usuarios',      icon: Users,        componente: GestionUsuarios },
  { id: 'consultorio', label: 'Consultorio',  icon: Building2,    componente: null }, // Sprint 8
  { id: 'medicos',    label: 'Médicos',       icon: Stethoscope,  componente: null }, // Sprint 8
  { id: 'servicios',  label: 'Servicios',     icon: ClipboardList,componente: null }, // Sprint 8
]

function TabPlaceholder({ label }) {
  return (
    <div className="card py-16 text-center text-sm text-gray-400">
      Módulo <strong>{label}</strong> — Sprint 8
    </div>
  )
}

export function ConfiguracionPage() {
  const [tabActiva, setTabActiva] = useState('usuarios')
  const tab = TABS.find(t => t.id === tabActiva)
  const Componente = tab?.componente

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Configuración</h1>
        <p className="page-subtitle">Solo administradores</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTabActiva(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                        border-b-2 -mb-px transition-colors
                        ${tabActiva === t.id
                          ? 'border-teal-600 text-teal-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {Componente
        ? <Componente />
        : <TabPlaceholder label={tab?.label} />}
    </div>
  )
}
