/**
 * Authentication hook - will integrate with Supabase
 * For now, provides the structure and mock for development
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

// Auth context
const AuthContext = createContext(null);

// Auth states
export const AuthState = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
};

/**
 * Auth Provider component
 * Wrap your app with this to provide auth context
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState(AuthState.LOADING);
  const [error, setError] = useState(null);

  // Check initial auth state
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setAuthState(AuthState.LOADING);
      
      // TODO: Replace with Supabase auth check
      // const { data: { session } } = await supabase.auth.getSession();
      
      // Mock: Check for stored session (development only)
      const mockSession = sessionStorage.getItem('dev_session');
      if (mockSession) {
        setUser(JSON.parse(mockSession));
        setAuthState(AuthState.AUTHENTICATED);
      } else {
        setUser(null);
        setAuthState(AuthState.UNAUTHENTICATED);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setError(err.message);
      setAuthState(AuthState.UNAUTHENTICATED);
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      setError(null);
      setAuthState(AuthState.LOADING);
      
      // TODO: Replace with Supabase sign in
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email,
      //   password,
      // });
      
      // Mock for development
      const mockUser = {
        id: crypto.randomUUID(),
        email,
        displayName: email.split('@')[0],
      };
      sessionStorage.setItem('dev_session', JSON.stringify(mockUser));
      setUser(mockUser);
      setAuthState(AuthState.AUTHENTICATED);
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      setAuthState(AuthState.UNAUTHENTICATED);
      return { success: false, error: err.message };
    }
  }, []);

  const signUp = useCallback(async (email, password) => {
    try {
      setError(null);
      setAuthState(AuthState.LOADING);
      
      // TODO: Replace with Supabase sign up
      // const { data, error } = await supabase.auth.signUp({
      //   email,
      //   password,
      // });
      
      // Mock for development
      const mockUser = {
        id: crypto.randomUUID(),
        email,
        displayName: email.split('@')[0],
      };
      sessionStorage.setItem('dev_session', JSON.stringify(mockUser));
      setUser(mockUser);
      setAuthState(AuthState.AUTHENTICATED);
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      setAuthState(AuthState.UNAUTHENTICATED);
      return { success: false, error: err.message };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // TODO: Replace with Supabase sign out
      // await supabase.auth.signOut();
      
      sessionStorage.removeItem('dev_session');
      setUser(null);
      setAuthState(AuthState.UNAUTHENTICATED);
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const value = {
    user,
    authState,
    error,
    isLoading: authState === AuthState.LOADING,
    isAuthenticated: authState === AuthState.AUTHENTICATED,
    signIn,
    signUp,
    signOut,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * HOC to protect routes
 */
export function withAuth(Component) {
  return function ProtectedRoute(props) {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/login';
      return null;
    }
    
    return <Component {...props} />;
  };
}
