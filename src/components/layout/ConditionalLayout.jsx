import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext'
import AppSidebar from './AppSidebar'
import AppHeader from './SiteHeader'
import Backdrop from './Backdrop'

const LayoutContent = ({ activeView, setActiveView, children }) => {
  const { isMobileOpen } = useSidebar()

  return (
    <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-950">
      <div>
        <AppSidebar activeView={activeView} setActiveView={setActiveView} />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out w-full lg:ml-[290px] ${
          isMobileOpen ? 'ml-0' : ''
        }`}
      >
        <AppHeader activeView={activeView} setActiveView={setActiveView} />
        <div className="px-2 py-4 md:px-3 md:py-5 w-full">
          {children}
        </div>
      </div>
    </div>
  )
}

const ConditionalLayout = ({ activeView, setActiveView, children }) => {
  return (
    <SidebarProvider>
      <LayoutContent activeView={activeView} setActiveView={setActiveView}>
        {children}
      </LayoutContent>
    </SidebarProvider>
  )
}

export default ConditionalLayout
