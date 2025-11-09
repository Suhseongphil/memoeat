# 📝 MemoEat

> **정보를 먹다, 지식을 소화하다**  
> 폴더 기반 지식 관리를 지원하는 스마트 메모 애플리케이션

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
🌐 **Website**: [memoeat.com](https://memoeat.com) (Coming Soon)

---

## 🎯 프로젝트 개요

**MemoEat**는 폴더 기반 메모 관리와 자동 저장에 집중한 스마트 메모 애플리케이션입니다.

### 핵심 가치

- 🧠 **집중력 있는 편집 경험**: 필요한 형식을 즉시 적용하며 흐름을 유지
- 📁 **Windows 탐색기 스타일 폴더 구조**: 익숙하고 직관적인 관리
- ⚡ **자동 저장**: 별도의 저장 버튼 없이 실시간 자동 저장
- 🌙 **다크모드 지원**: 눈의 피로를 줄이는 세련된 UI
- 🚀 **가볍고 빠름**: 최소한의 기능으로 최대의 효율

---

## ✨ 주요 기능

### 1️⃣ 폴더 구조 관리

- Windows 탐색기 스타일의 폴더 트리
- 드래그 앤 드롭으로 메모/폴더 이동
- 폴더 생성/이름 변경/삭제
- 무제한 중첩 폴더 지원

### 2️⃣ 스마트 메모 편집

- CodeMirror 기반 고성능 에디터
- 자동 저장 (타이핑 후 2초 대기)
- Undo/Redo 지원
- 저장 상태 실시간 표시

### 3️⃣ 추가 기능

- ⭐ 즐겨찾기
- 🔍 메모 검색 (제목/내용)
- 📤 메모 공유 (TXT 다운로드, 카카오톡)
- 🌓 다크모드

---

## 🛠 기술 스택

### Frontend

- **React 18** + **Vite** - 빠른 개발 환경
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **CodeMirror 6** - 고성능 텍스트 에디터
- **@dnd-kit** - 드래그 앤 드롭
- **React Query** - 서버 상태 관리
- **React Hot Toast** - 알림

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
│   │   ├── sidebar/        # 사이드바, 폴더 트리
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
│   │   └── folders.js
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

### folders (JSONB 기반)

```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  data JSONB NOT NULL,
  -- data: { name, parent_id, created_at, updated_at, order }
  created_at TIMESTAMP DEFAULT NOW()
);
```

### notes (JSONB 기반)

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  data JSONB NOT NULL,
  -- data: { title, content, folder_id, is_favorite, created_at, updated_at }
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
