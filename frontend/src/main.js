import '../style.css'
import Chart from 'chart.js/auto'

let token = localStorage.getItem('access_token')
let guestSingleUsed = sessionStorage.getItem('guest_single_used') === '1'

const tabButtons = document.querySelectorAll('.tab-link')
const tabPanels = document.querySelectorAll('.tab-panel')

const analyzeBtn = document.getElementById('analyze-btn')
const targetUrlInput = document.getElementById('target-url')
const analysisResult = document.getElementById('analysis-result')
const reportContent = document.getElementById('report-content')
const postAnalysisCta = document.getElementById('post-analysis-cta')

const charts = {
  score: null,
  geoLatency: null,
  statusMix: null,
}

const openLoginBtn = document.getElementById('open-login-btn')
const openRegisterBtn = document.getElementById('open-register-btn')
const logoutBtn = document.getElementById('logout-btn')

const authModal = document.getElementById('auth-modal')
const loginContainer = document.getElementById('login-container')
const registerContainer = document.getElementById('register-container')

const loginForm = document.getElementById('login-form')
const registerForm = document.getElementById('register-form')
const toRegister = document.getElementById('to-register')
const toLogin = document.getElementById('to-login')
const closeAuthModalBtn = document.getElementById('close-auth-modal')

const ctaOpenPricing = document.getElementById('cta-open-pricing')
const ctaOpenLogin = document.getElementById('cta-open-login')
const sitemapAnalyzeBtn = document.getElementById('sitemap-analyze-btn')
const enterpriseForm = document.getElementById('enterprise-form')

function setAuthButtons() {
  if (token) {
    openLoginBtn.classList.add('hidden')
    openRegisterBtn.classList.add('hidden')
    logoutBtn.classList.remove('hidden')
  } else {
    openLoginBtn.classList.remove('hidden')
    openRegisterBtn.classList.remove('hidden')
    logoutBtn.classList.add('hidden')
  }
}

function openAuthModal(mode) {
  authModal.classList.remove('hidden')
  if (mode === 'register') {
    loginContainer.classList.add('hidden')
    registerContainer.classList.remove('hidden')
  } else {
    registerContainer.classList.add('hidden')
    loginContainer.classList.remove('hidden')
  }
}

function closeAuthModal() {
  authModal.classList.add('hidden')
}

function switchTab(tabName) {
  tabButtons.forEach((button) => {
    if (button.dataset.tab === tabName) {
      button.classList.add('active')
    } else {
      button.classList.remove('active')
    }
  })

  tabPanels.forEach((panel) => {
    if (panel.id === `tab-${tabName}`) {
      panel.classList.remove('hidden')
    } else {
      panel.classList.add('hidden')
    }
  })
}

