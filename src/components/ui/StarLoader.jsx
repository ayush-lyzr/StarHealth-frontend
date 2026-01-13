import React from 'react';

const StarLoader = ({ size = 'medium', text = null, className = '' }) => {
    // Size mapping
    const sizeClasses = {
        small: 'w-12 h-12',
        medium: 'w-16 h-16',
        large: 'w-24 h-24',
        xl: 'w-32 h-32'
    };

    const containerSize = sizeClasses[size] || sizeClasses.medium;

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <div className={`relative ${containerSize} flex items-center justify-center`}>
                {/* Spinning Rings */}
                <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin"></div>

                {/* Logo in Center */}
                <div className="absolute inset-2 flex items-center justify-center bg-white rounded-full shadow-sm p-1.5 overflow-hidden">
                    <img
                        src="/Star_Health_and_Allied_Insurance.svg.png"
                        alt="Loading..."
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            {/* Optional Text */}
            {text && (
                <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400 animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
};

export default StarLoader;
