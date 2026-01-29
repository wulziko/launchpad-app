import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import CommandPalette, { useCommandPalette } from './CommandPalette'
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
  Search,
  Command,
  Sparkles,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Automations', href: '/automations', icon: Zap },
  { name: 'Assets', href: '/assets', icon: Image },
  { name: 'Converter', href: '/converter', icon: FileCode },
  { name: 'Settings', href: '/settings', icon: Settings },
]

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { getStats } = useData()
  const navigate = useNavigate()
  const location = useLocation()
  const commandPalette = useCommandPalette()
  const stats = getStats()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-dark-950 flex noise-overlay">
      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        onNewProduct={() => navigate('/products')}
      />

      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-dark-900/95 backdrop-blur-xl border-r border-dark-800
          transform transition-transform duration-300 ease-out-expo
          lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-800">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-pink-700 flex items-center justify-center shadow-lg shadow-primary-500/25"
            >
              <Rocket className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex-1">
              <span className="font-bold text-lg text-white">LaunchPad</span>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary-400" />
                <span className="text-[10px] text-dark-400 uppercase tracking-wider">Pro</span>
              </div>
            </div>
            <button 
              className="lg:hidden p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="px-4 py-4 border-b border-dark-800">
            <div className="grid grid-cols-2 gap-2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-3"
              >
                <motion.p
                  key={stats.live}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-bold text-green-400"
                >
                  {stats.live}
                </motion.p>
                <p className="text-xs text-dark-400">Live</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-primary-500/10 to-primary-500/5 border border-primary-500/20 rounded-xl p-3"
              >
                <motion.p
                  key={stats.inProgress}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-bold text-primary-400"
                >
                  {stats.inProgress}
                </motion.p>
                <p className="text-xs text-dark-400">In Progress</p>
              </motion.div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item, index) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                {({ isActive }) => (
                  <motion.div
                    className="flex items-center gap-3 w-full"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : ''}`} />
                    </motion.div>
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"
                        transition={{ type: 'spring', bounce: 0.3 }}
                      />
                    )}
                  </motion.div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Keyboard Shortcut Hint */}
          <div className="px-4 py-3 border-t border-dark-800">
            <motion.button
              onClick={commandPalette.open}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-dark-800/50 hover:bg-dark-800 border border-dark-700 rounded-xl text-dark-400 hover:text-dark-200 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left text-sm">Quick search...</span>
              <div className="flex items-center gap-0.5">
                <kbd className="px-1.5 py-0.5 text-[10px] bg-dark-700 border border-dark-600 rounded">
                  <Command className="w-2.5 h-2.5 inline" />
                </kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-dark-700 border border-dark-600 rounded">K</kbd>
              </div>
            </motion.button>
          </div>

          {/* User */}
          <div className="p-3 border-t border-dark-800">
            <div className="relative">
              <motion.button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}
                className="w-full flex items-center gap-3 p-2 rounded-xl transition-colors"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-lg shadow-lg shadow-primary-500/20"
                >
                  {user?.avatar || '👤'}
                </motion.div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-dark-400">{user?.role}</p>
                </div>
                <motion.div
                  animate={{ rotate: userMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-dark-400" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden"
                  >
                    <motion.button
                      onClick={handleLogout}
                      whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 bg-dark-900/80 backdrop-blur-xl border-b border-dark-800 flex items-center px-3 sm:px-4 gap-2 sm:gap-4">
          {/* Mobile menu button - larger touch target */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="lg:hidden p-3 -ml-1 text-dark-300 hover:text-white hover:bg-dark-800 rounded-xl active:bg-dark-700 transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </motion.button>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">LaunchPad</span>
          </div>

          {/* Search - responsive */}
          <div className="flex-1 max-w-xl hidden sm:block">
            <motion.button
              onClick={commandPalette.open}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-dark-800/50 hover:bg-dark-800 border border-dark-700 rounded-xl text-dark-400 hover:text-dark-300 transition-all cursor-text"
            >
              <Search className="w-5 h-5" />
              <span className="flex-1 text-left">Search anything...</span>
              <div className="hidden md:flex items-center gap-1">
                <kbd className="px-2 py-1 text-xs bg-dark-700 border border-dark-600 rounded">
                  <Command className="w-3 h-3 inline" />
                </kbd>
                <kbd className="px-2 py-1 text-xs bg-dark-700 border border-dark-600 rounded">K</kbd>
              </div>
            </motion.button>
          </div>

          {/* Spacer for mobile */}
          <div className="flex-1 sm:hidden" />

          {/* Mobile search icon */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={commandPalette.open}
            className="sm:hidden p-3 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl active:bg-dark-700 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </motion.button>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-3 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl active:bg-dark-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full"
            />
          </motion.button>
        </header>

        {/* Page content with transitions */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="enter"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
