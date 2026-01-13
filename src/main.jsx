import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import BootGuard from './components/BootGuard'
import { ThemeProvider } from './contexts/ThemeContext'
import { AgentsDataProvider } from './contexts/AgentsDataContext'
import { DataPreloaderProvider } from './contexts/DataPreloaderContext'
import { AuthProvider } from './contexts/AuthContext'
import { DashboardProvider } from './contexts/DashboardContext'
import './index.css'

/**
 * 🔒 PRODUCTION FIX: BootGuard must wrap ALL providers
 * This ensures no provider tries to access backend before it's ready
 * Prevents blank white screen during cold starts
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <BootGuard>
        <AuthProvider>
          <ThemeProvider>
            <DashboardProvider>
              <DataPreloaderProvider>
                <AgentsDataProvider>
                  <App />
                </AgentsDataProvider>
              </DataPreloaderProvider>
            </DashboardProvider>
          </ThemeProvider>
        </AuthProvider>
      </BootGuard>
    </BrowserRouter>
  </React.StrictMode>,
)


