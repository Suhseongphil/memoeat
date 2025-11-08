/**
 * 테마 설정 및 CSS Variables 관리
 *
 * 이 파일에서 라이트/다크 모드의 모든 색상을 중앙 집중식으로 관리합니다.
 * CSS Variables를 사용하여 테마를 적용하므로 React 리렌더링 없이 빠르게 변경됩니다.
 */

export const themes = {
  light: {
    // Primary colors (Amber)
    '--color-primary': '#f59e0b',
    '--color-primary-hover': '#d97706',
    '--color-primary-light': '#fef3c7',
    '--color-primary-dark': '#b45309',

    // Background colors
    '--color-bg-primary': '#ffffff',
    '--color-bg-secondary': '#f9fafb',
    '--color-bg-tertiary': '#f3f4f6',

    // Text colors
    '--color-text-primary': '#000000',
    '--color-text-secondary': '#4b5563',
    '--color-text-tertiary': '#6b7280',

    // Border colors
    '--color-border-primary': '#e5e7eb',
    '--color-border-secondary': '#d1d5db',

    // Interactive colors
    '--color-hover-bg': '#f3f4f6',
    '--color-active-bg': '#e5e7eb',
  },
  dark: {
    // Primary colors (VSCode Blue)
    '--color-primary': '#569cd6',
    '--color-primary-hover': '#4a8cc5',
    '--color-primary-light': '#6aadd7',
    '--color-primary-dark': '#3d7ab8',

    // Background colors (VSCode Dark Theme)
    '--color-bg-primary': '#1e1e1e',
    '--color-bg-secondary': '#252526',
    '--color-bg-tertiary': '#2d2d30',

    // Text colors
    '--color-text-primary': '#cccccc',
    '--color-text-secondary': '#9d9d9d',
    '--color-text-tertiary': '#808080',

    // Border colors
    '--color-border-primary': '#3e3e42',
    '--color-border-secondary': '#2d2d30',

    // Interactive colors
    '--color-hover-bg': '#2d2d30',
    '--color-active-bg': '#3e3e42',
  }
}

/**
 * 테마를 적용하는 함수
 * @param {boolean} isDark - 다크모드 여부
 */
export const applyTheme = (isDark) => {
  const theme = isDark ? themes.dark : themes.light
  const root = document.documentElement

  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}

/**
 * 초기 테마 설정
 * localStorage에서 테마를 읽어와 적용합니다.
 */
export const initializeTheme = () => {
  const isDark = localStorage.getItem('darkMode') === 'true'
  applyTheme(isDark)

  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  return isDark
}
