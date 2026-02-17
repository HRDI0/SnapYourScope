import { PROMPT_INCLUDED_COUNT } from './core/policy'
import { applyDocumentLanguage, getStoredLanguage, setStoredLanguage } from './core/session'
import { apiUrl } from './core/api'

const output = document.getElementById('result-output')
const languageSelect = document.getElementById('language-select')
const promptSubmitBtn = document.getElementById('pt-prompt-submit')
const promptQueryInput = document.getElementById('prompt-query')
const promptTargetUrlInput = document.getElementById('prompt-target-url')
const promptBrandNameInput = document.getElementById('prompt-brand-name')
const lockNote = document.getElementById('pt-lock-note')
const loginBtn = document.getElementById('pt-login-btn')

let currentLanguage = getStoredLanguage('en')
const DEMO_ACTIVE_LLM = ['gpt']
const DEMO_ACTIVE_ENGINES = ['google']

const I18N = {
  en: {
    title: 'Prompt Tracker',
    navMain: 'Main',
    navKeyword: 'Keyword Rank',
    navDashboard: 'Dashboard',
    navPrompt: 'Prompt Tracker',
    navOptimizer: 'SEO/AEO Optimizer',
    navPricing: 'Pricing',
    navInquiry: 'Inquiry',
    paidTitle: 'Open Beta Prompt Tracking',
    paidDesc: 'Logged-in users can test up to 5 prompts per account in demo open beta.',
    promptQueryLabel: 'Prompt / Query (one per line)',
    promptUrlLabel: 'Target URL',
    brandLabel: 'Brand Name (optional)',
    promptSubmit: 'Run Prompt Tracking',
    resultTitle: 'Result',
    outputIdle: 'Ready.',
    outputError: 'Error',
    paidPolicy: `Open beta policy: ${PROMPT_INCLUDED_COUNT} prompts per logged-in account. Demo active sources: ${DEMO_ACTIVE_LLM.join(', ')} / ${DEMO_ACTIVE_ENGINES.join(', ')}.`,
    refreshPolicy: 'Refresh policy: weekly (LLM/API-intensive).',
    freeDisabled: 'Google login is required for open beta prompt tracking. Sample output is shown below.',
    sampleOutput:
      '{\n  "status": "sample",\n  "policy": "open_beta_demo",\n  "result": {\n    "tier": "mentioned_and_linked",\n    "score": 70\n  }\n}',
    promptMissing: 'Enter at least one prompt.',
    quotaExceeded: 'Open beta quota exceeded for this account.',
    loginButton: 'Login (Paused)',
    loginPaused: 'Login is temporarily paused during open beta. Guest demo mode is active.',
  },
  ko: {
    title: '프롬프트 추적',
    navMain: '메인',
    navKeyword: '키워드 순위',
    navDashboard: '대시보드',
    navPrompt: '프롬프트 추적',
    navOptimizer: 'SEO/AEO 최적화',
    navPricing: '요금제',
    navInquiry: '문의',
    paidTitle: '오픈 베타 프롬프트 추적',
    paidDesc: '로그인 계정당 최대 5개 프롬프트를 데모 오픈 베타로 테스트할 수 있습니다.',
    promptQueryLabel: '프롬프트 / 질의 (한 줄에 하나)',
    promptUrlLabel: '대상 URL',
    brandLabel: '브랜드명 (선택)',
    promptSubmit: '프롬프트 추적 실행',
    resultTitle: '결과',
    outputIdle: '요청을 실행하면 결과가 표시됩니다.',
    outputError: '오류',
    paidPolicy: `오픈 베타 정책: 로그인 계정당 ${PROMPT_INCLUDED_COUNT}개. 데모 활성 소스: ${DEMO_ACTIVE_LLM.join(', ')} / ${DEMO_ACTIVE_ENGINES.join(', ')}.`,
    refreshPolicy: '갱신 주기: 매주 (LLM/API 고비용 기능).',
    freeDisabled: '오픈 베타 프롬프트 추적은 Google 로그인 후 사용할 수 있습니다. 아래 예시 결과를 확인하세요.',
    sampleOutput:
      '{\n  "status": "sample",\n  "policy": "open_beta_demo",\n  "result": {\n    "tier": "mentioned_and_linked",\n    "score": 70\n  }\n}',
    promptMissing: '프롬프트를 1개 이상 입력해주세요.',
    quotaExceeded: '이 계정의 오픈 베타 할당량을 초과했습니다.',
    loginButton: '로그인 (일시중단)',
    loginPaused: '오픈 베타 기간에는 로그인이 일시 중단됩니다. 현재 게스트 데모 모드가 활성화되어 있습니다.',
  },
  ja: {
    title: 'プロンプト追跡',
    navMain: 'メイン',
    navKeyword: 'キーワード順位',
    navDashboard: 'ダッシュボード',
    navPrompt: 'プロンプト追跡',
    navOptimizer: 'SEO/AEO 最適化',
    navPricing: '料金',
    navInquiry: '問い合わせ',
    paidTitle: 'オープンベータ プロンプト追跡',
    paidDesc: 'ログイン済みアカウントはデモで最大5件のプロンプトを試せます。',
    promptQueryLabel: 'プロンプト / クエリ (1行に1件)',
    promptUrlLabel: '対象 URL',
    brandLabel: 'ブランド名 (任意)',
    promptSubmit: 'プロンプト追跡を実行',
    resultTitle: '結果',
    outputIdle: '準備完了。',
    outputError: 'エラー',
    paidPolicy: `オープンベータ: ログインアカウントごとに ${PROMPT_INCLUDED_COUNT} 件。デモ有効ソース: ${DEMO_ACTIVE_LLM.join(', ')} / ${DEMO_ACTIVE_ENGINES.join(', ')}。`,
    refreshPolicy: '更新ポリシー: 毎週 (LLM/API 高コスト機能)。',
    freeDisabled: 'オープンベータのプロンプト追跡は Google ログインが必要です。以下にサンプル結果を表示します。',
    sampleOutput:
      '{\n  "status": "sample",\n  "policy": "open_beta_demo",\n  "result": {\n    "tier": "mentioned_and_linked",\n    "score": 70\n  }\n}',
    promptMissing: 'プロンプトを1件以上入力してください。',
    quotaExceeded: 'このアカウントのオープンベータ上限を超えました。',
    loginButton: 'ログイン (一時停止)',
    loginPaused: 'オープンベータ期間中はログインを一時停止しています。現在はゲストデモモードをご利用ください。',
  },
  zh: {
    title: '提示词追踪',
    navMain: '主页',
    navKeyword: '关键词排名',
    navDashboard: '仪表盘',
    navPrompt: '提示词追踪',
    navOptimizer: 'SEO/AEO 优化',
    navPricing: '价格',
    navInquiry: '咨询',
    paidTitle: '开放测试提示词追踪',
    paidDesc: '登录账号可在演示开放测试中最多试用 5 条提示词。',
    promptQueryLabel: '提示词 / 查询 (每行一个)',
    promptUrlLabel: '目标 URL',
    brandLabel: '品牌名 (可选)',
    promptSubmit: '开始提示词追踪',
    resultTitle: '结果',
    outputIdle: '准备就绪。',
    outputError: '错误',
    paidPolicy: `开放测试规则: 每个登录账号 ${PROMPT_INCLUDED_COUNT} 条。演示启用来源: ${DEMO_ACTIVE_LLM.join(', ')} / ${DEMO_ACTIVE_ENGINES.join(', ')}。`,
    refreshPolicy: '刷新策略: 每周 (LLM/API 高成本功能)。',
    freeDisabled: '开放测试提示词追踪需要 Google 登录。下面显示示例结果。',
    sampleOutput:
      '{\n  "status": "sample",\n  "policy": "open_beta_demo",\n  "result": {\n    "tier": "mentioned_and_linked",\n    "score": 70\n  }\n}',
    promptMissing: '请至少输入一条提示词。',
    quotaExceeded: '该账号已超过开放测试配额。',
    loginButton: '登录 (暂停)',
    loginPaused: '开放测试期间登录功能暂时停用。当前可使用访客演示模式。',
  },
}

