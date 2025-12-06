# 📝 MemoEat

> **정보를 먹다, 지식을 소화하다**  
> 단순하고 빠른 메모 작성에 집중한 스마트 메모 애플리케이션

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
🌐 **Website**: [memoeat.com](https://memoeat.com) (Coming Soon)

---

## 🎯 프로젝트 개요

**MemoEat**는 단순하고 빠른 메모 작성에 집중한 스마트 메모 애플리케이션입니다.

### 핵심 가치

- 🧠 **집중력 있는 편집 경험**: 필요한 형식을 즉시 적용하며 흐름을 유지
- ⚡ **자동 저장**: 별도의 저장 버튼 없이 실시간 자동 저장
- 🌙 **다크모드 지원**: 눈의 피로를 줄이는 세련된 UI
- 🚀 **가볍고 빠름**: 최소한의 기능으로 최대의 효율
- 📝 **단순함**: 복잡한 구조 없이 메모 작성에만 집중

---

## ✨ 주요 기능

### 1️⃣ 스마트 메모 편집

- Tiptap 기반 리치 텍스트 에디터
- 자동 저장 (타이핑 후 2초 대기)
- Undo/Redo 지원
- 저장 상태 실시간 표시

### 2️⃣ 메모 관리

- 📝 메모 생성, 수정, 삭제
- ⭐ 즐겨찾기
- 🔍 메모 검색 (제목/내용)
- 📋 메모 순서 변경 (드래그 앤 드롭)
- 🗑️ 휴지통 (30일 보관 후 자동 삭제)

### 3️⃣ 추가 기능

- 🌓 다크모드
- 📱 반응형 디자인 (모바일/데스크톱)
- ⚡ 빠른 성능

---

## 🛠 기술 스택

### Frontend

- **React 18** + **Vite** - 빠른 개발 환경
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Tiptap** - 리치 텍스트 에디터
- **React Query** - 서버 상태 관리
- **React Hot Toast** - 알림
- **Zustand** - 클라이언트 상태 관리

### Backend & Database

- **Supabase** - PostgreSQL + 인증 + RLS
  - JSONB 컬럼으로 NoSQL처럼 유연하게 활용

### Hosting & Deployment

- **Vercel** - 프론트엔드 + Serverless Functions
- **Supabase Cloud** - 데이터베이스 + 인증
- **Domain**: memoeat.com (가비아)

---

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.x 이상
- npm 또는 yarn
- Git

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/yourusername/memoeat.git
cd memoeat

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 필요한 값 입력

# 4. 개발 서버 실행
npm run dev

# 5. 브라우저에서 http://localhost:5173 접속
```

### 환경 변수 (.env.local)

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_VITE_SUPABASE_ANON_KEY

# 관리자 이메일 (최초 가입자 자동 승인용)
VITE_ADMIN_EMAIL=admin@example.com
```

---

## 📁 프로젝트 구조

```
memoeat/
├── src/
│   ├── components/         # 재사용 컴포넌트
│   │   ├── auth/           # 로그인, 회원가입
│   │   ├── editor/         # 에디터 컴포넌트
│   │   ├── sidebar/        # 사이드바, 메모 리스트
│   │   └── common/         # 공통 UI (버튼, 모달 등)
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── LoginPage.jsx
│   │   ├── SignUpPage.jsx
│   │   ├── MainPage.jsx
│   │   └── AdminPage.jsx
│   ├── hooks/              # 커스텀 훅
│   ├── services/           # API 호출 로직
│   │   ├── supabase.js
│   │   ├── notes.js
│   │   └── preferences.js
│   ├── utils/              # 유틸리티 함수
│   ├── styles/             # 글로벌 스타일
│   └── App.jsx
├── public/
├── .env.example
├── .env.local
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 🗄️ 데이터베이스 스키마

### user_approvals (관리자 승인)

```sql
CREATE TABLE user_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  email TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES auth.users(id)
);
```

### notes (JSONB 기반)

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  data JSONB NOT NULL,
  -- data: { title, content, is_favorite, order, created_at, updated_at }
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- 소프트 삭제용
);
```

### user_preferences (사용자 설정)

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  theme TEXT DEFAULT 'light', -- 'light' | 'dark'
  sidebar_position TEXT DEFAULT 'left', -- 'left' | 'right'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🤝 기여하기

현재는 개인 프로젝트로 진행 중이며, 베타 테스트 이후 기여 가이드를 추가할 예정입니다.

---

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

## 📧 문의

- **Email**: karlly980404@gmail.com
- **Website**: [memoeat.com](https://memoeat.com)

---

## 🙏 감사의 말

- [Supabase](https://supabase.com/) - 백엔드 인프라
- [Vercel](https://vercel.com/) - 호스팅

---

**Made with ❤️ and 🍴 (Eat!)**

> "정보를 먹고, 지식을 소화하라" - MemoEat
