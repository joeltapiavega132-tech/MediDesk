import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Users, FileText,
  DollarSign, Receipt, Settings, LogOut, Stethoscope,
  ClipboardList, Globe, ChevronRight, Lock,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { FEATURES } from '@/lib/constants'
import toast from 'react-hot-toast'

// ── Definición de navegación ──────────────────────────────────
// featureFlag: si es false, el ítem se muestra bloqueado (no accesible)
// modulo: clave en PERMISOS para controlar acceso por rol
const NAV_ITEMS = [
  {
    label: 'Principal',
    items: [
      { to: '/',             icon: LayoutDashboard, label: 'Dashboard',     modulo: null },
      { to: '/agenda',       icon: CalendarDays,    label: 'Agenda',        modulo: 'agenda' },
      { to: '/pacientes',    icon: Users,           label: 'Pacientes',     modulo: 'pacientes' },
    ],
  },
  {
    label: 'Clínico',
    items: [
      { to: '/certificados', icon: FileText,        label: 'Certificados',  modulo: 'certificados' },
    ],
  },
  {
    label: 'Administración',
    items: [
      { to: '/contabilidad', icon: DollarSign,      label: 'Contabilidad',  modulo: 'contabilidad' },
      {
        to: '/facturacion',
        icon: Receipt,
        label: 'Facturación SRI',
        modulo: 'facturacion',
        featureFlag: FEATURES.FACTURACION_SRI,  // false = bloqueado en prototipo
        badge: 'Pronto',
      },
    ],
  },
  {
    label: 'Portal',
    items: [
      {
        to: '/portal',
        icon: Globe,
        label: 'Portal Paciente',
        modulo: 'portal',
        featureFlag: FEATURES.PORTAL_PACIENTE,
      },
    ],
  },
]

const NAV_ADMIN = [
  { to: '/configuracion', icon: Settings, label: 'Configuración', modulo: 'configuracion' },
]

// ── Componente NavItem ────────────────────────────────────────
function NavItem({ to, icon: Icon, label, badge, locked = false }) {
  if (locked) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                      text-slate-600 cursor-not-allowed select-none">
        <Icon size={17} />
        <span className="flex-1">{label}</span>
        {badge
          ? <span className="text-[10px] font-bold bg-white/10 text-slate-400 px-1.5 py-0.5 rounded-full">{badge}</span>
          : <Lock size={12} className="text-slate-600" />
        }
      </div>
    )
  }

  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        isActive
          ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white'
          : 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-150'
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={17} />
          <span className="flex-1">{label}</span>
          {isActive && <ChevronRight size={14} className="opacity-70" />}
        </>
      )}
    </NavLink>
  )
}

// ── Sidebar principal ─────────────────────────────────────────
export function Sidebar() {
  const { perfil, isAdmin, isPaciente, puedeAcceder, displayName, avatarChar, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  // Los pacientes tienen su propio layout
  if (isPaciente) return null

  return (
    <aside className="w-60 min-h-screen bg-[#0B1829] flex flex-col shrink-0 border-r border-white/5">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
            <Stethoscope size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">MediDesk</p>
            <p className="text-slate-500 text-[11px] mt-0.5">v0.1 · prototipo</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-4">
        {NAV_ITEMS.map((group) => {
          // Filtrar ítems que el usuario puede ver
          const visibles = group.items.filter(item =>
            item.modulo === null || puedeAcceder(item.modulo)
          )
          if (visibles.length === 0) return null

          return (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-1">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {visibles.map((item) => (
                  <NavItem
                    key={item.to}
                    {...item}
                    locked={item.featureFlag === false}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Config solo admin */}
        {isAdmin && (
          <div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-1">
              Sistema
            </p>
            <div className="flex flex-col gap-0.5">
              {NAV_ADMIN.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Usuario */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center
                          text-white text-xs font-bold shrink-0">
            {avatarChar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{displayName}</p>
            <p className="text-slate-500 text-[11px] capitalize">{perfil?.rol ?? ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl
                     text-sm text-slate-400 hover:text-white hover:bg-white/10
                     transition-all duration-150"
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
