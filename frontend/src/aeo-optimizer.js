import './tools.css'
import { applyDocumentLanguage, fetchUserTier, getStoredLanguage, isPaidTier, setStoredLanguage } from './core/session'

const output = document.getElementById('optimizer-output')
const languageSelect = document.getElementById('language-select')
const submitBtn = document.getElementById('ao-submit')

let currentLanguage = getStoredLanguage('en')
let currentTier = 'free'

const I18N = {
  en: {
    title: 'AEO Optimizer',
    navMain: 'Main',
    navKeyword: 'Keyword Rank',
    navDashboard: 'Dashboard',
    navPrompt: 'Prompt Tracker',
    navAeo: 'AEO Optimizer',
    paidTitle: 'Paid Recommendation Workflow (Pro / Enterprise)',
    paidDesc: 'Generate optimization recommendations from URL audit outputs and GEO/AEO principles.',
    urlLabel: 'Target URL',
    submit: 'Generate Recommendations',
    resultTitle: 'Result',
    outputIdle: 'Submit URL to receive recommendations.',
    loginRequired: 'Error: Login required for paid optimizer feature.',
    paidRequired: 'Error: Pro or Enterprise subscription is required.',
    freeDisabled:
      'AEO optimizer is disabled on free tier. Sample output is shown below.',
    sampleOutput:
      '{\n  "status": "sample",\n  "recommendations": [\n    "Add answer-first paragraph near top of content",\n    "Expand FAQ schema with target intent terms"\n  ]\n}',
    refreshPolicy: 'Refresh policy: weekly (LLM/API-intensive).',
    outputError: 'Error',
  },
  ko: {
    title: 'AEO 최적화',
    navMain: '메인',
    navKeyword: '키워드 순위',
    navDashboard: '대시보드',
    navPrompt: '프롬프트 추적',
    navAeo: 'AEO 최적화',
    paidTitle: '유료 추천 워크플로우 (Pro / Enterprise)',
    paidDesc: 'URL 진단 결과와 GEO/AEO 원칙을 바탕으로 최적화 추천을 생성합니다.',
    urlLabel: '대상 URL',
    submit: '추천 생성',
    resultTitle: '결과',
    outputIdle: 'URL을 제출하면 추천 결과가 표시됩니다.',
    loginRequired: '오류: 유료 최적화 기능은 로그인이 필요합니다.',
    paidRequired: '오류: Pro 또는 Enterprise 구독이 필요합니다.',
    freeDisabled: '무료 티어에서는 AEO 최적화가 비활성화됩니다. 아래 예시 결과를 확인하세요.',
    sampleOutput:
      '{\n  "status": "sample",\n  "recommendations": [\n    "문서 상단에 answer-first 단락 추가",\n    "FAQ 스키마에 핵심 의도 키워드 보강"\n  ]\n}',
    refreshPolicy: '갱신 주기: 매주 (LLM/API 고비용 기능).',
    outputError: '오류',
  },
  ja: {
    title: 'AEO 最適化',
    navMain: 'メイン',
    navDashboard: 'ダッシュボード',
    navPrompt: 'プロンプト追跡',
    paidTitle: '有料提案ワークフロー (Pro / Enterprise)',
    paidDesc: 'URL 監査結果と GEO/AEO 原則に基づいて最適化提案を生成します。',
    urlLabel: '対象 URL',
    submit: '提案を生成',
    resultTitle: '結果',
    outputIdle: 'URL を送信すると提案結果が表示されます。',
    loginRequired: 'エラー: 有料最適化機能にはログインが必要です。',
    outputError: 'エラー',
  },
  zh: {
    title: 'AEO 优化',
    navMain: '主页',
    navDashboard: '仪表盘',
    navPrompt: '提示词追踪',
    paidTitle: '付费建议流程 (Pro / Enterprise)',
    paidDesc: '基于 URL 审计结果与 GEO/AEO 原则生成优化建议。',
    urlLabel: '目标 URL',
    submit: '生成建议',
    resultTitle: '结果',
    outputIdle: '提交 URL 后显示建议结果。',
    loginRequired: '错误：付费优化功能需要登录。',
    outputError: '错误',
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

  setText('ao-title', 'title')
  setText('ao-nav-main', 'navMain')
  setText('ao-nav-keyword', 'navKeyword')
  setText('ao-nav-dashboard', 'navDashboard')
  setText('ao-nav-prompt', 'navPrompt')
  setText('ao-nav-aeo', 'navAeo')
  setText('ao-paid-title', 'paidTitle')
  setText('ao-paid-desc', 'paidDesc')
  setText('ao-url-label', 'urlLabel')
  setText('ao-refresh-note', 'refreshPolicy')
  setText('ao-submit', 'submit')
  setText('ao-result-title', 'resultTitle')

  if (!output.dataset.hasResult) {
    output.textContent = t('outputIdle')
  }
}

function applyPaidGating() {
  const isPaid = isPaidTier(currentTier)
  submitBtn.disabled = !isPaid
  if (!isPaid) {
    output.dataset.hasResult = '1'
    output.textContent = `${t('freeDisabled')}\n\n${t('sampleOutput')}`
  }
}

document.getElementById('aeo-optimizer-form').addEventListener('submit', async (event) => {
  event.preventDefault()

  const token = localStorage.getItem('access_token')
  if (!token) {
    output.dataset.hasResult = '1'
    output.textContent = t('loginRequired')
    return
  }

  if (currentTier !== 'pro' && currentTier !== 'enterprise') {
    output.dataset.hasResult = '1'
    output.textContent = t('paidRequired')
    return
  }

  try {
    const response = await fetch('/api/aeo-optimizer/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: document.getElementById('optimizer-url').value.trim(),
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
    output.textContent = JSON.stringify(data, null, 2)
  } catch (error) {
    output.dataset.hasResult = '1'
    output.textContent = `${t('outputError')}: ${error.message}`
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
  applyPaidGating()
})
