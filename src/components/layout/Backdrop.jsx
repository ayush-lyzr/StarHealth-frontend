import { useSidebar } from '../../contexts/SidebarContext'

const Backdrop = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar()

  if (!isMobileOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
      onClick={toggleMobileSidebar}
    />
  )
}

export default Backdrop








