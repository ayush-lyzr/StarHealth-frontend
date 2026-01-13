import { createContext, useContext, useState, useEffect } from 'react'

const SidebarContext = createContext()

export const SidebarProvider = ({ children }) => {
  // Sidebar is always expanded (fixed)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen)

  return (
    <SidebarContext.Provider
      value={{
        isExpanded: true, // Always expanded
        isHovered: false, // Not used anymore
        isMobileOpen,
        setIsExpanded: () => {}, // No-op since always expanded
        setIsHovered: () => {}, // No-op since no hover
        toggleSidebar: () => {}, // No-op since always expanded
        toggleMobileSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}


