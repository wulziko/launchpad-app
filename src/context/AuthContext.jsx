import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Hardcoded users for now - will be replaced with proper auth later
const USERS = [
  { id: 1, username: 'guy', password: '123123', name: 'Guy', role: 'admin', avatar: '👨‍💼' }
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('launchpad_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (username, password) => {
    const foundUser = USERS.find(
      u => u.username === username && u.password === password
    )
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem('launchpad_user', JSON.stringify(userWithoutPassword))
      return { success: true }
    }
    
    return { success: false, error: 'Invalid username or password' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('launchpad_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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