function getDemoClientId() {
  const key = 'demo_client_id'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const created = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  localStorage.setItem(key, created)
  return created
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

  setText('pt-title', 'title')
  setText('pt-nav-main', 'navMain')
  setText('pt-nav-keyword', 'navKeyword')
  setText('pt-nav-dashboard', 'navDashboard')
  setText('pt-nav-prompt', 'navPrompt')
  setText('pt-nav-optimizer', 'navOptimizer')
  setText('pt-nav-pricing', 'navPricing')
  setText('pt-nav-inquiry', 'navInquiry')
  setText('pt-login-btn', 'loginButton')
  setText('pt-paid-title', 'paidTitle')
  setText('pt-paid-desc', 'paidDesc')
  setText('pt-prompt-query-label', 'promptQueryLabel')
  setText('pt-prompt-url-label', 'promptUrlLabel')
  setText('pt-brand-label', 'brandLabel')
  setText('pt-policy-note', 'paidPolicy')
  setText('pt-refresh-note', 'refreshPolicy')
  setText('pt-prompt-submit', 'promptSubmit')
  setText('pt-result-title', 'resultTitle')

  if (!output.dataset.hasResult) {
    output.dataset.state = 'idle'
    output.textContent = t('outputIdle')
  }
}

function checkedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => el.value)
}

function parsePrompts(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function applyDemoGating() {
  if (!promptSubmitBtn) return

  promptSubmitBtn.disabled = false
  if (promptQueryInput) {
    promptQueryInput.disabled = false
  }
  if (promptTargetUrlInput) {
    promptTargetUrlInput.disabled = false
  }
  if (promptBrandNameInput) {
    promptBrandNameInput.disabled = false
  }
  if (lockNote) {
    lockNote.classList.add('hidden')
  }

  if (!output.dataset.hasResult) {
    output.dataset.state = 'idle'
    output.textContent = t('outputIdle')
  }
}

async function postJson(url, payload) {
  const token = localStorage.getItem('access_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(apiUrl(url), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
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
  return data
}

document.getElementById('prompt-track-form').addEventListener('submit', async (event) => {
  event.preventDefault()

  const prompts = parsePrompts(document.getElementById('prompt-query').value)
  if (!prompts.length) {
    output.dataset.hasResult = '1'
    output.dataset.state = 'error'
    output.textContent = `${t('outputError')}: ${t('promptMissing')}`
    return
  }
  try {
    const data = await postJson('/api/prompt-track', {
      query: prompts[0],
      queries: prompts,
      target_url: document.getElementById('prompt-target-url').value.trim(),
      demo_client_id: getDemoClientId(),
      brand_name: document.getElementById('prompt-brand-name').value.trim() || null,
      llm_sources: checkedValues('llm-source'),
      search_engines: checkedValues('prompt-engine'),
    })

    output.dataset.hasResult = '1'
    output.dataset.state = 'result'
    output.textContent = JSON.stringify(data, null, 2)
  } catch (error) {
    output.dataset.hasResult = '1'
    output.dataset.state = 'error'
    output.textContent = `${t('outputError')}: ${error.message}`
  }
})

if (languageSelect) {
  languageSelect.addEventListener('change', (event) => {
    applyLanguage(event.target.value)
  })
}

if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    alert(t('loginPaused'))
  })
}

applyLanguage(currentLanguage)
applyDemoGating()
