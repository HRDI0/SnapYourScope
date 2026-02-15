import { calculatePromptAddOnMonthly, PROMPT_INCLUDED_COUNT, PROMPT_ADDON_BLOCK_SIZE, PROMPT_ADDON_BLOCK_PRICE_USD } from './core/policy'
import { applyDocumentLanguage, fetchUserTier, getStoredLanguage, isPaidTier, setStoredLanguage } from './core/session'
import { apiUrl } from './core/api'

const output = document.getElementById('result-output')
const languageSelect = document.getElementById('language-select')
const promptSubmitBtn = document.getElementById('pt-prompt-submit')
const promptQueryInput = document.getElementById('prompt-query')
const promptTargetUrlInput = document.getElementById('prompt-target-url')
const promptBrandNameInput = document.getElementById('prompt-brand-name')
const lockNote = document.getElementById('pt-lock-note')

let currentLanguage = getStoredLanguage('en')
let currentTier = 'free'

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
    paidTitle: 'Paid Prompt Tracking (Pro / Enterprise)',
    paidDesc: 'Score mention tier in LLM answers plus linked web search ranking.',
    promptQueryLabel: 'Prompt / Query (one per line)',
    promptUrlLabel: 'Target URL',
    brandLabel: 'Brand Name (optional)',
    promptSubmit: 'Run Prompt Tracking',
    resultTitle: 'Result',
    outputIdle: 'Ready.',
    outputError: 'Error',
    paidPolicy: `Paid policy: ${PROMPT_INCLUDED_COUNT} included; +$${PROMPT_ADDON_BLOCK_PRICE_USD}/month per extra ${PROMPT_ADDON_BLOCK_SIZE} prompts. Scope: SEO + AEO/GEO visibility workflow.`,
    refreshPolicy: 'Refresh policy: weekly (LLM/API-intensive).',
    freeDisabled:
      'Paid prompt tracking is disabled on free tier. Sample output is shown below.',
    sampleOutput:
      '{\n  "status": "sample",\n  "policy": "pro_or_enterprise",\n  "result": {\n    "tier": "mentioned_and_linked",\n    "score": 70\n  }\n}',
    promptMissing: 'Enter at least one prompt.',
    addOnEstimate: 'Estimated add-on: $${amount}/month for this prompt volume.',
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
    paidTitle: '유료 프롬프트 추적 (Pro / Enterprise)',
    paidDesc: 'LLM 응답 티어 점수와 웹 검색 순위를 함께 제공합니다.',
    promptQueryLabel: '프롬프트 / 질의 (한 줄에 하나)',
    promptUrlLabel: '대상 URL',
    brandLabel: '브랜드명 (선택)',
    promptSubmit: '프롬프트 추적 실행',
    resultTitle: '결과',
    outputIdle: '요청을 실행하면 결과가 표시됩니다.',
    outputError: '오류',
    paidPolicy: `유료 정책: 기본 ${PROMPT_INCLUDED_COUNT}개 포함, ${PROMPT_ADDON_BLOCK_SIZE}개 추가마다 월 $${PROMPT_ADDON_BLOCK_PRICE_USD}. 범위: SEO + AEO/GEO 통합 가시성 워크플로우.`,
    refreshPolicy: '갱신 주기: 매주 (LLM/API 고비용 기능).',
    freeDisabled:
      '무료 티어에서는 유료 프롬프트 추적이 비활성화됩니다. 아래 예시 결과를 확인하세요.',
    sampleOutput:
      '{\n  "status": "sample",\n  "policy": "pro_or_enterprise",\n  "result": {\n    "tier": "mentioned_and_linked",\n    "score": 70\n  }\n}',
    promptMissing: '프롬프트를 1개 이상 입력해주세요.',
    addOnEstimate: '현재 입력 기준 예상 추가 과금: 월 $${amount}',
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
    paidTitle: '有料プロンプト追跡 (Pro / Enterprise)',
    paidDesc: 'LLM 応答の言及ティアと連動する検索順位を評価します。',
    promptQueryLabel: 'プロンプト / クエリ (1行に1件)',
    promptUrlLabel: '対象 URL',
    brandLabel: 'ブランド名 (任意)',
    promptSubmit: 'プロンプト追跡を実行',
    resultTitle: '結果',
    outputIdle: '準備完了。',
    outputError: 'エラー',
    paidPolicy: `有料ポリシー: ${PROMPT_INCLUDED_COUNT}件を含み、追加 ${PROMPT_ADDON_BLOCK_SIZE}件ごとに月額 $${PROMPT_ADDON_BLOCK_PRICE_USD}。対象: SEO + AEO/GEO 可視性ワークフロー。`,
    refreshPolicy: '更新ポリシー: 毎週 (LLM/API 高コスト機能)。',
    freeDisabled:
      '無料ティアでは有料プロンプト追跡は無効です。以下にサンプル結果を表示します。',
    sampleOutput:
      '{\n  "status": "sample",\n  "policy": "pro_or_enterprise",\n  "result": {\n    "tier": "mentioned_and_linked",\n    "score": 70\n  }\n}',
    promptMissing: 'プロンプトを1件以上入力してください。',
    addOnEstimate: 'この件数での追加料金見積り: 月額 $${amount}',
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
    paidTitle: '付费提示词追踪 (Pro / Enterprise)',
    paidDesc: '评估 LLM 回答中的品牌提及层级及其关联搜索排名。',
    promptQueryLabel: '提示词 / 查询 (每行一个)',
    promptUrlLabel: '目标 URL',
    brandLabel: '品牌名 (可选)',
    promptSubmit: '开始提示词追踪',
    resultTitle: '结果',
    outputIdle: '准备就绪。',
    outputError: '错误',
    paidPolicy: `付费规则: 含 ${PROMPT_INCLUDED_COUNT} 条，超出后每增加 ${PROMPT_ADDON_BLOCK_SIZE} 条每月 +$${PROMPT_ADDON_BLOCK_PRICE_USD}。范围: SEO + AEO/GEO 可见性工作流。`,
    refreshPolicy: '刷新策略: 每周 (LLM/API 高成本功能)。',
    freeDisabled:
      '免费层级下付费提示词追踪不可用。下面显示示例结果。',
    sampleOutput:
      '{\n  "status": "sample",\n  "policy": "pro_or_enterprise",\n  "result": {\n    "tier": "mentioned_and_linked",\n    "score": 70\n  }\n}',
    promptMissing: '请至少输入一条提示词。',
    addOnEstimate: '按当前数量预估附加费用: 每月 $${amount}',
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

  setText('pt-title', 'title')
  setText('pt-nav-main', 'navMain')
  setText('pt-nav-keyword', 'navKeyword')
  setText('pt-nav-dashboard', 'navDashboard')
  setText('pt-nav-prompt', 'navPrompt')
  setText('pt-nav-optimizer', 'navOptimizer')
  setText('pt-nav-pricing', 'navPricing')
  setText('pt-nav-inquiry', 'navInquiry')
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

