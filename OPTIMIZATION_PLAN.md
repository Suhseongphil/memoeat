# 성능 최적화 계획 (MemoEat)

> **최적화 원칙**: 기존 사용자 동작은 그대로 유지하면서 코드 효율과 품질 향상

## 현재 프로젝트 상태 분석

### 기술 스택

- React 19.1.1
- React Query 5.90.6 (캐싱 전략 미적용)
- Vite 7.1.7 (빌드 최적화 없음)
- Tiptap 에디터 (무거운 컴포넌트)
- Supabase (select('\*') 사용)

### 주요 컴포넌트

- **MainPage**: 복잡한 상태 관리, 많은 핸들러 함수
- **Sidebar**: NoteList, FolderTree (많은 아이템 렌더링 가능)
- **Editor**: Tiptap 에디터 (무거운 컴포넌트, 코드 분할 필요)
- **TabBar**: 간단한 컴포넌트

### 현재 최적화 상태

- ✅ `useMemo` 일부 사용 (openedNotesData)
- ❌ React.memo 미사용
- ❌ useCallback 미사용
- ❌ 코드 분할 없음
- ❌ React Query 캐싱 전략 미적용 (staleTime: 0)
- ❌ Supabase 쿼리 최적화 없음 (select('\*'))
- ❌ Vite 빌드 최적화 없음

---

## 최적화 계획 (우선순위별)

### 🔴 Phase 7.1: 데이터 최적화 (최우선)

**목표**: 네트워크 요청 최소화 및 데이터 로딩 속도 개선

#### 7.1.1 React Query 캐싱 전략 설정

- [ ] `staleTime` 설정 (폴더: 5분, 메모: 2분)
- [ ] `cacheTime` 설정 (10분)
- [ ] `refetchOnMount`, `refetchOnReconnect` 설정
- [ ] Mutation `retry: 0` 설정

**예상 효과**: 불필요한 네트워크 요청 감소, 로딩 속도 개선

#### 7.1.2 Supabase 쿼리 최적화

- [ ] `getNotes`: 필요한 컬럼만 select (`id, data, created_at, updated_at`)
- [ ] `getFolders`: 필요한 컬럼만 select (`id, data, created_at`)
- [ ] 모든 update/insert 쿼리 최적화

**예상 효과**: 네트워크 전송량 20-30% 감소

#### 7.1.3 Optimistic Updates 적용 (선택적)

- [ ] 메모 생성/삭제
- [ ] 폴더 생성/삭제
- [ ] 즐겨찾기 토글

**예상 효과**: UI 반응성 향상 (즉각적인 피드백)

---

### 🟡 Phase 7.2: 렌더링 최적화

**목표**: 불필요한 리렌더링 방지

#### 7.2.1 React.memo 적용

- [ ] `NoteItemSimple`: 자주 리렌더되는 컴포넌트
- [ ] `FolderItem`: 폴더 트리 최적화
- [ ] `TabBar`: 탭 리스트 최적화

**주의사항**: props 비교 함수 신중하게 작성 (기존 동작 유지)

#### 7.2.2 useCallback 적용

- [ ] MainPage의 핸들러 함수들 (handleNoteSelect, handleTabClose 등)
- [ ] Sidebar의 핸들러 함수들

**주의사항**: 의존성 배열 정확히 설정 (무한 루프 방지)

#### 7.2.3 useMemo 추가 적용

- [ ] `folderTree` 계산 (이미 buildFolderTree 사용 중)
- [ ] 필터링된 메모 리스트 (rootNotes, favoriteNotes 등)

---

### 🟢 Phase 7.3: 코드 분할

**목표**: 초기 번들 크기 감소

#### 7.3.1 라우트별 코드 스플리팅

- [ ] `AdminPage` lazy loading (거의 사용 안 함)
- [ ] `Editor` 컴포넌트 lazy loading (Tiptap 무거움)

**주의사항**: Suspense fallback UI 제공

---

### 🔵 Phase 7.4: 빌드 최적화

**목표**: 프로덕션 번들 크기 최소화

#### 7.4.1 Vite 빌드 최적화 설정

- [ ] `manualChunks` 설정 (큰 라이브러리 분리)
- [ ] `chunkSizeWarningLimit` 설정
- [ ] Tree-shaking 확인

#### 7.4.2 번들 크기 분석

- [ ] `vite-bundle-visualizer` 또는 `rollup-plugin-visualizer` 사용
- [ ] 큰 의존성 확인 및 최적화

---

### ⚪ Phase 7.5: 추가 최적화 (선택적)

#### 7.5.1 Virtual List

- [ ] 메모가 100개 이상일 때만 적용
- [ ] `react-window` 또는 `react-virtual` 사용

**현재는 제외**: 메모가 많지 않을 것으로 예상

#### 7.5.2 Pagination/무한 스크롤

- [ ] 현재는 제외 (필요 시 추가)

---

## 최적화 순서 (권장)

1. **7.1.2 Supabase 쿼리 최적화** (가장 빠른 효과)
2. **7.1.1 React Query 캐싱 전략** (네트워크 요청 감소)
3. **7.2.1 React.memo 적용** (리렌더링 최적화)
4. **7.2.2 useCallback 적용** (함수 재생성 방지)
5. **7.3.1 코드 분할** (초기 로딩 속도 개선)
6. **7.4.1 빌드 최적화** (번들 크기 감소)
7. **7.1.3 Optimistic Updates** (UX 개선, 선택적)

---

## 주의사항

### ⚠️ 최적화 시 반드시 확인할 사항

1. **기존 동작 유지**: 모든 최적화 후 기능 테스트 필수
2. **의존성 배열**: useCallback, useMemo의 의존성 배열 정확히 설정
3. **React.memo 비교 함수**: props 비교 시 기존 동작과 동일하게 동작하는지 확인
4. **캐시 무효화**: Optimistic Updates 적용 시 실패 시 롤백 로직 필수
5. **점진적 적용**: 한 번에 하나씩 적용하고 테스트

### ❌ 하지 말아야 할 것

1. **과도한 최적화**: 모든 컴포넌트에 React.memo 적용하지 않기
2. **의존성 배열 생략**: useCallback, useMemo의 의존성 배열 생략하지 않기
3. **캐시 전략 과도 설정**: staleTime을 너무 길게 설정하지 않기 (데이터 동기화 문제)

---

## 성공 지표

- [ ] 초기 로딩 속도: 3초 이내
- [ ] 번들 크기: 초기 번들 200KB 이하
- [ ] 네트워크 요청: 불필요한 요청 50% 이상 감소
- [ ] 리렌더링: 불필요한 리렌더링 70% 이상 감소
- [ ] Lighthouse 성능 점수: 90점 이상

---

## 참고사항

- 모든 최적화는 기존 기능을 유지하면서 진행
- 각 단계마다 테스트 필수
- 문제 발생 시 즉시 롤백 가능하도록 Git 커밋 분리
