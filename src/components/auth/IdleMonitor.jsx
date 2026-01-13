
import { useState, useEffect, useRef } from 'react'
import apiClient from '../../utils/axiosConfig'

// Idle timeout in milliseconds (30 minutes)
const IDLE_TIMEOUT = 30 * 60 * 1000
// Warning timeout (28 minutes)
const WARNING_TIMEOUT = 28 * 60 * 1000

export default function IdleMonitor() {
    const [showWarning, setShowWarning] = useState(false)
    const lastActivityRef = useRef(Date.now())
    const warningTimerRef = useRef(null)
    const logoutTimerRef = useRef(null)

    const resetTimer = () => {
        const now = Date.now()
        // Debounce: Only update if more than 1 second has passed
        if (now - lastActivityRef.current < 1000) return

        lastActivityRef.current = now
        setShowWarning(false)

        if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)

        // Set new timers
        warningTimerRef.current = setTimeout(() => {
            setShowWarning(true)
        }, WARNING_TIMEOUT)

        logoutTimerRef.current = setTimeout(() => {
            handleLogout()
        }, IDLE_TIMEOUT)
    }

    const handleLogout = async () => {
        try {
            await apiClient.post('/auth/logout')
        } catch (error) {
            console.error('Logout failed', error)
        } finally {
            // Memory token interacts with AuthContext updates automatically on page reload
            localStorage.removeItem('auth_user')
            window.location.href = '/login'
        }
    }

    const handleStayLoggedIn = async () => {
        // Reset timers locally
        resetTimer()
        setShowWarning(false)

        // Optional: Call heartbeat endpoint if needed, or just rely on local reset
        // await apiClient.get('/auth/heartbeat') 
        // We can just rely on the fact that any API call extends the session (via refresh token mechanics)
        // but strict security might require explicit hit. For now, local reset is fine.
    }

    useEffect(() => {
        // Events to track
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer)
        })

        // Initial timer
        resetTimer()

        return () => {
            // Cleanup
            events.forEach(event => {
                window.removeEventListener(event, resetTimer)
            })
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
            if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
        }
    }, [])

    if (!showWarning) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Session Expiring
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    You have been inactive for a while. You will be logged out in 2 minutes for security.
                </p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                        Log Out
                    </button>
                    <button
                        onClick={handleStayLoggedIn}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                        Stay Logged In
                    </button>
                </div>
            </div>
        </div>
    )
}
