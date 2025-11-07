/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 오렌지 테마 색상
        'orange-theme': {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        // 다크 테마 색상 (VSCode, Notion 스타일)
        'dark-theme': {
          bg: '#1E1E1E',          // 메인 배경
          'bg-secondary': '#252526', // 세컨더리 배경
          'bg-tertiary': '#2D2D30',  // 3차 배경
          border: '#3E3E42',       // 테두리
          text: '#E0E0E0',         // 텍스트
          'text-secondary': '#9D9D9D', // 보조 텍스트
          accent: '#4A9EFF',       // 악센트
        },
      },
    },
  },
  plugins: [],
}
