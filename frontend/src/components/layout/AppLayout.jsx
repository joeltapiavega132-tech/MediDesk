import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/ui/Spinner'

export function AppLayout() {
  const { loading } = useAuth()
  if (loading) return <PageLoader />

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Topbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div id="page-breadcrumb" className="text-sm text-gray-400" />
          <div className="flex items-center gap-3">
            {/* Slot para acciones de página — se llena desde cada página */}
            <div id="topbar-actions" />
          </div>
        </div>
        {/* Contenido */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
