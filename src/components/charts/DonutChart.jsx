import React from 'react'

const DonutChart = ({ data, labels, colors, size = 200, totalFeedback, isDark = false }) => {
  const total = data.reduce((sum, val) => sum + val, 0)
  const radius = size / 2 - 10
  const centerX = size / 2
  const centerY = size / 2
  const strokeWidth = 30

  // If there is no data, avoid rendering an empty/NaN donut and show a simple message instead
  if (total === 0) {
    return (
      <div className="flex flex-col items-center">
        <div className={`text-sm ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
          No data available
        </div>
      </div>
    )
  }

  let currentAngle = -90 // Start from top

  const segments = data.map((value, index) => {
    const percentage = (value / total) * 100
    const angle = (value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle

    // Calculate path for arc
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180

    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)

    const largeArcFlag = angle > 180 ? 1 : 0

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')

    currentAngle += angle

    return {
      pathData,
      color: colors[index] || '#888',
      label: labels[index] || '',
      value,
      percentage
    }
  })

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Segments */}
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.pathData}
              fill={segment.color}
              className="transition-all duration-300 hover:opacity-90 hover:scale-110 cursor-pointer"
              style={{ transformOrigin: 'center' }}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2 w-full">
        {segments.map((segment, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#111827] transition-all duration-200 cursor-pointer group/legend hover:scale-105 hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full group-hover/legend:scale-125 transition-transform duration-200 shadow-sm"
                style={{ backgroundColor: segment.color }}
              />
              <span className={`text-[12px] ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'} group-hover/legend:font-bold transition-all duration-200`}>{segment.label}</span>
            </div>
            <span className={`text-[14px] font-semibold ${isDark ? 'text-[#FFFFFF]' : 'text-[#333333]'} group-hover/legend:scale-110 transition-transform duration-200`}>{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DonutChart

