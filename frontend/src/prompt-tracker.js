import { PROMPT_INCLUDED_COUNT } from './core/policy'
import { applyDocumentLanguage, getStoredLanguage, setStoredLanguage } from './core/session'
import { apiUrl } from './core/api'
import { createLoadingController } from './core/loading'

const output = document.getElementById('result-output')
const languageSelect = document.getElementById('language-select')
const promptSubmitBtn = document.getElementById('pt-prompt-submit')
const loginBtn = document.getElementById('pt-login-btn')
const SESSION_KEY = 'pt_page_state_v1'
const loading = createLoadingController({
  modalId: 'pt-loading-modal',
  defaultMessage: 'Loading...',
})

let currentLanguage = getStoredLanguage('en')
let lastPromptResponse = null
let isSubmitting = false

const I18N = {
  en: {
    title: 'Prompt Tracker Dashboard',
    navMain: 'Main',
    navKeyword: 'Search Rank',
    navDashboard: 'Dashboard',
    navPrompt: 'Prompt Tracker',
    navOptimizer: 'SEO/AEO Optimizer',
    navPricing: 'Pricing',
    navInquiry: 'Inquiry',
    paidTitle: 'Open Beta Prompt Tracking',
    paidDesc: 'Run user prompt as-is and classify brand mention tier with share links.',
    promptQueryLabel: 'Prompt / Query (one per line)',
    promptUrlLabel: 'Target URL',
    brandLabel: 'Brand Name (reference only)',
    promptSubmit: 'Run Prompt Tracking',
    submitting: 'Loading...',
    resultTitle: 'Prompt Tracker Dashboard',
    outputIdle: 'Run prompt tracking to view dashboard.',
    outputError: 'Error',
    paidPolicy: `Open beta policy: up to ${PROMPT_INCLUDED_COUNT} prompts per request only.`,
    refreshPolicy: 'Refresh policy: weekly (LLM/API-intensive).',
    promptMissing: 'Enter at least one prompt.',
    loginButton: 'Login (Open Beta)',
    loginPaused: 'Login is paused during open beta. Guest mode is active.',
    tablePrompt: 'Prompt',
    tableTier: 'Tier',
    tableReason: 'Tier Description',
    tableLink: 'Share Link',
    noLink: 'Coming Soon!',
    tier1: 'Tier 1',
    tier2: 'Tier 2',
    tier3: 'Tier 3',
    tier4: 'Tier 4',
  },
  ko: {
    title: '프롬프트 추적기 대시보드',
    navMain: '메인',
    navKeyword: '검색 순위 추적',
    navDashboard: '대시보드',
    navPrompt: '프롬프트 추적',
    navOptimizer: 'SEO/AEO 최적화',
    navPricing: '요금제',
    navInquiry: '문의',
    paidTitle: '오픈 베타 프롬프트 추적',
    paidDesc: '사용자 프롬프트 원문만 입력하고, 브랜드 언급 티어와 공유 링크를 표시합니다.',
    promptQueryLabel: '프롬프트 / 질의 (한 줄에 하나)',
    promptUrlLabel: '대상 URL',
    brandLabel: '브랜드명 (참고용)',
    promptSubmit: '프롬프트 추적 실행',
    submitting: '로딩 중...',
    resultTitle: '프롬프트 추적기 대시보드',
    outputIdle: '프롬프트 추적을 실행하면 대시보드가 표시됩니다.',
    outputError: '오류',
    paidPolicy: `오픈 베타 정책: 1회 요청당 최대 ${PROMPT_INCLUDED_COUNT}개 프롬프트만 허용`,
    refreshPolicy: '갱신 주기: 매주 (LLM/API 고비용 기능).',
    promptMissing: '프롬프트를 1개 이상 입력해주세요.',
    loginButton: '로그인(오픈베타)',
    loginPaused: '오픈 베타 기간에는 로그인이 일시 중단되며 게스트 모드가 활성화됩니다.',
    tablePrompt: '프롬프트',
    tableTier: '티어',
    tableReason: '티어 설명',
    tableLink: '공유 링크',
    noLink: 'Coming Soon!',
    tier1: 'Tier 1',
    tier2: 'Tier 2',
    tier3: 'Tier 3',
    tier4: 'Tier 4',
  },
  ja: {
    title: 'プロンプトトラッカーダッシュボード',
    navMain: 'メイン',
    navKeyword: '検索順位トラッキング',
    navDashboard: 'ダッシュボード',
    navPrompt: 'プロンプト追跡',
    navOptimizer: 'SEO/AEO 最適化',
    navPricing: '料金',
    navInquiry: '問い合わせ',
    paidTitle: 'オープンベータ プロンプト追跡',
    paidDesc: '入力プロンプトそのままで実行し、ブランド言及ティアと共有リンクを表示します。',
    promptQueryLabel: 'プロンプト / クエリ (1行に1件)',
    promptUrlLabel: '対象 URL',
    brandLabel: 'ブランド名 (参照用)',
    promptSubmit: 'プロンプト追跡を実行',
    submitting: '読み込み中...',
    resultTitle: 'プロンプトトラッカーダッシュボード',
    outputIdle: '実行するとダッシュボードが表示されます。',
    outputError: 'エラー',
    paidPolicy: `オープンベータ: 1回のリクエストで最大 ${PROMPT_INCLUDED_COUNT} 件のみ`,
    refreshPolicy: '更新ポリシー: 毎週 (LLM/API 高コスト機能)。',
    promptMissing: 'プロンプトを1件以上入力してください。',
    loginButton: 'ログイン（オープンベータ）',
    loginPaused: 'オープンベータ期間中はログインを一時停止しています。',
    tablePrompt: 'プロンプト',
    tableTier: 'ティア',
    tableReason: 'ティア説明',
    tableLink: '共有リンク',
    noLink: 'Coming Soon!',
    tier1: 'Tier 1',
    tier2: 'Tier 2',
    tier3: 'Tier 3',
    tier4: 'Tier 4',
  },
  zh: {
    title: '提示词追踪器仪表盘',
    navMain: '主页',
    navKeyword: '搜索排名追踪',
    navDashboard: '仪表盘',
    navPrompt: '提示词追踪',
    navOptimizer: 'SEO/AEO 优化',
    navPricing: '价格',
    navInquiry: '咨询',
    paidTitle: '开放测试提示词追踪',
    paidDesc: '仅使用用户输入的提示词，输出品牌提及层级与分享链接。',
    promptQueryLabel: '提示词 / 查询 (每行一个)',
    promptUrlLabel: '目标 URL',
    brandLabel: '品牌名 (仅参考)',
    promptSubmit: '开始提示词追踪',
    submitting: '加载中...',
    resultTitle: '提示词追踪器仪表盘',
    outputIdle: '执行后将显示仪表盘。',
    outputError: '错误',
    paidPolicy: `开放测试：仅支持每次请求最多 ${PROMPT_INCLUDED_COUNT} 条`,
    refreshPolicy: '刷新策略: 每周 (LLM/API 高成本功能)。',
    promptMissing: '请至少输入一条提示词。',
    loginButton: '登录（开放测试）',
    loginPaused: '开放测试期间登录已暂停，访客模式可用。',
    tablePrompt: '提示词',
    tableTier: '层级',
    tableReason: '层级说明',
    tableLink: '分享链接',
    noLink: 'Coming Soon!',
    tier1: 'Tier 1',
    tier2: 'Tier 2',
    tier3: 'Tier 3',
    tier4: 'Tier 4',
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
  if (promptSubmitBtn) {
    promptSubmitBtn.textContent = isSubmitting ? t('submitting') : t('promptSubmit')
  }
  setText('pt-result-title', 'resultTitle')

  if (output.dataset.state === 'result' && lastPromptResponse) {
    renderDashboard(lastPromptResponse)
    return
  }

  if (!output.dataset.hasResult) {
    output.dataset.state = 'idle'
    output.textContent = t('outputIdle')
  }
}

function setSubmittingState(active) {
  isSubmitting = active
  if (!promptSubmitBtn) return

  promptSubmitBtn.disabled = active
  promptSubmitBtn.textContent = active ? t('submitting') : t('promptSubmit')

  if (active) {
    loading.show(t('submitting'))
    return
  }
  loading.hide()
}

function setCheckedValues(name, values) {
  const selected = new Set(values || [])
  document.querySelectorAll(`input[name="${name}"]`).forEach((el) => {
    el.checked = selected.has(el.value)
  })
}

function saveSessionState() {
  const promptQueryInput = document.getElementById('prompt-query')
  const promptTargetUrlInput = document.getElementById('prompt-target-url')
  const promptBrandNameInput = document.getElementById('prompt-brand-name')

  const snapshot = {
    promptQuery: promptQueryInput?.value || '',
    targetUrl: promptTargetUrlInput?.value || '',
    brandName: promptBrandNameInput?.value || '',
    llmSources: checkedValues('llm-source'),
    searchEngines: checkedValues('prompt-engine'),
    hasResult: Boolean(output?.dataset?.hasResult),
    outputState: output?.dataset?.state || 'idle',
    resultData: lastPromptResponse,
    errorText: output?.dataset?.state === 'error' ? output.textContent : '',
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot))
}

