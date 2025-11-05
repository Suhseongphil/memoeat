# Phase 4 링크 요약 기능 테스트 가이드

Phase 4 링크 요약 기능을 직접 테스트하는 방법을 단계별로 안내합니다.

---

## 📋 **사전 준비**

### 1. Anthropic API Key 발급

1. **Anthropic Console 접속**
   - 브라우저에서 https://console.anthropic.com/ 접속

2. **계정 생성**
   - 구글 계정으로 로그인 또는 이메일로 가입
   - 이메일 인증 완료

3. **API Key 생성**
   - 좌측 메뉴에서 **"API Keys"** 클릭
   - **"Create Key"** 버튼 클릭
   - Key 이름 입력 (예: "memoeat-dev")
   - 생성된 Key 복사 (예: `sk-ant-api03-...`)
   - ⚠️ **중요**: 이 키는 다시 볼 수 없으니 안전한 곳에 저장!

4. **크레딧 확인**
   - 신규 가입 시 $5 무료 크레딧 제공
   - Settings > Billing에서 잔액 확인

---

## 🔧 **로컬 환경 설정**

### Step 1: 환경 변수 파일 생성

프로젝트 루트에 `.env.local` 파일을 열고 다음 추가:

```bash
# .env.local 파일 확인 (이미 있어야 함)
# 없으면 .env.example을 복사해서 .env.local 생성

# 기존 환경 변수들...
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_ADMIN_EMAIL=your_email

# Phase 4를 위해 추가 (아래 줄을 추가하세요)
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

**⚠️ 주의사항:**
- `your-actual-key-here` 부분을 실제 발급받은 API Key로 교체
- `VITE_` 접두사는 붙이지 않음 (서버 환경 변수)
- `.env.local`은 Git에 커밋되지 않음 (이미 .gitignore에 포함)

---

### Step 2: Vercel CLI 설치

```bash
# 관리자 권한으로 PowerShell 또는 CMD 실행
npm install -g vercel

# 설치 확인
vercel --version
```

**설치 성공 시:**
```
Vercel CLI 33.x.x
```

---

### Step 3: Vercel 개발 서버 실행

```bash
# 프로젝트 루트 디렉토리에서 실행
cd d:\workspace\memoeat

# Vercel 개발 서버 시작
vercel dev
```

**첫 실행 시 나오는 질문들:**

1. **"Set up and develop ~?"** → `Y` (Enter)
2. **"Which scope should contain your project?"** → 계정 선택 (Enter)
3. **"Link to existing project?"** → `N` (새 프로젝트)
4. **"What's your project's name?"** → `memoeat` (Enter)
5. **"In which directory is your code located?"** → `./` (Enter)
6. **"Want to modify these settings?"** → `N` (Enter)

**서버 시작 완료 메시지:**
```
Ready! Available at http://localhost:3000
```

---

## ✅ **테스트 시나리오**

### 테스트 1: 유튜브 영상 요약 (일반)

1. **브라우저에서 접속**
   - http://localhost:3000 열기
   - 로그인

2. **새 메모 생성**
   - 사이드바에서 "새 메모" 버튼 클릭

3. **링크 요약 실행**
   - 에디터 상단의 **"링크 요약"** 버튼 클릭
   - 모달에 유튜브 URL 입력:
     ```
     https://www.youtube.com/watch?v=dQw4w9WgXcQ
     ```
   - **"요약하기"** 버튼 클릭

4. **예상 결과**
   - 로딩 중: "유튜브 영상 분석 중..." 표시
   - 10~30초 후: 요약 결과가 에디터에 자동 삽입
   - 요약 형식:
     ```markdown
     ---

     ## 🔗 링크 요약 (2025-11-04 16:30)

     **원본 링크**: https://www.youtube.com/watch?v=...

     - **주제**: [영상 주제]
     - **핵심 포인트**:
       • [포인트 1]
       • [포인트 2]
       ...

     ---
     ```

5. **링크 정보 확인**
   - 에디터 상단에 빨간색 "YouTube" 배지 표시
   - 원본 링크 버튼 클릭 → 새 탭에서 영상 열림

---

### 테스트 2: 유튜브 요리 영상 요약

1. **요리 영상 URL 입력**
   ```
   https://www.youtube.com/watch?v=[요리-영상-ID]
   ```

   **추천 테스트 영상** (한국어 자막 있는 요리 영상):
   - 백종원 채널 영상
   - 예: "간단한 김치찌개 만들기"

2. **예상 결과**
   ```markdown
   - **주제**: 김치찌개
   - **재료**:
     • 김치 300g
     • 돼지고기 200g
     • 두부 1모
     ...
   - **조리 순서**:
     1. 김치를 먹기 좋은 크기로 자른다
     2. 냄비에 기름을 두르고 돼지고기를 �볶는다
     ...
   - **팁**: 김치는 오래 묵은 것이 맛있습니다
   ```

---

### 테스트 3: 웹페이지 요약

1. **뉴스 기사 또는 블로그 URL 입력**
   ```
   https://news.ycombinator.com/
   또는
   https://www.bbc.com/korean
   ```

2. **예상 결과**
   - 로딩 중: "웹페이지 분석 중..." 표시
   - 요약 형식:
     ```markdown
     - **주제**: [페이지 제목]
     - **핵심 내용**:
       • [요약 1]
       • [요약 2]
       ...
     - **결론**: [결론]
     ```

3. **링크 정보 확인**
   - 파란색 "Web" 배지 표시

---

### 테스트 4: 에러 처리

#### 4-1. 자막 없는 유튜브 영상

**테스트 URL:**
```
https://www.youtube.com/watch?v=[자막-없는-영상-ID]
```

**예상 에러 메시지:**
```
유튜브 자막을 가져올 수 없습니다.
자막이 없거나 비공개 영상일 수 있습니다.
```

#### 4-2. 잘못된 URL

**테스트 URL:**
```
https://invalid-url
또는
not-a-url
```

**예상 에러 메시지:**
```
유효한 URL을 입력해주세요
```

#### 4-3. 크롤링 차단된 웹사이트

일부 웹사이트는 크롤링을 차단합니다.

**예상 에러 메시지:**
```
웹페이지 내용을 가져올 수 없습니다.
접근이 차단되었거나 유효하지 않은 URL일 수 있습니다.
```

---

## 🐛 **트러블슈팅**

### 문제 1: "API key not configured" 에러

**원인:**
- `.env.local`에 `ANTHROPIC_API_KEY`가 없음
- Vercel CLI가 환경 변수를 읽지 못함

**해결:**
1. `.env.local` 파일 확인
2. `ANTHROPIC_API_KEY=sk-ant-...` 형식이 맞는지 확인
3. Vercel 서버 재시작:
   ```bash
   # Ctrl+C로 종료 후
   vercel dev
   ```

---

### 문제 2: "Network Error" 또는 연결 실패

**원인:**
- Vercel CLI가 실행되지 않음
- API 엔드포인트 URL이 잘못됨

**해결:**
1. Vercel 서버가 실행 중인지 확인:
   ```
   Ready! Available at http://localhost:3000
   ```

2. 브라우저 콘솔(F12) 확인:
   - Network 탭에서 `/api/summarize` 요청 확인
   - 요청 URL이 `http://localhost:3000/api/summarize`인지 확인

