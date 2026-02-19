import { applyDocumentLanguage, getStoredLanguage, setStoredLanguage } from './core/session'
import { apiUrl } from './core/api'
import { createLoadingController } from './core/loading'

const output = document.getElementById('kr-output')
const languageSelect = document.getElementById('language-select')
const submitBtn = document.getElementById('kr-submit')
const loginBtn = document.getElementById('kr-login-btn')
const SESSION_KEY = 'kr_page_state_v1'
const loading = createLoadingController({
  modalId: 'kr-loading-modal',
  defaultMessage: 'Loading...',
})

let currentLanguage = getStoredLanguage('en')
let lastRankResponse = null
let isSubmitting = false

const I18N = {
  en: {
    title: 'Search Rank Dashboard',
    navMain: 'Main',
    navDashboard: 'Dashboard',
    navKeyword: 'Search Rank',
    navPrompt: 'Prompt Tracker',
    navOptimizer: 'SEO/AEO Optimizer',
    navPricing: 'Pricing',
    navInquiry: 'Inquiry',
    freeTitle: 'Open Beta: Search Rank',
    freeDesc: 'Track your URL position for one search query in dashboard format.',
    querySingleLabel: 'Search Query',
    queryLabel: 'Additional Queries (Coming Soon)',
    querySinglePlaceholder: 'best ai seo platform',
    urlLabel: 'Target URL',
    policyNote: 'Open beta: single query dashboard tracking. Multi-query is coming soon.',
    refreshNote: 'Refresh policy: daily (lightweight search tracking).',
    submit: 'Run Search Rank',
    submitting: 'Loading...',
    resultTitle: 'Search Rank Dashboard',
    outputIdle: 'Run search rank tracking to view dashboard.',
    outputError: 'Error',
    rankPaused: 'Search rank tracking is temporarily paused during open beta.',
    missingQuery: 'Enter a search query.',
    loginButton: 'Login (Open Beta)',
    loginPaused: 'Login is paused during open beta. Guest mode is active.',
    engine: 'Engine',
    rank: 'Rank',
    status: 'Status',
    resultCount: 'Result Count',
    query: 'Query',
    targetUrl: 'Target URL',
    found: 'Found',
    notFound: 'Not Found',
  },
  ko: {
    title: '검색 순위 추적 대시보드',
    navMain: '메인',
    navDashboard: '대시보드',
    navKeyword: '검색 순위 추적',
    navPrompt: '프롬프트 추적',
    navOptimizer: 'SEO/AEO 최적화',
    navPricing: '요금제',
    navInquiry: '문의',
    freeTitle: '오픈 베타: 검색 순위 추적',
    freeDesc: '입력한 검색어 기준으로 내 URL 노출 순위를 대시보드 형태로 확인합니다.',
    querySingleLabel: '검색어',
    queryLabel: '추가 검색어 (Coming Soon)',
    querySinglePlaceholder: 'ai seo 플랫폼',
    urlLabel: '대상 URL',
    policyNote: '오픈 베타: 단일 검색어 추적만 제공하며 다중 검색어는 오픈 예정입니다.',
    refreshNote: '갱신 주기: 매일 (경량 검색 추적).',
    submit: '검색 순위 실행',
    submitting: '로딩 중...',
    resultTitle: '검색 순위 추적 대시보드',
    outputIdle: '검색 순위를 실행하면 대시보드가 표시됩니다.',
    outputError: '오류',
    rankPaused: '오픈 베타 기간 동안 검색 순위 추적이 일시 중단되었습니다.',
    missingQuery: '검색어를 입력해주세요.',
    loginButton: '로그인(오픈베타)',
    loginPaused: '오픈 베타 기간에는 로그인이 일시 중단되며 게스트 모드가 활성화됩니다.',
    engine: '엔진',
    rank: '순위',
    status: '상태',
    resultCount: '결과 수',
    query: '검색어',
    targetUrl: '대상 URL',
    found: '노출됨',
    notFound: '미노출',
  },
  ja: {
    title: '検索順位トラッキング ダッシュボード',
    navMain: 'メイン',
    navDashboard: 'ダッシュボード',
    navKeyword: '検索順位トラッキング',
    navPrompt: 'プロンプト追跡',
    navOptimizer: 'SEO/AEO 最適化',
    navPricing: '料金',
    navInquiry: '問い合わせ',
    freeTitle: 'オープンベータ: 検索順位トラッキング',
    freeDesc: '入力した検索語で対象 URL の表示順位をダッシュボードで確認します。',
    querySingleLabel: '検索クエリ',
    queryLabel: '追加クエリ (Coming Soon)',
    querySinglePlaceholder: 'ai seo platform',
    urlLabel: '対象 URL',
    policyNote: 'オープンベータ: 単一クエリのみ提供。複数クエリは近日公開。',
    refreshNote: '更新ポリシー: 毎日 (軽量トラッキング)。',
    submit: '検索順位を実行',
    submitting: '読み込み中...',
    resultTitle: '検索順位トラッキング ダッシュボード',
    outputIdle: '実行するとダッシュボードが表示されます。',
    outputError: 'エラー',
    rankPaused: 'オープンベータ期間中、検索順位トラッキングは一時停止中です。',
    missingQuery: '検索クエリを入力してください。',
    loginButton: 'ログイン（オープンベータ）',
    loginPaused: 'オープンベータ期間中はログインを一時停止しています。',
    engine: 'エンジン',
    rank: '順位',
    status: '状態',
    resultCount: '結果数',
    query: 'クエリ',
    targetUrl: '対象 URL',
    found: '表示',
    notFound: '未表示',
  },
  zh: {
    title: '搜索排名追踪仪表盘',
    navMain: '主页',
    navDashboard: '仪表盘',
    navKeyword: '搜索排名追踪',
    navPrompt: '提示词追踪',
    navOptimizer: 'SEO/AEO 优化',
    navPricing: '价格',
    navInquiry: '咨询',
    freeTitle: '开放测试: 搜索排名追踪',
    freeDesc: '按输入搜索词查看目标 URL 的排名位置。',
    querySingleLabel: '搜索词',
    queryLabel: '附加搜索词 (Coming Soon)',
    querySinglePlaceholder: 'ai seo 平台',
    urlLabel: '目标 URL',
    policyNote: '开放测试: 当前仅支持单搜索词追踪，多搜索词即将开放。',
    refreshNote: '刷新策略: 每日 (轻量追踪)。',
    submit: '执行搜索排名',
    submitting: '加载中...',
    resultTitle: '搜索排名追踪仪表盘',
    outputIdle: '执行后将显示仪表盘。',
    outputError: '错误',
    rankPaused: '开放测试期间，搜索排名追踪暂时停用。',
    missingQuery: '请输入搜索词。',
    loginButton: '登录（开放测试）',
    loginPaused: '开放测试期间登录已暂停，访客模式可用。',
    engine: '引擎',
    rank: '排名',
    status: '状态',
    resultCount: '结果数',
    query: '搜索词',
    targetUrl: '目标 URL',
    found: '已出现',
    notFound: '未出现',
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
  setText('kr-policy-note', 'policyNote')
  setText('kr-refresh-note', 'refreshNote')
  if (submitBtn) {
    submitBtn.textContent = isSubmitting ? t('submitting') : t('submit')
  }
  setText('kr-result-title', 'resultTitle')
  setText('kr-login-btn', 'loginButton')

  const singleInput = document.getElementById('kr-query-single')
  if (singleInput) singleInput.placeholder = t('querySinglePlaceholder')

  if (output.dataset.state === 'result' && lastRankResponse) {
    renderDashboard(lastRankResponse)
    return
  }

  if (!output.dataset.hasResult) {
    output.dataset.state = 'idle'
    output.textContent = t('outputIdle')
  }
}

function setSubmittingState(active) {
  isSubmitting = active
  if (!submitBtn) return

  submitBtn.disabled = active || output.dataset.paused === '1'
  submitBtn.textContent = active ? t('submitting') : t('submit')

  if (active) {
    loading.show(t('submitting'))
    return
  }
  loading.hide()
}

function saveSessionState() {
  const queryInput = document.getElementById('kr-query-single')
  const targetUrlInput = document.getElementById('kr-target-url')

  const snapshot = {
    query: queryInput?.value || '',
    targetUrl: targetUrlInput?.value || '',
    hasResult: Boolean(output?.dataset?.hasResult),
    outputState: output?.dataset?.state || 'idle',
    resultData: lastRankResponse,
    errorText: output?.dataset?.state === 'error' ? output.textContent : '',
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot))
}

