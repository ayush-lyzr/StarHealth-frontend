import { useState, useRef } from 'react'

const InteractiveLineChart = ({ data, labels, color = '#3b82f6', height = 200 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const svgRef = useRef(null)
  const containerRef = useRef(null)

  const maxValue = Math.max(...data, 1)
  const minValue = Math.min(...data, 0)
  const range = maxValue - minValue || 1
  const pointCount = data.length
  const pointSpacing = 100 / (pointCount - 1 || 1)

  // Generate path for line
  const points = data.map((value, index) => {
    const x = index * pointSpacing
    const y = 100 - ((value - minValue) / range) * 80 - 10
    return { x, y, value, label: labels[index] }
  })

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    
    // Find closest point
    let closestIndex = 0
    let minDistance = Infinity
    
    points.forEach((point, index) => {
      const distance = Math.abs(point.x - x)
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = index
      }
    })
    
    setHoveredIndex(closestIndex)
    setTooltipPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  }

  return (
    <div 
      ref={containerRef}
      className="w-full relative" 
      style={{ height: `${height}px` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg 
        ref={svgRef}
        viewBox="0 0 100 100" 
        className="w-full h-full" 
        preserveAspectRatio="none"
      >
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
          className="transition-opacity duration-200"
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          className="transition-all duration-300"
        />
        
        {/* Hover line */}
        {hoveredIndex !== null && (
          <line
            x1={points[hoveredIndex].x}
            y1="0"
            x2={points[hoveredIndex].x}
            y2="100"
            stroke={color}
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.5"
          />
        )}
        
        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? "3" : "2"}
              fill={color}
              stroke="white"
              strokeWidth={hoveredIndex === index ? "2" : "1"}
              className="transition-all duration-200 cursor-pointer"
              style={{
                filter: hoveredIndex === index ? 'drop-shadow(0 0 4px ' + color + ')' : 'none'
              }}
            />
            {hoveredIndex === index && (
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill={color}
                fillOpacity="0.2"
                className="animate-ping"
              />
            )}
          </g>
        ))}
      </svg>
      
      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="absolute z-10 bg-gray-900 text-white text-xs rounded-lg shadow-xl px-3 py-2 pointer-events-none"
          style={{
            left: `${Math.min(tooltipPosition.x, containerRef.current?.offsetWidth - 100 || 0)}px`,
            top: `${tooltipPosition.y - 60}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-semibold mb-1">{points[hoveredIndex].label}</div>
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: color }}
            ></div>
            <span className="font-bold">{points[hoveredIndex].value}</span>
          </div>
        </div>
      )}
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        {labels.map((label, index) => (
          <span 
            key={index} 
            className={`text-center flex-1 truncate transition-all duration-200 ${
              hoveredIndex === index ? 'font-bold text-gray-900 scale-110' : ''
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default InteractiveLineChart












