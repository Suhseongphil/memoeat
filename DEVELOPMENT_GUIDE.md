# 🛠 MemoEat 개발 가이드 (Claude Code 전용)

> **이 문서는 Claude Code를 활용한 초간결 개발 가이드입니다.**  
> 각 Phase의 핵심만 담았습니다. Claude에게 명령할 때 이 문서를 참고하세요.

---

## 📌 사용 방법

1. 각 Phase를 순서대로 진행
2. "Claude 명령" 섹션을 Claude에게 복사/붙여넣기
3. 생성된 코드 확인 및 테스트
4. README.md에서 체크박스 체크

**팁**: 구체적으로 요청할수록 좋은 결과가 나옵니다!

---

# Phase 0: 프로젝트 초기 설정

## 구현 파일
```
프로젝트 루트/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── editor/
│   │   ├── sidebar/
│   │   └── common/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   │   └── supabase.js
│   └── utils/
├── api/
│   └── summarize.js
├── .env.local
└── .env.example
```

## 핵심 작업

### 1. 프로젝트 생성
```bash
npm create vite@latest memoeat -- --template react
cd memoeat
npm install
```

### 2. Tailwind CSS 설치
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**tailwind.config.js**:
```javascript
content: ["./index.html", "./src/**/*.{js,jsx}"],
darkMode: 'class',
```

**src/index.css**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. 필수 라이브러리 설치
```bash
npm install @supabase/supabase-js @uiw/react-codemirror @codemirror/lang-markdown
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @tanstack/react-query zustand react-hot-toast react-router-dom lodash
npm install youtube-transcript axios cheerio @anthropic-ai/sdk
```

### 4. Supabase 설정
**수동 작업**:
1. https://supabase.com 에서 프로젝트 생성
2. SQL Editor에서 테이블 생성:

```sql
-- user_approvals
CREATE TABLE user_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  email TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_user_approvals_pending ON user_approvals(is_approved) WHERE is_approved = false;
ALTER TABLE user_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own approval status" ON user_approvals FOR SELECT USING (auth.uid() = user_id);

-- folders
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_folders_user ON folders(user_id);
CREATE INDEX idx_folders_data ON folders USING GIN(data);
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own folders" ON folders FOR ALL USING (auth.uid() = user_id);

-- notes
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_data ON notes USING GIN(data);
CREATE INDEX idx_notes_favorite ON notes(user_id) WHERE (data->>'is_favorite')::boolean = true;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notes" ON notes FOR ALL USING (auth.uid() = user_id);
```

3. Project URL과 Anon Key를 `.env.local`에 저장

### 5. Supabase 클라이언트
**src/services/supabase.js**:
```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
```

## Claude 명령
```
Phase 0를 시작해줘.

1. 프로젝트 폴더 구조 만들기:
src/components/{auth,editor,sidebar,common}
src/{pages,hooks,services,utils,styles}
api/

2. src/services/supabase.js 파일 만들기:
- createClient로 Supabase 초기화
- persistSession: true 설정
- 환경변수에서 URL, ANON_KEY 가져오기

3. .env.example과 .env.local 파일 만들기
4. .gitignore에 .env.local 추가
```

## 주의사항
⚠️ Supabase 테이블은 수동으로 SQL Editor에서 생성 필수
⚠️ 환경변수 설정 필수 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_EMAIL)

---

# Phase 1: 인증 시스템

## 구현 파일
- `src/pages/LoginPage.jsx` - 로그인 UI
- `src/pages/SignUpPage.jsx` - 회원가입 UI
- `src/services/auth.js` - 인증 로직
- `src/components/auth/ProtectedRoute.jsx` - 보호 라우트
- `src/components/common/DarkModeToggle.jsx` - 다크모드 토글
- `src/pages/AdminPage.jsx` - 관리자 승인 페이지
- `src/hooks/useAdmin.js` - 관리자 확인 훅
- `src/App.jsx` - Router 설정

## 핵심 로직

