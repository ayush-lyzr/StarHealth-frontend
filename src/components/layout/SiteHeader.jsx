import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'

const AppHeader = ({ activeView, setActiveView }) => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const { user, logout: signOut, isAdmin } = useAuth()
  const userMenuRef = useRef(null)

  // Get active view from prop
  const currentView = activeView || 'dashboard'

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Analytics'
      case 'knowledge':
        return 'Knowledge Base'
      case 'agents':
        return 'Agents'
      case 'customize-agents':
        return 'Customize Agents'
      case 'customize-users':
      case 'users':
        return 'Users'
      case 'profile':
        return 'User Profile'
      default:
        return 'Star Health'
    }
  }

  const getPageDescription = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Analytics and metrics overview'
      case 'knowledge':
        return 'Manage knowledge base articles and training data'
      case 'agents':
        return 'Monitor AI agent performance and interactions'
      case 'customize-agents':
        return 'Configure agent prompts and settings'
      case 'customize-users':
      case 'users':
        return 'Manage users and user data'
      case 'profile':
        return 'View and edit your profile information'
      default:
        return ''
    }
  }


  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-40 dark:border-gray-800 dark:bg-gray-900 lg:border-b shadow-sm">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <div className="lg:hidden">
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white">{getPageTitle()}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{getPageDescription()}</p>
            </div>
          </div>

        </div>
        <div
          className={`${
            isApplicationMenuOpen ? 'flex' : 'hidden'
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user ? (
                    (user.firstName?.[0]?.toUpperCase() || 
                     user.email?.[0]?.toUpperCase() || 
                     'U')
                  ) : 'U'}
                </div>
                {user && (
                  <span className="hidden text-sm font-medium sm:block">
                    {[user.firstName, user.lastName].filter(Boolean).join(' ') ||
                     user.email?.split('@')[0] ||
                     'User'}
                  </span>
                )}
              </button>
              
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {user ? (
                        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
                        user.email?.split('@')[0] ||
                        'User'
                      ) : 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || 'No email'}
                      {isAdmin && <span className="ml-1 text-blue-500">(Admin)</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (setActiveView) {
                        setActiveView('profile')
                      }
                      setIsUserMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      signOut()
                      setIsUserMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
