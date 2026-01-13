/**
 * DashboardContext - Dashboard data management
 * 
 * This context provides dashboard data and refresh functionality.
 * Note: The actual dashboard data fetching is handled in the Dashboard component
 * to maintain component-level state management.
 */
import { createContext, useContext } from 'react'

const DashboardContext = createContext(undefined)

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

export const DashboardProvider = ({ children }) => {
  // Dashboard data is managed at component level (Dashboard.jsx)
  // This provider exists for future extensibility
  const value = {
    // Add dashboard-related methods here if needed in the future
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}
