import React from 'react'
import PropTypes from 'prop-types'

/**
 * Reusable notification toast component
 */
const NotificationToast = ({ message, onClose }) => {
    if (!message.text) return null

    const isSuccess = message.type === 'success'

    return (
        <div className={`p-4 rounded-lg mb-4 flex justify-between items-center ${isSuccess
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
            <span>{message.text}</span>
            {onClose && (
                <button
                    onClick={onClose}
                    className={`ml-4 hover:opacity-75 ${isSuccess ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'
                        }`}
                >
                    ✕
                </button>
            )}
        </div>
    )
}

NotificationToast.propTypes = {
    message: PropTypes.shape({
        type: PropTypes.string,
        text: PropTypes.string
    }).isRequired,
    onClose: PropTypes.func
}

export default NotificationToast
