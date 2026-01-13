import React from 'react'

const cn = (...classes) => classes.filter(Boolean).join(' ')

export const Card = React.forwardRef(function Card(
  { className = '', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm dark:bg-[#1F2937] dark:border-[#374151] dark:text-slate-50',
        className
      )}
      {...props}
    />
  )
})

export const CardHeader = React.forwardRef(function CardHeader(
  { className = '', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-4 md:p-6', className)}
      {...props}
    />
  )
})

export const CardTitle = React.forwardRef(function CardTitle(
  { className = '', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
})

export const CardDescription = React.forwardRef(function CardDescription(
  { className = '', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
      {...props}
    />
  )
})

export const CardContent = React.forwardRef(function CardContent(
  { className = '', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('p-4 pt-0 md:p-6 md:pt-0', className)}
      {...props}
    />
  )
})

export const CardFooter = React.forwardRef(function CardFooter(
  { className = '', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center p-4 pt-0 md:p-6 md:pt-0', className)}
      {...props}
    />
  )
})










