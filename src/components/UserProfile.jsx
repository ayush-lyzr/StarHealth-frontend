import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card'
import { useAuth } from '../contexts/AuthContext'
import apiClient from '../utils/axiosConfig'

const UserProfile = () => {
  const { user, updateUser: updateAuthUser } = useAuth()
  
  const updateUser = async (userData) => {
    try {
      // Use the authenticated endpoint (no email needed, uses token)
      const response = await apiClient.put('/auth/profile', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        bio: userData.bio,
      })
      if (response.data.success) {
        // Update auth context with new user data
        if (updateAuthUser && response.data.user) {
          updateAuthUser(response.data.user)
        }
        return { success: true, message: 'Profile updated successfully' }
      }
      return { success: false, message: response.data.message || 'Failed to update profile' }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update profile. Please try again.' 
      }
    }
  }
  
  // Fetch profile on mount if user is not loaded
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        try {
          const response = await apiClient.get('/auth/profile')
          if (response.data.success && response.data.user) {
            if (updateAuthUser) {
              updateAuthUser(response.data.user)
            }
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
        }
      }
    }
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      // Map user data to form fields
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required')
      return
    }

    setIsLoading(true)
    const result = await updateUser({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      bio: formData.bio,
    })
    setIsLoading(false)

    if (result.success) {
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(result.message || 'Failed to update profile')
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
      })
    }
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Not Authenticated</h2>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">User Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account information and preferences
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 text-sm text-green-600 bg-green-50 rounded-lg dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Personal Information</CardTitle>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                {user.firstName?.[0]?.toUpperCase() || 
                 user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {[user.firstName, user.lastName].filter(Boolean).join(' ') ||
                   user.email?.split('@')[0] ||
                   'User'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
                {user.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                ) : (
                  <p className="px-4 py-2 text-gray-800 bg-gray-50 rounded-lg dark:bg-gray-800 dark:text-gray-200">
                    {user.firstName || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                ) : (
                  <p className="px-4 py-2 text-gray-800 bg-gray-50 rounded-lg dark:bg-gray-800 dark:text-gray-200">
                    {user.lastName || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <p className="px-4 py-2 text-gray-600 bg-gray-50 rounded-lg dark:bg-gray-800 dark:text-gray-400 opacity-60">
                  {user.email}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="+1234567890"
                  />
                ) : (
                  <p className="px-4 py-2 text-gray-800 bg-gray-50 rounded-lg dark:bg-gray-800 dark:text-gray-200">
                    {user.phone || 'N/A'}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={isLoading}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="px-4 py-2 text-gray-800 bg-gray-50 rounded-lg dark:bg-gray-800 dark:text-gray-200 min-h-[60px]">
                    {user.bio || 'No bio provided'}
                  </p>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                Account Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Created
                  </label>
                  <p className="px-4 py-2 text-gray-600 bg-gray-50 rounded-lg dark:bg-gray-800 dark:text-gray-400">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Login
                  </label>
                  <p className="px-4 py-2 text-gray-600 bg-gray-50 rounded-lg dark:bg-gray-800 dark:text-gray-400">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserProfile







