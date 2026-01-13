const BarChartHorizontal = ({ data, labels, colors, height = 200 }) => {
  const maxValue = Math.max(...data, 1)
  const barHeight = 30
  const spacing = 12

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        {data.map((value, index) => {
          const barWidth = (value / maxValue) * 90
          const y = index * (barHeight + spacing)
          const color = colors[index] || colors[0]

          return (
            <g key={index}>
              {/* Background bar */}
              <rect
                x="0"
                y={y}
                width="100"
                height={barHeight}
                fill="#f3f4f6"
                rx="4"
              />
              {/* Value bar */}
              <rect
                x="0"
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="4"
                className="transition-all duration-500"
              />
              {/* Label */}
              <text
                x="2"
                y={y + barHeight / 2 + 1}
                fontSize="3.5"
                fill="#1f2937"
                fontWeight="600"
                dominantBaseline="middle"
              >
                {labels[index]}
              </text>
              {/* Value */}
              <text
                x={barWidth > 10 ? barWidth - 1 : barWidth + 5}
                y={y + barHeight / 2 + 1}
                fontSize="3.5"
                fill={barWidth > 10 ? "#ffffff" : "#1f2937"}
                fontWeight="bold"
                dominantBaseline="middle"
                textAnchor={barWidth > 10 ? "end" : "start"}
              >
                {value}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default BarChartHorizontal












