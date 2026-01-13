/**
 * Shared utility functions for formatting and data manipulation
 */

// Format Date to "Mon DD, YYYY HH:MM AM/PM"
export const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
}

// Format Phone Number - return as stored in DB (e.g., +919739865471)
export const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A'
    // Clean up: ensure single +91 prefix, no spaces
    let cleaned = phone.replace(/\s+/g, '').replace(/^\+?91/, '')
    return `+91${cleaned}`
}

// Get Initials from name
export const getInitials = (firstName, lastName) => {
    return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase() || '?'
}

// Get Avatar Background Color based on name
export const getAvatarColor = (name) => {
    const colors = [
        'bg-slate-100 text-slate-600',
        'bg-yellow-100 text-yellow-600',
        'bg-green-100 text-green-600',
        'bg-blue-100 text-blue-600',
        'bg-indigo-100 text-indigo-600',
        'bg-purple-100 text-purple-600',
        'bg-pink-100 text-pink-600',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
}
