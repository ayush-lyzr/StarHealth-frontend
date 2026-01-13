import { useState, useEffect } from 'react'

const API_BASE_URL = 'https://star-health-api.rapid.studio.lyzr.ai/api'

export default function PasswordReset() {
  const [email, setEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState('request') // 'request' or 'verify'
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Force light mode on password reset page
  useEffect(() => {
    const root = document.documentElement
    const originalIsDark = root.classList.contains('dark')
    root.classList.remove('dark')

    // Cleanup: restore theme if necessary when leaving
    return () => {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark') {
        root.classList.add('dark')
      }
    }
  }, [])

  const handleRequestReset = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/password-reset-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Password reset code sent to your WhatsApp. Please check your messages.')
        setStep('verify')
      } else {
        setError(data.message || 'Failed to send reset code')
      }
    } catch (error) {
      setError('Failed to send reset code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyReset = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/password-reset-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Password reset successfully! You can now sign in with your new password.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        setError(data.message || 'Failed to reset password')
      }
    } catch (error) {
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {step === 'request' ? 'Reset Password' : 'Verify Reset Code'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 'request'
              ? 'Enter your email to receive a reset code via WhatsApp'
              : 'Enter the reset code and new password'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {step === 'request' ? (
          <form className="mt-8 space-y-6" onSubmit={handleRequestReset}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => window.location.href = '/login'}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to login
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyReset}>
            <div>
              <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-2">
                Reset Code
              </label>
              <input
                id="resetCode"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter 6-digit code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep('request')
                  setError('')
                  setSuccess('')
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}