async function extractErrorMessage(res, fallbackMessage) {
  const text = await res.text()
  if (!text) return fallbackMessage

  try {
    const data = JSON.parse(text)
    return data.detail || data.message || fallbackMessage
  } catch {
    return text
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatTime(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function normalizeStatus(value) {
  if (typeof value !== 'string') return 'info'
  const lower = value.toLowerCase()
  if (lower.includes('pass')) return 'pass'
  if (lower.includes('warn')) return 'warn'
  if (lower.includes('fail')) return 'fail'
  return 'info'
}

function toBadge(status) {
  const kind = normalizeStatus(status)
  if (kind === 'pass') return { className: 'badge-pass', label: 'Pass' }
  if (kind === 'warn') return { className: 'badge-warn', label: 'Warn' }
  if (kind === 'fail') return { className: 'badge-fail', label: 'Fail' }
  return { className: 'badge-info', label: 'Info' }
}

function collectSeoChecks(seoResult) {
  if (!seoResult || typeof seoResult !== 'object') return []
  return [
    { label: 'Meta Title', data: seoResult.meta_title },
    { label: 'Meta Description', data: seoResult.meta_description },
    { label: 'Canonical', data: seoResult.canonical },
    { label: 'Robots', data: seoResult.robots },
    { label: 'Viewport', data: seoResult.viewport },
    { label: 'Open Graph', data: seoResult.open_graph },
    { label: 'Structured Data', data: seoResult.structured_data },
    { label: 'Hreflang', data: seoResult.hreflang },
    { label: 'Heading Structure', data: seoResult.heading_structure },
    { label: 'Images', data: seoResult.images },
    { label: 'Content Length', data: seoResult.content_length },
  ]
    .filter((item) => item.data && typeof item.data === 'object')
    .map((item) => ({
      ...item,
      status: item.data.status || 'Info',
      statusType: normalizeStatus(item.data.status || ''),
      detail: item.data.details || '',
    }))
}

function collectAeoChecks(aeoResult) {
  if (!aeoResult || typeof aeoResult !== 'object') return []
  return [
    { label: 'Answer First', data: aeoResult.answer_first },
    { label: 'Content Structure', data: aeoResult.content_structure },
    { label: 'AEO Schema', data: aeoResult.structured_data_deep_dive },
    { label: 'Readability', data: aeoResult.readability_signal },
    { label: 'E-E-A-T Signals', data: aeoResult.e_e_a_t_signals },
  ]
    .filter((item) => item.data && typeof item.data === 'object')
    .map((item) => ({
      ...item,
      status: item.data.status || 'Info',
      statusType: normalizeStatus(item.data.status || ''),
      detail: item.data.details || '',
    }))
}

function renderStatusRows(checks, emptyText) {
  if (!checks.length) {
    return `<p class="dashboard-empty">${emptyText}</p>`
  }

  return checks
    .map((check) => {
      const badge = toBadge(check.status)
      return `
        <li class="status-row">
          <div>
            <p class="status-label">${escapeHtml(check.label)}</p>
            <p class="status-detail">${escapeHtml(check.detail || 'No details')}</p>
          </div>
          <span class="status-badge ${badge.className}">${badge.label}</span>
        </li>
      `
    })
    .join('')
}

function renderGeoRows(geoResult) {
  if (!geoResult || typeof geoResult !== 'object') {
    return '<p class="dashboard-empty">No GEO data</p>'
  }

  return Object.entries(geoResult)
    .map(([region, info]) => {
      const ok = Number(info.status) >= 200 && Number(info.status) < 400
      return `
        <li class="geo-row">
          <strong>${escapeHtml(region)}</strong>
          <span class="geo-status ${ok ? 'status-ok' : 'status-bad'}">${ok ? 'Reachable' : 'Issue'}</span>
          <span class="geo-latency">${Number(info.load_time_ms) || 0} ms</span>
        </li>
      `
    })
    .join('')
}

function summarizeStatusCounts(checks) {
  return checks.reduce(
    (acc, check) => {
      if (check.statusType === 'pass') acc.pass += 1
      else if (check.statusType === 'warn') acc.warn += 1
      else if (check.statusType === 'fail') acc.fail += 1
      else acc.info += 1
      return acc
    },
    { pass: 0, warn: 0, fail: 0, info: 0 }
  )
}

function destroyCharts() {
  Object.keys(charts).forEach((key) => {
    if (charts[key]) {
      charts[key].destroy()
      charts[key] = null
    }
  })
}

function renderCharts({ seoScore, geoResult, statusCounts }) {
  const scoreCanvas = document.getElementById('score-chart')
  const geoCanvas = document.getElementById('geo-latency-chart')
  const statusCanvas = document.getElementById('status-mix-chart')

  if (!scoreCanvas || !geoCanvas || !statusCanvas) return

  charts.score = new Chart(scoreCanvas, {
    type: 'doughnut',
    data: {
      labels: ['SEO Score', 'Remaining'],
      datasets: [
        {
          data: [seoScore, Math.max(0, 100 - seoScore)],
          backgroundColor: ['#2d9cdb', '#e6edf6'],
          borderWidth: 0,
          cutout: '72%',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
    },
  })

  const geoEntries = Object.entries(geoResult || {})
  charts.geoLatency = new Chart(geoCanvas, {
    type: 'bar',
    data: {
      labels: geoEntries.map(([region]) => region),
      datasets: [
        {
          label: 'Latency (ms)',
          data: geoEntries.map(([, info]) => Number(info.load_time_ms) || 0),
          backgroundColor: '#4c7cf0',
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#5f6f86' },
          grid: { color: '#edf2fa' },
        },
        x: {
          ticks: { color: '#5f6f86' },
          grid: { display: false },
        },
      },
    },
  })

  charts.statusMix = new Chart(statusCanvas, {
    type: 'doughnut',
    data: {
      labels: ['Pass', 'Warn', 'Fail', 'Info'],
      datasets: [
        {
          data: [statusCounts.pass, statusCounts.warn, statusCounts.fail, statusCounts.info],
          backgroundColor: ['#11a36a', '#f2b736', '#e94f37', '#8ea2c1'],
          borderWidth: 0,
          cutout: '66%',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            color: '#4a5a72',
          },
        },
      },
    },
  })
}

function renderReport(data) {
  const seoResult = data?.seo_result || {}
  const aeoResult = data?.aeo_result || {}
  const geoResult = data?.geo_result || {}

  const seoScore = Number(seoResult.score) || 0
  const seoChecks = collectSeoChecks(seoResult)
  const aeoChecks = collectAeoChecks(aeoResult)
  const allChecks = [...seoChecks, ...aeoChecks]

  const seoPass = seoChecks.filter((check) => check.statusType === 'pass').length
  const aeoPass = aeoChecks.filter((check) => check.statusType === 'pass').length
  const statusCounts = summarizeStatusCounts(allChecks)

  const geoEntries = Object.entries(geoResult)
  const successfulRegions = geoEntries.filter(
    ([, info]) => Number(info.status) >= 200 && Number(info.status) < 400
  ).length
  const avgLatency = geoEntries.length
    ? Math.round(
        geoEntries.reduce((sum, [, info]) => sum + (Number(info.load_time_ms) || 0), 0) /
          geoEntries.length
      )
    : 0

  const words = Number(seoResult?.content_length?.word_count) || 0
  const missingAlt = Number(seoResult?.images?.missing_alt) || 0

  const issueList = allChecks.filter((check) => check.statusType !== 'pass').slice(0, 6)

  const html = `
    <section class="dashboard-hero">
      <div>
        <h3>Analysis Dashboard</h3>
        <p class="dashboard-url">${escapeHtml(data.url || '')}</p>
        <p class="dashboard-sub">Generated at ${formatTime(new Date())}</p>
      </div>
      <div class="score-shell">
        <div class="chart-box chart-score"><canvas id="score-chart"></canvas></div>
        <div class="score-center">
          <strong>${seoScore}</strong>
          <span>SEO Score</span>
        </div>
      </div>
    </section>

    <section class="kpi-grid">
      <article class="kpi-card"><p>SEO Checks</p><h4>${seoPass}/${seoChecks.length || 0}</h4></article>
      <article class="kpi-card"><p>AEO Checks</p><h4>${aeoPass}/${aeoChecks.length || 0}</h4></article>
      <article class="kpi-card"><p>Global Reach</p><h4>${successfulRegions}/${geoEntries.length || 0}</h4></article>
      <article class="kpi-card"><p>Avg Latency</p><h4>${avgLatency}ms</h4></article>
    </section>

    <section class="dashboard-grid">
      <article class="dashboard-card">
        <div class="card-head"><h4>SEO Essentials</h4></div>
        <ul class="status-list">${renderStatusRows(seoChecks, 'No SEO checks available')}</ul>
      </article>

      <article class="dashboard-card">
        <div class="card-head"><h4>AEO Signals</h4></div>
        <ul class="status-list">${renderStatusRows(aeoChecks, 'No AEO checks available')}</ul>
      </article>

      <article class="dashboard-card dashboard-chart-card">
        <div class="card-head"><h4>Check Status Mix</h4></div>
        <div class="chart-box chart-medium"><canvas id="status-mix-chart"></canvas></div>
      </article>

      <article class="dashboard-card dashboard-chart-card">
        <div class="card-head"><h4>Regional Latency</h4></div>
        <div class="chart-box chart-medium"><canvas id="geo-latency-chart"></canvas></div>
        <ul class="geo-list">${renderGeoRows(geoResult)}</ul>
      </article>

      <article class="dashboard-card">
        <div class="card-head"><h4>Content Snapshot</h4></div>
        <div class="meta-grid">
          <div class="meta-chip"><span>Words</span><strong>${words}</strong></div>
          <div class="meta-chip"><span>Missing Alt</span><strong>${missingAlt}</strong></div>
          <div class="meta-chip"><span>Currencies</span><strong>${
            seoResult?.geo_signals?.found_currencies?.length || 0
          }</strong></div>
          <div class="meta-chip"><span>Phone Formats</span><strong>${
            seoResult?.geo_signals?.found_phones?.length || 0
          }</strong></div>
        </div>
      </article>

      <article class="dashboard-card">
        <div class="card-head"><h4>Immediate Fixes</h4></div>
        <ul class="issue-list">
          ${
            issueList.length
              ? issueList
                  .map(
                    (issue) => `<li><strong>${escapeHtml(issue.label)}</strong><span>${escapeHtml(issue.detail || issue.status)}</span></li>`
                  )
                  .join('')
              : '<li><strong>No critical issues</strong><span>Core checks are passing.</span></li>'
          }
        </ul>
      </article>
    </section>
  `

  reportContent.innerHTML = html
  analysisResult.classList.remove('hidden')

  destroyCharts()
  renderCharts({ seoScore, geoResult, statusCounts })
}

analyzeBtn.addEventListener('click', async () => {
  const url = targetUrlInput.value.trim()
  if (!url) {
    alert('Please enter a URL.')
    return
  }

  if (!token && guestSingleUsed) {
    postAnalysisCta.classList.remove('hidden')
    switchTab('pricing')
    alert('Guest mode supports one single URL analysis. Login + paid plan is required for full sitemap analysis.')
    return
  }

  analyzeBtn.disabled = true
  analyzeBtn.innerText = 'Analyzing...'

  try {
    const headers = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url,
        include_aeo: true,
        include_pagespeed: false,
      }),
    })

    if (!res.ok) {
      const message = await extractErrorMessage(res, 'Analysis request failed')
      throw new Error(message)
    }

    const data = await res.json()
    renderReport(data)
    postAnalysisCta.classList.remove('hidden')

    if (!token) {
      guestSingleUsed = true
      sessionStorage.setItem('guest_single_used', '1')
    }
  } catch (err) {
    alert(`Analysis failed: ${err.message}`)
  } finally {
    analyzeBtn.disabled = false
    analyzeBtn.innerText = 'Analyze URL'
  }
})

