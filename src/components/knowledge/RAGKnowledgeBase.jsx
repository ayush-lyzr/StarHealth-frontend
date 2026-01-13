import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useTheme } from '../../contexts/ThemeContext'
import { useDataPreloader } from '../../contexts/DataPreloaderContext'
import StarLoader from '../ui/StarLoader'

// 🔒 Global cache to persist across component unmounts (navigation)
const globalContentCache = {}

const RAGKnowledgeBase = () => {
  const { isDark } = useTheme()
  const { preloadedData, refreshSection } = useDataPreloader()
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(!preloadedData.knowledge)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddFileModal, setShowAddFileModal] = useState(false)
  const [showAddTextModal, setShowAddTextModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ragId, setRagId] = useState('')
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [databases, setDatabases] = useState(null)
  const [selectedDatabase, setSelectedDatabase] = useState('starHealth') // Default to Star Health
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  // Use global cache instead of useRef
  const contentCache = useRef(globalContentCache)

  // Form states
  const [fileInput, setFileInput] = useState(null)
  const [textContent, setTextContent] = useState('')
  const [textSource, setTextSource] = useState('')

  // 🔒 OPTIMIZATION: Initialize from preloaded data
  useEffect(() => {
    if (preloadedData.knowledge) {
      // console.log('⚡ RAGKnowledgeBase: Using preloaded data')
      setDatabases(preloadedData.knowledge.databases)

      // Only set content if we haven't loaded it yet (to avoid overwriting user interactions)
      if (!initialLoadComplete && selectedDatabase === 'starHealth') {
        // Check global cache first
        const ragId = preloadedData.knowledge.ragId
        if (ragId && contentCache.current[ragId]) {
          // If global cache has data, use it (it might be fresher than preloaded)
          setContent(contentCache.current[ragId])
          setRagId(ragId)
        } else {
          // Otherwise use preloaded
          const preloadedContent = preloadedData.knowledge.content || []
          setContent(preloadedContent)

          if (ragId) {
            setRagId(ragId)
            // Populate local cache
            contentCache.current[ragId] = preloadedContent
          }
        }

        setLoading(false)
        setInitialLoadComplete(true)
      }
    } else {
      // Fallback if no preloaded data
      fetchDatabases()
    }
  }, [preloadedData.knowledge])

  // Normal fetch logic for database switching or missing cache
  useEffect(() => {
    if (databases) {
      fetchContent()
    }
  }, [selectedDatabase, databases])

  const fetchDatabases = async () => {
    try {
      const response = await axios.get('https://star-health-api.rapid.studio.lyzr.ai/api/rag/databases')
      if (response.data.success) {
        setDatabases(response.data.databases)
      }
    } catch (error) {
      console.error('❌ Error fetching databases:', error)
    }
  }

  const fetchContent = async (forceRefresh = false) => {
    if (!databases) return

    const activeRagId = databases[selectedDatabase]?.id

    // 🔒 OPTIMIZATION: Check cache first to avoid "Loading..." spinner on tab switch
    const cached = contentCache.current[activeRagId]

    // Check preloadedData if not in component cache (for first navigation)
    let preloadedContent = null
    if (preloadedData.knowledge && preloadedData.knowledge.ragId === activeRagId) {
      preloadedContent = preloadedData.knowledge.content
    }

    const hasCache = (cached && cached.length > 0) || (preloadedContent && preloadedContent.length > 0)

    if (hasCache && !forceRefresh) {
      const dataToUse = cached || preloadedContent
      // console.log(`⚡ Using cached content for ${selectedDatabase}`)
      setContent(dataToUse)
      setRagId(activeRagId)
      setLoading(false) // Show data immediately

      // Update component cache if we used preloaded data
      if (!cached && preloadedContent) {
        contentCache.current[activeRagId] = preloadedContent
      }
    } else {
      setLoading(true) // Only show spinner if no cache
    }

    try {
      // console.log(`📖 Fetching RAG content for ${databases[selectedDatabase]?.name}...`)

      const cacheBuster = forceRefresh ? `&t=${Date.now()}` : ''
      const response = await axios.get(
        `https://star-health-api.rapid.studio.lyzr.ai/api/rag/content?rag_id=${activeRagId}${cacheBuster}`
      )
      // console.log('✅ RAG content response:', response.data)

      if (response.data.success) {
        const contentList = response.data.content || []
        // console.log(`📚 Loaded ${contentList.length} content items`)

        // Update State & Cache
        setContent(contentList)
        contentCache.current[activeRagId] = contentList

        if (response.data.ragId) {
          setRagId(response.data.ragId)
        }
      } else {
        console.error('❌ Failed to fetch content:', response.data)
        if (!hasCache) setContent([])
      }
    } catch (error) {
      console.error('❌ Error fetching content:', error)
      console.error('   Error details:', error.response?.data || error.message)
      if (!hasCache) setContent([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddFile = async (e) => {
    e.preventDefault()
    if (!fileInput || !fileInput.files[0]) {
      alert('Please select a file')
      return
    }

    if (!databases) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', fileInput.files[0])
      const activeRagId = databases[selectedDatabase]?.id

      // Add rag_id to form data as well (some servers prefer form data over query params for multipart)
      formData.append('rag_id_form', activeRagId)

      const response = await axios.post(
        `https://star-health-api.rapid.studio.lyzr.ai/api/rag/file?rag_id=${activeRagId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (response.data.success) {
        alert('File added successfully!')
        setShowAddFileModal(false)
        setFileInput(null)
        setSearchTerm('') // Clear search to show all items including new one
        // Delay to ensure backend has processed the data, then fetch all content (old + new)
        setTimeout(() => {
          fetchContent(true) // Force refresh to get all data including newly added
          refreshSection('knowledge') // 🔒 Update global cache
        }, 1000)
      } else {
        alert('Failed to add file: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error adding file:', error)
      alert('Error adding file: ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploading(false)
    }
  }


  const handleAddText = async (e) => {
    e.preventDefault()
    if (!textContent.trim()) {
      alert('Please enter text content')
      return
    }

    if (!databases) return

    try {
      setUploading(true)
      const activeRagId = databases[selectedDatabase]?.id
      const response = await axios.post(
        `https://star-health-api.rapid.studio.lyzr.ai/api/rag/text?rag_id=${activeRagId}`,
        {
          text: textContent,
          source: textSource || 'Text Input',
        }
      )

      if (response.data.success) {
        alert('Text added successfully!')
        setShowAddTextModal(false)
        setTextContent('')
        setTextSource('')
        setSearchTerm('') // Clear search to show all items including new one
        // Delay to ensure backend has processed the data, then fetch all content (old + new)
        setTimeout(() => {
          fetchContent(true) // Force refresh to get all data including newly added
          refreshSection('knowledge') // 🔒 Update global cache
        }, 1000)
      } else {
        alert('Failed to add text: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error adding text:', error)
      alert('Error adding text: ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (contentId) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    if (!databases) return

    try {
      const activeRagId = databases[selectedDatabase]?.id
      const response = await axios.delete(
        `https://star-health-api.rapid.studio.lyzr.ai/api/rag/content/${encodeURIComponent(contentId)}?rag_id=${activeRagId}`
      )
      if (response.data.success) {
        alert('Content deleted successfully!')
        setSelectedItems(new Set())
        fetchContent()
        refreshSection('knowledge') // 🔒 Update global cache
      } else {
        alert('Failed to delete: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      alert('Error deleting content: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      alert('Please select items to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedItems.size} item(s)?`)) return

    if (!databases) return

    try {
      const activeRagId = databases[selectedDatabase]?.id
      const deleteResults = await Promise.allSettled(
        Array.from(selectedItems).map(id =>
          axios.delete(`https://star-health-api.rapid.studio.lyzr.ai/api/rag/content/${encodeURIComponent(id)}?rag_id=${activeRagId}`)
        )
      )

      // Check results - verify actual success from response
      const successful = deleteResults.filter(r =>
        r.status === 'fulfilled' && r.value?.data?.success === true
      ).length
      const failed = deleteResults.filter(r =>
        r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.data?.success !== true)
      )

      if (failed.length > 0) {
        const errorMessages = failed.map(r => {
          if (r.status === 'rejected') {
            return r.reason?.response?.data?.detail || r.reason?.response?.data?.error || r.reason?.message || 'Unknown error'
          } else {
            return r.value?.data?.error || 'Deletion failed'
          }
        })
        alert(`Failed to delete ${failed.length} item(s). Errors: ${errorMessages.join(', ')}`)
      }

      if (successful > 0) {
        alert(`Successfully deleted ${successful} item(s)!`)
        setSelectedItems(new Set())
        fetchContent()
        refreshSection('knowledge') // 🔒 Update global cache
      } else {
        // All failed - don't refresh content, show error
        console.error('All deletions failed')
        alert('All deletions failed. Please check the console for details.')
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      alert('Error deleting content: ' + (error.response?.data?.detail || error.response?.data?.error || error.message))
    }
  }

  const handleDatabaseSwitch = (databaseKey) => {
    setSelectedDatabase(databaseKey)
    setSelectedItems(new Set()) // Clear selections when switching
    setSearchTerm('') // Clear search
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(new Set(filteredContent.map(item => item.contentId)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleSelectItem = (contentId, checked) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(contentId)
    } else {
      newSelected.delete(contentId)
    }
    setSelectedItems(newSelected)
  }

  const getFileName = (item) => {
    const source = (item.source || '').trim()

    // For files, show the exact source (e.g. "storage/Prospectus_...pdf")
    if (item.type === 'file') {
      if (source && source !== 'Unknown') {
        return source
      }
      return `storage/content_${(item.contentId || '').substring(0, 8)}.pdf`
    }

    // For text content, avoid showing internal names like "storage/content_0.txt"
    if (item.type === 'text') {
      // Use a friendly source label if provided and not an auto-generated storage name
      if (source && source !== 'Unknown' && !source.startsWith('storage/content_')) {
        return source
      }

      // Otherwise, derive a name from the text preview
      const preview = (item.textPreview || '').trim()
      if (preview) {
        const firstLine = preview.split(/\r?\n/)[0]
        const trimmed = firstLine.length > 80 ? `${firstLine.slice(0, 80)}…` : firstLine
        return trimmed || 'Text content'
      }

      // Final fallback
      return `Text content ${(item.contentId || '').substring(0, 8)}`
    }

    // Generic fallback
    return source || `content_${(item.contentId || '').substring(0, 8)}`
  }

  const filteredContent = content.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (item.source || '').toLowerCase().includes(searchLower) ||
      (item.textPreview || '').toLowerCase().includes(searchLower) ||
      (item.question || '').toLowerCase().includes(searchLower) ||
      (item.answer || '').toLowerCase().includes(searchLower) ||
      (item.category || '').toLowerCase().includes(searchLower) ||
      (item.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
    )
  })

  const getFileIcon = (type) => {
    switch (type) {
      case 'file':
        return '📄'
      case 'website':
        return '🌐'
      case 'text':
        return '📝'
      default:
        return '📄'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-[#111827] transition-colors duration-200 min-h-screen">
        <StarLoader size="large" text="Loading knowledge base..." />
      </div>
    )
  }

  if (!databases) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-[#111827] transition-colors duration-200 min-h-screen">
        <StarLoader size="large" text="Loading databases..." />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#111827] p-6 space-y-6 transition-colors duration-200 w-full">
      {/* Database Selection Buttons */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1F2937] rounded-lg border border-gray-200 dark:border-[#374151]">
        <span className="text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mr-2">Database:</span>
        <button
          onClick={() => handleDatabaseSwitch('starHealth')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedDatabase === 'starHealth'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white dark:bg-[#111827] text-[#333333] dark:text-[#FFFFFF] border border-gray-300 dark:border-[#374151] hover:bg-gray-50 dark:hover:bg-[#374151]'
            }`}
        >
          {databases.starHealth?.label || 'Star Health'}
        </button>
        <button
          onClick={() => handleDatabaseSwitch('competitor')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedDatabase === 'competitor'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white dark:bg-[#111827] text-[#333333] dark:text-[#FFFFFF] border border-gray-300 dark:border-[#374151] hover:bg-gray-50 dark:hover:bg-[#374151]'
            }`}
        >
          {databases.competitor?.label || 'Competitor'}
        </button>
        <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          Current: {databases[selectedDatabase]?.name || 'Unknown'}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-500 rounded-lg shrink-0">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#333333] dark:text-[#FFFFFF] mb-1">
              {databases[selectedDatabase]?.name || 'Knowledge Base'}
            </h3>
            <p className="text-sm text-[#333333] dark:text-[#FFFFFF]">
              Content added here (files, text) is trained in the RAG system. The AI agent uses this knowledge to provide accurate answers. Each content item has a confidence score indicating its reliability.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setShowAddFileModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#FFFFFF] dark:bg-[#1F2937] border border-gray-300 dark:border-[#374151] rounded-lg hover:bg-gray-50 dark:hover:bg-[#374151] transition-colors text-sm font-medium text-[#333333] dark:text-[#FFFFFF]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Add File</span>
        </button>

        <button
          onClick={() => setShowAddTextModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#FFFFFF] dark:bg-[#1F2937] border border-gray-300 dark:border-[#374151] rounded-lg hover:bg-gray-50 dark:hover:bg-[#374151] transition-colors text-sm font-medium text-black dark:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Add Text</span>
        </button>

        <button
          onClick={fetchContent}
          className="ml-auto flex items-center space-x-2 px-4 py-2 bg-white dark:bg-[#1F2937] border border-gray-300 dark:border-[#374151] rounded-lg hover:bg-gray-50 dark:hover:bg-[#111827] transition-colors text-sm font-medium text-gray-700 dark:text-[#FFFFFF]"
          title="Refresh"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search knowledge base..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#374151] bg-[#FFFFFF] dark:bg-[#1F2937] text-[#333333] dark:text-[#FFFFFF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedItems.size} item(s) selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* File List */}
      <div className="bg-[#FFFFFF] dark:bg-[#1F2937] rounded-lg border border-gray-200 dark:border-[#374151] overflow-hidden">
        {/* Header Row */}
        <div className="bg-gray-50 dark:bg-[#111827] border-b border-gray-200 dark:border-[#374151] px-4 py-3 flex items-center">
          <div className="w-12 flex items-center justify-center">
            <input
              type="checkbox"
              checked={filteredContent.length > 0 && selectedItems.size === filteredContent.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-[#333333] dark:text-[#FFFFFF]">File name</span>
          </div>
        </div>

        {/* File List Items */}
        <div className="max-h-[600px] overflow-y-auto">
          {filteredContent.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-[#6B7280] dark:text-[#9CA3AF]">No knowledge articles found matching your search.</p>
            </div>
          ) : (
            filteredContent.map((item, index) => {
              const fileName = getFileName(item)
              const isSelected = selectedItems.has(item.contentId)

              return (
                <div
                  key={item.contentId}
                  className={`border-b border-gray-200 dark:border-[#374151] px-4 py-3 flex items-center hover:bg-gray-50 dark:hover:bg-[#111827] transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                >
                  <div className="w-12 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectItem(item.contentId, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-lg">{getFileIcon(item.type)}</span>
                    <span className="text-sm text-[#333333] dark:text-[#FFFFFF] font-medium">
                      {fileName}
                    </span>
                    {item.type && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-[#374151] text-[#6B7280] dark:text-[#9CA3AF] rounded text-xs capitalize">
                        {item.type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(item.contentId)}
                      className="text-[#9CA3AF] dark:text-[#6B7280] hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add File Modal */}
      {showAddFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Add File</h3>
                <button
                  onClick={() => setShowAddFileModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddFile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                  <input
                    type="file"
                    ref={(el) => setFileInput(el)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".txt,.md,.pdf,.doc,.docx"
                  />
                  <p className="text-xs text-gray-500 mt-1">Supported: TXT, MD, PDF, DOC, DOCX</p>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload & Train'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddFileModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Text Modal */}
      {showAddTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Add Text</h3>
                <button
                  onClick={() => setShowAddTextModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddText} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source (Optional)</label>
                  <input
                    type="text"
                    value={textSource}
                    onChange={(e) => setTextSource(e.target.value)}
                    placeholder="e.g., Product Guide, FAQ, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text Content</label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={10}
                    placeholder="Enter text content to train the RAG system..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {uploading ? 'Training...' : 'Add & Train'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTextModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RAGKnowledgeBase
