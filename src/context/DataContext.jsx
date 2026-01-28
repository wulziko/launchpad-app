import { createContext, useContext, useState, useEffect } from 'react'

const DataContext = createContext(null)

// Status workflow
export const STATUSES = [
  { id: 'new', label: 'New', color: 'bg-dark-600', textColor: 'text-dark-300' },
  { id: 'banner_generation', label: 'Banner Generation', color: 'bg-blue-600', textColor: 'text-blue-100' },
  { id: 'landing_page', label: 'Landing Page', color: 'bg-purple-600', textColor: 'text-purple-100' },
  { id: 'review', label: 'Review', color: 'bg-yellow-600', textColor: 'text-yellow-100' },
  { id: 'ready', label: 'Ready to Launch', color: 'bg-green-600', textColor: 'text-green-100' },
  { id: 'live', label: 'Live', color: 'bg-primary-600', textColor: 'text-primary-100' },
  { id: 'paused', label: 'Paused', color: 'bg-orange-600', textColor: 'text-orange-100' },
]

// Sample products for demo
const SAMPLE_PRODUCTS = [
  {
    id: '1',
    name: 'PDRN Salmon DNA Mask',
    description: 'Korean regenerative skincare mask with salmon DNA for anti-aging',
    status: 'live',
    market: 'US',
    niche: 'Skincare',
    targetAudience: 'Women 35+',
    price: 49.99,
    createdAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-01-28T12:00:00Z',
    images: [],
    banners: [
      { id: 'b1', url: 'https://placehold.co/1080x1080/ec4899/white?text=Banner+1', status: 'ready' },
      { id: 'b2', url: 'https://placehold.co/1080x1080/db2777/white?text=Banner+2', status: 'ready' },
      { id: 'b3', url: 'https://placehold.co/1080x1080/be185d/white?text=Banner+3', status: 'ready' },
    ],
    landingPage: { html: '', status: 'ready' },
    notes: 'Top performer, scaling aggressively',
    tags: ['trending', 'high-margin'],
  },
  {
    id: '2',
    name: 'Smart Posture Corrector',
    description: 'AI-powered posture correction device with vibration alerts',
    status: 'banner_generation',
    market: 'US',
    niche: 'Health & Wellness',
    targetAudience: 'Office workers 25-45',
    price: 39.99,
    createdAt: '2026-01-27T08:00:00Z',
    updatedAt: '2026-01-28T10:00:00Z',
    images: [],
    banners: [],
    landingPage: { html: '', status: 'pending' },
    notes: 'Testing market demand',
    tags: ['new', 'tech'],
  },
  {
    id: '3',
    name: 'Portable Blender Pro',
    description: 'USB-C rechargeable personal blender with powerful motor',
    status: 'landing_page',
    market: 'Israel',
    niche: 'Kitchen',
    targetAudience: 'Health-conscious adults',
    price: 29.99,
    createdAt: '2026-01-26T14:00:00Z',
    updatedAt: '2026-01-28T08:00:00Z',
    images: [],
    banners: [
      { id: 'b4', url: 'https://placehold.co/1080x1080/3b82f6/white?text=Blender+1', status: 'ready' },
    ],
    landingPage: { html: '', status: 'generating' },
    notes: '',
    tags: ['kitchen', 'portable'],
  },
  {
    id: '4',
    name: 'LED Therapy Mask',
    description: '7-color LED facial mask for skin rejuvenation',
    status: 'review',
    market: 'US',
    niche: 'Beauty Tech',
    targetAudience: 'Women 28-50',
    price: 89.99,
    createdAt: '2026-01-24T09:00:00Z',
    updatedAt: '2026-01-27T15:00:00Z',
    images: [],
    banners: [
      { id: 'b5', url: 'https://placehold.co/1080x1080/8b5cf6/white?text=LED+1', status: 'ready' },
      { id: 'b6', url: 'https://placehold.co/1080x1080/7c3aed/white?text=LED+2', status: 'ready' },
    ],
    landingPage: { html: '<html>...</html>', status: 'ready' },
    notes: 'Need to review landing page copy',
    tags: ['beauty', 'tech'],
  },
  {
    id: '5',
    name: 'Magnetic Phone Mount',
    description: 'MagSafe compatible car phone mount with fast charging',
    status: 'new',
    market: 'US',
    niche: 'Car Accessories',
    targetAudience: 'iPhone users',
    price: 24.99,
    createdAt: '2026-01-28T07:00:00Z',
    updatedAt: '2026-01-28T07:00:00Z',
    images: [],
    banners: [],
    landingPage: { html: '', status: 'pending' },
    notes: 'Discovered from daily product research',
    tags: ['new', 'car'],
  },
]