### 회원가입 플로우
1. `supabase.auth.signUp(email, password)`
2. `user_approvals` 테이블에 `is_approved: false` 추가
3. 즉시 `signOut()` 실행
4. "관리자 승인 대기" 메시지 표시

### 로그인 플로우
1. `supabase.auth.signInWithPassword(email, password)`
2. `user_approvals`에서 `is_approved` 확인
3. `false`면 → `signOut()` + 에러 메시지
4. `true`면 → 메인 페이지로 이동

### 관리자 승인
- 환경변수 `VITE_ADMIN_EMAIL`과 비교로 관리자 확인
- 승인 대기 목록: `user_approvals WHERE is_approved = false`
- 승인: `UPDATE user_approvals SET is_approved = true`

### JSONB 데이터 구조
```javascript
// notes.data
{
  title: "제목",
  content: "내용",
  folder_id: "uuid 또는 null",
  link_url: "https://..." 또는 null,
  link_type: "youtube" 또는 "webpage" 또는 null,
  is_favorite: false,
  created_at: "timestamp",
  updated_at: "timestamp"
}

// folders.data
{
  name: "폴더명",
  parent_id: "uuid 또는 null",
  created_at: "timestamp",
  updated_at: "timestamp",
  order: 0
}
```

## Claude 명령
```
Phase 1을 시작해줘.

1. LoginPage.jsx와 SignUpPage.jsx 만들기:
- 이메일, 비밀번호 입력 폼
- "로그인 상태 유지" 체크박스
- Tailwind CSS + 다크모드 지원
- 회원가입 시 user_approvals에 is_approved: false로 추가
- 로그인 시 is_approved 확인 후 false면 signOut

2. src/services/auth.js 만들기:
- signUp, signIn, signOut, getCurrentUser 함수
- 모두 승인 여부 확인 포함

3. ProtectedRoute.jsx 만들기:
- getCurrentUser로 인증 확인
- 로딩 중이면 스피너
- 미인증이면 /login으로 리다이렉트

4. DarkModeToggle.jsx 만들기:
- localStorage에 darkMode 저장
- document.documentElement.classList에 'dark' 추가/제거

5. AdminPage.jsx 만들기:
- user_approvals 테이블에서 승인 대기/승인 완료 목록 표시
- 승인/거절 버튼
- useAdmin 훅으로 관리자만 접근 가능

6. src/App.jsx 수정:
- React Router 설정
- /login, /signup: 공개
- /, /admin: ProtectedRoute로 보호
- Toaster 추가
```

## 주의사항
⚠️ 승인 확인 로직 필수 (로그인, 페이지 로드 시 모두)
⚠️ 관리자 이메일 환경변수 설정 필수
⚠️ persistSession: true로 자동 로그인 활성화

---

# Phase 2: 메모 CRUD

## 구현 파일
- `src/pages/MainPage.jsx` - Header + Sidebar + Editor 레이아웃
- `src/components/common/Header.jsx` - 헤더
- `src/components/sidebar/Sidebar.jsx` - 사이드바
- `src/components/sidebar/NoteList.jsx` - 메모 목록
- `src/components/editor/Editor.jsx` - CodeMirror 에디터
- `src/services/notes.js` - 메모 CRUD API

## 핵심 로직

### 메모 CRUD
**Create**: `supabase.from('notes').insert({ user_id, data: { title, content, ... } })`
**Read**: `supabase.from('notes').select('*').eq('user_id', userId)`
**Update**: `supabase.from('notes').update({ data: updatedData }).eq('id', noteId)`
**Delete**: `supabase.from('notes').delete().eq('id', noteId)`

### 자동 저장
- `lodash.debounce(saveFunction, 2000)` 사용
- 타이핑 후 2초 대기 후 저장
- 저장 상태 표시: "저장 중..." → "저장됨"

### 레이아웃
```
┌─────────────────────────────────────┐
│  Header (로고, 다크모드, 로그아웃)  │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │   Editor                 │
│ (메모    │   (CodeMirror)           │
│  목록)   │                          │
│          │                          │
└──────────┴──────────────────────────┘
```

