import React from "react"

// Dynamic import to avoid SSR issues
let lyzrInstance = null;

async function getLyzrInstance() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!lyzrInstance) {
    const module = await import("../lib/lyzr/lyzr-agent");
    // module.default is the getter function, call it to get the instance
    const getterFunction = module.default;
    lyzrInstance = getterFunction();
  }

  return lyzrInstance;
}

const LyzrContext = React.createContext(undefined)

export function LyzrProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [user, setUser] = React.useState(null)
  const [token, setToken] = React.useState(null)

  React.useEffect(() => {
    const initializeLyzr = async () => {
      try {
        setIsLoading(true)

        // Get Lyzr instance (only on client side)
        const instance = await getLyzrInstance();
        if (!instance) {
          console.warn('Lyzr instance not available (SSR)');
          setIsLoading(false);
          return;
        }

        const publicKey = import.meta.env.VITE_LYZR_PUBLIC_KEY || 'pk_c14a2728e715d9ea67bf'

        // Initialize Lyzr SDK
        await instance.init(publicKey)

        // Subscribe to auth state changes
        const unsubscribe = instance.onAuthStateChange(async (authenticated) => {
          setIsAuthenticated(authenticated)
          const currentToken = instance.getToken()
          setToken(currentToken)

          if (authenticated) {
            // Fetch user data
            try {
              const member = await instance.getMember()
              setUser(member)
            } catch (error) {
              console.error('Error fetching member:', error)
              setUser(null)
            }
          } else {
            setUser(null)
          }
        })

        // Get initial state
        const authenticated = instance.getIsAuthenticated()
        setIsAuthenticated(authenticated)
        const currentToken = instance.getToken()
        setToken(currentToken)

        if (authenticated) {
          try {
            const member = await instance.getMember()
            setUser(member)
          } catch (error) {
            console.error('Error fetching initial member:', error)
            setUser(null)
          }
        }

        setIsLoading(false)

        return () => {
          unsubscribe()
        }
      } catch (error) {
        console.error('Error initializing Lyzr:', error)
        setIsLoading(false)
        setIsAuthenticated(false)
        setUser(null)
      }
    }

    if (typeof window !== 'undefined') {
      initializeLyzr()
    }
  }, [])

  const logout = async () => {
    const instance = await getLyzrInstance()
    if (instance) {
      await instance.logout()
    }
  }

  const getMember = async () => {
    const instance = await getLyzrInstance()
    if (instance) {
      return await instance.getMember()
    }
    return null
  }

  return (
    <LyzrContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        token,
        logout,
        getMember,
      }}
    >
      {children}
    </LyzrContext.Provider>
  )
}

export function useLyzr() {
  const context = React.useContext(LyzrContext)
  if (context === undefined) {
    throw new Error('useLyzr must be used within a LyzrProvider')
  }
  return context
}




