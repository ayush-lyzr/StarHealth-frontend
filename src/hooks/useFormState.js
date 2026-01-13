import { useState, useCallback } from 'react'

/**
 * Custom hook for managing common form states (loading, saving, messages)
 * @param {Object} initialState - Initial form data (optional)
 * @returns {Object} - Form state and handlers
 */
export const useFormState = (initialState = {}) => {
    const [formData, setFormData] = useState(initialState)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const showMessage = useCallback((type, text, duration = 3000) => {
        setMessage({ type, text })
        if (duration > 0) {
            setTimeout(() => setMessage({ type: '', text: '' }), duration)
        }
    }, [])

    const handleChange = useCallback((e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }, [])

    const resetForm = useCallback(() => {
        setFormData(initialState)
    }, [initialState])

    return {
        formData,
        setFormData,
        loading,
        setLoading,
        saving,
        setSaving,
        message,
        showMessage,
        handleChange,
        resetForm
    }
}
