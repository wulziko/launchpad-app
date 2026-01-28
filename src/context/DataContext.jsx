import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, db } from '../lib/supabase'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

// Status workflow
export const STATUSES = [
  { id: 'new', label: 'New', color: 'bg-dark-600', textColor: 'text-dark-300' },
  { id: 'banner_gen', label: 'Banner Generation', color: 'bg-blue-600', textColor: 'text-blue-100' },
  { id: 'landing_page', label: 'Landing Page', color: 'bg-purple-600', textColor: 'text-purple-100' },
  { id: 'review', label: 'Review', color: 'bg-yellow-600', textColor: 'text-yellow-100' },
  { id: 'ready', label: 'Ready to Launch', color: 'bg-green-600', textColor: 'text-green-100' },
  { id: 'live', label: 'Live', color: 'bg-primary-600', textColor: 'text-primary-100' },
  { id: 'paused', label: 'Paused', color: 'bg-orange-600', textColor: 'text-orange-100' },
]

export function DataProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const [products, setProducts] = useState([])
  const [automations, setAutomations] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAllData()
    } else {
      // Clear data when logged out
      setProducts([])
      setAutomations([])
      setAssets([])
      setLoading(false)
    }
  }, [isAuthenticated, user])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch products, automations, and assets in parallel
      const [productsData, automationsData, assetsData] = await Promise.all([
        db.products.getAll(),
        db.automations.getAll(),
        db.assets.getAll(),
      ])
      
      setProducts(productsData || [])
      setAutomations(automationsData || [])
      setAssets(assetsData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Products CRUD
  const addProduct = useCallback(async (productData) => {
    if (!user) throw new Error('Must be logged in')
    
    try {
      const newProduct = await db.products.create({
        user_id: user.id,
        name: productData.name,
        description: productData.description || '',
        status: 'new',
        niche: productData.niche || '',
        target_market: productData.market || 'US',
        metadata: {
          targetAudience: productData.targetAudience || '',
          tags: productData.tags || [],
          language: productData.language || 'English',
          country: productData.country || 'United States',
          gender: productData.gender || 'All',
          aliexpress_link: productData.aliexpress_link || '',
          amazon_link: productData.amazon_link || '',
          competitor_link_1: productData.competitor_link_1 || '',
          competitor_link_2: productData.competitor_link_2 || '',
          product_image_url: productData.product_image_url || '',
        }
      })
      
      // Transform to frontend format
      const formattedProduct = formatProduct(newProduct)
      setProducts(prev => [formattedProduct, ...prev])
      return formattedProduct
    } catch (err) {
      console.error('Error adding product:', err)
      throw err
    }
  }, [user])

  const updateProduct = useCallback(async (id, updates) => {
    try {
      // Find current product to get existing metadata
      const currentProduct = products.find(p => p.id === id)
      const currentMetadata = currentProduct?.metadata || {}
      
      const dbUpdates = {}
      if (updates.name) dbUpdates.name = updates.name
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.status) dbUpdates.status = updates.status
      if (updates.niche) dbUpdates.niche = updates.niche
      if (updates.market) dbUpdates.target_market = updates.market
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes
      
      // Update metadata fields
      const metadataUpdates = {}
      if (updates.language !== undefined) metadataUpdates.language = updates.language
      if (updates.country !== undefined) metadataUpdates.country = updates.country
      if (updates.gender !== undefined) metadataUpdates.gender = updates.gender
      if (updates.targetAudience !== undefined) metadataUpdates.targetAudience = updates.targetAudience
      if (updates.aliexpress_link !== undefined) metadataUpdates.aliexpress_link = updates.aliexpress_link
      if (updates.amazon_link !== undefined) metadataUpdates.amazon_link = updates.amazon_link
      if (updates.competitor_link_1 !== undefined) metadataUpdates.competitor_link_1 = updates.competitor_link_1
      if (updates.competitor_link_2 !== undefined) metadataUpdates.competitor_link_2 = updates.competitor_link_2
      if (updates.product_image_url !== undefined) metadataUpdates.product_image_url = updates.product_image_url
      if (updates.tags !== undefined) metadataUpdates.tags = updates.tags
      
      // Merge with existing metadata if there are updates
      if (Object.keys(metadataUpdates).length > 0) {
        dbUpdates.metadata = { ...currentMetadata, ...metadataUpdates }
      }
      
      const updated = await db.products.update(id, dbUpdates)
      const formattedProduct = formatProduct(updated)
      
      setProducts(prev => prev.map(p => p.id === id ? formattedProduct : p))
      return formattedProduct
    } catch (err) {
      console.error('Error updating product:', err)
      throw err
    }
  }, [products])

  const deleteProduct = useCallback(async (id) => {
    try {
      await db.products.delete(id)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error deleting product:', err)
      throw err
    }
  }, [])

  // Duplicate a product (creates new with fresh ID)
  const duplicateProduct = useCallback(async (id) => {
    if (!user) throw new Error('Must be logged in')
    
    try {
      // Find the product to duplicate
      const productToDuplicate = products.find(p => p.id === id)
      if (!productToDuplicate) throw new Error('Product not found')
      
      // Create new product with same data but new ID
      const newProduct = await db.products.create({
        user_id: user.id,
        name: `${productToDuplicate.name} (Copy)`,
        description: productToDuplicate.description || '',
        status: 'new', // Reset status for duplicated product
        niche: productToDuplicate.niche || '',
        target_market: productToDuplicate.market || 'US',
        metadata: {
          targetAudience: productToDuplicate.targetAudience || '',
          tags: productToDuplicate.tags || [],
          language: productToDuplicate.language || 'English',
          country: productToDuplicate.country || 'United States',
          gender: productToDuplicate.gender || 'All',
          aliexpress_link: productToDuplicate.aliexpress_link || '',
          amazon_link: productToDuplicate.amazon_link || '',
          competitor_link_1: productToDuplicate.competitor_link_1 || '',
          competitor_link_2: productToDuplicate.competitor_link_2 || '',
          product_image_url: productToDuplicate.product_image_url || '',
        }
      })
      
      const formattedProduct = formatProduct(newProduct)
      setProducts(prev => [formattedProduct, ...prev])
      return formattedProduct
    } catch (err) {
      console.error('Error duplicating product:', err)
      throw err
    }
  }, [user, products])

  const updateProductStatus = useCallback(async (id, newStatus) => {
    try {
      const updated = await db.products.updateStatus(id, newStatus)
      const formattedProduct = formatProduct(updated)
      
      setProducts(prev => prev.map(p => p.id === id ? formattedProduct : p))
      
      // Trigger webhook for status-based automations
      const automation = automations.find(a => 
        a.trigger_type === 'status_change' && 
        a.trigger_config?.status === newStatus &&
        a.is_active
      )
      
      if (automation?.webhook_url) {
        console.log(`Triggering automation: ${automation.name}`)
        // TODO: Call webhook
      }
      
      return formattedProduct
    } catch (err) {
      console.error('Error updating status:', err)
      throw err
    }
  }, [automations])

  // Automations CRUD
  const addAutomation = useCallback(async (automationData) => {
    if (!user) throw new Error('Must be logged in')
    
    try {
      const newAutomation = await db.automations.create({
        user_id: user.id,
        name: automationData.name,
        description: automationData.description || '',
        type: automationData.type || 'n8n',
        trigger_type: automationData.triggerType || 'manual',
        trigger_config: automationData.triggerConfig || {},
        webhook_url: automationData.webhookUrl || '',
        is_active: true,
      })
      
      setAutomations(prev => [newAutomation, ...prev])
      return newAutomation
    } catch (err) {
      console.error('Error adding automation:', err)
      throw err
    }
  }, [user])

  const updateAutomation = useCallback(async (id, updates) => {
    try {
      const updated = await db.automations.update(id, updates)
      setAutomations(prev => prev.map(a => a.id === id ? updated : a))
      return updated
    } catch (err) {
      console.error('Error updating automation:', err)
      throw err
    }
  }, [])

  const deleteAutomation = useCallback(async (id) => {
    try {
      await db.automations.delete(id)
      setAutomations(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Error deleting automation:', err)
      throw err
    }
  }, [])

  // Assets CRUD
  const addAsset = useCallback(async (assetData) => {
    if (!user) throw new Error('Must be logged in')
    
    try {
      const newAsset = await db.assets.create({
        user_id: user.id,
        product_id: assetData.productId || null,
        type: assetData.type,
        name: assetData.name,
        file_url: assetData.fileUrl || '',
        content: assetData.content || '',
        metadata: assetData.metadata || {},
      })
      
      setAssets(prev => [newAsset, ...prev])
      return newAsset
    } catch (err) {
      console.error('Error adding asset:', err)
      throw err
    }
  }, [user])

  const deleteAsset = useCallback(async (id) => {
    try {
      await db.assets.delete(id)
      setAssets(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Error deleting asset:', err)
      throw err
    }
  }, [])

  // Helper functions
  const getProductsByStatus = useCallback((status) => {
    return products.filter(p => p.status === status)
  }, [products])

  const getAssetsByProduct = useCallback((productId) => {
    return assets.filter(a => a.product_id === productId)
  }, [assets])

  const getStats = useCallback(() => {
    return {
      total: products.length,
      new: products.filter(p => p.status === 'new').length,
      inProgress: products.filter(p => ['banner_gen', 'landing_page', 'review'].includes(p.status)).length,
      ready: products.filter(p => p.status === 'ready').length,
      live: products.filter(p => p.status === 'live').length,
    }
  }, [products])

  // Format database product to frontend format
  const formatProduct = (dbProduct) => ({
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    status: dbProduct.status,
    market: dbProduct.target_market,
    niche: dbProduct.niche,
    notes: dbProduct.notes || '',
    tags: dbProduct.metadata?.tags || [],
    targetAudience: dbProduct.metadata?.targetAudience || '',
    language: dbProduct.metadata?.language || 'English',
    country: dbProduct.metadata?.country || 'United States',
    gender: dbProduct.metadata?.gender || 'All',
    aliexpress_link: dbProduct.metadata?.aliexpress_link || '',
    amazon_link: dbProduct.metadata?.amazon_link || '',
    competitor_link_1: dbProduct.metadata?.competitor_link_1 || '',
    competitor_link_2: dbProduct.metadata?.competitor_link_2 || '',
    product_image_url: dbProduct.metadata?.product_image_url || '',
    createdAt: dbProduct.created_at,
    updatedAt: dbProduct.updated_at,
    
    // Automation status (from metadata)
    automationStatus: dbProduct.metadata?.automation_status || 'idle',
    automationProgress: dbProduct.metadata?.automation_progress || 0,
    automationMessage: dbProduct.metadata?.automation_message || '',
    
    // External IDs for 3rd party integrations
    // Example: { meta_ad_id: '123', shopify_product_id: '456', clickup_task_id: '789' }
    external_ids: dbProduct.metadata?.external_ids || {},
    
    // Pass through full metadata for access to other fields
    metadata: dbProduct.metadata || {},
    
    // These will be populated from assets
    banners: [],
    landingPage: { html: '', status: 'pending' },
  })

  const value = {
    // Data
    products,
    automations,
    assets,
    loading,
    error,
    
    // Products
    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    updateProductStatus,
    getProductsByStatus,
    
    // Automations
    addAutomation,
    updateAutomation,
    deleteAutomation,
    
    // Assets
    addAsset,
    deleteAsset,
    getAssetsByProduct,
    
    // Utils
    getStats,
    refreshData: fetchAllData,
    STATUSES,
  }

  return (
    <DataContext.Provider value={value}>
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
