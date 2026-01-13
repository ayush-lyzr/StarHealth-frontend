const BarChart = ({ data, labels, colors, height = 200 }) => {
  const maxValue = Math.max(...data, 1)
  const barWidth = 100 / data.length
  const spacing = 2

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        {data.map((value, index) => {
          const barHeight = (value / maxValue) * 80
          const x = (index * barWidth) + spacing
          const width = barWidth - (spacing * 2)
          const y = 100 - barHeight
          const color = colors[index] || colors[0]

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={width}
                height={barHeight}
                fill={color}
                rx="2"
                className="transition-all duration-500"
              />
              <text
                x={x + width / 2}
                y={y - 2}
                textAnchor="middle"
                fontSize="3"
                fill="#374151"
                fontWeight="bold"
              >
                {value}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        {labels.map((label, index) => (
          <span key={index} className="text-center flex-1">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default BarChart