## Claude 명령
```
Phase 2를 시작해줘.

1. MainPage를 Header + Sidebar + Editor 레이아웃으로 만들기:
- useState로 selectedNote 관리
- 반응형 (모바일에서 사이드바 토글)

2. Header.jsx 만들기:
- 로고, 다크모드 토글, 로그아웃 버튼
- 모바일 사이드바 토글 버튼

3. Sidebar.jsx 만들기:
- 새 메모 버튼
- NoteList 컴포넌트로 메모 목록 표시
- 선택된 메모 하이라이트

4. Editor.jsx 만들기:
- @uiw/react-codemirror 사용
- 제목 입력 필드 + 에디터
- lodash debounce로 2초 후 자동 저장
- 저장 상태 표시

5. src/services/notes.js 만들기:
- createNote, getNotes, updateNote, deleteNote 함수
- JSONB data 구조 사용
```

## 주의사항
⚠️ JSONB 구조로 저장 (data 컬럼에 전체 메모 데이터)
⚠️ debounce로 과도한 DB 쓰기 방지
⚠️ CodeMirror 기본 Undo/Redo 기능 활용

---

# Phase 3: 폴더 관리

## 구현 파일
- `src/components/sidebar/FolderTree.jsx` - 폴더 트리 (재귀)
- `src/services/folders.js` - 폴더 CRUD API
- `src/hooks/useDragDrop.js` - 드래그앤드롭 로직

## 핵심 로직

### 폴더 트리 구조
- 재귀 컴포넌트로 무한 중첩 폴더 표시
- `parent_id`로 부모-자식 관계 표현
- 클라이언트에서 트리 구조로 변환

### 드래그 앤 드롭
- `@dnd-kit/core`, `@dnd-kit/sortable` 사용
- 메모를 폴더로 드래그: `folder_id` 업데이트
- 폴더를 폴더로 드래그: `parent_id` 업데이트
- 순환 참조 방지 로직 필수

### 폴더 CRUD
**Create**: `data: { name: "새 폴더", parent_id: null, order: 0 }`
**Update**: 이름 변경, parent_id 변경
**Delete**: 하위 메모/폴더 처리 (CASCADE 또는 이동)

## Claude 명령
```
Phase 3을 시작해줘.

1. FolderTree.jsx 만들기:
- 재귀 컴포넌트로 폴더 트리 렌더링
- 확장/축소 아이콘
- 우클릭 메뉴 (이름 변경, 삭제)
- 폴더 클릭 시 해당 폴더의 메모만 표시

2. @dnd-kit 설정:
- DndContext로 Sidebar 감싸기
- 메모를 폴더로 드래그 가능
- 폴더를 다른 폴더로 드래그 가능
- 순환 참조 방지 (폴더를 자기 자식으로 이동 불가)

3. src/services/folders.js 만들기:
- createFolder, getFolders, updateFolder, deleteFolder
- buildFolderTree 함수 (flat 배열 → 트리 구조)

4. Sidebar에 통합:
- 폴더 트리 상단 표시
- 선택된 폴더의 메모만 필터링
```

## 주의사항
⚠️ 순환 참조 방지 (부모를 자식의 자식으로 이동 불가)
⚠️ 폴더 삭제 시 하위 항목 처리 확인
⚠️ localStorage에 폴더 확장 상태 저장

---

# Phase 4: 링크 요약 (Claude API)

## 구현 파일
- `api/summarize.js` - Vercel Serverless Function
- `src/components/editor/LinkModal.jsx` - 링크 입력 모달
- `src/services/summarize.js` - 프론트엔드 API 호출

## 핵심 로직

### 링크 타입 감지
```javascript
if (url.includes('youtube.com') || url.includes('youtu.be')) {
  return 'youtube';
} else {
  return 'webpage';
}
```

### 유튜브 자막 추출
```javascript
import { YoutubeTranscript } from 'youtube-transcript';
const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ko' });
const text = transcript.map(item => item.text).join(' ');
```

