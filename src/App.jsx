import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ConditionalLayout from './components/layout/ConditionalLayout'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './components/auth/Login'
import PasswordReset from './components/auth/PasswordReset'
import Dashboard from './components/Dashboard'
import EnhancedKnowledge from './components/knowledge/EnhancedKnowledge'
import RAGKnowledgeBase from './components/knowledge/RAGKnowledgeBase'
import Agents from './components/Agents'
import CustomizeAgents from './components/CustomizeAgents'
import CustomizeUsers from './components/CustomizeUsers'
import ProductTraces from './components/ProductTraces'
import UserProfile from './components/UserProfile'
import StarLoader from './components/ui/StarLoader'
import IdleMonitor from './components/auth/IdleMonitor'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, authLoading } = useAuth()
  const location = useLocation()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <StarLoader size="xl" text="Loading..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 🔒 ADMIN-ONLY ACCESS: Block non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md mx-4">
          <div className="mb-6">
            <svg
              className="w-16 h-16 mx-auto text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Restricted
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This portal is restricted to administrators only. Please contact an administrator to grant you access.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token')
              localStorage.removeItem('auth_user')
              window.location.href = '/login'
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return children
}

// Main Layout Component (for protected routes)
function MainLayout() {
  const [activeView, setActiveView] = useState('dashboard')
  const location = useLocation()
  const navigate = useNavigate()

  // Update activeView based on current route
  useEffect(() => {
    const path = location.pathname
    if (path === '/dashboard' || path === '/') {
      setActiveView('dashboard')
    } else if (path === '/knowledge') {
      setActiveView('knowledge')
    } else if (path === '/agents') {
      setActiveView('agents')
    } else if (path === '/customize-agents') {
      setActiveView('customize-agents')
    } else if (path === '/customize-users') {
      setActiveView('customize-users')
    } else if (path === '/product-traces') {
      setActiveView('product-traces')
    } else if (path === '/profile') {
      setActiveView('profile')
    }
  }, [location.pathname])

  // Handle navigation via setActiveView (for sidebar/header clicks)
  const handleViewChange = (view) => {
    setActiveView(view)
    const routeMap = {
      'dashboard': '/dashboard',
      'knowledge': '/knowledge',
      'agents': '/agents',
      'customize-agents': '/customize-agents',
      'customize-users': '/customize-users',
      'product-traces': '/product-traces',
      'profile': '/profile'
    }
    if (routeMap[view]) {
      navigate(routeMap[view])
    }
  }

  return (
    <ErrorBoundary>
      <IdleMonitor />
      <ConditionalLayout activeView={activeView} setActiveView={handleViewChange}>
        <ErrorBoundary>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/knowledge" element={<RAGKnowledgeBase />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/customize-agents" element={<CustomizeAgents />} />
            <Route path="/customize-users" element={<CustomizeUsers />} />
            <Route path="/product-traces" element={<ProductTraces />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ErrorBoundary>
      </ConditionalLayout>
    </ErrorBoundary>
  )
}

function App() {
  return (
    <div className="relative min-h-screen">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/password-reset" element={<PasswordReset />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* 🚀 Lyzr Floating Logo Overlay */}
      <a
        href="https://www.lyzr.ai/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[9999] pointer-events-auto select-none animate-fadeIn block"
      >
        <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border-2 border-blue-500/50 dark:border-blue-400/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center gap-3 group transition-all duration-300 hover:scale-105 hover:border-blue-500 dark:hover:border-blue-400 active:scale-95">
          <div className="pl-2">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] block leading-none">Powered by</span>
          </div>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <img
            src="/Lyzrlogo.jpg"
            alt="Lyzr Logo"
            className="h-7 w-auto transition-all duration-500 rounded-sm pr-1"
          />
        </div>
      </a>
    </div>
  )
}

export default App