---

### 문제 3: 요약이 너무 오래 걸림 (30초 이상)

**원인:**
- 매우 긴 영상이나 웹페이지
- Vercel Function Timeout (최대 30초)

**해결:**
- 짧은 영상이나 기사로 테스트
- Timeout 에러 발생 시 다른 URL 시도

---

### 문제 4: "Insufficient credits" 에러

**원인:**
- Anthropic API 크레딧 소진

**해결:**
1. Anthropic Console > Billing에서 잔액 확인
2. 크레딧 추가 구매 또는 카드 등록

---

## 📊 **테스트 체크리스트**

Phase 4 테스트 완료 후 CHECKLIST.md를 업데이트하세요:

```markdown
### ✅ Phase 4 완료 확인

- [o] 웹페이지 링크 요약 동작
- [o] 유튜브 링크 요약 동작 (한국어 자막)
- [o] 요리 영상 레시피 형식 확인
- [o] 에러 처리 (자막 없음, 크롤링 실패) 확인
```

---

## 💡 **테스트 팁**

### 추천 테스트 URL

**유튜브 (일반):**
- TED 강연 (영어 자막)
- 뉴스 클립 (한국어 자막)

**유튜브 (요리):**
- 백종원 레시피
- Maangchi (한국 요리, 영어 자막)

**웹페이지:**
- BBC News Korean
- Medium 기술 블로그
- Wikipedia 문서

### 디버깅 도구

1. **브라우저 개발자 도구 (F12)**
   - Console: 에러 메시지 확인
   - Network: API 요청/응답 확인

2. **Vercel CLI 로그**
   - 터미널에서 API 로그 실시간 확인
   - 에러 스택 트레이스 확인

3. **React Developer Tools**
   - 컴포넌트 상태 확인
   - Props 확인

---

## 🎉 **테스트 성공 시**

모든 테스트가 성공하면:

1. **CHECKLIST.md 업데이트**
   - Phase 4 완료 체크박스 체크

2. **커밋 & 푸시**
   ```bash
   git add CHECKLIST.md
   git commit -m "docs: Phase 4 테스트 완료"
   git push origin main
   ```

3. **다음 Phase 진행**
   - Phase 5: 추가 기능 (검색, TXT 다운로드, 카카오톡 공유)
   - Phase 6: UI/UX 개선

---

**테스트를 시작하세요!** 🚀

문제가 발생하면 에러 메시지와 함께 질문해주세요.
