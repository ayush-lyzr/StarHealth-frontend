/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light Mode Colors
        light: {
          bg: '#F3F4F6',
          card: '#FFFFFF',
          textPrimary: '#333333',
          textSecondary: '#6B7280',
          textTertiary: '#9CA3AF',
        },
        // Dark Mode Colors
        dark: {
          bg: '#111827',
          card: '#1F2937',
          textPrimary: '#FFFFFF',
          textSecondary: '#9CA3AF',
          border: '#374151',
        },
        // Chart Colors (same for both modes)
        chart: {
          green: '#10B981',
          purple: '#8B5CF6',
          orange: '#F59E0B',
          blue: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      }
    },
  },
  plugins: [],
}


