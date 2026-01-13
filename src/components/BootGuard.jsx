/**
 * BootGuard Component - Enterprise Refined
 *
 * 🔒 ENTERPRISE: Polls /health/live until backend is alive.
 * Stops polling immediately when backend responds.
 * Stable useEffect dependencies to prevent infinite loops.
 */
import { useState, useEffect, useRef } from 'react'

import StarLoader from './ui/StarLoader'

// Branded loader component wrapper
const SimpleLoader = ({ retryCount = 0 }) => (
  <div
    className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
    }}
  >
    <StarLoader
      size="xl"
      text={retryCount > 0 ? `Connecting... (attempt ${retryCount + 1})` : 'System is starting up...'}
    />
  </div>
)

export default function BootGuard({ children }) {
  const [ready, setReady] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const isMountedRef = useRef(true)
  const pollingActiveRef = useRef(false)
  const abortControllerRef = useRef(null)

  // Mark component as mounted
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Abort any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Health check effect - stable dependencies (empty array = run once)
  useEffect(() => {
    // Prevent duplicate polling
    if (pollingActiveRef.current || ready) {
      return
    }

    pollingActiveRef.current = true
    let timeoutId = null

    const checkBackendHealth = async () => {
      // Stop if already ready or unmounted
      if (ready || !isMountedRef.current) {
        pollingActiveRef.current = false
        return
      }

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      const healthCheckTimeout = setTimeout(() => {
        abortControllerRef.current?.abort()
      }, 5000) // 5 second timeout

      try {
        // 🔒 ENTERPRISE: Use /health/live (never fails, no dependencies)
        const response = await fetch('http://3.231.155.2:8000/health/live', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: abortControllerRef.current.signal,
          cache: 'no-cache'
        })

        clearTimeout(healthCheckTimeout)

        // /health/live should ALWAYS return 200
        // ANY 200 response means backend is alive (regardless of JSON content)
        if (response.status === 200) {
          // console.log('✅ Backend is alive')
          // Stop polling immediately
          pollingActiveRef.current = false
          if (isMountedRef.current) {
            setReady(true)
          }
          return // Stop retrying
        }

        // If we get here, something unexpected happened
        throw new Error(`Unexpected response: ${response.status}`)

      } catch (error) {
        clearTimeout(healthCheckTimeout)

        // Stop polling if component unmounted
        if (!isMountedRef.current) {
          pollingActiveRef.current = false
          return
        }

        // Don't log aborted requests as errors
        if (error.name === 'AbortError') {
          // console.log(`⏱️ Health check timeout (attempt ${retryCount + 1}), retrying...`)
        } else {
          // console.warn(`⚠️ Backend health check failed (attempt ${retryCount + 1}):`, error.message)
        }

        // Exponential backoff: 1s, 2s, 3s, then 3s intervals
        const delay = Math.min(1000 * (retryCount + 1), 3000)

        timeoutId = setTimeout(() => {
          if (isMountedRef.current && !ready) {
            setRetryCount(prev => prev + 1)
            // Recursive call for retry
            checkBackendHealth()
          } else {
            pollingActiveRef.current = false
          }
        }, delay)
      }
    }

    // Start health check immediately
    checkBackendHealth()

    // Cleanup on unmount
    return () => {
      pollingActiveRef.current = false
      if (timeoutId) clearTimeout(timeoutId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []) // Empty deps - only run once on mount

  // Show loader until backend is ready
  if (!ready) {
    return <SimpleLoader retryCount={retryCount} />
  }

  // Backend is ready, render the app
  return children
}