### 웹페이지 크롤링
```javascript
import axios from 'axios';
import * as cheerio from 'cheerio';
const response = await axios.get(url);
const $ = cheerio.load(response.data);
$('script, style, nav, footer').remove();
const text = $('body').text();
```

### Claude API 프롬프트
**유튜브**:
```
다음 유튜브 영상 자막을 요약해줘.
요리 영상이면: 재료 목록, 조리 순서
다른 주제면: 핵심 포인트 3-5개
```

**웹페이지**:
```
다음 웹페이지를 핵심 포인트 위주로 요약해줘.
```

## Claude 명령
```
Phase 4를 시작해줘.

1. api/summarize.js 만들기:
- POST 요청 받기
- URL에서 유튜브/웹 구분
- 유튜브: youtube-transcript로 자막 추출
- 웹페이지: axios + cheerio로 크롤링
- Claude API로 요약 (링크 타입별 프롬프트)
- CORS 설정

2. LinkModal.jsx 만들기:
- URL 입력 필드
- "요약하기" 버튼
- 로딩 상태 (유튜브 영상 분석 중... / 웹페이지 분석 중...)
- 요약 완료 후 에디터에 삽입

3. Editor에 통합:
- "링크 요약" 버튼 추가
- 모달 열기
- 요약 결과를 현재 커서 위치에 삽입
- link_url, link_type을 data에 저장
```

## 주의사항
⚠️ ANTHROPIC_API_KEY 환경변수 필수
⚠️ 자막 없는 유튜브 영상 에러 처리
⚠️ 크롤링 실패 시 에러 메시지
⚠️ 텍스트 길이 제한 (Claude API 토큰 제한)

---

# Phase 5: 추가 기능

## 구현 파일
- `src/components/sidebar/SearchBar.jsx` - 검색
- `src/hooks/useFavorite.js` - 즐겨찾기 로직
- `src/utils/export.js` - TXT 다운로드
- Kakao SDK 연동

## 핵심 기능

### 즐겨찾기
- 별 아이콘 클릭 → `data.is_favorite` 토글
- 사이드바에 "즐겨찾기" 필터 버튼
- `WHERE (data->>'is_favorite')::boolean = true`

### 검색
- 제목/내용 검색: `.or('data->>title.ilike.%keyword%,data->>content.ilike.%keyword%')`
- 실시간 검색 (debounce 500ms)
- 검색 결과 하이라이팅

### TXT 다운로드
```javascript
const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `${title}.txt`;
a.click();
```

### 카카오톡 공유
```javascript
window.Kakao.Link.sendDefault({
  objectType: 'text',
  text: content.substring(0, 200),
  link: { webUrl: window.location.href }
});
```

## Claude 명령
```
Phase 5를 시작해줘.

1. 즐겨찾기 기능:
- 메모 제목 옆에 별 아이콘
- 클릭 시 is_favorite 토글
- 사이드바에 "즐겨찾기" 필터

2. 검색 기능:
- 사이드바 상단에 검색 입력
- 제목/내용 검색
- lodash debounce 500ms

3. TXT 다운로드:
- Editor에 "다운로드" 버튼
- Blob으로 파일 생성

4. 카카오톡 공유:
- Kakao SDK 초기화 (VITE_KAKAO_APP_KEY)
- "카카오톡 공유" 버튼
```

## 주의사항
⚠️ JSONB 쿼리: `->>` 연산자 사용
⚠️ Kakao Developers에서 앱 등록 필수
⚠️ 검색 인덱스 활용 (GIN 인덱스)

---

# Phase 6: UI/UX 개선

## 구현 파일
- 다크모드 전체 적용
- 반응형 디자인
- 애니메이션
- 키보드 단축키

## 핵심 작업

### 다크모드
- 모든 컴포넌트에 `dark:` 클래스 추가
- 색상 일관성 유지

### 반응형
- 모바일: 사이드바 토글 (오버레이)
- 태블릿: 좁은 사이드바
- 데스크톱: 전체 레이아웃

