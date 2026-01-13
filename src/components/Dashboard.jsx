import { useState, useEffect, useRef } from 'react'
import { getDashboardWebSocket } from '../utils/websocket'
import { useTheme } from '../contexts/ThemeContext'
import { useDataPreloader } from '../contexts/DataPreloaderContext'
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card'
import LineChartApex from './charts/LineChartApex'
import BarChartApex from './charts/BarChartApex'
import { GroupIcon, StarIcon, RepeatIcon, CheckCircleIcon } from './icons'
import { formatDate, getInitials, getAvatarColor } from '../utils/formatters'
import { CHART_COLORS, DASHBOARD_POLLING_INTERVAL, SENTIMENT_KEYWORDS } from '../utils/constants'

const Dashboard = () => {
  const { isDark } = useTheme()
  const { preloadedData, refreshSection } = useDataPreloader()
  // Initial state strictly defined for consistency
  const initialState = {
    uniqueUsers: 0,
    totalInteractions: 0,
    feedbackCount: 0,
    recommendations: 0,
    salesPitches: 0,
    repeatedUsers: 0,
    completedConversations: 0,
    incompleteConversations: 0,
    totalConversations: 0,
    trends: {
      uniqueUsers: null,
      feedback: null,
      repeatedUsers: null,
      completedConversations: null,
      incompleteConversations: null,
      totalConversations: null,
    },
    feedbackData: [],
    recentActivity: [],
    feedbackByType: {
      product_recommendation: 0,
      sales_pitch: 0,
    },
    completedConversationsData: {
      labels: [],
      data: {
        productRecommendation: [],
        salesPitch: []
      }
    },
  }

  const [dashboardData, setDashboardData] = useState(initialState)
  const [isAuthorized, setIsAuthorized] = useState(true)
  const hasLoadedRef = useRef(false)
  const socketRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [chartType, setChartType] = useState('line') // 'line' or 'area'
  const [isWsConnected, setIsWsConnected] = useState(false)

  // Use a strictly deterministic poll interval (60 seconds)
  // Use a strictly deterministic poll interval (60 seconds)
  const pollIntervalTime = DASHBOARD_POLLING_INTERVAL

  // Always use 7 days for Activity Distribution
  const dayFilter = 7

  // 🔒 PERSISTENCE: Save to LocalStorage whenever data changes

  // Update dashboard state from API response
  const normalizeDashboardData = (responseData) => {
    if (!responseData) return

    const summary = responseData.summary || {}
    const trends = responseData.trends || {}

    // Check if we have the new compact format or old format
    // New format has summary/trends/topStats at root

    const data = {
      uniqueUsers: summary.totalUsers ?? responseData.uniqueUsers ?? 0,
      totalInteractions: summary.totalInteractions ?? responseData.totalInteractions ?? 0,
      feedbackCount: summary.feedbackCount ?? responseData.feedbackCount ?? 0,
      recommendations: summary.recommendations ?? responseData.recommendations ?? 0,
      salesPitches: summary.salesPitches ?? responseData.salesPitches ?? 0,
      repeatedUsers: summary.repeatedUsers ?? responseData.repeatedUsers ?? 0,
      completedConversations: summary.completed ?? responseData.completedConversations ?? 0,
      incompleteConversations: summary.incomplete ?? responseData.incompleteConversations ?? 0,
      totalConversations: summary.totalConversations ?? responseData.totalConversations ?? 0,

      feedbackData: Array.isArray(responseData.feedbackData) ? responseData.feedbackData : [],
      recentActivity: Array.isArray(responseData.recentActivity) ? responseData.recentActivity : [],

      trends: {
        uniqueUsers: trends.uniqueUsers ?? null,
        feedback: trends.feedback ?? trends.feedbackCount ?? null,
        repeatedUsers: trends.repeatedUsers ?? null,
        completedConversations: trends.completedConversations ?? null,
        incompleteConversations: trends.incompleteConversations ?? null,
        totalConversations: trends.totalConversations ?? null,
        recommendations: trends.recommendations ?? null,
        salesPitches: trends.salesPitches ?? null,
        totalInteractions: trends.totalInteractions ?? null
      },

      feedbackByType: responseData.topStats?.feedbackByType || responseData.feedbackByType || {
        product_recommendation: 0,
        sales_pitch: 0,
      },

      completedConversationsData: {
        labels: responseData.completedConversationsData?.labels || [],
        data: {
          productRecommendation: responseData.completedConversationsData?.data?.productRecommendation || [],
          salesPitch: responseData.completedConversationsData?.data?.salesPitch || []
        }
      }
    }

    setDashboardData(data)
    setLastUpdated(new Date())
    setLoading(false)

    // 🔒 PERSISTENCE: Save to LocalStorage
    localStorage.setItem('dashboard_cache', JSON.stringify({
      data,
      timestamp: new Date().getTime()
    }))
  }

  const fetchDashboardData = async (days = 7, forceRefresh = false, retryCount = 0) => {
    const isInitial = (!hasLoadedRef.current || forceRefresh) && retryCount === 0
    if (isInitial) {
      setLoading(true)
    } else if (retryCount === 0) {
      setIsRefreshing(true)
    }

    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }

      const url = `https://star-health-api.rapid.studio.lyzr.ai/api/dashboard?days=${days}`
      const response = await fetch(url, { headers })

      if (response.status === 202) {
        if (retryCount < 10) {
          console.log(`⏳ Dashboard generation in progress (202), retrying in 2s (attempt ${retryCount + 1}/10)...`)
          setTimeout(() => fetchDashboardData(days, forceRefresh, retryCount + 1), 2000)
        } else {
          console.warn('⚠️ Dashboard generation timed out after multiple retries')
          setLoading(false)
          setIsRefreshing(false)
        }
        return
      }

      if (response.status === 401) {
        console.error('Unauthorized access to dashboard')
        setIsAuthorized(false)
        setLoading(false)
        setIsRefreshing(false)
        return
      }

      setIsAuthorized(true)

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        normalizeDashboardData(result.data)
      } else if (result.meta && result.summary) {
        normalizeDashboardData(result)
      } else {
        console.warn('Unexpected dashboard response format', result)
      }

    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const pollDashboardData = async (force = false) => {
    await fetchDashboardData(dayFilter || 7, force)
  }


  // Removal of localStorage persistence for dashboard state

  useEffect(() => {
    const isFirstLoad = !hasLoadedRef.current

    // 🔒 PERSISTENCE: Try to load from localStorage first
    const cached = localStorage.getItem('dashboard_cache')
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        // Only use if less than 24h old
        if (Date.now() - timestamp < 86400000) {
          console.log('✅ Loaded dashboard from localStorage')
          setDashboardData(data)
          setLoading(false)
          hasLoadedRef.current = true // Mark as loaded to prevent immediate re-fetch
        }
      } catch (e) {
        console.warn('Failed to parse dashboard cache', e)
      }
    }

    // Check if we have preloaded data (must be truthy and have actual data)
    if (isFirstLoad && preloadedData.dashboard !== null && preloadedData.dashboard !== undefined) {
      const responseData = preloadedData.dashboard
      // Check if preloaded data has actual values (not empty object)
      const hasValidData = responseData && typeof responseData === 'object' &&
        (responseData.uniqueUsers !== undefined || responseData.totalInteractions !== undefined)

      if (hasValidData) {
        // Preloaded data log removed
        hasLoadedRef.current = true
        const data = {
          uniqueUsers: responseData.uniqueUsers || 0,
          totalInteractions: responseData.totalInteractions || 0,
          feedbackCount: responseData.feedbackCount || 0,
          recommendations: responseData.recommendations || 0,
          salesPitches: responseData.salesPitches || 0,
          repeatedUsers: responseData.repeatedUsers || 0,
          completedConversations: responseData.completedConversations || 0,
          incompleteConversations: responseData.incompleteConversations || 0,
          totalConversations: responseData.totalConversations || 0,
          feedbackData: Array.isArray(responseData.feedbackData) ? responseData.feedbackData : [],
          recentActivity: Array.isArray(responseData.recentActivity) ? responseData.recentActivity : [],
          trends: responseData.trends && typeof responseData.trends === 'object' ? {
            uniqueUsers: responseData.trends.uniqueUsers || null,
            feedback: responseData.trends.feedback || null,
            repeatedUsers: responseData.trends.repeatedUsers || null,
            completedConversations: responseData.trends.completedConversations || null,
            incompleteConversations: responseData.trends.incompleteConversations || null,
            totalConversations: responseData.trends.totalConversations || null,
          } : {
            uniqueUsers: null,
            feedback: null,
            repeatedUsers: null,
            completedConversations: null,
            incompleteConversations: null,
            totalConversations: null,
          },
          feedbackByType: responseData.feedbackByType && typeof responseData.feedbackByType === 'object' ? {
            product_recommendation: responseData.feedbackByType.product_recommendation || 0,
            sales_pitch: responseData.feedbackByType.sales_pitch || 0,
          } : {
            product_recommendation: 0,
            sales_pitch: 0,
          },
          completedConversationsData: responseData.completedConversationsData && typeof responseData.completedConversationsData === 'object' ? {
            labels: Array.isArray(responseData.completedConversationsData.labels) ? responseData.completedConversationsData.labels : [],
            data: {
              productRecommendation: Array.isArray(responseData.completedConversationsData.data?.productRecommendation) ? responseData.completedConversationsData.data.productRecommendation : [],
              salesPitch: Array.isArray(responseData.completedConversationsData.data?.salesPitch) ? responseData.completedConversationsData.data.salesPitch : [],
            }
          } : {
            labels: [],
            data: {
              productRecommendation: [],
              salesPitch: []
            }
          },
        }
        setDashboardData(data)
        setLastUpdated(new Date())
        setLoading(false)
        // Background refresh to get latest even if we have preloaded
        // 🔒 Use pollDashboardData to also fetch real-time Activity Distribution
        pollDashboardData(false)
      } else {
        console.warn('⚠️ Preloaded dashboard data is empty/invalid, fetching fresh data...')
        hasLoadedRef.current = true
        // 🔒 Use pollDashboardData to also fetch real-time Activity Distribution
        pollDashboardData(true)
      }
    } else if (isFirstLoad) {
      // Direct mount (no preloaded data and no cache hit)
      hasLoadedRef.current = true
      // 🔒 Use pollDashboardData to also fetch real-time Activity Distribution
      pollDashboardData(true)
    } else {
      // Component re-mounting or returning from another page (and no cache hit on initial load)
      // 🔒 Use pollDashboardData to also fetch real-time Activity Distribution
      pollDashboardData(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadedData.dashboard])


  useEffect(() => {
    if (!socketRef.current) {
      const ws = getDashboardWebSocket()

      ws.on('connect', () => setIsWsConnected(true))
      ws.on('disconnect', () => setIsWsConnected(false))

      // Update initial status
      if (ws.isConnected()) {
        setIsWsConnected(true)
      }

      const handleDashboardUpdate = (data) => {
        console.log('📡 [Dashboard] Received Update Event:', data.updateType, data)
        // ... (lines 304-336 remain the same)
        if (data.updateType === "incomplete_conversation") {
          setDashboardData((prev) => ({
            ...prev,
            incompleteConversations: data.incompleteConversations !== undefined ? data.incompleteConversations : prev.incompleteConversations,
            totalConversations: data.totalConversations !== undefined ? data.totalConversations : prev.totalConversations,
          }))
        } else {
          setDashboardData((prev) => ({
            ...prev,
            ...data,
            trends: { ...prev.trends, ...(data.trends || {}) }
          }))
        }
        setLastUpdated(new Date())
      }

      ws.on('dashboard:update', handleDashboardUpdate)

      ws.on('dashboard:activity_update', (event) => {
        console.log('📡 [Dashboard] Received Activity Update:', event)
        const { data } = event
        if (!data) return

        setDashboardData((prev) => {
          const newTotalInteractions = (prev.totalInteractions || 0) + (data.llmCalls || 1)
          return { ...prev, totalInteractions: newTotalInteractions }
        })
        setLastUpdated(new Date())
      })

      ws.on('dashboard:event', (data) => {
        console.log('📡 [Dashboard] Received Event trigger, polling...', data)
        pollDashboardData(true)
      })
      ws.on('dashboard:refresh', (data) => {
        console.log('📡 [Dashboard] Received Refresh trigger, polling...', data)
        pollDashboardData(true)
      })
      socketRef.current = ws
    }

    const pollInterval = setInterval(() => {
      pollDashboardData(true)
    }, pollIntervalTime)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceUpdate = Date.now() - lastUpdated.getTime()
        if (timeSinceUpdate > 60000) {
          pollDashboardData(true)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (socketRef.current) {
        socketRef.current.off('connect')
        socketRef.current.off('disconnect')
        socketRef.current.off('dashboard:update')
        socketRef.current.off('dashboard:event')
        socketRef.current.off('dashboard:refresh')
        socketRef.current.off('dashboard:activity_update')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadedData.dashboard, isWsConnected])



  const StatCard = ({ title, value, IconComponent, subtitle, trend, sparklineData, loading }) => {
    const { isDark } = useTheme()
    const formatValue = (val) => {
      if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K'
      }
      return val.toLocaleString()
    }

    const formatTrend = (trendData) => {
      // Handle missing or null trend
      if (trendData === null || trendData === undefined) {
        return { display: "—", isPositive: null, isSignificant: false }
      }

      // Handle raw number (Optimized API)
      if (typeof trendData === 'number') {
        return {
          display: `${trendData >= 0 ? '+' : ''}${trendData.toFixed(1)}%`,
          isPositive: trendData >= 0,
          isSignificant: true, // Assuming numbers are significant if present
        }
      }

      // Handle legacy object format
      if (typeof trendData === 'object') {
        if (trendData.percentage === null || trendData.percentage === undefined) {
          return {
            display: trendData.display || "—",
            isPositive: null,
            isSignificant: false
          }
        }
        const isPositive = trendData.percentage >= 0
        const absValue = Math.abs(trendData.percentage).toFixed(1)
        return {
          display: trendData.display || `${isPositive ? '+' : ''}${trendData.percentage.toFixed(1)}%`,
          isPositive,
          value: absValue,
          isSignificant: trendData.isSignificant !== false
        }
      }

      return { display: "—", isPositive: null, isSignificant: false }
    }

    const trendInfo = formatTrend(trend)

    // Simple sparkline data (mock for now - can be enhanced with real time-series data)
    const defaultSparkline = sparklineData || [10, 15, 12, 18, 20, 16, 22]

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] card-hover group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-800">
        <div className="flex flex-col h-full">
          {/* Icon and Title Row */}
          <div className="flex items-start gap-3 mb-4">
            {/* Circular Icon */}
            {IconComponent && (
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full dark:bg-gray-800 flex-shrink-0 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors duration-200">
                <IconComponent className="text-gray-800 size-5 dark:text-white/90" />
              </div>
            )}

            {/* Title and Subtitle */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 break-words mb-0.5 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {title}
              </div>
              {subtitle && (
                <div className="text-xs text-gray-400 dark:text-gray-500 break-words transition-colors duration-300 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Value */}
          <div className="mt-auto">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              {loading ? (
                <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
              ) : (
                <div className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">
                  {formatValue(value)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }



  // Get feedback sentiment/display - simplified without emojis
  const getFeedbackDisplay = (feedback) => {
    const raw = (feedback || '').trim()
    const lower = raw.toLowerCase()

    // Treat empty, "no feedback", "pending", "n/a" as neutral
    if (
      !raw ||
      lower === 'no feedback' ||
      lower === 'no' ||
      lower === 'pending' ||
      lower === 'n/a'
    ) {
      return { icon: '', text: raw || 'Pending', color: 'text-gray-500 dark:text-gray-400' }
    }

    // Simple sentiment detection
    const lowerFeedback = lower
    const positiveWords = SENTIMENT_KEYWORDS.positive
    const negativeWords = SENTIMENT_KEYWORDS.negative

    const isPositive = positiveWords.some(word => lowerFeedback.includes(word))
    const isNegative = negativeWords.some(word => lowerFeedback.includes(word))

    if (isPositive && !isNegative) {
      return {
        icon: '',
        text: feedback.length > 30 ? feedback.substring(0, 30) + '...' : feedback,
        color: 'text-green-600 dark:text-green-400',
        fullText: feedback
      }
    } else if (isNegative) {
      return {
        icon: '',
        text: feedback.length > 30 ? feedback.substring(0, 30) + '...' : feedback,
        // No red as per user request (using gray/orange instead)
        color: 'text-orange-600 dark:text-orange-400',
        fullText: feedback
      }
    }

    // Default to positive if unclear
    return {
      icon: '',
      text: feedback.length > 30 ? feedback.substring(0, 30) + '...' : feedback,
      color: 'text-green-600 dark:text-green-400',
      fullText: feedback
    }
  }

  const feedbackByType = dashboardData.feedbackByType || {
    product_recommendation: 0,
    sales_pitch: 0,
  }

  const completedConversationsData = dashboardData.completedConversationsData || {
    labels: [],
    data: {
      productRecommendation: [],
      salesPitch: []
    }
  }

  const recentActivity = dashboardData.recentActivity || []

  // Prepare chart data for individual charts (completed conversations)
  const getCompletedConversationsChartData = () => {
    const labels = completedConversationsData.labels || []
    const productRecommendation = completedConversationsData.data.productRecommendation || []
    const salesPitch = completedConversationsData.data.salesPitch || []

    return {
      productData: productRecommendation,
      salesData: salesPitch,
      labels: labels,
    }
  }

  const completedChartData = getCompletedConversationsChartData()

  // Determine if we should show skeleton state
  const isInitialLoading = loading && dashboardData.totalInteractions === 0

  return (
    <div className="bg-white dark:bg-[#111827] p-3 transition-colors duration-200 w-full relative">
      {/* 🔒 AUTH SHIELD: Production-grade overlay if session is invalid */}
      {!isAuthorized && (
        <div className="absolute inset-0 z-[100] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-11a4 4 0 11-8 0 4 4 0 018 0zM7 10V9a5 5 0 0110 0v1a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7a1 1 0 011-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your authentication session has expired or is invalid. Please log in again to view your analytics.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Sign In to Continue
            </button>
          </div>
        </div>
      )}

      <div className={`max-w-7xl mx-auto space-y-6 w-full ${!isAuthorized ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
        {/* Page Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitor user engagement and conversation outcomes
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* 🔄 MANUAL REFRESH: Enhanced with spinner animation */}
            <button
              onClick={() => pollDashboardData(true)}
              disabled={loading || isRefreshing}
              className={`p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 shadow-sm flex items-center gap-2 ${(loading || isRefreshing) ? 'opacity-70' : 'active:scale-95'}`}
              title="Refresh Dashboard"
            >
              <svg
                className={`w-5 h-5 ${(loading || isRefreshing) ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline text-sm font-medium">Sync Data</span>
            </button>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-1"></div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[12px] font-medium text-green-700 dark:text-green-400">Live Updates</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-5">
          <StatCard
            title="Unique Users"
            subtitle="Total unique users"
            value={dashboardData.uniqueUsers || 0}
            IconComponent={GroupIcon}
            trend={dashboardData.trends?.uniqueUsers}
            loading={isInitialLoading}
          />
          <StatCard
            title="Feedback"
            subtitle="Total feedback received"
            value={dashboardData.feedbackCount || 0}
            IconComponent={StarIcon}
            trend={dashboardData.trends?.feedback}
            loading={isInitialLoading}
          />
          <StatCard
            title="Repeated Users"
            subtitle="Users with multiple sessions"
            value={dashboardData.repeatedUsers || 0}
            IconComponent={RepeatIcon}
            trend={dashboardData.trends?.repeatedUsers}
            loading={isInitialLoading}
          />
          <StatCard
            title="Completed Conversations"
            subtitle="Successfully completed chats"
            value={dashboardData.completedConversations || 0}
            IconComponent={CheckCircleIcon}
            trend={dashboardData.trends?.completedConversations}
            loading={isInitialLoading}
          />
          <StatCard
            title="Total Conversations"
            subtitle={`${dashboardData.completedConversations || 0} complete, ${dashboardData.incompleteConversations || 0} incomplete`}
            value={dashboardData.totalConversations || 0}
            IconComponent={GroupIcon}
            trend={dashboardData.trends?.totalConversations}
            loading={isInitialLoading}
          />
        </div>

        {/* Bar Charts - Product Recommendation and Sales Pitch */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Product Recommendation Bar Chart */}
          <Card className="group animate-slideUp flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-800">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-[18px] text-[#333333] dark:text-[#FFFFFF] transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Product Recommendation
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                  Product Recommendation completed conversations over time
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="w-full flex-1 flex flex-col chart-animate transition-transform duration-300 group-hover:scale-[1.02]" style={{ minHeight: '380px' }}>
                <BarChartApex
                  data={completedChartData.productData}
                  labels={completedChartData.labels}
                  colors={['#3B82F6']} // Blue for Product Recommendation
                  height={380}
                  isDark={isDark}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sales Pitch Bar Chart */}
          <Card className="group animate-slideUp flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-orange-200 dark:hover:border-orange-800">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-[18px] text-[#333333] dark:text-[#FFFFFF] transition-colors duration-300 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                  Sales Pitch
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                  Sales Pitch completed conversations over time
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="w-full flex-1 flex flex-col chart-animate transition-transform duration-300 group-hover:scale-[1.02]" style={{ minHeight: '380px' }}>
                <BarChartApex
                  data={completedChartData.salesData}
                  labels={completedChartData.labels}
                  colors={['#F97316']} // Orange for Sales Pitch
                  height={380}
                  isDark={isDark}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Full Width */}
        <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-gray-100 dark:border-[#374151] p-5 shadow-sm animate-slideUp mb-6">
          <h2 className="text-[18px] font-bold text-[#333333] dark:text-[#FFFFFF] mb-5">
            Recent Activity
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-[#374151]">
              <thead className="bg-gray-50 dark:bg-[#111827]">
                <tr>
                  <th className="px-5 py-3 text-left text-[12px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-5 py-3 text-left text-[12px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-5 py-3 text-left text-[12px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-5 py-3 text-left text-[12px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                    Feedback
                  </th>
                  <th className="px-5 py-3 text-left text-[12px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1F2937] divide-y divide-gray-100 dark:divide-[#374151]">
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-gray-500">
                      No recent activity
                    </td>
                  </tr>
                ) : (
                  recentActivity.slice(0, 10).map((activity, idx) => {
                    const timestamp = activity.date || activity.timestamp || activity.createdAt || new Date()
                    const formattedDate = formatDate(timestamp)
                    const displayName = activity.name
                      ? (activity.name.startsWith('Agent') ? activity.name.replace('Agent ', '') : activity.name)
                      : activity.agentCode || 'Unknown'
                    const avatarColorSet = getAvatarColor(displayName)

                    // 🔒 CUSTOM LOGIC: First two characters or initials
                    const nameParts = displayName.trim().split(/\s+/)
                    const initials = nameParts.length > 1
                      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                      : displayName.slice(0, 2).toUpperCase()

                    const typeText = activity.type || 'Unknown'
                    const isProductRecommendation = typeText.toLowerCase().includes('product') || typeText.toLowerCase().includes('recommendation')
                    const isSalesPitch = typeText.toLowerCase().includes('sales') || typeText.toLowerCase().includes('pitch')
                    const displayType = isProductRecommendation ? 'Product Recommendation' : isSalesPitch ? 'Sales Pitch' : typeText
                    const feedbackInfo = getFeedbackDisplay(activity.feedback)

                    return (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#111827] transition-colors duration-200">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 ${avatarColorSet} rounded-full flex items-center justify-center text-xs font-bold leading-none`}>
                              {initials}
                            </div>
                            <span className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                              {displayName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[14px] text-gray-500 dark:text-gray-400">
                            {activity.code || '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${isProductRecommendation
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : isSalesPitch
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                            {displayType}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[14px]">
                          <span className={`font-medium ${feedbackInfo.color}`}>
                            {feedbackInfo.text}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formattedDate}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard

