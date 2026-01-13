import React from 'react'
import Chart from 'react-apexcharts'

const BarChartApex = ({ data, labels, colors, height = 180, isDark = false }) => {
  const total = data.reduce((sum, val) => sum + val, 0)

  // If there is no data, show a message
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: `${height}px` }}>
        <div className={`text-sm ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
          No data available
        </div>
      </div>
    )
  }

  const options = {
    colors: colors || ['#465fff', '#a78bfa'],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      height: height,
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
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 5,
        borderRadiusApplication: 'end',
        distributed: true, // Enable distributed colors so each bar gets its own color
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
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
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
      borderColor: isDark ? '#334155' : '#E5E7EB',
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val) => `${val}`,
      },
    },
    legend: {
      show: false,
    },
  }

  const series = [
    {
      name: 'Value',
      data: data || [],
    },
  ]

  return (
    <div className="w-full">
      <Chart options={options} series={series} type="bar" height={height} />
    </div>
  )
}

export default BarChartApex