function restoreSessionState() {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return

  try {
    const saved = JSON.parse(raw)
    const promptQueryInput = document.getElementById('prompt-query')
    const promptTargetUrlInput = document.getElementById('prompt-target-url')
    const promptBrandNameInput = document.getElementById('prompt-brand-name')

    if (promptQueryInput && typeof saved.promptQuery === 'string') {
      promptQueryInput.value = saved.promptQuery
    }
    if (promptTargetUrlInput && typeof saved.targetUrl === 'string') {
      promptTargetUrlInput.value = saved.targetUrl
    }
    if (promptBrandNameInput && typeof saved.brandName === 'string') {
      promptBrandNameInput.value = saved.brandName
    }

    if (Array.isArray(saved.llmSources)) {
      setCheckedValues('llm-source', saved.llmSources)
    }
    if (Array.isArray(saved.searchEngines)) {
      setCheckedValues('prompt-engine', saved.searchEngines)
    }

    if (saved?.resultData && saved.outputState === 'result') {
      lastPromptResponse = saved.resultData
      output.dataset.hasResult = '1'
      output.dataset.state = 'result'
      renderDashboard(saved.resultData)
      return
    }

    if (saved?.hasResult && saved.outputState === 'error' && typeof saved.errorText === 'string') {
      output.dataset.hasResult = '1'
      output.dataset.state = 'error'
      output.textContent = saved.errorText
    }
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
  }
}