// Sample automations
const SAMPLE_AUTOMATIONS = [
  {
    id: 'auto1',
    name: 'Product Discovery',
    description: 'Daily scan for trending products across platforms',
    trigger: 'schedule',
    schedule: '7:00 AM daily',
    status: 'active',
    lastRun: '2026-01-28T07:00:00Z',
    runsToday: 1,
    webhook: 'https://n8n.example.com/webhook/product-discovery',
  },
  {
    id: 'auto2',
    name: 'Banner Generation',
    description: 'Generate 10 banner variations for Meta ads',
    trigger: 'status_change',
    triggerStatus: 'banner_generation',
    status: 'active',
    lastRun: '2026-01-28T10:15:00Z',
    runsToday: 3,
    webhook: 'https://n8n.example.com/webhook/banner-gen',
  },
  {
    id: 'auto3',
    name: 'Landing Page Generation',
    description: 'Create advertorial landing page with AI',
    trigger: 'status_change',
    triggerStatus: 'landing_page',
    status: 'active',
    lastRun: '2026-01-28T08:30:00Z',
    runsToday: 2,
    webhook: 'https://n8n.example.com/webhook/landing-page',
  },
  {
    id: 'auto4',
    name: 'GemPages Converter',
    description: 'Convert HTML to GemPages-ready format',
    trigger: 'manual',
    status: 'active',
    lastRun: '2026-01-28T12:45:00Z',
    runsToday: 5,
    webhook: 'https://n8n.example.com/webhook/gempages-convert',
  },
]

export function DataProvider({ children }) {
  const [products, setProducts] = useState([])
  const [automations, setAutomations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage or use sample data
    const savedProducts = localStorage.getItem('launchpad_products')
    const savedAutomations = localStorage.getItem('launchpad_automations')
    
    setProducts(savedProducts ? JSON.parse(savedProducts) : SAMPLE_PRODUCTS)
    setAutomations(savedAutomations ? JSON.parse(savedAutomations) : SAMPLE_AUTOMATIONS)
    setLoading(false)
  }, [])

  // Save to localStorage when data changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('launchpad_products', JSON.stringify(products))
    }
  }, [products, loading])

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('launchpad_automations', JSON.stringify(automations))
    }
  }, [automations, loading])

  const addProduct = (product) => {
    const newProduct = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'new',
      banners: [],
      landingPage: { html: '', status: 'pending' },
      tags: product.tags || [],
    }
    setProducts(prev => [newProduct, ...prev])
    return newProduct
  }

  const updateProduct = (id, updates) => {
    setProducts(prev => prev.map(p => 
      p.id === id 
        ? { ...p, ...updates, updatedAt: new Date().toISOString() }
        : p
    ))
  }

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const updateProductStatus = (id, newStatus) => {
    updateProduct(id, { status: newStatus })
    // Here we would trigger the webhook for status-based automations
    const automation = automations.find(a => a.triggerStatus === newStatus)
    if (automation) {
      console.log(`Would trigger automation: ${automation.name}`)
    }
  }

  const getProductsByStatus = (status) => {
    return products.filter(p => p.status === status)
  }

  const getStats = () => {
    return {
      total: products.length,
      new: products.filter(p => p.status === 'new').length,
      inProgress: products.filter(p => ['banner_generation', 'landing_page', 'review'].includes(p.status)).length,
      ready: products.filter(p => p.status === 'ready').length,
      live: products.filter(p => p.status === 'live').length,
    }
  }

  return (
    <DataContext.Provider value={{
      products,
      automations,
      loading,
      addProduct,
      updateProduct,
      deleteProduct,
      updateProductStatus,
      getProductsByStatus,
      getStats,
      STATUSES,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