tabButtons.forEach((button) => {
  button.addEventListener('click', () => switchTab(button.dataset.tab))
})

openLoginBtn.addEventListener('click', () => openAuthModal('login'))
openRegisterBtn.addEventListener('click', () => openAuthModal('register'))
closeAuthModalBtn.addEventListener('click', closeAuthModal)
toRegister.addEventListener('click', () => openAuthModal('register'))
toLogin.addEventListener('click', () => openAuthModal('login'))
authModal.addEventListener('click', (event) => {
  if (event.target === authModal) closeAuthModal()
})

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  try {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const res = await fetch('/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    })

    if (!res.ok) {
      const message = await extractErrorMessage(res, 'Login failed')
      throw new Error(message)
    }

    const data = await res.json()
    token = data.access_token
    localStorage.setItem('access_token', token)
    setAuthButtons()
    closeAuthModal()
    alert('Logged in successfully.')
  } catch (err) {
    alert(err.message)
  }
})

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const email = document.getElementById('reg-email').value.trim()
  const password = document.getElementById('reg-password').value

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const message = await extractErrorMessage(res, 'Registration failed')
      throw new Error(message)
    }

    alert('Registration complete. Please login.')
    openAuthModal('login')
  } catch (err) {
    alert(err.message)
  }
})

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('access_token')
  token = null
  setAuthButtons()
  alert('Logged out.')
})

ctaOpenPricing.addEventListener('click', () => switchTab('pricing'))
ctaOpenLogin.addEventListener('click', () => openAuthModal('login'))

sitemapAnalyzeBtn.addEventListener('click', () => {
  if (!token) {
    switchTab('pricing')
    alert('Login and paid subscription are required for full sitemap analysis.')
    return
  }

  alert('Frontend API connection for full sitemap analysis will be wired in the next step. Backend batch endpoints are ready.')
})

enterpriseForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const company = document.getElementById('company-name').value.trim()
  const email = document.getElementById('contact-email').value.trim()
  const needs = document.getElementById('enterprise-needs').value.trim()

  const subject = encodeURIComponent(`[Enterprise Inquiry] ${company}`)
  const body = encodeURIComponent(`Company: ${company}\nEmail: ${email}\n\nNeeds:\n${needs}`)
  window.location.href = `mailto:enterprise@searchscope.example?subject=${subject}&body=${body}`
})

setAuthButtons()
switchTab('analyze')