function parsePrompts(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function checkedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => el.value)
}

function tierLabel(tier) {
  if (tier === 'tier1_core_mention') return t('tier1')
  if (tier === 'tier2_competitive_mention') return t('tier2')
  if (tier === 'tier3_minor_mention') return t('tier3')
  return t('tier4')
}

function isPublicChatGptShareUrl(url) {
  if (!url || typeof url !== 'string') return false
  return /^https:\/\/chatgpt\.com\/share\/[A-Za-z0-9-]+$/.test(url.trim())
}

function renderDashboard(data) {
  lastPromptResponse = data

  const results = data?.results || []
  const tierCounts = {
    tier1_core_mention: 0,
    tier2_competitive_mention: 0,
    tier3_minor_mention: 0,
    tier4_not_mentioned: 0,
  }

  const rows = results.map((item) => {
    const llm = (item?.llm_results || [])[0] || {}
    if (typeof tierCounts[llm.tier] === 'number') {
      tierCounts[llm.tier] += 1
    }
    const shareUrl = llm?.response_share_url
    const link = isPublicChatGptShareUrl(shareUrl)
      ? `<a href="${shareUrl}" target="_blank" rel="noreferrer" class="block max-w-[18rem] truncate text-violet-300 hover:text-white" title="${shareUrl}">${shareUrl}</a>`
      : t('noLink')
    return `
      <tr class="border-t border-slate-800/60">
        <td class="px-3 py-2 text-slate-200">${item.query || '-'}</td>
        <td class="px-3 py-2 font-semibold text-white">${tierLabel(llm.tier)}</td>
        <td class="px-3 py-2 text-slate-300">${llm.reason || '-'}</td>
        <td class="px-3 py-2 text-slate-300 break-all">${link}</td>
      </tr>
    `
  })

  output.innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('tier1')}</p><h4 class="mt-1 text-lg font-bold text-emerald-300">${tierCounts.tier1_core_mention}</h4></article>
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('tier2')}</p><h4 class="mt-1 text-lg font-bold text-amber-300">${tierCounts.tier2_competitive_mention}</h4></article>
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('tier3')}</p><h4 class="mt-1 text-lg font-bold text-sky-300">${tierCounts.tier3_minor_mention}</h4></article>
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('tier4')}</p><h4 class="mt-1 text-lg font-bold text-rose-300">${tierCounts.tier4_not_mentioned}</h4></article>
      </div>
      <div class="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/35">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-900/60 text-slate-300">
            <tr>
              <th class="px-3 py-2">${t('tablePrompt')}</th>
              <th class="px-3 py-2">${t('tableTier')}</th>
              <th class="px-3 py-2">${t('tableReason')}</th>
              <th class="px-3 py-2">${t('tableLink')}</th>
            </tr>
          </thead>
          <tbody>
            ${rows.join('')}
          </tbody>
        </table>
      </div>
    </div>
  `
}

document.getElementById('prompt-track-form').addEventListener('submit', async (event) => {
  event.preventDefault()

  const prompts = parsePrompts(document.getElementById('prompt-query').value)
  if (!prompts.length) {
    output.dataset.hasResult = '1'
    output.dataset.state = 'error'
    output.textContent = `${t('outputError')}: ${t('promptMissing')}`
    saveSessionState()
    return
  }

  setSubmittingState(true)
  try {
    const response = await fetch(apiUrl('/api/prompt-track'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: prompts[0],
        queries: prompts,
        target_url: document.getElementById('prompt-target-url').value.trim(),
        demo_client_id: getDemoClientId(),
        brand_name: document.getElementById('prompt-brand-name').value.trim() || null,
        llm_sources: checkedValues('llm-source'),
        search_engines: checkedValues('prompt-engine'),
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
    renderDashboard(data)
    saveSessionState()
  } catch (error) {
    output.dataset.hasResult = '1'
    output.dataset.state = 'error'
    output.textContent = `${t('outputError')}: ${error.message}`
    saveSessionState()
  } finally {
    setSubmittingState(false)
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
restoreSessionState()
