import { createContext, useContext, useState } from 'react'

const SidebarContext = createContext(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true)
  const [hovered, setHovered] = useState(false)

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, hovered, setHovered }}>
      {children}
    </SidebarContext.Provider>
  )
}

export default SidebarProvider












