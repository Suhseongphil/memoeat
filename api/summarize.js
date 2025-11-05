import Anthropic from '@anthropic-ai/sdk'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { YoutubeTranscript } from 'youtube-transcript'

/**
 * Vercel Serverless Function - 링크 요약 API
 * 웹페이지와 유튜브 영상을 Claude API로 요약합니다.
 */
export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    // API 키 확인
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not found in environment variables')
      return res.status(500).json({ error: 'API key not configured' })
    }

    // 링크 타입 감지
    const linkType = detectLinkType(url)
    console.log('링크 타입:', linkType, '| URL:', url)

    let content = ''
    let summary = ''

    if (linkType === 'youtube') {
      // 유튜브 자막 추출
      content = await extractYoutubeTranscript(url)
      if (!content) {
        return res.status(400).json({
          error: '유튜브 자막을 가져올 수 없습니다. 자막이 없거나 비공개 영상일 수 있습니다.'
        })
      }

      // Claude API로 요약
      summary = await summarizeWithClaude(content, linkType, apiKey)
    } else if (linkType === 'webpage') {
      // 웹페이지 크롤링
      content = await extractWebpageContent(url)
      if (!content) {
        return res.status(400).json({
          error: '웹페이지 내용을 가져올 수 없습니다. 접근이 차단되었거나 유효하지 않은 URL일 수 있습니다.'
        })
      }

      // Claude API로 요약
      summary = await summarizeWithClaude(content, linkType, apiKey)
    } else {
      return res.status(400).json({ error: 'Unsupported link type' })
    }

    // 성공 응답
    return res.status(200).json({
      summary,
      linkType,
      originalUrl: url
    })

  } catch (error) {
    console.error('요약 처리 오류:', error)
    return res.status(500).json({
      error: error.message || 'An error occurred while processing the request'
    })
  }
}

/**
 * 링크 타입 감지 (유튜브 vs 웹페이지)
 */
function detectLinkType(url) {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
  return youtubeRegex.test(url) ? 'youtube' : 'webpage'
}

/**
 * 유튜브 영상 ID 추출
 */
function extractVideoId(url) {
  const regexList = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ]

  for (const regex of regexList) {
    const match = url.match(regex)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * 유튜브 자막 추출
 */
async function extractYoutubeTranscript(url) {
  try {
    const videoId = extractVideoId(url)
    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }

    console.log('유튜브 비디오 ID:', videoId)

    // 한국어 자막 시도
    let transcript
    try {
      transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ko' })
      console.log('한국어 자막 추출 성공')
    } catch (koError) {
      console.log('한국어 자막 없음, 영어 자막 시도')
      // 영어 자막 시도
      try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
        console.log('영어 자막 추출 성공')
      } catch (enError) {
        console.log('영어 자막 없음, 자동 생성 자막 시도')
        // 자동 생성 자막 (언어 지정 없음)
        transcript = await YoutubeTranscript.fetchTranscript(videoId)
        console.log('자동 생성 자막 추출 성공')
      }
    }

    if (!transcript || transcript.length === 0) {
      return null
    }

    // 자막 텍스트 합치기
    const fullText = transcript.map(item => item.text).join(' ')
    console.log(`자막 길이: ${fullText.length} 문자`)

    // Claude API 토큰 제한을 고려하여 텍스트 길이 제한 (약 50,000 문자)
    return fullText.substring(0, 50000)
  } catch (error) {
    console.error('유튜브 자막 추출 오류:', error)
    return null
  }
}

/**
 * 웹페이지 크롤링
 */
async function extractWebpageContent(url) {
  try {
    console.log('웹페이지 크롤링 시작:', url)

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    const $ = cheerio.load(response.data)

    // 불필요한 태그 제거
    $('script, style, nav, footer, header, aside, iframe, noscript').remove()

    // 메타 정보 추출
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || ''
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || ''

    // 본문 텍스트 추출
    let mainContent = ''

    // article, main 태그 우선 시도
    if ($('article').length > 0) {
      mainContent = $('article').text()
    } else if ($('main').length > 0) {
      mainContent = $('main').text()
    } else {
      mainContent = $('body').text()
    }

    // 공백 정리
    mainContent = mainContent
      .replace(/\s+/g, ' ')
      .trim()

    const fullText = `제목: ${title}\n\n설명: ${description}\n\n본문:\n${mainContent}`
    console.log(`웹페이지 텍스트 길이: ${fullText.length} 문자`)

    // Claude API 토큰 제한을 고려하여 텍스트 길이 제한 (약 50,000 문자)
    return fullText.substring(0, 50000)
  } catch (error) {
    console.error('웹페이지 크롤링 오류:', error)
    return null
  }
}

/**
 * Claude API로 요약
 */
async function summarizeWithClaude(content, linkType, apiKey) {
  try {
    const anthropic = new Anthropic({
      apiKey: apiKey
    })

    // 링크 타입별 프롬프트
    let systemPrompt = ''
    let userPrompt = ''

    if (linkType === 'youtube') {
      systemPrompt = `당신은 유튜브 영상 내용을 요약하는 전문가입니다. 영상의 핵심 내용을 파악하여 명확하게 요약해주세요.`

      userPrompt = `다음은 유튜브 영상의 자막입니다. 이 영상을 분석하여 요약해주세요.

자막:
${content}

요약 형식:
1. 만약 요리 영상이라면:
   - **주제**: [음식명]
   - **재료**:
     • [재료 1]
     • [재료 2]
     ...
   - **조리 순서**:
     1. [단계 1]
     2. [단계 2]
     ...
   - **팁**: [있다면 추가]

2. 만약 일반 영상이라면:
   - **주제**: [영상 주제]
   - **핵심 포인트**:
     • [포인트 1]
     • [포인트 2]
     • [포인트 3]
     ...
   - **결론**: [있다면 추가]

요약은 한국어로 작성하고, 마크다운 형식을 사용하세요.`
    } else {
      systemPrompt = `당신은 웹페이지 내용을 요약하는 전문가입니다. 웹페이지의 핵심 내용을 파악하여 간결하게 요약해주세요.`

      userPrompt = `다음은 웹페이지의 내용입니다. 이 페이지의 핵심 내용을 요약해주세요.

내용:
${content}

요약 형식:
- **주제**: [페이지 주제]
- **핵심 내용**:
  • [포인트 1]
  • [포인트 2]
  • [포인트 3]
  ...
- **결론**: [있다면 추가]

요약은 한국어로 작성하고, 마크다운 형식을 사용하세요. 불필요한 광고나 부가 정보는 제외하고 핵심 내용만 요약해주세요.`
    }

    console.log('Claude API 요청 시작')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })

    console.log('Claude API 응답 받음')

    const summary = message.content[0].text
    return summary

  } catch (error) {
    console.error('Claude API 요약 오류:', error)
    throw new Error('요약 생성 중 오류가 발생했습니다')
  }
}
