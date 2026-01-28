import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import {
  Rocket,
  LayoutDashboard,
  Package,
  Zap,
  Image,
  FileCode,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Automations', href: '/automations', icon: Zap },
  { name: 'Assets', href: '/assets', icon: Image },
  { name: 'Converter', href: '/converter', icon: FileCode },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { getStats } = useData()
  const navigate = useNavigate()
  const stats = getStats()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-700 
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-700">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">LaunchPad</span>
            <button 
              className="lg:hidden ml-auto text-dark-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="px-4 py-4 border-b border-dark-700">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-dark-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-white">{stats.live}</p>
                <p className="text-xs text-dark-400">Live Products</p>
              </div>
              <div className="bg-dark-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-primary-400">{stats.inProgress}</p>
                <p className="text-xs text-dark-400">In Progress</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User */}
          <div className="p-3 border-t border-dark-700">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-lg">
                  {user?.avatar || '👤'}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-dark-400">{user?.role}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-dark-800 border border-dark-600 rounded-lg shadow-lg overflow-hidden">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-dark-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-dark-900/80 backdrop-blur-md border-b border-dark-700 flex items-center px-4 gap-4">
          <button 
            className="lg:hidden text-dark-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="Search products, automations..."
                className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <button className="relative p-2 text-dark-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