function applyPaidGating() {
  const isPaid = isPaidTier(currentTier)
  if (!promptSubmitBtn) return

  promptSubmitBtn.disabled = !isPaid
  if (promptQueryInput) {
    promptQueryInput.disabled = !isPaid
  }
  if (promptTargetUrlInput) {
    promptTargetUrlInput.disabled = !isPaid
  }
  if (promptBrandNameInput) {
    promptBrandNameInput.disabled = !isPaid
  }
  if (lockNote) {
    lockNote.classList.toggle('hidden', isPaid)
  }

  if (!isPaid) {
    output.dataset.hasResult = '1'
    output.dataset.state = 'sample'
    output.textContent = `${t('freeDisabled')}\n\n${t('sampleOutput')}`
  } else if (!output.dataset.hasResult) {
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
  const addOnAmount = calculatePromptAddOnMonthly(prompts.length)

  try {
    const data = await postJson('/api/prompt-track', {
      query: prompts[0],
      queries: prompts,
      target_url: document.getElementById('prompt-target-url').value.trim(),
      brand_name: document.getElementById('prompt-brand-name').value.trim() || null,
      llm_sources: checkedValues('llm-source'),
      search_engines: checkedValues('prompt-engine'),
    })

    if (addOnAmount > 0) {
      alert(t('addOnEstimate').replace('${amount}', String(addOnAmount)))
    }

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

applyLanguage(currentLanguage)
fetchUserTier().then((tier) => {
  currentTier = tier
  applyPaidGating()
})