function restoreSessionState() {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return

  try {
    const saved = JSON.parse(raw)
    const queryInput = document.getElementById('kr-query-single')
    const targetUrlInput = document.getElementById('kr-target-url')

    if (queryInput && typeof saved.query === 'string') queryInput.value = saved.query
    if (targetUrlInput && typeof saved.targetUrl === 'string') targetUrlInput.value = saved.targetUrl

    if (saved?.resultData && saved.outputState === 'result') {
      lastRankResponse = saved.resultData
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

function setPausedState(message) {
  output.dataset.hasResult = '1'
  output.dataset.state = 'error'
  output.dataset.paused = '1'
  output.textContent = message || `${t('outputError')}: ${t('rankPaused')}`
  setSubmittingState(false)
  submitBtn.disabled = true
}

function renderDashboard(response) {
  lastRankResponse = response

  const query = response?.query || '-'
  const targetUrl = response?.target_url || '-'
  const byQuery = response?.results?.[query] || {}
  const rows = Object.entries(byQuery)
  const rankedRows = rows.filter(([, info]) => Number.isInteger(info?.rank))
  const unavailableRows = rows.filter(([, info]) => String(info?.status || '').toLowerCase() === 'unavailable')
  const bestRank = rankedRows.length
    ? Math.min(...rankedRows.map(([, info]) => Number(info.rank)))
    : null

  const statusBadgeClass = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'ok') return 'inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200'
    if (normalized === 'unavailable') return 'inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200'
    if (normalized === 'error') return 'inline-flex rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-200'
    return 'inline-flex rounded-full bg-slate-500/15 px-2 py-0.5 text-[11px] font-semibold text-slate-200'
  }

  const tableRows = rows
    .map(([engine, info]) => {
      const rank = Number.isInteger(info?.rank) ? `#${info.rank}` : '-'
      const status = info?.status || 'unknown'
      const resultCount = Number(info?.result_count || 0)
      const found = Number.isInteger(info?.rank) ? t('found') : t('notFound')
      return `<tr class="border-t border-slate-800/60"><td class="px-3 py-2 text-slate-200">${engine}</td><td class="px-3 py-2 text-white font-semibold">${rank}</td><td class="px-3 py-2 text-slate-300"><span class="${statusBadgeClass(status)}">${status}</span></td><td class="px-3 py-2 text-slate-300">${resultCount}</td><td class="px-3 py-2 text-slate-300">${found}</td></tr>`
    })
    .join('')

  output.innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('engine')}</p><h4 class="mt-1 text-lg font-bold text-white">${rows.length}</h4></article>
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('rank')}</p><h4 class="mt-1 text-lg font-bold text-white">${bestRank ? `#${bestRank}` : '-'}</h4></article>
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('found')}</p><h4 class="mt-1 text-lg font-bold text-emerald-300">${rankedRows.length}</h4></article>
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('notFound')}</p><h4 class="mt-1 text-lg font-bold text-rose-300">${rows.length - rankedRows.length}</h4></article>
      </div>
      ${unavailableRows.length ? `<p class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">Search provider returned no results for ${unavailableRows.length} engine(s). Check API key/CX or query coverage.</p>` : ''}
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article class="rounded-xl border border-slate-800/60 bg-slate-950/35 p-3"><p class="text-xs text-slate-400">${t('query')}</p><h4 class="mt-1 text-sm font-semibold text-white">${query}</h4></article>
        <article class="rounded-xl border border-slate-800/60 bg-slate-950/35 p-3"><p class="text-xs text-slate-400">${t('targetUrl')}</p><h4 class="mt-1 text-sm font-semibold text-white break-all">${targetUrl}</h4></article>
      </div>
      <div class="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/35">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-900/60 text-slate-300">
            <tr>
              <th class="px-3 py-2">${t('engine')}</th>
              <th class="px-3 py-2">${t('rank')}</th>
              <th class="px-3 py-2">${t('status')}</th>
              <th class="px-3 py-2">${t('resultCount')}</th>
              <th class="px-3 py-2">Match</th>
            </tr>
          </thead>
          <tbody>${tableRows || `<tr><td colspan="5" class="px-3 py-3 text-slate-400">No data</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `
}

document.getElementById('rank-track-form').addEventListener('submit', async (event) => {
  event.preventDefault()

  const query = (document.getElementById('kr-query-single').value || '').trim()
  if (!query) {
    output.dataset.hasResult = '1'
    output.dataset.state = 'error'
    output.textContent = `${t('outputError')}: ${t('missingQuery')}`
    saveSessionState()
    return
  }

  setSubmittingState(true)
  output.dataset.paused = ''
  try {
    const response = await fetch(apiUrl('/api/search-rank'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        queries: [query],
        target_url: document.getElementById('kr-target-url').value.trim(),
        engines: ['google'],
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
      if (response.status === 503) {
        const detail = data?.detail || t('rankPaused')
        setPausedState(`${t('outputError')}: ${detail}`)
        saveSessionState()
        return
      }
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
