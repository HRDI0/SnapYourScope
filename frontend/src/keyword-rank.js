import './tools.css'
import { applyDocumentLanguage, fetchUserTier, getStoredLanguage, isPaidTier, setStoredLanguage } from './core/session'

const output = document.getElementById('kr-output')
const languageSelect = document.getElementById('language-select')
const submitBtn = document.getElementById('kr-submit')

let currentLanguage = getStoredLanguage('en')
let currentTier = 'free'

const I18N = {
  en: {
    title: 'Keyword Rank Tracker',
    navMain: 'Main',
    navDashboard: 'Dashboard',
    navKeyword: 'Keyword Rank',
    navPrompt: 'Prompt Tracker',
    navOptimizer: 'SEO/AEO Optimizer',
    navPricing: 'Pricing',
    navInquiry: 'Inquiry',
    freeTitle: 'Free: Single Keyword',
    freeDesc: 'Track one keyword for free. Multi-keyword batch is paid.',
    querySingleLabel: 'Primary Keyword',
    queryLabel: 'Additional Keywords (optional, one per line)',
    querySinglePlaceholder: 'best ai seo platform',
    queryMultiPlaceholder: 'seo tool comparison',
    urlLabel: 'Target URL',
    policyNote:
      'Policy: single keyword is free. Multi-keyword requires Pro/Enterprise. Use this SEO baseline before prompt/AEO checks.',
    refreshNote: 'Refresh policy: daily (lightweight search tracking).',
    submit: 'Run Rank Tracking',
    resultTitle: 'Result',
    outputIdle: 'Ready.',
    outputError: 'Error',
    outputSample:
      '{\n  "status": "sample",\n  "query": "best ai seo platform",\n  "results": [{"engine": "google", "rank": 7}]\n}',
    freeBatchBlocked:
      'Multi-keyword tracking is paid. Free tier can run one keyword only. Showing sample for batch mode.',
    missingQuery: 'Enter at least one keyword.',
  },
  ko: {
    title: '키워드 순위 추적',
    navMain: '메인',
    navDashboard: '대시보드',
    navKeyword: '키워드 순위',
    navPrompt: '프롬프트 추적',
    navOptimizer: 'SEO/AEO 최적화',
    navPricing: '요금제',
    navInquiry: '문의',
    freeTitle: '무료: 단일 키워드',
    freeDesc: '키워드 1개는 무료입니다. 다중 키워드 배치는 유료입니다.',
    querySingleLabel: '기본 키워드',
    queryLabel: '추가 키워드 (선택, 한 줄에 하나)',
    querySinglePlaceholder: 'ai seo 플랫폼',
    queryMultiPlaceholder: 'seo 도구 비교',
    urlLabel: '대상 URL',
    policyNote:
      '정책: 단일 키워드는 무료, 다중 키워드는 Pro/Enterprise 필요. SEO 기준 확인 후 프롬프트/AEO 점검으로 이어가세요.',
    refreshNote: '갱신 주기: 매일 (경량 검색 추적).',
    submit: '순위 추적 실행',
    resultTitle: '결과',
    outputIdle: '요청을 실행하면 결과가 표시됩니다.',
    outputError: '오류',
    outputSample:
      '{\n  "status": "sample",\n  "query": "ai seo 플랫폼",\n  "results": [{"engine": "google", "rank": 7}]\n}',
    freeBatchBlocked:
      '다중 키워드 추적은 유료 기능입니다. 무료 티어는 키워드 1개만 가능합니다. 배치 모드 예시를 표시합니다.',
    missingQuery: '키워드를 1개 이상 입력해주세요.',
  },
}

function t(key) {
  return I18N[currentLanguage]?.[key] || I18N.en[key] || key
}

function setText(id, key) {
  const element = document.getElementById(id)
  if (element) element.textContent = t(key)
}

function applyLanguage(lang) {
  currentLanguage = I18N[lang] ? lang : 'en'
  setStoredLanguage(currentLanguage)
  applyDocumentLanguage(currentLanguage)
  if (languageSelect) languageSelect.value = currentLanguage

  setText('kr-title', 'title')
  setText('kr-nav-main', 'navMain')
  setText('kr-nav-dashboard', 'navDashboard')
  setText('kr-nav-keyword', 'navKeyword')
  setText('kr-nav-prompt', 'navPrompt')
  setText('kr-nav-optimizer', 'navOptimizer')
  setText('kr-nav-pricing', 'navPricing')
  setText('kr-nav-inquiry', 'navInquiry')
  setText('kr-free-title', 'freeTitle')
  setText('kr-free-desc', 'freeDesc')
  setText('kr-query-single-label', 'querySingleLabel')
  setText('kr-query-label', 'queryLabel')
  setText('kr-url-label', 'urlLabel')
  const singleInput = document.getElementById('kr-query-single')
  if (singleInput) singleInput.placeholder = t('querySinglePlaceholder')
  const multiInput = document.getElementById('kr-query')
  if (multiInput) multiInput.placeholder = t('queryMultiPlaceholder')
  setText('kr-policy-note', 'policyNote')
  setText('kr-refresh-note', 'refreshNote')
  setText('kr-submit', 'submit')
  setText('kr-result-title', 'resultTitle')

  if (!output.dataset.hasResult) {
    output.dataset.state = 'idle'
    output.textContent = t('outputIdle')
  }
}

function checkedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => el.value)
}

function parseQueries(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

document.getElementById('rank-track-form').addEventListener('submit', async (event) => {
  event.preventDefault()

  const primaryKeyword = (document.getElementById('kr-query-single').value || '').trim()
  const extraQueries = parseQueries(document.getElementById('kr-query').value)
  const queries = primaryKeyword ? [primaryKeyword, ...extraQueries] : extraQueries
  if (!queries.length) {
    output.dataset.hasResult = '1'
    output.dataset.state = 'error'
    output.textContent = `${t('outputError')}: ${t('missingQuery')}`
    return
  }

  const isBatch = queries.length > 1
  const isPaid = isPaidTier(currentTier)
  if (isBatch && !isPaid) {
    output.dataset.hasResult = '1'
    output.dataset.state = 'sample'
    output.textContent = `${t('freeBatchBlocked')}\n\n${t('outputSample')}`
    return
  }

  submitBtn.disabled = true
  try {
    const token = localStorage.getItem('access_token')
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`

    const response = await fetch('/api/search-rank', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: queries[0],
        queries,
        target_url: document.getElementById('kr-target-url').value.trim(),
        engines: checkedValues('rank-engine'),
      }),
    })

    const text = await response.text()
    let data = text
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }

    if (!response.ok) {
      throw new Error(data?.detail || JSON.stringify(data))
    }

    output.dataset.hasResult = '1'
    output.dataset.state = 'result'
    output.textContent = JSON.stringify(data, null, 2)
  } catch (error) {
    output.dataset.hasResult = '1'
    output.dataset.state = 'error'
    output.textContent = `${t('outputError')}: ${error.message}`
  } finally {
    submitBtn.disabled = false
  }
})

if (languageSelect) {
  languageSelect.addEventListener('change', (event) => {
    applyLanguage(event.target.value)
  })
}

applyLanguage(currentLanguage)
fetchUserTier().then((tier) => {
  currentTier = tier
})
