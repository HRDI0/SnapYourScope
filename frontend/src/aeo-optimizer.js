import { applyDocumentLanguage, getStoredLanguage, setStoredLanguage } from './core/session'
import { apiUrl } from './core/api'

const output = document.getElementById('optimizer-output')
const languageSelect = document.getElementById('language-select')
const submitBtn = document.getElementById('ao-submit')
const loginBtn = document.getElementById('ao-login-btn')
const SESSION_KEY = 'ao_page_state_v1'

let currentLanguage = getStoredLanguage('en')
let lastOptimizerResponse = null

const I18N = {
  en: {
    title: 'SEO/AEO Optimizer Dashboard',
    navMain: 'Main',
    navKeyword: 'Search Rank',
    navDashboard: 'Dashboard',
    navPrompt: 'Prompt Tracker',
    navAeo: 'SEO/AEO Optimizer',
    navPricing: 'Pricing',
    navInquiry: 'Inquiry',
    paidTitle: 'Open Beta Recommendation Workflow',
    paidDesc: 'Provides traditional SEO fixes and GEO-paper aligned AEO guidance from URL analysis.',
    urlLabel: 'Target URL',
    submit: 'Generate Recommendations',
    resultTitle: 'Recommendation Dashboard',
    outputIdle: 'Submit URL to generate dashboard recommendations.',
    outputError: 'Error',
    loginButton: 'Login (Open Beta)',
    loginPaused: 'Login is paused during open beta. Guest mode is active.',
    priority: 'Priority',
    category: 'Category',
    titleCol: 'Recommendation',
    detail: 'Detail',
  },
  ko: {
    title: 'SEO/AEO 최적화 대시보드',
    navMain: '메인',
    navKeyword: '검색 순위 추적',
    navDashboard: '대시보드',
    navPrompt: '프롬프트 추적',
    navAeo: 'SEO/AEO 최적화',
    navPricing: '요금제',
    navInquiry: '문의',
    paidTitle: '오픈 베타 추천 워크플로우',
    paidDesc: 'URL 분석 기반 전통 SEO 개선안과 GEO 논문 기반 AEO 개선안을 제공합니다.',
    urlLabel: '대상 URL',
    submit: '추천 생성',
    resultTitle: '추천 대시보드',
    outputIdle: 'URL 제출 시 추천 대시보드가 생성됩니다.',
    outputError: '오류',
    loginButton: '로그인(오픈베타)',
    loginPaused: '오픈 베타 기간에는 로그인이 일시 중단되며 게스트 모드가 활성화됩니다.',
    priority: '우선순위',
    category: '카테고리',
    titleCol: '추천 항목',
    detail: '상세 설명',
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
  setText('ao-nav-pricing', 'navPricing')
  setText('ao-nav-inquiry', 'navInquiry')
  setText('ao-paid-title', 'paidTitle')
  setText('ao-paid-desc', 'paidDesc')
  setText('ao-url-label', 'urlLabel')
  setText('ao-submit', 'submit')
  setText('ao-result-title', 'resultTitle')
  setText('ao-login-btn', 'loginButton')

  if (output.dataset.state === 'result' && lastOptimizerResponse) {
    renderDashboard(lastOptimizerResponse)
    return
  }

  if (!output.dataset.hasResult) {
    output.dataset.state = 'idle'
    output.textContent = t('outputIdle')
  }
}

function saveSessionState() {
  const optimizerUrlInput = document.getElementById('optimizer-url')
  const snapshot = {
    url: optimizerUrlInput?.value || '',
    hasResult: Boolean(output?.dataset?.hasResult),
    outputState: output?.dataset?.state || 'idle',
    resultData: lastOptimizerResponse,
    errorText: output?.dataset?.state === 'error' ? output.textContent : '',
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot))
}

function restoreSessionState() {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return

  try {
    const saved = JSON.parse(raw)
    const optimizerUrlInput = document.getElementById('optimizer-url')

    if (optimizerUrlInput && typeof saved.url === 'string') {
      optimizerUrlInput.value = saved.url
    }

    if (saved?.resultData && saved.outputState === 'result') {
      lastOptimizerResponse = saved.resultData
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

function renderDashboard(data) {
  lastOptimizerResponse = data

  const recommendations = data?.result?.recommendations || []
  const highPriority = recommendations.filter((item) => String(item.priority).toLowerCase() === 'high').length
  const mediumPriority = recommendations.filter((item) => String(item.priority).toLowerCase() === 'medium').length
  const lowPriority = recommendations.filter((item) => String(item.priority).toLowerCase() === 'low').length
  const rows = recommendations
    .map(
      (item) => `
      <tr class="border-t border-slate-800/60 align-top">
        <td class="px-3 py-2 text-slate-200">${item.priority || '-'}</td>
        <td class="px-3 py-2 text-slate-300">${item.category || '-'}</td>
        <td class="px-3 py-2 text-white font-semibold">${item.title || '-'}</td>
        <td class="px-3 py-2 text-slate-300 break-words leading-6">${item.detail || '-'}</td>
      </tr>
    `
    )
    .join('')

  output.innerHTML = `
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">Total</p><h4 class="mt-1 text-lg font-bold text-white">${recommendations.length}</h4></article>
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">High</p><h4 class="mt-1 text-lg font-bold text-rose-300">${highPriority}</h4></article>
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">Medium</p><h4 class="mt-1 text-lg font-bold text-amber-300">${mediumPriority}</h4></article>
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">Low</p><h4 class="mt-1 text-lg font-bold text-emerald-300">${lowPriority}</h4></article>
      </div>
      <div class="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/35">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-900/60 text-slate-300">
            <tr>
              <th class="px-3 py-2">${t('priority')}</th>
              <th class="px-3 py-2">${t('category')}</th>
              <th class="px-3 py-2">${t('titleCol')}</th>
              <th class="px-3 py-2">${t('detail')}</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="4" class="px-3 py-3 text-slate-400">No recommendations</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `
}

document.getElementById('aeo-optimizer-form').addEventListener('submit', async (event) => {
  event.preventDefault()

  submitBtn.disabled = true
  try {
    const response = await fetch(apiUrl('/api/aeo-optimizer/recommend'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    output.dataset.state = 'result'
    renderDashboard(data)
    saveSessionState()
  } catch (error) {
    output.dataset.hasResult = '1'
    output.dataset.state = 'error'
    output.textContent = `${t('outputError')}: ${error.message}`
    saveSessionState()
  } finally {
    submitBtn.disabled = false
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
