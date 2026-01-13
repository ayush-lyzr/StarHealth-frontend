/**
 * Axios Configuration with Authentication
 *
 * Production-grade axios instance with:
 * - memory-based token storage (secure)
 * - Automatic token injection
 * - Request/response interceptors
 * - Error handling
 * - Base URL configuration
 */
import axios from 'axios'

// Memory storage for access token (more secure than localStorage)
let memoryToken = null

// Flag to prevent infinite redirect loops
let isRedirecting = false

// Function to set the token (exported to be used by AuthContext)
export const setAuthToken = (token) => {
  memoryToken = token
  // Reset redirect flag when a valid token is set (successful login)
  if (token) {
    isRedirecting = false
  }
}

// Function to check if we're currently redirecting
export const getIsRedirecting = () => isRedirecting

// Function to reset the redirect flag (for manual control if needed)
export const resetRedirectFlag = () => {
  isRedirecting = false
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: 'https://star-health-api.rapid.studio.lyzr.ai/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 🔒 Required for HttpOnly cookie-based auth in cross-origin (production)
})

// Request interceptor - Add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    // Add token to Authorization header if available in memory
    if (memoryToken) {
      config.headers.Authorization = `Bearer ${memoryToken}`
    }

    return config
  },
  (error) => {
    // Handle request error
    return Promise.reject(error)
  }
)

// Response interceptor - Handle common errors and Token Refresh
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized - Try to refresh token
    // Skip if already redirecting to prevent infinite loops
    // Also skip if already on login/password-reset page
    const currentPath = window.location.pathname.replace(/\/$/, '')
    const isOnAuthPage = currentPath === '/login' || currentPath === '/password-reset'

    if (error.response?.status === 401 && !originalRequest._retry && !isRedirecting && !isOnAuthPage) {
      originalRequest._retry = true

      try {
        // Attempt to refresh token using HttpOnly cookie
        // We use a new axios instance to avoid infinite loops
        const response = await axios.post(
          'https://star-health-api.rapid.studio.lyzr.ai/api/auth/refresh',
          {},
          { withCredentials: true }
        )

        const { token } = response.data

        if (token) {
          // Update memory token
          setAuthToken(token)

          // Update authorization header for original request
          originalRequest.headers.Authorization = `Bearer ${token}`

          // Retry original request
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Only redirect once - set the flag to prevent infinite loops
        // Double-check we're not already on auth page
        const currentPath = window.location.pathname.replace(/\/$/, '')
        const isOnAuthPage = currentPath === '/login' || currentPath === '/password-reset'

        if (!isRedirecting && !isOnAuthPage) {
          console.error('Session expired, please login again', refreshError)
          isRedirecting = true

          // Refresh failed - clear auth and redirect
          setAuthToken(null)
          // Also clear user data from localStorage if we are cleaning up
          localStorage.removeItem('auth_user')

          // Redirect to login
          window.location.replace('/login')
        }
        // Return rejected promise without triggering more redirects
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    if (error.response) {
      const { status, data } = error.response

      if (status === 403) {
        console.error('Access forbidden:', data?.message)
      }

      if (status === 503) {
        console.warn('Backend warming up:', data?.message)
      }
    } else if (error.request) {
      console.error('Network error: No response')
    } else {
      console.error('Request error:', error.message)
    }

    return Promise.reject(error)
  }
)

// Export as default
export default apiClient
