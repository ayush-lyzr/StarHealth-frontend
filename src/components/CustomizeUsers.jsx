import { useState, useEffect } from 'react'
import apiClient from '../utils/axiosConfig'
import { useTheme } from '../contexts/ThemeContext'
import { useDataPreloader } from '../contexts/DataPreloaderContext'
import StarLoader from './ui/StarLoader'
import { useFormState } from '../hooks/useFormState'
import NotificationToast from './common/NotificationToast'
import { formatPhoneNumber } from '../utils/formatters'

const CustomizeUsers = () => {
  const { isDark } = useTheme()
  const { preloadedData, refreshSection } = useDataPreloader()
  const [users, setUsers] = useState([])
  const [loginUsers, setLoginUsers] = useState([])

  // Use shared hook for form state
  const {
    loading, setLoading,
    saving, setSaving,
    message, showMessage
  } = useFormState({ loading: true }) // Start loading true

  const [newUser, setNewUser] = useState({
    agent_name: '',
    agent_code: '',
    role: '',
    phone_number: '',
    email: '',
  })
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [activeTab, setActiveTab] = useState('agents')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Use preloaded data if available
    if (preloadedData.users && Array.isArray(preloadedData.users) && preloadedData.users.length > 0) {
      setUsers(preloadedData.users)
      setLoading(false)
      // console.log('✅ Using preloaded users data')
    } else if (preloadedData.users !== null) {
      // Preloaded but empty array - still set it
      setUsers([])
      setLoading(false)
    } else if (preloadedData.users === null) {
      // Not preloaded yet, fetch it
      fetchUsers()
    }
    // Fetch login users
    fetchLoginUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadedData.users])

  // Handler for phone number input in add form
  const handlePhoneNumberChange = (value) => {
    const formatted = formatPhoneNumber(value)
    setNewUser({ ...newUser, phone_number: formatted })
  }

  // Handler for phone number input in edit form
  const handleEditPhoneNumberChange = (value) => {
    const formatted = formatPhoneNumber(value)
    handleEditChange('phone_number', formatted)
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/users')
      // Handle both response formats: {users: []} or direct array
      const usersData = response.data.users || response.data || []
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      console.error('Error fetching users:', error)
      showMessage('error', 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchLoginUsers = async () => {
    try {
      const response = await apiClient.get('/auth/users')
      if (response.data.success && response.data.users) {
        // Show all users from database, handle missing fields gracefully
        const allUsers = response.data.users.filter(user => user !== null && user !== undefined)
        setLoginUsers(allUsers)
        console.log('✅ Loaded all login users from database:', allUsers.length)
      } else {
        console.error('Failed to fetch login users:', response.data)
        setLoginUsers([])
      }
    } catch (error) {
      console.error('Error fetching login users:', error)
      showMessage('error', 'Failed to load login users')
      setLoginUsers([])
    }
  }

  const toggleAdminAccess = async (email, currentAdminStatus) => {
    try {
      setSaving(true)
      const response = await apiClient.put('/auth/update-admin-access', {
        email: email,
        isAdmin: !currentAdminStatus
      })
      if (response.data.success) {
        setLoginUsers(prev =>
          prev.map(user =>
            user.email === email
              ? { ...user, isAdmin: !currentAdminStatus }
              : user
          )
        )
        showMessage('success', response.data.message || `Admin access ${!currentAdminStatus ? 'granted' : 'revoked'}`)
      }
    } catch (error) {
      console.error('Error updating admin access:', error)
      const errorMsg = error.response?.data?.message || 'Failed to update admin access'
      showMessage('error', errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    // Validate all fields are mandatory
    if (!newUser.agent_name.trim()) {
      showMessage('error', 'Agent Name is required')
      return
    }
    if (!newUser.agent_code.trim()) {
      showMessage('error', 'Agent Code is required')
      return
    }
    if (!newUser.role.trim()) {
      showMessage('error', 'Role is required')
      return
    }
    if (!newUser.phone_number.trim()) {
      showMessage('error', 'Phone Number is required')
      return
    }
    if (!newUser.email.trim()) {
      showMessage('error', 'Email is required')
      return
    }
    try {
      setSaving(true)
      // Ensure phone number has +91 prefix before submitting
      const userData = {
        ...newUser,
        phone_number: newUser.phone_number ? formatPhoneNumber(newUser.phone_number) : ''
      }
      const response = await apiClient.post('/users', userData)
      setUsers((prev) => [response.data.user, ...prev])
      setNewUser({
        agent_name: '',
        agent_code: '',
        role: '',
        phone_number: '',
        email: '',
      })
      showMessage('success', 'Agent added successfully')
      // Refresh preloaded data and login users
      refreshSection('users')
      fetchLoginUsers()
    } catch (error) {
      console.error('Error adding agent:', error)
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Failed to add agent'
      showMessage('error', errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (user) => {
    setEditingId(user._id)
    setEditValues({
      agent_name: user.agent_name || '',
      agent_code: user.agent_code || '',
      role: user.role || '',
      phone_number: user.phone_number ? formatPhoneNumber(user.phone_number) : '',
      email: user.email || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({})
  }

  const handleEditChange = (field, value) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const saveEdit = async (userId) => {
    // Validate all fields are mandatory
    if (!editValues.agent_name.trim()) {
      showMessage('error', 'Agent Name is required')
      return
    }
    if (!editValues.agent_code.trim()) {
      showMessage('error', 'Agent Code is required')
      return
    }
    if (!editValues.role.trim()) {
      showMessage('error', 'Role is required')
      return
    }
    if (!editValues.phone_number.trim()) {
      showMessage('error', 'Phone Number is required')
      return
    }
    if (!editValues.email.trim()) {
      showMessage('error', 'Email is required')
      return
    }
    try {
      setSaving(true)
      // Ensure phone number has +91 prefix before submitting
      const editData = {
        ...editValues,
        phone_number: editValues.phone_number ? formatPhoneNumber(editValues.phone_number) : ''
      }
      const response = await apiClient.put(`/users/${userId}`, editData)
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? response.data.user : u))
      )
      setEditingId(null)
      setEditValues({})
      showMessage('success', 'Agent updated successfully')
      // Refresh preloaded data
      refreshSection('users')
    } catch (error) {
      console.error('Error updating user:', error)
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Failed to update agent'
      showMessage('error', errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      setSaving(true)
      await apiClient.delete(`/users/${userId}`)
      setUsers((prev) => prev.filter((u) => u._id !== userId))
      showMessage('success', 'Agent deleted successfully')
      // Refresh preloaded data and login users list
      refreshSection('users')
      fetchLoginUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      showMessage('error', 'Failed to delete agent')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLoginUser = async (email) => {
    if (!email) return
    if (email.toLowerCase() === JSON.parse(localStorage.getItem('auth_user'))?.email?.toLowerCase()) {
      showMessage('error', 'You cannot delete your own login account')
      return
    }
    if (!window.confirm(`Are you sure you want to delete the login account for ${email}? This user will lose dashboard access.`)) return

    try {
      setSaving(true)
      await apiClient.delete(`/auth/users/${encodeURIComponent(email)}`)
      setLoginUsers((prev) => prev.filter((u) => u.email !== email))
      showMessage('success', 'Login user deleted successfully')
    } catch (error) {
      console.error('Error deleting login user:', error)
      const errorMsg = error.response?.data?.message || 'Failed to delete login user'
      showMessage('error', errorMsg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-[#111827] transition-colors duration-200 min-h-screen">
        <StarLoader size="large" text="Loading users..." />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#111827] p-6 transition-colors duration-200 w-full">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-[#333333] dark:text-[#FFFFFF] mb-2">
            Customize Users
          </h1>
          <p className="text-[#6B7280] dark:text-[#9CA3AF]">
            Manage agents (users) and login users with admin access.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'agents'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            Agents
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'login'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            Login Users & Admin Access
          </button>
        </div>

        {/* Message */}
        <NotificationToast message={message} onClose={() => showMessage('', '')} />

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <>
            {/* Add User Form */}
            <div className="bg-white dark:bg-[#1F2937] rounded-[12px] border border-gray-100 dark:border-[#374151] p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-[#333333] dark:text-[#FFFFFF] mb-3">
                Add New Agent
              </h2>
              <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-1">
                    Agent Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.agent_name}
                    onChange={(e) => setNewUser({ ...newUser, agent_name: e.target.value })}
                    placeholder="e.g., Rohith Kumar"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-1">
                    Agent Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.agent_code}
                    onChange={(e) => setNewUser({ ...newUser, agent_code: e.target.value })}
                    placeholder="e.g., SH007"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    placeholder="e.g., Sales Agent"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
                      +91
                    </span>
                    <input
                      type="text"
                      required
                      value={newUser.phone_number.replace(/^\+91/, '')}
                      onChange={(e) => handlePhoneNumberChange(e.target.value)}
                      placeholder="98765 43210"
                      className="w-full px-3 py-2 pl-12 rounded-lg border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="e.g., agent@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Add User'}
                </button>
              </form>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-[#1F2937] rounded-[12px] border border-gray-100 dark:border-[#374151] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#333333] dark:text-[#FFFFFF]">
                  Agents ({users.length})
                </h2>
              </div>
              {users.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                    No users found. Add a user to get started.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-[#374151]">
                    <thead className="bg-gray-50 dark:bg-[#111827]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                          Agent Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                          Agent Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                          Phone Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#1F2937] divide-y divide-gray-100 dark:divide-[#374151]">
                      {users.map((user) => {
                        const isEditing = editingId === user._id
                        const createdDate = user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                          : 'N/A'

                        return (
                          <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-[#111827] transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="text"
                                  required
                                  value={editValues.agent_name}
                                  onChange={(e) => handleEditChange('agent_name', e.target.value)}
                                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <span className="text-sm text-[#333333] dark:text-[#FFFFFF] font-medium">
                                  {user.agent_name || '—'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="text"
                                  required
                                  value={editValues.agent_code}
                                  onChange={(e) => handleEditChange('agent_code', e.target.value)}
                                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                />
                              ) : (
                                <span className="text-sm text-[#333333] dark:text-[#FFFFFF] font-mono">
                                  {user.agent_code || '—'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="text"
                                  required
                                  value={editValues.role}
                                  onChange={(e) => handleEditChange('role', e.target.value)}
                                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <span className="text-sm text-[#333333] dark:text-[#FFFFFF]">
                                  {user.role || '—'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {isEditing ? (
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                                    +91
                                  </span>
                                  <input
                                    type="text"
                                    required
                                    value={editValues.phone_number.replace(/^\+91/, '')}
                                    onChange={(e) => handleEditPhoneNumberChange(e.target.value)}
                                    className="w-full px-2 py-1 pl-10 rounded border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              ) : (
                                <span className="text-sm text-[#333333] dark:text-[#FFFFFF]">
                                  {user.phone_number ? formatPhoneNumber(user.phone_number) : '—'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="email"
                                  required
                                  value={editValues.email}
                                  onChange={(e) => handleEditChange('email', e.target.value)}
                                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <span className="text-sm text-[#333333] dark:text-[#FFFFFF]">
                                  {user.email || '—'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                                {createdDate}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => saveEdit(user._id)}
                                      disabled={saving}
                                      className="px-3 py-1 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-[#FFFFFF] dark:hover:bg-gray-600"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEdit(user)}
                                      className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-[#FFFFFF] dark:hover:bg-gray-600"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(user._id)}
                                      className="px-3 py-1 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Login Users Tab */}
        {activeTab === 'login' && (
          <div className="bg-white dark:bg-[#1F2937] rounded-[12px] border border-gray-100 dark:border-[#374151] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#333333] dark:text-[#FFFFFF]">
                Admin Access Management
              </h2>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {loginUsers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                  No login users found.
                </p>
              </div>
            ) : (() => {
              // Filter users based on search query (search by name, email, or any field)
              const filteredUsers = loginUsers.filter((user) => {
                if (!searchQuery.trim()) return true
                const query = searchQuery.toLowerCase().trim()
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().trim()
                const email = (user.email || '').toLowerCase()
                const phone = (user.phone || '').toLowerCase()
                // Search in name, email, or phone
                return fullName.includes(query) || email.includes(query) || phone.includes(query)
              })

              return (
                <>
                  <div className="mb-2 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                    Showing {filteredUsers.length} of {loginUsers.length} users
                  </div>
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                        No users found matching "{searchQuery}"
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-[#374151]">
                        <thead className="bg-gray-50 dark:bg-[#111827]">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                              Admin Access
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-[#1F2937] divide-y divide-gray-100 dark:divide-[#374151]">
                          {filteredUsers.map((user) => {
                            const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No Name'
                            const userKey = user.email || user._id || `user-${Math.random()}`
                            return (
                              <tr key={userKey} className="hover:bg-gray-50 dark:hover:bg-[#111827] transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="text-sm text-[#333333] dark:text-[#FFFFFF] font-medium">
                                    {displayName}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="text-sm text-[#333333] dark:text-[#FFFFFF]">
                                    {user.email || 'No Email'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`text-xs px-2 py-1 rounded-full ${user.isAdmin
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                    {user.isAdmin ? 'Admin' : 'User'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    {user.email ? (
                                      <>
                                        <button
                                          onClick={() => toggleAdminAccess(user.email, user.isAdmin)}
                                          disabled={saving}
                                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${user.isAdmin
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                                            }`}
                                        >
                                          {user.isAdmin ? 'Revoke Admin' : 'Grant Admin'}
                                        </button>
                                        <button
                                          onClick={() => handleDeleteLoginUser(user.email)}
                                          disabled={saving}
                                          className="px-3 py-1 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                        >
                                          Delete
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-xs text-gray-400 dark:text-gray-500">
                                        No Email
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomizeUsers



