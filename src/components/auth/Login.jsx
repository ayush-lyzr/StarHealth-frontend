import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import apiClient from '../../utils/axiosConfig'

const API_BASE_URL = 'https://star-health-api.rapid.studio.lyzr.ai/api'

export default function Login() {
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendingOTP, setResendingOTP] = useState(false)
  const [twoFactorEmail, setTwoFactorEmail] = useState('')
  const [showPasswordReset, setShowPasswordReset] = useState(false)

  // Force light mode on login page
  useEffect(() => {
    const root = document.documentElement
    const originalIsDark = root.classList.contains('dark')
    root.classList.remove('dark')

    // Cleanup: restore theme if necessary when leaving login
    return () => {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark') {
        root.classList.add('dark')
      }
    }
  }, [])

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      const data = await response.json()

      // Handle admin-only access error
      if (response.status === 403 && data.code === 'ADMIN_ACCESS_REQUIRED') {
        setError('Access restricted to administrators only. Please contact an admin to grant you access.')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError(data.message || 'Sign in failed. Please check your credentials.')
        setLoading(false)
        return
      }

      if (data.requires2FA) {
        setRequires2FA(true)
        setTwoFactorEmail(data.email || email)
        setError('')
      } else if (data.success && data.token) {
        // Direct login (no 2FA)
        if (updateUser) {
          updateUser(data.user, data.token)
        }

        // Legacy user data for persistence (optional)
        localStorage.setItem('auth_user', JSON.stringify(data.user))

        // Small delay to ensure state is updated, then redirect
        setTimeout(() => {
          navigate('/dashboard')
        }, 300)
      } else {
        setError(data.message || 'Sign in failed')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setSuccess('')
    setResendingOTP(true)

    try {
      // Resend OTP by calling signin again (which will generate a new 2FA code)
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: twoFactorEmail || email,
          password: password
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (response.status === 403 && data.code === 'ADMIN_ACCESS_REQUIRED') {
        setError('Access restricted to administrators only.')
        setResendingOTP(false)
        return
      }

      if (!response.ok) {
        setError(data.message || 'Failed to resend OTP. Please try again.')
        setResendingOTP(false)
        return
      }

      if (data.requires2FA) {
        setSuccess('New verification code has been sent to your WhatsApp.')
        setTwoFactorCode('') // Clear the old code
        setTimeout(() => setSuccess(''), 5000)
      } else {
        setError('Failed to resend OTP. Please try signing in again.')
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setResendingOTP(false)
    }
  }

  const handleVerify2FA = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: twoFactorEmail || email,
          code: twoFactorCode
        }),
        credentials: 'include'
      })

      const data = await response.json()

      // Handle admin-only access error
      if (response.status === 403 && data.code === 'ADMIN_ACCESS_REQUIRED') {
        setError('Access restricted to administrators only. Please contact an admin to grant you access.')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError(data.message || 'Invalid 2FA code. Please try again.')
        setLoading(false)
        return
      }

      if (data.success && data.token) {
        // Update auth state first
        if (updateUser) {
          updateUser(data.user, data.token)
        }

        // Legacy user data for persistence (optional)
        localStorage.setItem('auth_user', JSON.stringify(data.user))

        // Small delay to ensure state is updated, then redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard')
        }, 300)
      } else {
        setError(data.message || '2FA verification failed')
      }
    } catch (error) {
      console.error('2FA verification error:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    // Navigate to password reset page
    navigate('/password-reset')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-12 relative">


      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <img
              src="/Star_Health_and_Allied_Insurance.svg.png"
              alt="Star Health Insurance"
              className="h-20 w-auto"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {requires2FA ? 'Two-Factor Authentication' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {requires2FA
              ? 'Enter the 6-digit code sent to your WhatsApp'
              : 'Sign in to your Star Health account'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Login Form */}
        {!requires2FA ? (
          <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSignIn}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>🔒 Secure Login</p>
              <p className="mt-1">Protected by Two-Factor Authentication</p>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleVerify2FA}>
            <div>
              <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-2">
                6-Digit Code
              </label>
              <input
                id="twoFactorCode"
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Check your WhatsApp for the verification code
              </p>
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendingOTP}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendingOTP ? 'Resending...' : "Didn't receive code? Resend OTP"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || twoFactorCode.length !== 6}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false)
                  setTwoFactorCode('')
                  setError('')
                  setSuccess('')
                }}
                disabled={loading}
                className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
