const PieChart = ({ data, labels, colors, size = 150, totalFeedback }) => {
  const total = totalFeedback || data.reduce((sum, val) => sum + val, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <p className="text-gray-400 text-sm">No data</p>
      </div>
    )
  }

  let currentAngle = -90
  const radius = size / 2 - 10
  const center = size / 2

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((value, index) => {
          const percentage = (value / total) * 100
          const angle = (percentage / 100) * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle

          const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180)
          const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180)
          const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180)
          const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180)

          const largeArcFlag = angle > 180 ? 1 : 0

          const pathData = [
            `M ${center} ${center}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ')

          currentAngle += angle

          return (
            <path
              key={index}
              d={pathData}
              fill={colors[index] || colors[0]}
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-200 hover:opacity-80 cursor-pointer"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>
      <div className="mt-6 space-y-2.5">
        {labels.map((label, index) => {
          const value = data[index]
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
          
          return (
            <div 
              key={index} 
              className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: colors[index] || colors[0] }}
                />
                <span className="text-sm text-gray-700 font-medium">{label}</span>
              </div>
              <span 
                className="text-sm font-bold"
                style={{ color: colors[index] || colors[0] }}
              >
                {value}
                <span className="text-xs ml-1.5 font-normal text-gray-600">
                  ({percentage}%)
                </span>
              </span>
            </div>
          )
        })}
        {/* Total Feedback row */}
        {totalFeedback && (
          <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: '#F59E0B' }}
              />
              <span className="text-sm text-gray-700 font-medium">Total Feedback</span>
            </div>
            <span className="text-sm font-bold text-amber-600">
              {totalFeedback}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default PieChart

