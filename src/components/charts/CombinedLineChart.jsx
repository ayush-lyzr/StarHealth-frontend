import { useState, useRef } from 'react'

const CombinedLineChart = ({ 
  data, 
  labels, 
  height = 300,
  onMetricToggle,
  isDark = false
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [visibleMetrics, setVisibleMetrics] = useState({
    recommendations: true,
    salesPitches: true,
    feedback: true
  })
  const containerRef = useRef(null)

  const colors = {
    recommendations: '#10B981', // Green - Product Recommendation
    salesPitches: '#8B5CF6', // Purple - Sales Pitch
    feedback: '#F59E0B' // Orange - With Feedback
  }

  // Ensure data arrays exist and have values
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : []
  const salesPitches = Array.isArray(data.salesPitches) ? data.salesPitches : []
  const feedback = Array.isArray(data.feedback) ? data.feedback : []
  
  // Calculate max value, ensuring at least 10 for proper scaling
  const allValues = [...recommendations, ...salesPitches, ...feedback]
  const rawMaxValue = Math.max(...allValues, 0)
  // Round up to nearest 5 for cleaner Y-axis labels
  const maxValue = Math.max(Math.ceil(rawMaxValue / 5) * 5, 10)
  const minValue = 0
  const range = maxValue - minValue || 10
  const pointCount = Math.max(labels.length, 1)
  const pointSpacing = pointCount > 1 ? 100 / (pointCount - 1) : 100

  // Generate points for each metric
  const generatePoints = (values) => {
    return values.map((value, index) => {
      const x = index * pointSpacing
      // Y position: 0 at bottom, maxValue at top
      // Reserve 10% at top (y=0-10) and 15% at bottom (y=85-100) for labels
      // Chart area: y=10 to y=85 (75 units)
      const y = 10 + (75 * (1 - (value - minValue) / range))
      return { x, y, value }
    })
  }

  const recPoints = generatePoints(recommendations)
  const salesPoints = generatePoints(salesPitches)
  const feedbackPoints = generatePoints(feedback)

  // Generate smooth path using high-tension spline (monotone/catmullRom) for wave-like curves
  const generateSmoothPath = (points) => {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
    
    // Use Catmull-Rom spline with tension = 0.4 for smooth, wave-like curves
    let path = `M ${points[0].x} ${points[0].y}`
    const tension = 0.4
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(points.length - 1, i + 2)]
      
      // Catmull-Rom spline with tension for smooth waves (hills and valleys)
      const cp1x = p1.x + (p2.x - p0.x) * tension / 3
      const cp1y = p1.y + (p2.y - p0.y) * tension / 3
      const cp2x = p2.x - (p3.x - p1.x) * tension / 3
      const cp2y = p2.y - (p3.y - p1.y) * tension / 3
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }
    
    // Ensure path ends at the rightmost point (x=100) for proper area fill closing
    const lastPoint = points[points.length - 1]
    if (lastPoint && lastPoint.x < 100) {
      path += ` L 100 ${lastPoint.y}`
    }
    
    return path
  }

  const recPath = generateSmoothPath(recPoints)
  const salesPath = generateSmoothPath(salesPoints)
  const feedbackPath = generateSmoothPath(feedbackPoints)

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    
    // Find closest point
    let closestIndex = 0
    let minDistance = Infinity
    
    recPoints.forEach((point, index) => {
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

  const toggleMetric = (metric) => {
    const newVisibility = {
      ...visibleMetrics,
      [metric]: !visibleMetrics[metric]
    }
    setVisibleMetrics(newVisibility)
    if (onMetricToggle) {
      onMetricToggle(newVisibility)
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {[
          { key: 'recommendations', label: 'Product Recommendation', color: colors.recommendations },
          { key: 'salesPitches', label: 'Sales Pitch', color: colors.salesPitches },
          { key: 'feedback', label: 'With Feedback', color: colors.feedback }
        ].map((metric) => (
          <button
            key={metric.key}
            onClick={() => toggleMetric(metric.key)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-[#111827] hover:scale-105 hover:shadow-md cursor-pointer group/legend"
            style={{
              opacity: visibleMetrics[metric.key] ? 1 : 0.35
            }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full transition-all duration-200"
              style={{
                backgroundColor: metric.color
              }}
            />
            <span className={`text-[12px] font-medium ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'} group-hover/legend:font-bold transition-all duration-200`}>
              {metric.label}
            </span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div 
        ref={containerRef}
        className={`w-full relative flex-1 ${isDark ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-gray-100'} rounded-[12px] border p-4 animate-fadeIn`}
        style={{ height: '100%', minHeight: `${height}px`, overflow: 'visible' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full" 
          preserveAspectRatio="none"
          style={{ 
            background: isDark ? 'transparent' : '#FFFFFF',
            display: 'block',
            width: '100%',
            height: `${height - 80}px` // Account for padding and X-axis labels
          }}
        >
          {/* Gradient Definitions - Vertical fade from 50% opacity at top to 0% at bottom */}
          <defs>
            <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity="0.5"/>
              <stop offset="95%" stopColor="#10B981" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="gradientPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity="0.5"/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="gradientOrange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity="0.5"/>
              <stop offset="95%" stopColor="#F59E0B" stopOpacity="0"/>
            </linearGradient>
          </defs>
          
          {/* Y-axis labels - Show evenly spaced values (0, 25%, 50%, 75%, 100% of maxValue) */}
          {/* Y positions: 0 at bottom (y=85), maxValue at top (y=10) */}
          {/* Reserve 10% at top (y=0-10) and 15% at bottom (y=85-100) for labels */}
          {/* Chart area: y=10 to y=85 (75 units) */}
          {[0, 25, 50, 75, 100].map((yPercent) => {
            // Calculate value: 0% = 0 (bottom), 100% = maxValue (top)
            const value = Math.round((yPercent / 100) * maxValue)
            // Map yPercent to actual Y position: 0% -> 85 (bottom), 100% -> 10 (top)
            const yPosition = 10 + (75 * (1 - yPercent / 100))
            
            // Show labels at all positions
            return (
              <text
                key={`y-${yPercent}`}
                x="2"
                y={yPosition}
                fontSize="2.5"
                fill={isDark ? "#6B7280" : "#9CA3AF"}
                textAnchor="start"
                dominantBaseline="middle"
              >
                {value}
              </text>
            )
          })}
          
          {/* Horizontal grid lines only - dashed, very faint */}
          {/* Map grid lines to chart area: 10% top margin, 15% bottom margin */}
          {/* Chart area: y=10 to y=85 */}
          {[25, 50, 75].map((yPercent) => {
            const yPosition = 10 + (75 * (1 - yPercent / 100))
            return (
              <line
                key={`grid-${yPercent}`}
                x1="5"
                y1={yPosition}
                x2="100"
                y2={yPosition}
                stroke={isDark ? "#334155" : "#E5E7EB"}
                strokeWidth="0.15"
                strokeDasharray="4 4"
                opacity={isDark ? "0.5" : "0.6"}
              />
            )
          })}
          
          {/* Area fills with vertical gradient fade (50% top to 0% bottom) */}
          {/* Bottom of chart area is at y=85, fill to y=85 */}
          {visibleMetrics.recommendations && recPoints.length > 0 && (
            <path
              d={`${recPath} L ${recPoints[recPoints.length - 1]?.x || 100} 85 L 0 85 Z`}
              fill="url(#gradientGreen)"
              className="transition-opacity duration-200"
              style={{
                opacity: visibleMetrics.recommendations ? 1 : 0
              }}
            />
          )}
          {visibleMetrics.salesPitches && salesPoints.length > 0 && (
            <path
              d={`${salesPath} L ${salesPoints[salesPoints.length - 1]?.x || 100} 85 L 0 85 Z`}
              fill="url(#gradientPurple)"
              className="transition-opacity duration-200"
              style={{
                opacity: visibleMetrics.salesPitches ? 1 : 0
              }}
            />
          )}
          {visibleMetrics.feedback && feedbackPoints.length > 0 && (
            <path
              d={`${feedbackPath} L ${feedbackPoints[feedbackPoints.length - 1]?.x || 100} 85 L 0 85 Z`}
              fill="url(#gradientOrange)"
              className="transition-opacity duration-200"
              style={{
                opacity: visibleMetrics.feedback ? 1 : 0
              }}
            />
          )}
          
          {/* Lines - smooth curves (wave-like), thinner stroke */}
          {visibleMetrics.recommendations && (
            <path
              d={recPath}
              fill="none"
              stroke={colors.recommendations}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-opacity duration-200"
              style={{
                opacity: visibleMetrics.recommendations ? 1 : 0
              }}
            />
          )}
          {visibleMetrics.salesPitches && (
            <path
              d={salesPath}
              fill="none"
              stroke={colors.salesPitches}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-opacity duration-200"
              style={{
                opacity: visibleMetrics.salesPitches ? 1 : 0
              }}
            />
          )}
          {visibleMetrics.feedback && (
            <path
              d={feedbackPath}
              fill="none"
              stroke={colors.feedback}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-opacity duration-200"
              style={{
                opacity: visibleMetrics.feedback ? 1 : 0
              }}
            />
          )}
          
          {/* Hover line */}
          {hoveredIndex !== null && (
            <line
              x1={recPoints[hoveredIndex]?.x || 0}
              y1="10"
              x2={recPoints[hoveredIndex]?.x || 0}
              y2="85"
              stroke={isDark ? "#cbd5e1" : "#374151"}
              strokeWidth="0.5"
              strokeDasharray="2,2"
              opacity="0.3"
            />
          )}
          
          {/* Hover points (only visible on hover) */}
          {hoveredIndex !== null && (
            <>
              {visibleMetrics.recommendations && recPoints[hoveredIndex] && (
                <circle
                  cx={recPoints[hoveredIndex].x}
                  cy={recPoints[hoveredIndex].y}
                  r="2"
                  fill={colors.recommendations}
                  stroke="white"
                  strokeWidth="0.8"
                />
              )}
              {visibleMetrics.salesPitches && salesPoints[hoveredIndex] && (
                <circle
                  cx={salesPoints[hoveredIndex].x}
                  cy={salesPoints[hoveredIndex].y}
                  r="2"
                  fill={colors.salesPitches}
                  stroke="white"
                  strokeWidth="0.8"
                />
              )}
              {visibleMetrics.feedback && feedbackPoints[hoveredIndex] && (
                <circle
                  cx={feedbackPoints[hoveredIndex].x}
                  cy={feedbackPoints[hoveredIndex].y}
                  r="2"
                  fill={colors.feedback}
                  stroke="white"
                  strokeWidth="0.8"
                />
              )}
            </>
          )}
        </svg>
        
        {/* Custom Tooltip */}
        {hoveredIndex !== null && (
          <div
            className={`absolute z-10 ${isDark ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-gray-100'} rounded-[12px] px-4 py-3 pointer-events-none shadow-2xl animate-scaleIn backdrop-blur-sm`}
            style={{
              left: `${Math.min(Math.max(tooltipPosition.x, 50), (containerRef.current?.offsetWidth || 0) - 150)}px`,
              top: `${tooltipPosition.y - 100}px`,
              transform: 'translateX(-50%)',
              minWidth: '180px',
              animation: 'scaleIn 0.2s ease-out'
            }}
          >
            <div className={`text-sm font-semibold ${isDark ? 'text-[#FFFFFF] border-[#374151]' : 'text-[#333333] border-gray-100'} mb-3 border-b pb-2`}>
              {labels[hoveredIndex]}
            </div>
            <div className="space-y-2">
              {visibleMetrics.recommendations && (
                <div className="flex items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-dark-bg p-1 rounded transition-colors duration-200">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full shadow-sm animate-pulse-slow" 
                      style={{ backgroundColor: colors.recommendations }}
                    />
                    <span className={`text-[12px] ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>Product Recommendation</span>
                  </div>
                  <span className={`text-sm font-bold ${isDark ? 'text-[#FFFFFF]' : 'text-[#333333]'} transition-transform duration-200 hover:scale-110 inline-block`}>
                    {data.recommendations[hoveredIndex]}
                  </span>
                </div>
              )}
              {visibleMetrics.salesPitches && (
                <div className="flex items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-[#111827] p-1 rounded transition-colors duration-200">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full shadow-sm animate-pulse-slow" 
                      style={{ backgroundColor: colors.salesPitches }}
                    />
                    <span className={`text-[12px] ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>Sales Pitch</span>
                  </div>
                  <span className={`text-sm font-bold ${isDark ? 'text-[#FFFFFF]' : 'text-[#333333]'} transition-transform duration-200 hover:scale-110 inline-block`}>
                    {data.salesPitches[hoveredIndex]}
                  </span>
                </div>
              )}
              {visibleMetrics.feedback && (
                <div className="flex items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-[#111827] p-1 rounded transition-colors duration-200">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full shadow-sm animate-pulse-slow" 
                      style={{ backgroundColor: colors.feedback }}
                    />
                    <span className={`text-[12px] ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>Feedback</span>
                  </div>
                  <span className={`text-sm font-bold ${isDark ? 'text-[#FFFFFF]' : 'text-[#333333]'} transition-transform duration-200 hover:scale-110 inline-block`}>
                    {data.feedback[hoveredIndex]}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* X-axis labels - positioned at bottom of container, visible and properly spaced */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-between px-4" style={{ paddingBottom: '8px', height: '40px' }}>
          {labels.map((label, index) => (
            <span 
              key={index} 
              className={`text-[11px] ${isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'} transition-all duration-200 ${
                hoveredIndex === index ? `font-semibold ${isDark ? 'text-[#FFFFFF]' : 'text-[#333333]'}` : ''
              }`}
              style={{ 
                flex: '1',
                textAlign: index === 0 ? 'left' : index === labels.length - 1 ? 'right' : 'center',
                overflow: 'visible',
                whiteSpace: 'nowrap'
              }}
              title={label}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CombinedLineChart

