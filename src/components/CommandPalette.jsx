import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'
import {
  Search,
  LayoutDashboard,
  Package,
  Zap,
  Image,
  FileCode,
  Settings,
  Plus,
  ArrowRight,
  Command,
  Hash,
  Clock,
  Star,
} from 'lucide-react'

const NAVIGATION_ITEMS = [
  { id: 'nav-dashboard', name: 'Dashboard', description: 'Overview and stats', icon: LayoutDashboard, path: '/', type: 'navigation' },
  { id: 'nav-products', name: 'Products', description: 'Manage your products', icon: Package, path: '/products', type: 'navigation' },
  { id: 'nav-automations', name: 'Automations', description: 'Workflow automations', icon: Zap, path: '/automations', type: 'navigation' },
  { id: 'nav-assets', name: 'Assets', description: 'Images and files', icon: Image, path: '/assets', type: 'navigation' },
  { id: 'nav-converter', name: 'Converter', description: 'File conversion tools', icon: FileCode, path: '/converter', type: 'navigation' },
  { id: 'nav-settings', name: 'Settings', description: 'App preferences', icon: Settings, path: '/settings', type: 'navigation' },
]

const ACTION_ITEMS = [
  { id: 'action-new-product', name: 'New Product', description: 'Add a new product', icon: Plus, action: 'new-product', type: 'action', shortcut: 'N' },
]

export default function CommandPalette({ isOpen, onClose, onNewProduct }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const navigate = useNavigate()
  const { products } = useData()

  // Build product items
  const productItems = useMemo(() => {
    return (products || []).slice(0, 5).map(p => ({
      id: `product-${p.id}`,
      name: p.name || 'Untitled',
      description: `${p.niche || 'No niche'} • ${p.status || 'Unknown'}`,
      icon: Package,
      path: `/products/${p.id}`,
      type: 'product',
    }))
  }, [products])

  // Combine all items
  const allItems = useMemo(() => {
    return [...ACTION_ITEMS, ...NAVIGATION_ITEMS, ...productItems]
  }, [productItems])

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems
    
    const lowerQuery = query.toLowerCase()
    return allItems.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery)
    )
  }, [query, allItems])

  // Group items by type
  const groupedItems = useMemo(() => {
    const groups = {}
    filteredItems.forEach(item => {
      if (!groups[item.type]) groups[item.type] = []
      groups[item.type].push(item)
    })
    return groups
  }, [filteredItems])

  // Flatten for navigation
  const flatItems = useMemo(() => {
    return Object.values(groupedItems).flat()
  }, [groupedItems])

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => Math.min(prev + 1, flatItems.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (flatItems[activeIndex]) {
          handleSelect(flatItems[activeIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [isOpen, flatItems, activeIndex, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && activeIndex >= 0) {
      const activeEl = listRef.current.querySelector(`[data-index="${activeIndex}"]`)
      activeEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  const handleSelect = (item) => {
    if (item.path) {
      navigate(item.path)
    } else if (item.action === 'new-product') {
      onNewProduct?.()
    }
    onClose()
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'action': return 'Actions'
      case 'navigation': return 'Navigation'
      case 'product': return 'Products'
      default: return 'Items'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'action': return Zap
      case 'navigation': return ArrowRight
      case 'product': return Package
      default: return Hash
    }
  }

  if (!isOpen) return null

  let currentIndex = -1

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="command-palette-backdrop"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="command-palette"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              placeholder="Search commands, products, pages..."
              className="command-input pl-14 pr-20"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-xs text-dark-500 bg-dark-800 border border-dark-700 rounded">
                esc
              </kbd>
            </div>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
            {flatItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-dark-500">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              Object.entries(groupedItems).map(([type, items]) => {
                const TypeIcon = getTypeIcon(type)
                return (
                  <div key={type} className="mb-2">
                    <div className="px-4 py-2 flex items-center gap-2">
                      <TypeIcon className="w-3.5 h-3.5 text-dark-500" />
                      <span className="text-xs font-medium text-dark-500 uppercase tracking-wider">
                        {getTypeLabel(type)}
                      </span>
                    </div>
                    {items.map((item) => {
                      currentIndex++
                      const index = currentIndex
                      const Icon = item.icon
                      const isActive = index === activeIndex
                      
                      return (
                        <motion.div
                          key={item.id}
                          data-index={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`command-item ${isActive ? 'active' : ''}`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setActiveIndex(index)}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            item.type === 'action' 
                              ? 'bg-primary-500/10 text-primary-400' 
                              : 'bg-dark-800 text-dark-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-dark-500 truncate">{item.description}</p>
                            )}
                          </div>
                          {item.shortcut && (
                            <kbd className="px-2 py-1 text-xs text-dark-400 bg-dark-800 border border-dark-700 rounded">
                              {item.shortcut}
                            </kbd>
                          )}
                          {isActive && (
                            <ArrowRight className="w-4 h-4 text-dark-400" />
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-800 text-xs text-dark-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-dark-800 border border-dark-700 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-dark-800 border border-dark-700 rounded">↓</kbd>
                <span className="ml-1">Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-dark-800 border border-dark-700 rounded">↵</kbd>
                <span className="ml-1">Select</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-dark-600">
              <Command className="w-3 h-3" />
              <span>K to open</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

// Hook to manage command palette state
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  }
}
