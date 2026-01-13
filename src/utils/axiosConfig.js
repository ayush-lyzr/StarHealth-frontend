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

// Function to set the token (exported to be used by AuthContext)
export const setAuthToken = (token) => {
  memoryToken = token
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
    if (error.response?.status === 401 && !originalRequest._retry) {
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
        console.error('Session expired, please login again', refreshError)
        // Refresh failed - clear auth and redirect
        setAuthToken(null)
        // Also clear user data from localStorage if we are cleaning up
        localStorage.removeItem('auth_user')

        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
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
