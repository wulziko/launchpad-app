import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, auth } from '../lib/supabase'
import { secureStorage } from '../lib/security'

const AuthContext = createContext(null)

// Auth states for clearer state management
export const AuthState = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authState, setAuthState] = useState(AuthState.LOADING)
  const [error, setError] = useState(null)

  // Session timeout (30 minutes of inactivity)
  const SESSION_TIMEOUT = 30 * 60 * 1000
  let inactivityTimer = null

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer) clearTimeout(inactivityTimer)
    inactivityTimer = setTimeout(() => {
      logout()
    }, SESSION_TIMEOUT)
  }, [])

  // Track user activity
  useEffect(() => {
    if (authState === AuthState.AUTHENTICATED) {
      const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
      events.forEach(event => {
        window.addEventListener(event, resetInactivityTimer, { passive: true })
      })
      resetInactivityTimer()

      return () => {
        events.forEach(event => {
          window.removeEventListener(event, resetInactivityTimer)
        })
        if (inactivityTimer) clearTimeout(inactivityTimer)
      }
    }
  }, [authState, resetInactivityTimer])

  // Initialize auth state
  useEffect(() => {
    if (supabase) {
      // Supabase mode - check session and listen for changes
      initSupabaseAuth()
    } else {
      // Demo mode - no Supabase configured
      setAuthState(AuthState.UNAUTHENTICATED)
    }
  }, [])

  const initSupabaseAuth = async () => {
    try {
      // Get initial session
      const session = await auth.getSession()
      
      if (session?.user) {
        setUser(formatUser(session.user))
        setAuthState(AuthState.AUTHENTICATED)
      } else {
        setAuthState(AuthState.UNAUTHENTICATED)
      }

      // Listen for auth changes
      const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(formatUser(session.user))
          setAuthState(AuthState.AUTHENTICATED)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setAuthState(AuthState.UNAUTHENTICATED)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(formatUser(session.user))
        }
      })

      return () => subscription?.unsubscribe()
    } catch (err) {
      console.error('Auth initialization error:', err)
      setAuthState(AuthState.UNAUTHENTICATED)
    }
  }

  // Format Supabase user to app user format
  const formatUser = (supabaseUser) => ({
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
    avatar: supabaseUser.user_metadata?.avatar || '👤',
    role: supabaseUser.user_metadata?.role || 'user',
  })

  // Sign up with email/password
  const signUp = useCallback(async (email, password, metadata = {}) => {
    try {
      setError(null)
      
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' }
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' }
      }

      const data = await auth.signUp(email, password, metadata)
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        return { 
          success: true, 
          needsConfirmation: true,
          message: 'Check your email to confirm your account'
        }
      }

      return { success: true }
    } catch (err) {
      console.error('Sign up error:', err)
      return { success: false, error: err.message || 'Sign up failed' }
    }
  }, [])

  // Sign in with email/password
  const login = useCallback(async (email, password) => {
    try {
      setError(null)
      
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' }
      }

      await auth.signIn(email, password)
      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      // Generic error message for security
      return { success: false, error: 'Invalid email or password' }
    }
  }, [])

  // Sign in with OAuth (Google, GitHub, etc.)
  const loginWithOAuth = useCallback(async (provider) => {
    try {
      setError(null)
      await auth.signInWithOAuth(provider)
      return { success: true }
    } catch (err) {
      console.error('OAuth error:', err)
      return { success: false, error: err.message || 'OAuth login failed' }
    }
  }, [])

  // Sign out
  const logout = useCallback(async () => {
    try {
      if (supabase) {
        await auth.signOut()
      }
      setUser(null)
      setAuthState(AuthState.UNAUTHENTICATED)
      setError(null)
      
      if (inactivityTimer) clearTimeout(inactivityTimer)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }, [])

  // Reset password
  const resetPassword = useCallback(async (email) => {
    try {
      setError(null)
      
      if (!email) {
        return { success: false, error: 'Email is required' }
      }

      await auth.resetPassword(email)
      return { success: true, message: 'Check your email for reset instructions' }
    } catch (err) {
      console.error('Password reset error:', err)
      return { success: false, error: err.message || 'Password reset failed' }
    }
  }, [])

  // Update password
  const updatePassword = useCallback(async (newPassword) => {
    try {
      setError(null)
      
      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' }
      }

      await auth.updatePassword(newPassword)
      return { success: true, message: 'Password updated successfully' }
    } catch (err) {
      console.error('Password update error:', err)
      return { success: false, error: err.message || 'Password update failed' }
    }
  }, [])

  const value = {
    user,
    authState,
    error,
    loading: authState === AuthState.LOADING,
    isAuthenticated: authState === AuthState.AUTHENTICATED,
    isSupabaseConfigured: !!supabase,
    login,
    logout,
    signUp,
    loginWithOAuth,
    resetPassword,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
