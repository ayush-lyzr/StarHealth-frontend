import React from 'react'
import Chart from 'react-apexcharts'

const LineChartApex = ({ data1, data2, labels, colors, height = 380, isDark = false, label1 = 'Series 1', label2 = 'Series 2', chartType = 'line' }) => {
  const total1 = data1.reduce((sum, val) => sum + val, 0)
  const total2 = data2.reduce((sum, val) => sum + val, 0)

  // If there is no data, show a message
  if (total1 === 0 && total2 === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: `${height}px` }}>
        <div className={`text-sm ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
          No data available
        </div>
      </div>
    )
  }

  // Ensure colors are always set and visible
  const chartColors = colors || ['#3B82F6', '#F97316'] // Blue for Product Recommendation, Orange for Sales Pitch
  
  const options = {
    colors: chartColors,
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: chartType === 'area' ? 'area' : 'line',
      height: height,
      toolbar: {
        show: false,
      },
      background: 'transparent',
      zoom: {
        enabled: false,
      },
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
    stroke: {
      curve: 'smooth',
      width: 5, // Increased width for better visibility
      lineCap: 'round',
    },
    markers: {
      size: 6, // Add markers to make lines more visible
      strokeWidth: 2,
      strokeColors: ['#FFFFFF', '#FFFFFF'], // White border for markers
      fillColors: chartColors, // Fill with series colors
      hover: {
        size: 8,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: labels || [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#6B7280',
          fontSize: '12px',
          fontFamily: 'Outfit, sans-serif',
        },
        rotate: -45,
        rotateAlways: false,
        hideOverlappingLabels: false,
        showDuplicates: true,
        maxHeight: labels && labels.length > 15 ? 60 : undefined,
      },
    },
    yaxis: {
      title: {
        text: undefined,
      },
      labels: {
        style: {
          colors: isDark ? '#9CA3AF' : '#6B7280',
          fontSize: '12px',
          fontFamily: 'Outfit, sans-serif',
        },
        formatter: (val) => {
          return val.toFixed(0)
        },
      },
    },
    grid: {
      borderColor: isDark ? '#334155' : '#E5E7EB',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: chartType === 'area' ? 0.6 : 0.4,
        opacityTo: chartType === 'area' ? 0.2 : 0.1,
        stops: [0, 100],
        colorStops: [
          [
            {
              offset: 0,
              color: chartColors[0],
              opacity: chartType === 'area' ? 0.6 : 0.4
            },
            {
              offset: 100,
              color: chartColors[0],
              opacity: chartType === 'area' ? 0.2 : 0.1
            }
          ],
          [
            {
              offset: 0,
              color: chartColors[1],
              opacity: chartType === 'area' ? 0.6 : 0.4
            },
            {
              offset: 100,
              color: chartColors[1],
              opacity: chartType === 'area' ? 0.2 : 0.1
            }
          ]
        ],
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val) => `${val}`,
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      markers: {
        width: 8,
        height: 8,
        radius: 4,
      },
      labels: {
        colors: isDark ? '#9CA3AF' : '#6B7280',
        useSeriesColors: false,
      },
    },
  }

  const series = [
    {
      name: label1,
      data: data1 || [],
      color: chartColors[0], // Explicitly set blue for Product Recommendation
    },
    {
      name: label2,
      data: data2 || [],
      color: chartColors[1], // Explicitly set orange for Sales Pitch
    },
  ]

  return (
    <div className="w-full">
      <Chart options={options} series={series} type={chartType === 'area' ? 'area' : 'line'} height={height} />
    </div>
  )
}

export default LineChartApex

