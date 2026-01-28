import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using demo mode.')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

// Auth helpers
export const auth = {
  // Sign up with email and password
  signUp: async (email, password, metadata = {}) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
    if (error) throw error
    return data
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  // Sign in with OAuth provider
  signInWithOAuth: async (provider) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) throw error
    return data
  },

  // Sign out
  signOut: async () => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current session
  getSession: async () => {
    if (!supabase) return null
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // Get current user
  getUser: async () => {
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
    return supabase.auth.onAuthStateChange(callback)
  },

  // Reset password
  resetPassword: async (email) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  },

  // Update password
  updatePassword: async (newPassword) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  }
}

// Database helpers
export const db = {
  // Products
  products: {
    getAll: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },

    getById: async (id) => {
      if (!supabase) return null
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },

    create: async (product) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single()
      if (error) throw error
      return data
    },

    update: async (id, updates) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    delete: async (id) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      if (error) throw error
    },

    updateStatus: async (id, status) => {
      return db.products.update(id, { status, updated_at: new Date().toISOString() })
    }
  },

  // Assets
  assets: {
    getAll: async (productId = null) => {
      if (!supabase) return []
      let query = supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (productId) {
        query = query.eq('product_id', productId)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    },

    create: async (asset) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('assets')
        .insert(asset)
        .select()
        .single()
      if (error) throw error
      return data
    },

    delete: async (id) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)
      if (error) throw error
    }
  },

  // Automations
  automations: {
    getAll: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },

    create: async (automation) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('automations')
        .insert(automation)
        .select()
        .single()
      if (error) throw error
      return data
    },

    update: async (id, updates) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('automations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    delete: async (id) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', id)
      if (error) throw error
    }
  }
}

// Storage helpers
export const storage = {
  upload: async (bucket, path, file) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)
    if (error) throw error
    return data
  },

  getPublicUrl: (bucket, path) => {
    if (!supabase) return null
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    return data.publicUrl
  },

  delete: async (bucket, paths) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths)
    if (error) throw error
  }
}

export default supabase
