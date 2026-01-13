import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const DataPreloaderContext = createContext(undefined)

export const useDataPreloader = () => {
  const context = useContext(DataPreloaderContext)
  if (context === undefined) {
    throw new Error('useDataPreloader must be used within a DataPreloaderProvider')
  }
  return context
}

export const DataPreloaderProvider = ({ children }) => {
  const [preloadedData, setPreloadedData] = useState({
    dashboard: null,
    knowledge: null,
    agentConfigs: null,
    users: null,
  })
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [preloadComplete, setPreloadComplete] = useState(false)

  // 🔒 OPTIMIZATION: Initial state from localStorage
  useEffect(() => {
    const savedKnowledge = localStorage.getItem('preloaded_knowledge')
    if (savedKnowledge) {
      try {
        const parsed = JSON.parse(savedKnowledge)
        setPreloadedData(prev => ({
          ...prev,
          knowledge: parsed
        }))
      } catch (e) {
        console.error('Failed to parse saved knowledge', e)
      }
    }

    // Also try users and configs
    ['users', 'agentConfigs'].forEach(key => {
      const saved = localStorage.getItem(`preloaded_${key}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setPreloadedData(prev => ({ ...prev, [key]: parsed }))
        } catch (e) { }
      }
    })
  }, [])

  useEffect(() => {
    // Preload all data on app initialization
    const preloadAllData = async () => {
      // console.log('🚀 Preloading all section data...')
      setLoading(true)
      const newErrors = {}

      // Dashboard data is now handled by DashboardContext
      setPreloadedData(prev => ({
        ...prev,
        dashboard: null,
      }))

      // Preload Knowledge/RAG databases
      try {
        const ragResponse = await axios.get('http://3.231.155.2:8000/api/rag/databases', {
          timeout: 30000, // Increased to 30s for cold start
        })
        if (ragResponse.data.success && ragResponse.data.databases) {
          // Also fetch content for default database (Star Health)
          const starHealthRagId = ragResponse.data.databases.starHealth?.id
          if (starHealthRagId) {
            try {
              const contentResponse = await axios.get(
                `http://3.231.155.2:8000/api/rag/content?rag_id=${starHealthRagId}`,
                { timeout: 30000 } // Increased to 30s for cold start
              )
              setPreloadedData(prev => ({
                ...prev,
                knowledge: {
                  databases: ragResponse.data.databases,
                  content: contentResponse.data.content || [],
                  ragId: starHealthRagId,
                },
              }))
              // 💾 Save to localStorage
              localStorage.setItem('preloaded_knowledge', JSON.stringify({
                databases: ragResponse.data.databases,
                content: contentResponse.data.content || [],
                ragId: starHealthRagId,
              }))
              // console.log('✅ Knowledge data preloaded')
            } catch (error) {
              console.error('❌ Error preloading knowledge content:', error)
              // Still save databases even if content fails
              setPreloadedData(prev => ({
                ...prev,
                knowledge: {
                  databases: ragResponse.data.databases,
                  content: [],
                },
              }))
            }
          }
        }
      } catch (error) {
        console.error('❌ Error preloading knowledge:', error)
        newErrors.knowledge = error.message
      }

      // Preload Agent Configs
      try {
        const configResponse = await axios.get('http://3.231.155.2:8000/api/agents/config', {
          timeout: 30000, // Increased to 30s for cold start
        })
        if (configResponse.data && configResponse.data.success) {
          setPreloadedData(prev => ({
            ...prev,
            agentConfigs: configResponse.data.configs,
          }))
          localStorage.setItem('preloaded_agentConfigs', JSON.stringify(configResponse.data.configs))
          // console.log('✅ Agent configs preloaded')
        }
      } catch (error) {
        console.error('❌ Error preloading agent configs:', error)
        newErrors.agentConfigs = error.message
      }

      // Preload Users
      try {
        const usersResponse = await axios.get('http://3.231.155.2:8000/api/users', {
          timeout: 30000, // Increased to 30s for cold start
        })
        const usersData = usersResponse.data.users || usersResponse.data || []
        setPreloadedData(prev => ({
          ...prev,
          users: Array.isArray(usersData) ? usersData : [],
        }))
        localStorage.setItem('preloaded_users', JSON.stringify(Array.isArray(usersData) ? usersData : []))
        // console.log('✅ Users data preloaded')
      } catch (error) {
        console.error('❌ Error preloading users:', error)
        newErrors.users = error.message
      }

      setErrors(newErrors)
      setLoading(false)
      setPreloadComplete(true)
      // console.log('✅ Data preloading complete')
    }

    preloadAllData()
  }, [])

  const refreshSection = async (section) => {
    try {
      switch (section) {
        case 'dashboard':
          // Dashboard refresh is handled by DashboardContext
          break
        case 'knowledge':
          const ragResponse = await axios.get('http://3.231.155.2:8000/api/rag/databases')
          if (ragResponse.data.success && ragResponse.data.databases) {
            const starHealthRagId = ragResponse.data.databases.starHealth?.id
            if (starHealthRagId) {
              const contentResponse = await axios.get(
                `http://3.231.155.2:8000/api/rag/content?rag_id=${starHealthRagId}`
              )
              const knowledgeData = {
                databases: ragResponse.data.databases,
                content: contentResponse.data.content || [],
                ragId: starHealthRagId,
              }
              setPreloadedData(prev => ({
                ...prev,
                knowledge: knowledgeData,
              }))
              localStorage.setItem('preloaded_knowledge', JSON.stringify(knowledgeData))
            }
          }
          break
        case 'agentConfigs':
          const configResponse = await axios.get('http://3.231.155.2:8000/api/agents/config')
          if (configResponse.data && configResponse.data.success) {
            setPreloadedData(prev => ({
              ...prev,
              agentConfigs: configResponse.data.configs,
            }))
            localStorage.setItem('preloaded_agentConfigs', JSON.stringify(configResponse.data.configs))
          }
          break
        case 'users':
          const usersResponse = await axios.get('http://3.231.155.2:8000/api/users')
          const usersData = usersResponse.data.users || usersResponse.data || []
          setPreloadedData(prev => ({
            ...prev,
            users: Array.isArray(usersData) ? usersData : [],
          }))
          localStorage.setItem('preloaded_users', JSON.stringify(Array.isArray(usersData) ? usersData : []))
          break
      }
    } catch (error) {
      console.error(`Error refreshing ${section}:`, error)
    }
  }

  const value = {
    preloadedData,
    loading,
    errors,
    refreshSection,
    preloadComplete,
  }

  return (
    <DataPreloaderContext.Provider value={value}>
      {children}
    </DataPreloaderContext.Provider>
  )
}

