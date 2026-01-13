const LineChart = ({ data, labels, color = '#3b82f6', height = 200 }) => {
  const maxValue = Math.max(...data, 1)
  const minValue = Math.min(...data, 0)
  const range = maxValue - minValue || 1
  const pointCount = data.length
  const pointSpacing = 100 / (pointCount - 1 || 1)

  // Generate path for line
  const points = data.map((value, index) => {
    const x = index * pointSpacing
    const y = 100 - ((value - minValue) / range) * 80 - 10
    return { x, y, value }
  })

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Area under line */}
        <path
          d={`${pathData} L 100 100 L 0 100 Z`}
          fill={color}
          fillOpacity="0.1"
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="1"
          className="transition-all duration-500"
        />
        
        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill={color}
              stroke="white"
              strokeWidth="0.5"
            />
            <text
              x={point.x}
              y={point.y - 3}
              textAnchor="middle"
              fontSize="2.5"
              fill="#374151"
              fontWeight="bold"
            >
              {point.value}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        {labels.map((label, index) => (
          <span key={index} className="text-center flex-1 truncate">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default LineChart












