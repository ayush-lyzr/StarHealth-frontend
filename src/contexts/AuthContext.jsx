/**
 * AuthContext - Authentication context provider
 * Manages user authentication state and provides auth methods
 */
import { createContext, useContext, useState, useEffect } from 'react'
import apiClient, { setAuthToken, getIsRedirecting } from '../utils/axiosConfig'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // Skip auth check on login/password-reset pages to prevent redirect loops
      const currentPath = window.location.pathname
      if (currentPath === '/login' || currentPath === '/password-reset') {
        setAuthLoading(false)
        return
      }

      // Skip if a redirect to login is already in progress
      if (getIsRedirecting()) {
        console.debug('Redirect in progress, skipping auth init')
        setAuthLoading(false)
        return
      }

      try {
        // Try to recover session from HttpOnly cookie
        // We use a direct call to verify validity
        // Note: The interceptor handles automatic refresh on 401s for API calls,
        // but here we need to explicitly check if we have a valid session on page load.
        // We call /auth/refresh directly to get a fresh access token.
        const response = await apiClient.post('/auth/refresh')

        if (response.data.success && response.data.token) {
          const { user: userData, token } = response.data
          setUser(userData)
          setAuthToken(token) // Set memory token for apiClient
          setIsAuthenticated(true)

          // Legacy: Update localStorage user data for UI persistence if needed (not token)
          localStorage.setItem('auth_user', JSON.stringify(userData))
        } else {
          throw new Error('No session')
        }
      } catch (error) {
        // Silent failure is expected if no cookie exists
        console.debug('No active session found on init')
        setAuthToken(null)
        setUser(null)
        setIsAuthenticated(false)
        localStorage.removeItem('auth_user')
      } finally {
        setAuthLoading(false)
      }
    }

    initAuth()
  }, [])

  // Logout function
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (e) {
      console.error("Logout API failed", e)
    } finally {
      setAuthToken(null) // Clear memory token
      localStorage.removeItem('auth_user') // Clear legacy support
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/login'
    }
  }

  // Update user function (for after login/signup)
  const updateUser = (userData, token) => {
    if (token) {
      setAuthToken(token) // Set memory token
    }
    if (userData) {
      localStorage.setItem('auth_user', JSON.stringify(userData))
      setUser(userData)
      setIsAuthenticated(true)
    }
  }

  // Check if user is admin
  const isAdmin = user?.isAdmin === true

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    authLoading,
    logout,
    updateUser, // Expose updateUser for profile updates
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth context
 * @returns {Object} Auth context with user, isAuthenticated, isAdmin, logout, etc.
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
