import React from 'react'
import Chart from 'react-apexcharts'

const PieChartApex = ({ data, labels, colors, size = 200, isDark = false }) => {
  const total = data.reduce((sum, val) => sum + val, 0)

  // If there is no data, show a message
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: `${size}px` }}>
        <div className={`text-sm ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
          No data available
        </div>
      </div>
    )
  }

  const options = {
    colors: colors || ['#3B82F6', '#F97316'], // Blue for Product Recommendation, Orange for Sales Pitch
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'pie',
      width: size,
      height: size,
      toolbar: {
        show: false,
      },
      background: 'transparent',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    labels: labels || [],
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontWeight: 600,
        colors: ['#FFFFFF'],
      },
      formatter: (val, opts) => {
        return opts.w.config.series[opts.seriesIndex]
      },
    },
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '12px',
      fontFamily: 'Outfit, sans-serif',
      markers: {
        width: 8,
        height: 8,
        radius: 4,
      },
      labels: {
        colors: isDark ? '#9CA3AF' : '#6B7280',
        useSeriesColors: false,
      },
      formatter: (seriesName, opts) => {
        const value = opts.w.globals.series[opts.seriesIndex]
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
        return `${seriesName} - ${value} (${percentage}%)`
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val, opts) => {
          const percentage = ((val / total) * 100).toFixed(1)
          return `${val} (${percentage}%)`
        },
      },
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: '0%', // Make it a full pie chart, not a donut
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: size * 0.8,
            height: size * 0.8,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
  }

  const series = data || []

  return (
    <div className="w-full flex flex-col items-center">
      <Chart options={options} series={series} type="pie" width={size} height={size} />
    </div>
  )
}

export default PieChartApex