### 애니메이션
- 폴더 확장/축소: `transition-all duration-200`
- 드래그앤드롭: 드래그 중 opacity 변경
- 토스트 알림

### 키보드 단축키
- Ctrl+N: 새 메모
- Ctrl+F: 검색 포커스
- Ctrl+S: 수동 저장
- Esc: 모달 닫기

## Claude 명령
```
Phase 6을 시작해줘.

1. 모든 컴포넌트에 dark: 클래스 추가
2. 반응형 디자인 개선 (모바일, 태블릿, 데스크톱)
3. 애니메이션 추가 (폴더, 드래그, 토스트)
4. 키보드 단축키 구현 (useEffect에서 keydown 이벤트)
```

---

# Phase 7: 성능 최적화

## 핵심 작업

### 코드 분할
- React.lazy() + Suspense
- 라우트별 코드 스플리팅

### 데이터 최적화
- React Query 캐싱 (`staleTime: 5분`)
- Optimistic Updates
- 필요한 컬럼만 select

### 렌더링 최적화
- React.memo
- useMemo, useCallback
- Virtual List (메모 많을 때)

## Claude 명령
```
Phase 7을 시작해줘.

1. React.lazy로 페이지 컴포넌트 분할
2. React Query 설정 (staleTime, cacheTime)
3. 자주 리렌더되는 컴포넌트에 React.memo
4. useMemo, useCallback 적용
```

---

# Phase 8: 배포

## 핵심 작업

### Vercel 배포
1. GitHub에 푸시
2. Vercel에서 Import Project
3. 환경 변수 설정
4. Deploy

### 도메인 연결
1. 가비아에서 memoeat.com 구매
2. DNS 설정: Vercel nameservers
3. Vercel에서 도메인 추가

### 테스트
- 기능 테스트 (회원가입 → 승인 → 로그인 → 메모 작성)
- 크로스 브라우저 테스트
- 모바일 테스트

## Claude 명령
```
Phase 8을 시작해줘.

1. package.json에 "build": "vite build" 확인
2. vercel.json 파일 만들기 (Serverless Functions 설정)
3. .env 변수들이 Vercel Dashboard에 설정되었는지 확인 목록 작성
```

---

# Phase 9: 베타 테스트 & 개선

## 핵심 작업

### 베타 테스트
- 지인 5-10명 초대
- Google Forms로 피드백 수집
- 버그 리포트 수집

### 개선
- Critical 버그 즉시 수정
- High 우선순위 기능 추가
- UI/UX 개선

## Claude 명령
```
피드백을 받았어. 다음 문제를 수정해줘:
1. [버그 설명]
2. [기능 요청]
3. [UI 개선]
```

---

# Phase 10: 향후 확장

## 미래 기능
- 이미지 삽입 (Supabase Storage)
- 마크다운 미리보기
- 협업 기능 (메모 공유)
- 음성 메모 (Whisper API)
- AI 자동 태그
- React Native 모바일 앱

---

## 🚨 자주 하는 실수

1. **Supabase RLS 미설정** → 다른 사용자 데이터 접근 가능
2. **승인 확인 누락** → 미승인 사용자 로그인 가능
3. **JSONB 쿼리 오류** → `->>` 연산자 사용 필수
4. **환경변수 미설정** → undefined 에러
5. **순환 참조** → 폴더 무한 루프
6. **자동 저장 미적용** → 데이터 손실

---

## 💡 빠른 참고

### Supabase JSONB 쿼리
```javascript
// 읽기
.select('data->>title, data->>content')

// 검색
.ilike('data->>title', '%keyword%')

// 필터
.eq('data->>is_favorite', 'true')

// 업데이트
.update({ data: { ...oldData, title: 'new' } })
```

### 환경변수
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
VITE_KAKAO_APP_KEY=
VITE_ADMIN_EMAIL=
```

### Git 커밋 컨벤션
```
feat: 새 기능
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 리팩토링
test: 테스트
chore: 빌드, 설정
```

---

**개발하면서 막히면 이 가이드를 다시 보고, 구체적으로 Claude에게 요청하세요!** 🚀
