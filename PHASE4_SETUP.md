# Phase 4: 링크 요약 기능 설정 가이드

이 문서는 Phase 4 링크 요약 기능을 사용하기 위한 설정 가이드입니다.

---

## 📋 필요한 환경 변수

### 1. Anthropic API Key 발급

링크 요약 기능을 사용하려면 Claude API 키가 필요합니다.

1. [Anthropic Console](https://console.anthropic.com/) 접속
2. 계정 생성 또는 로그인
3. API Keys 메뉴에서 새로운 API Key 생성
4. 생성된 Key를 복사 (예: `sk-ant-api03-...`)

### 2. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# Anthropic Claude API (링크 요약 기능)
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

**주의사항**:
- `.env.local` 파일은 절대 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- API Key는 외부에 노출되지 않도록 주의하세요

---

## 🚀 로컬 개발 환경에서 테스트

### 방법 1: Vercel CLI 사용 (권장)

Vercel Serverless Functions를 로컬에서 실행하려면 Vercel CLI가 필요합니다.

```bash
# Vercel CLI 설치 (전역)
npm install -g vercel

# 프로젝트 루트에서 Vercel 개발 서버 실행
vercel dev
```

- 로컬 서버: `http://localhost:3000`
- API 엔드포인트: `http://localhost:3000/api/summarize`

### 방법 2: 프론트엔드만 실행

Vercel CLI 없이 프론트엔드만 실행하면 API 호출이 실패합니다.

```bash
npm run dev
```

**주의**: 이 경우 링크 요약 기능은 작동하지 않습니다. Vercel에 배포 후 테스트하거나 Vercel CLI를 사용하세요.

---

## 🔧 LinkModal 컴포넌트 구조

### API 엔드포인트 설정

`LinkModal.jsx` 파일에서 환경에 따라 API URL이 자동으로 설정됩니다:

```javascript
const apiUrl = import.meta.env.DEV
  ? 'http://localhost:3000/api/summarize' // 개발 환경 (Vercel CLI)
  : '/api/summarize' // 프로덕션 환경 (Vercel)
```

---

## 📝 기능 설명

### 지원하는 링크 타입

1. **유튜브 영상**
   - URL 예시: `https://youtube.com/watch?v=...` 또는 `https://youtu.be/...`
   - 자막 추출 후 AI 요약
   - 자막 우선순위: 한국어 → 영어 → 자동 생성

2. **웹페이지**
   - URL 예시: `https://example.com/article`
   - 웹페이지 크롤링 후 AI 요약
   - 메타 정보 및 본문 추출

### 요약 형식

- **유튜브 (요리 영상)**: 재료 목록 + 조리 순서
- **유튜브 (일반 영상)**: 주제 + 핵심 포인트
- **웹페이지**: 주제 + 핵심 내용 + 결론

### 사용 방법

1. 메모 에디터 상단의 **"링크 요약"** 버튼 클릭
2. 모달에 URL 입력
3. **"요약하기"** 버튼 클릭
4. AI가 요약하는 동안 대기 (10~30초)
5. 요약 결과가 에디터에 자동 삽입됨

---

## ⚠️ 에러 처리

### 1. "자막을 가져올 수 없습니다"

**원인**:
- 유튜브 영상에 자막이 없음
- 비공개 영상이거나 연령 제한이 있음
- 잘못된 URL

**해결**:
- 자막이 있는 공개 영상 URL을 사용하세요

### 2. "웹페이지 내용을 가져올 수 없습니다"

**원인**:
- 웹사이트에서 크롤링을 차단함 (robots.txt, 403 Forbidden)
- 잘못된 URL
- 네트워크 오류

**해결**:
- 다른 웹사이트를 시도하세요
- URL이 올바른지 확인하세요

### 3. "API key not configured"

**원인**:
- `.env.local`에 `ANTHROPIC_API_KEY`가 설정되지 않음
- Vercel 배포 시 환경 변수가 설정되지 않음

**해결**:
- 로컬: `.env.local` 파일에 API Key 추가
- Vercel: Dashboard → Settings → Environment Variables에서 추가

---

## 🚀 Vercel 배포 시 설정

### 1. Vercel Dashboard에서 환경 변수 추가

1. Vercel 프로젝트 선택
2. **Settings** → **Environment Variables** 메뉴
3. 다음 환경 변수 추가:

| Name | Value | Environment |
|------|-------|-------------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Production, Preview |

### 2. 배포 후 재빌드

환경 변수를 추가한 후 프로젝트를 다시 배포하세요:

```bash
git push origin main
```

또는 Vercel Dashboard에서 **Deployments** → **Redeploy** 클릭

---

## 💡 팁

### 토큰 제한

Claude API는 입력 토큰에 제한이 있습니다. 현재 설정:
- 최대 입력: 50,000자
- 최대 출력: 2,048 토큰

매우 긴 영상이나 웹페이지는 자동으로 잘립니다.

### 비용 관리

Anthropic API는 사용량에 따라 과금됩니다.
- Claude 3.5 Sonnet: 입력 $3/M tokens, 출력 $15/M tokens
- 1회 요약 평균 비용: $0.01 ~ $0.05

무료 크레딧: 첫 가입 시 $5 제공

### 응답 시간

- 유튜브 자막: 5~15초
- 웹페이지: 10~30초
- 매우 긴 콘텐츠: 최대 30초 (Vercel Function Timeout)

---

## 📚 참고 자료

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [youtube-transcript npm package](https://www.npmjs.com/package/youtube-transcript)
- [cheerio (Web Scraping)](https://cheerio.js.org/)

---

**설정 완료 후 로컬에서 테스트해보세요!** 🎉
