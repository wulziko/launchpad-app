import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { secureStorage } from '../lib/security'

const AuthContext = createContext(null)

// Auth states for clearer state management
export const AuthState = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
}

// Temporary hardcoded users - will be replaced with Supabase Auth
// In production, NEVER store passwords in code
const DEV_USERS = [
  { 
    id: crypto.randomUUID(), 
    username: 'guy', 
    // Simulated hash - in production use proper hashing
    passwordHash: 'MTIzMTIz', // base64 of '123123' for demo only
    name: 'Guy', 
    role: 'admin', 
    avatar: '👨‍💼' 
  }
]

// Simple hash for demo (NOT SECURE - use Supabase in production)
const simpleHash = (str) => btoa(str)

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

  // Check for saved session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = () => {
    try {
      const savedSession = secureStorage.get('session')
      
      if (savedSession) {
        // Check if session is expired
        const sessionAge = Date.now() - (savedSession.timestamp || 0)
        if (sessionAge > SESSION_TIMEOUT) {
          // Session expired
          secureStorage.remove('session')
          setUser(null)
          setAuthState(AuthState.UNAUTHENTICATED)
        } else {
          setUser(savedSession.user)
          setAuthState(AuthState.AUTHENTICATED)
        }
      } else {
        setAuthState(AuthState.UNAUTHENTICATED)
      }
    } catch (err) {
      console.error('Session check failed:', err)
      setAuthState(AuthState.UNAUTHENTICATED)
    }
  }

  const login = useCallback(async (username, password) => {
    try {
      setError(null)
      
      // Input validation
      if (!username || !password) {
        return { success: false, error: 'Username and password are required' }
      }

      if (username.length > 100 || password.length > 100) {
        return { success: false, error: 'Invalid credentials' }
      }

      // TODO: Replace with Supabase Auth
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email: username,
      //   password,
      // })

      // Temporary: Check against dev users
      const hashedPassword = simpleHash(password)
      const foundUser = DEV_USERS.find(
        u => u.username.toLowerCase() === username.toLowerCase() && 
             u.passwordHash === hashedPassword
      )
      
      if (foundUser) {
        const { passwordHash: _, ...userWithoutPassword } = foundUser
        
        // Save session with timestamp
        secureStorage.set('session', {
          user: userWithoutPassword,
          timestamp: Date.now(),
        })
        
        setUser(userWithoutPassword)
        setAuthState(AuthState.AUTHENTICATED)
        
        return { success: true }
      }
      
      // Generic error message (don't reveal if user exists)
      return { success: false, error: 'Invalid credentials' }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message)
      return { success: false, error: 'An error occurred. Please try again.' }
    }
  }, [])

  const logout = useCallback(() => {
    secureStorage.remove('session')
    setUser(null)
    setAuthState(AuthState.UNAUTHENTICATED)
    setError(null)
    
    // Clear any sensitive data from memory
    if (inactivityTimer) clearTimeout(inactivityTimer)
  }, [])

  const value = {
    user,
    authState,
    error,
    loading: authState === AuthState.LOADING,
    isAuthenticated: authState === AuthState.AUTHENTICATED,
    login,
    logout,
    checkSession,
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
