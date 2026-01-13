import { useState, useEffect } from 'react'
import apiClient from '../utils/axiosConfig'
import { useTheme } from '../contexts/ThemeContext'
import { useFormState } from '../hooks/useFormState'
import NotificationToast from './common/NotificationToast'

const CustomizeAgents = () => {
  const { isDark } = useTheme()
  const [showOnboarding, setShowOnboarding] = useState(true)

  // Use shared hook for form state
  const {
    loading, setLoading,
    saving, setSaving,
    message, showMessage
  } = useFormState()

  const [productAgentMode, setProductAgentMode] = useState('default') // 'default' or 'customize'
  const [salesAgentMode, setSalesAgentMode] = useState('default') // 'default' or 'customize'
  const [productAgentConfig, setProductAgentConfig] = useState({
    role: '',
    goal: '',
    instructions: ''
  })
  const [salesAgentConfig, setSalesAgentConfig] = useState({
    role: '',
    goal: '',
    instructions: ''
  })
  const [onboardingMode, setOnboardingMode] = useState('default') // 'default' or 'customize'
  const [onboardingConfig, setOnboardingConfig] = useState({
    greetingMessage: '',
    menuMessage: '',
    invalidCodeMessage: '',
    authFailedMessage: '',
    invalidOptionMessage: '',
    continuationQuestion: '',
    continuationYesResponse: '',
    thankYouMessage: '',
  })

  const [resetConfirm, setResetConfirm] = useState({ show: false, type: '' })

  useEffect(() => {
    fetchAgentConfigs()
  }, [])

  const fetchAgentConfigs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/agents/config')
      if (response.data.success) {
        const configs = response.data.configs
        if (configs.product) {
          setProductAgentMode(configs.product.mode || 'default')
          setProductAgentConfig({
            role: configs.product.role || '',
            goal: configs.product.goal || '',
            instructions: configs.product.instructions || ''
          })
        }
        if (configs.sales) {
          setSalesAgentMode(configs.sales.mode || 'default')
          setSalesAgentConfig({
            role: configs.sales.role || '',
            goal: configs.sales.goal || '',
            instructions: configs.sales.instructions || ''
          })
        }
        if (configs.onboarding) {
          const o = configs.onboarding
          // Define our new system-level defaults for comparison
          const DEFAULT_GREETING = "Hi! Welcome to **Star Health** on WhatsApp. 🌟\n\nI can help you find the right insurance plan and close sales in under 2 minutes.\n\nPlease enter your **Agent Code** to get started.";
          const DEFAULT_MENU = "Welcome {agent_name}! 🚀 What can I help you with today?\n\n1️⃣ **Product Recommendation** - Find the right plan\n2️⃣ **Sales Pitch** - Get a winning pitch\n\nJust type 1 or 2!";

          // Check if custom onboarding exists (different from our new defaults)
          const isCustomized = o.greetingMessage && o.greetingMessage !== DEFAULT_GREETING ||
            o.menuMessage && o.menuMessage !== DEFAULT_MENU;

          // 🔒 UI CHOICE: Users want the section collapsed by default (Image 2)
          // We load the data but keep it in 'default' mode until they click 'Customize'
          setOnboardingMode(isCustomized ? 'customize' : 'default')

          setOnboardingConfig({
            greetingMessage: o.greetingMessage || DEFAULT_GREETING,
            menuMessage: o.menuMessage || DEFAULT_MENU,
            invalidCodeMessage: o.invalidCodeMessage || '❌ That code doesn\'t look quite right. Please check your Agent Code and try again.',
            authFailedMessage: o.authFailedMessage || '⚠️ Security Alert: This code is registered to another mobile number. Please use the code assigned to you.',
            invalidOptionMessage: o.invalidOptionMessage || 'I didn\'t quite catch that! Please type 1️⃣ for Recommendation or 2️⃣ for Sales Pitch.',
            continuationQuestion: o.continuationQuestion || "Is this all you need or anything else you need help with?\n\n1. Yes, continue\n2. No, I'm done",
            continuationYesResponse: o.continuationYesResponse || "Great! How else can I help you?",
            thankYouMessage: o.thankYouMessage || "Thank you for using our service, {username}!\n\nPlease select an option to start a new conversation:\n1️⃣ Product Recommendation\n2️⃣ Sales Pitch",
          })
        }
      }
    } catch (error) {
      console.error('Error fetching agent configs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check if all fields are filled for product agent
  const isProductAgentValid = () => {
    return productAgentConfig.role.trim() !== '' &&
      productAgentConfig.goal.trim() !== '' &&
      productAgentConfig.instructions.trim() !== ''
  }

  // Check if all fields are filled for sales agent
  const isSalesAgentValid = () => {
    return salesAgentConfig.role.trim() !== '' &&
      salesAgentConfig.goal.trim() !== '' &&
      salesAgentConfig.instructions.trim() !== ''
  }

  const handleSave = async (agentType) => {
    const config =
      agentType === 'product'
        ? productAgentConfig
        : agentType === 'sales'
          ? salesAgentConfig
          : onboardingConfig

    const mode =
      agentType === 'product'
        ? productAgentMode
        : agentType === 'sales'
          ? salesAgentMode
          : agentType === 'onboarding'
            ? onboardingMode
            : 'customize'

    if (mode === 'customize' && (agentType === 'product' || agentType === 'sales')) {
      if (!config.role.trim() || !config.goal.trim() || !config.instructions.trim()) {
        showMessage('error', 'Role, Goal, and Instructions cannot be empty')
        return
      }
    }

    try {
      setSaving(true)
      const response = await apiClient.post('/agents/config', {
        agentType,
        mode,
        config: mode === 'customize' ? config : null
      })

      if (response.data.success) {
        let label = ''
        if (agentType === 'product') {
          label = 'Product'
        } else if (agentType === 'sales') {
          label = 'Sales'
        } else {
          label = 'Onboarding'
        }
        showMessage('success', `${label} configuration saved successfully!`)
      }
    } catch (error) {
      console.error('Error saving agent config:', error)
      showMessage('error', 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefault = async (agentType) => {
    try {
      setSaving(true)
      const response = await apiClient.post('/agents/config', {
        agentType,
        mode: 'default',
        config: null
      })

      if (response.data.success) {
        let label = ''
        if (agentType === 'product') {
          label = 'Product'
          setProductAgentMode('default')
          setProductAgentConfig({
            role: '',
            goal: '',
            instructions: ''
          })
        } else if (agentType === 'sales') {
          label = 'Sales'
          setSalesAgentMode('default')
          setSalesAgentConfig({
            role: '',
            goal: '',
            instructions: ''
          })
        }
        showMessage('success', `${label} agent reset to default successfully! ✨`)
      }
    } catch (error) {
      console.error('Error resetting agent config:', error)
      showMessage('error', 'Failed to reset configuration')
    } finally {
      setSaving(false)
      setResetConfirm({ show: false, type: '' })
    }
  }

  return (
    <div className="bg-white dark:bg-[#111827] p-6 transition-colors duration-200 w-full">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#333333] dark:text-[#FFFFFF] mb-2">Customize Agents</h1>
          <p className="text-[#6B7280] dark:text-[#9CA3AF]">Configure agent prompts and select which agents to use</p>
        </div>

        {/* Onboarding Banner */}
        {showOnboarding && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-[12px] border border-blue-200 dark:border-blue-800 p-6 relative overflow-hidden">
            <button
              onClick={() => setShowOnboarding(false)}
              className="absolute top-4 right-4 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              ✕
            </button>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🚀</div>
                <div>
                  <h3 className="font-bold text-[#1E40AF] dark:text-[#93C5FD] mb-2">Welcome to Agent Customization!</h3>
                  <p className="text-[#1E3A8A] dark:text-[#DBEAFE] text-sm mb-3">
                    Customize how your agents interact with users. You can:
                  </p>
                  <ul className="text-[#1E3A8A] dark:text-[#DBEAFE] text-sm space-y-1 ml-2">
                    <li>✓ Switch between default and custom agent personalities</li>
                    <li>✓ Define custom roles, goals, and instructions for each agent</li>
                    <li>✓ Customize onboarding messages and authentication flows</li>
                    <li>✓ Reset any customization back to defaults with one click</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        <NotificationToast message={message} onClose={() => showMessage('', '')} />

        {/* Reset Confirmation Modal */}
        {resetConfirm.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
            <div className="bg-white dark:bg-[#1F2937] rounded-lg p-6 max-w-sm mx-4 border border-gray-200 dark:border-[#374151]">
              <h3 className="text-lg font-bold text-[#333333] dark:text-[#FFFFFF] mb-4">Reset to Default?</h3>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-6">
                Are you sure you want to reset the <strong>{resetConfirm.type === 'product' ? 'Product Recommendation' : 'Sales'} Agent</strong> to its default configuration? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setResetConfirm({ show: false, type: '' })}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-[#374151] text-[#333333] dark:text-[#FFFFFF] rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-[#4B5563] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResetToDefault(resetConfirm.type)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Resetting...' : 'Reset'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onboarding & Authentication Messages */}
        <div className="bg-white dark:bg-[#1F2937] rounded-[12px] border border-gray-100 dark:border-[#374151] p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#333333] dark:text-[#FFFFFF] mb-4">Onboarding & Authentication Messages</h2>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mb-4">
              These messages are shown to users when they first interact with the bot. Customize them to match your brand voice.
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-[#333333] dark:text-[#FFFFFF]">Select agent to use:</label>
              <select
                value={onboardingMode}
                onChange={(e) => setOnboardingMode(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Default Messages</option>
                <option value="customize">Customize Messages</option>
              </select>
            </div>
          </div>

          {onboardingMode === 'customize' && (
            <div className="space-y-4 mt-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300 mb-4">
                <strong>📋 Message Flow:</strong> Users see these messages in order: Greeting → Menu → (Error messages if needed)
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">
                  1️⃣ Greeting & Agent Code Prompt
                </label>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-2">
                  First message users see. Should ask them to enter their agent code.
                </p>
                <textarea
                  value={onboardingConfig.greetingMessage}
                  onChange={(e) => setOnboardingConfig({ ...onboardingConfig, greetingMessage: e.target.value })}
                  placeholder="Hi 👋 Please enter your Agent Code."
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">
                  2️⃣ Menu Prompt (after Agent Code validation)
                </label>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-2">
                  Shown after user enters a valid agent code. Can use {'{agent_name}'} and {'{agent_code}'} placeholders.
                </p>
                <textarea
                  value={onboardingConfig.menuMessage}
                  onChange={(e) => setOnboardingConfig({ ...onboardingConfig, menuMessage: e.target.value })}
                  placeholder={"Welcome {agent_name}! Please select an option:\n1. Product Recommendation\n2. Sales Pitch"}
                  rows={4}
                  className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">
                    ❌ Invalid Agent Code Message
                  </label>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-2">
                    Shown when user enters a non-existent agent code.
                  </p>
                  <textarea
                    value={onboardingConfig.invalidCodeMessage}
                    onChange={(e) => setOnboardingConfig({ ...onboardingConfig, invalidCodeMessage: e.target.value })}
                    placeholder="❌ Invalid agent code. Please try again with a valid code."
                    rows={3}
                    className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">
                    🔐 Authentication Failed Message
                  </label>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-2">
                    Shown when code exists but phone number doesn't match.
                  </p>
                  <textarea
                    value={onboardingConfig.authFailedMessage}
                    onChange={(e) => setOnboardingConfig({ ...onboardingConfig, authFailedMessage: e.target.value })}
                    placeholder="❌ Authentication failed. The phone number associated with this agent code doesn't match your number."
                    rows={3}
                    className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">
                  ⚠️ Invalid Menu Option Message
                </label>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-2">
                  Shown when user selects an invalid option from the menu.
                </p>
                <textarea
                  value={onboardingConfig.invalidOptionMessage}
                  onChange={(e) => setOnboardingConfig({ ...onboardingConfig, invalidOptionMessage: e.target.value })}
                  placeholder="Please select option 1 (Product Recommendation) or option 2 (Sales Pitch)."
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="border-t border-gray-200 dark:border-[#374151] pt-4 mt-6">
                <h3 className="text-md font-bold text-[#333333] dark:text-[#FFFFFF] mb-3">🔄 Conversation Continuation & Closing</h3>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-4">
                  These messages are shown after an agent response to ask if the user needs more help.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">
                      ❓ Continuation Question
                    </label>
                    <textarea
                      value={onboardingConfig.continuationQuestion}
                      onChange={(e) => setOnboardingConfig({ ...onboardingConfig, continuationQuestion: e.target.value })}
                      placeholder={"Is this all you need or anything else you need help with?\n\n1. Yes, continue\n2. No, I'm done"}
                      rows={3}
                      className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">
                      ✅ Response when user says 'Yes' (Continue)
                    </label>
                    <textarea
                      value={onboardingConfig.continuationYesResponse}
                      onChange={(e) => setOnboardingConfig({ ...onboardingConfig, continuationYesResponse: e.target.value })}
                      placeholder="Great! How else can I help you?"
                      rows={2}
                      className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">
                      🙏 Thank You & Exit Message
                    </label>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-2">
                      Shown when user is done. Use {'{username}'} for the agent's name.
                    </p>
                    <textarea
                      value={onboardingConfig.thankYouMessage}
                      onChange={(e) => setOnboardingConfig({ ...onboardingConfig, thankYouMessage: e.target.value })}
                      placeholder={"Thank you for using our service, {username}!\n\nPlease select an option to start a new conversation:\n1️⃣ Product Recommendation\n2️⃣ Sales Pitch"}
                      rows={4}
                      className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSave('onboarding')}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Onboarding Messages'}
              </button>
            </div>
          )}
        </div>

        {/* Product Recommendation Agent */}
        <div className="bg-white dark:bg-[#1F2937] rounded-[12px] border border-gray-100 dark:border-[#374151] p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#333333] dark:text-[#FFFFFF] mb-4">Product Recommendation Agent</h2>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[#333333] dark:text-[#FFFFFF]">Select agent to use:</label>
                <select
                  value={productAgentMode}
                  onChange={(e) => setProductAgentMode(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="default">Default Agent</option>
                  <option value="customize">Customize Agent</option>
                </select>
              </div>
              {productAgentMode === 'customize' && (
                <button
                  onClick={() => setResetConfirm({ show: true, type: 'product' })}
                  className="px-4 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors border border-red-200 dark:border-red-800"
                  title="Reset this agent back to default"
                >
                  🔄 Reset to Default
                </button>
              )}
            </div>
          </div>

          {productAgentMode === 'customize' && (
            <div className="space-y-4 mt-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
                <strong>💡 Tip:</strong> Customize this agent's behavior to match your specific requirements for product recommendations.
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">Role</label>
                <textarea
                  value={productAgentConfig.role}
                  onChange={(e) => setProductAgentConfig({ ...productAgentConfig, role: e.target.value })}
                  placeholder="Enter the agent's role..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">Goal</label>
                <textarea
                  value={productAgentConfig.goal}
                  onChange={(e) => setProductAgentConfig({ ...productAgentConfig, goal: e.target.value })}
                  placeholder="Enter the agent's goal..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">Instructions</label>
                <textarea
                  value={productAgentConfig.instructions}
                  onChange={(e) => setProductAgentConfig({ ...productAgentConfig, instructions: e.target.value })}
                  placeholder="Enter detailed instructions for the agent..."
                  rows={5}
                  className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <button
                onClick={() => handleSave('product')}
                disabled={saving || !isProductAgentValid()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Product Agent Configuration'}
              </button>
            </div>
          )}
        </div>

        {/* Sales Agent */}
        <div className="bg-white dark:bg-[#1F2937] rounded-[12px] border border-gray-100 dark:border-[#374151] p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#333333] dark:text-[#FFFFFF] mb-4">Sales Agent</h2>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[#333333] dark:text-[#FFFFFF]">Select agent to use:</label>
                <select
                  value={salesAgentMode}
                  onChange={(e) => setSalesAgentMode(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-sm text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="default">Default Agent</option>
                  <option value="customize">Customize Agent</option>
                </select>
              </div>
              {salesAgentMode === 'customize' && (
                <button
                  onClick={() => setResetConfirm({ show: true, type: 'sales' })}
                  className="px-4 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors border border-red-200 dark:border-red-800"
                  title="Reset this agent back to default"
                >
                  🔄 Reset to Default
                </button>
              )}
            </div>
          </div>

          {salesAgentMode === 'customize' && (
            <div className="space-y-4 mt-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
                <strong>💡 Tip:</strong> Customize this agent's behavior to match your specific requirements for sales pitches.
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">Role</label>
                <textarea
                  value={salesAgentConfig.role}
                  onChange={(e) => setSalesAgentConfig({ ...salesAgentConfig, role: e.target.value })}
                  placeholder="Enter the agent's role..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">Goal</label>
                <textarea
                  value={salesAgentConfig.goal}
                  onChange={(e) => setSalesAgentConfig({ ...salesAgentConfig, goal: e.target.value })}
                  placeholder="Enter the agent's goal..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333] dark:text-[#FFFFFF] mb-2">Instructions</label>
                <textarea
                  value={salesAgentConfig.instructions}
                  onChange={(e) => setSalesAgentConfig({ ...salesAgentConfig, instructions: e.target.value })}
                  placeholder="Enter detailed instructions for the agent..."
                  rows={5}
                  className="w-full px-4 py-3 bg-white dark:bg-[#111827] border border-gray-300 dark:border-[#374151] rounded-lg text-[#333333] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <button
                onClick={() => handleSave('sales')}
                disabled={saving || !isSalesAgentValid()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Sales Agent Configuration'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomizeAgents

