import React from 'react'

// Simple utility to join class names
const cn = (...classes) => classes.filter(Boolean).join(' ')

// Basic Tailwind-style variants inspired by the Meesho/shadcn UI button
const baseClasses =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50'

const variantClasses = {
  default: 'bg-blue-600 text-white shadow hover:bg-blue-700',
  destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  outline:
    'border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-100 dark:bg-transparent dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800',
  secondary:
    'bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  ghost:
    'bg-transparent hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50',
  link: 'text-blue-600 underline-offset-4 hover:underline dark:text-blue-400',
}

const sizeClasses = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-10 px-6',
  icon: 'h-9 w-9 p-0',
}

export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}) {
  const v = variantClasses[variant] || variantClasses.default
  const s = sizeClasses[size] || sizeClasses.default

  return (
    <button
      className={cn(baseClasses, v, s, className)}
      {...props}
    />
  )
}










