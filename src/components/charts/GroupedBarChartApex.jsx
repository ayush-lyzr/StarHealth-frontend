import React from 'react'
import Chart from 'react-apexcharts'

const GroupedBarChartApex = ({ data1, data2, labels, colors, height = 380, isDark = false, label1 = 'Series 1', label2 = 'Series 2' }) => {
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

  const options = {
    colors: colors || ['#3B82F6', '#F97316'], // Blue for Product Recommendation, Orange for Sales Pitch
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      height: height,
      toolbar: {
        show: false,
      },
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 5,
        borderRadiusApplication: 'end',
        dataLabels: {
          position: 'top',
        },
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
        formatter: (val) => {
          return val.toFixed(0)
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
    },
    {
      name: label2,
      data: data2 || [],
    },
  ]

  return (
    <div className="w-full">
      <Chart options={options} series={series} type="bar" height={height} />
    </div>
  )
}

export default GroupedBarChartApex

