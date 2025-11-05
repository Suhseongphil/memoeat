# API Key 모델 접근 권한 확인

현재 발급받은 API Key가 어떤 모델에 접근할 수 있는지 확인이 필요합니다.

## 시도해볼 모델 목록 (순서대로)

### 1. Claude 3.5 Sonnet (최신)
```javascript
model: 'claude-3-5-sonnet-latest'
```
**현재 시도 중**

### 2. Claude 3.5 Sonnet (2024년 6월)
```javascript
model: 'claude-3-5-sonnet-20240620'
```
**결과: 404 에러 (접근 불가)**

### 3. Claude 3 Opus (가장 강력)
```javascript
model: 'claude-3-opus-20240229'
```
**대안 1**

### 4. Claude 3 Sonnet
```javascript
model: 'claude-3-sonnet-20240229'
```
**대안 2**

### 5. Claude 3 Haiku (가장 빠르고 저렴)
```javascript
model: 'claude-3-haiku-20240307'
```
**대안 3**

---

## 문제 원인 가능성

1. **API Key가 베타 버전**
   - 일부 모델에 대한 접근 권한이 제한될 수 있음
   - Anthropic Console에서 확인 필요

2. **요금제 문제**
   - 무료 크레딧으로는 일부 모델만 사용 가능할 수 있음
   - Claude 3 Haiku가 가장 저렴하므로 접근 가능성 높음

3. **모델 버전 변경**
   - Anthropic이 모델 ID를 변경했을 수 있음

---

## 해결 방법

### 방법 1: Claude 3 Haiku로 변경 (권장)

`api/summarize.js` 파일의 286번 줄을 다음으로 변경:

```javascript
model: 'claude-3-haiku-20240307',
```

**장점:**
- 가장 저렴 ($0.25/M tokens vs $3/M tokens)
- 무료 크레딧으로 더 많이 사용 가능
- 응답 속도가 가장 빠름
- 요약 품질도 충분히 좋음

**단점:**
- 긴 콘텐츠 요약 시 Opus/Sonnet보다 약간 덜 정확할 수 있음

### 방법 2: Anthropic Console에서 확인

1. https://console.anthropic.com/ 접속
2. **Settings** → **API Keys**
3. 사용 중인 Key 확인
4. **Workbench** 또는 **Playground**에서 사용 가능한 모델 확인

### 방법 3: API Key 재발급

현재 Key가 제한된 베타 버전일 수 있으므로:
1. 새로운 API Key 발급
2. `.env.local`에서 교체
3. 다시 시도

---

## 다음 시도할 코드

`claude-3-5-sonnet-latest`가 안되면 이 코드로 교체하세요:

```javascript
const message = await anthropic.messages.create({
  model: 'claude-3-haiku-20240307',  // Haiku로 변경
  max_tokens: 2048,
  system: systemPrompt,
  messages: [
    {
      role: 'user',
      content: userPrompt
    }
  ]
})
```
