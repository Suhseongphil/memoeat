/**
 * 애플리케이션 테마 설정
 * 기본 테마와 다크 테마만 제공
 */

export const THEMES = {
  DEFAULT: {
    id: 'default',
    name: '기본',
    description: '깔끔한 하얀색 베이스',
    preview: {
      background: '#FFFFFF',
      text: '#111827',
      accent: '#3B82F6'
    }
  },
  DARK: {
    id: 'dark',
    name: '다크',
    description: '모던한 검은색 테마',
    preview: {
      background: '#1E1E1E',
      text: '#E0E0E0',
      accent: '#4A9EFF'
    }
  }
}

// 테마 배열 (순서대로 표시)
export const THEME_LIST = [
  THEMES.DEFAULT,
  THEMES.DARK
]

// 테마 ID로 테마 객체 찾기
export const getThemeById = (themeId) => {
  return THEME_LIST.find(theme => theme.id === themeId) || THEMES.DEFAULT
}
