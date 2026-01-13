import { useCallback, useState } from 'react'
import { useSidebar } from '../../contexts/SidebarContext'
import { useAuth } from '../../contexts/AuthContext'
import { GridIcon, UserCircleIcon, DatabaseIcon, BotIcon, HorizontaLDots, ChatIcon, SettingsIcon, CalenderIcon, TaskIcon, ListIcon, TableIcon, PageIcon, EnvelopeIcon } from '../icons'

const AppSidebar = ({ activeView, setActiveView }) => {
  const { isMobileOpen } = useSidebar()
  const { user, isAdmin, logout } = useAuth()
  const [openSubmenu, setOpenSubmenu] = useState(null)

  const navItems = [
    {
      icon: <GridIcon />,
      name: 'Dashboard',
      view: 'dashboard',
    },
    {
      icon: (
        <div
          className="w-5 h-5 bg-current"
          style={{
            maskImage: 'url(/telescope.png)',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskImage: 'url(/telescope.png)',
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center'
          }}
        />
      ),
      name: 'Agent Traces',
      view: 'agents',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      name: 'Product Traces',
      view: 'product-traces',
    },
    // Admin only items
    ...(isAdmin ? [
      {
        icon: <DatabaseIcon />,
        name: 'Knowledge',
        view: 'knowledge',
      },
      {
        icon: (
          <div
            className="w-5 h-5 bg-current"
            style={{
              maskImage: 'url(/Agents.png)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskImage: 'url(/Agents.png)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center'
            }}
          />
        ),
        name: 'Customize Agents',
        view: 'customize-agents',
      },
      {
        icon: (
          <div
            className="w-5 h-5 bg-current"
            style={{
              maskImage: 'url(/user.png)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskImage: 'url(/user.png)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center'
            }}
          />
        ),
        name: 'Users',
        view: 'customize-users',
      },
    ] : [])
  ]

  const handleSubmenuToggle = (index) => {
    setOpenSubmenu(openSubmenu === index ? null : index)
  }

  const isActive = useCallback(
    (view) => activeView === view || (view === 'dashboard' && !activeView),
    [activeView]
  )

  const handleNavClick = (view) => {
    if (setActiveView) {
      setActiveView(view)
    }
  }

  const showFullSidebar = true // Always show full sidebar (fixed)

  return (
    <aside
      className={`fixed flex flex-col top-0 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 overflow-y-auto shadow-sm
        ${isMobileOpen ? 'w-[290px]' : 'w-[290px]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
    >
      <div className="py-4 px-6 flex justify-start">
        <a
          href="https://www.starhealth.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer block w-full"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <img
                src="/Star_Health_and_Allied_Insurance.svg.png"
                alt="Star Health Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-gray-800 dark:text-white leading-tight">Star Health</h1>
              <p className="text-[10px] text-gray-500 font-medium whitespace-nowrap uppercase tracking-wider">Sales Enablement</p>
            </div>
          </div>
        </a>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="px-4 mb-6">
          <div className="flex flex-col gap-1">
            <div>
              <ul className="flex flex-col gap-2">
                {navItems.map((nav, index) => (
                  <li key={nav.name}>
                    <button
                      onClick={() => handleNavClick(nav.view)}
                      className={`menu-item group w-full ${isActive(nav.view) ? 'menu-item-active font-semibold shadow-sm ring-1 ring-black/5' : 'menu-item-inactive font-medium'
                        } cursor-pointer lg:justify-start`}
                    >
                      <span
                        className={`menu-item-icon-size ${isActive(nav.view)
                          ? 'menu-item-icon-active'
                          : 'menu-item-icon-inactive'
                          }`}
                      >
                        {nav.icon}
                      </span>
                      {showFullSidebar && (
                        <span className="menu-item-text">{nav.name}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        {/* Profile Section */}
        <div className="mt-auto px-4 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => handleNavClick('profile')}
            className="flex items-center w-full hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl p-3 transition-colors duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0 ring-2 ring-white dark:ring-gray-800 group-hover:ring-blue-100 dark:group-hover:ring-blue-900 transition-all">
              {user ? (user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U') : 'U'}
            </div>
            {showFullSidebar && (
              <div className="flex-1 text-left ml-3 overflow-hidden">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                  {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User'}
                </div>
                <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <span>{user?.email || 'No email'}</span>
                  {isAdmin && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>}
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default AppSidebar
