import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText, Users, Package, Settings, Menu, X,
  Home, Send, BarChart3, ChevronLeft, ChevronRight
} from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/facturas', label: 'Facturas', icon: FileText },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/productos', label: 'Productos', icon: Package },
  { path: '/configuracion', label: 'Configuración', icon: Settings }
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`bg-sidebar-bg text-white transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Send className="w-6 h-6 text-primary-400" />
              <span className="font-bold text-lg">EBI FE</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-slate-700 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-sidebar-text hover:bg-slate-700 hover:text-white'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-700">
            <p className="text-xs text-slate-400">EBI Facturación Electrónica v1.0</p>
            <p className="text-xs text-slate-500 mt-1">Panamá</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-slate-800">
            {menuItems.find(item => item.path === location.pathname)?.label || 'EBI Facturación'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500">
              {new Date().toLocaleDateString('es-PA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
