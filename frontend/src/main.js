import Chart from 'chart.js/auto'
import { renderComparisonRows, renderIssueBoard } from './ui/renderers'
import { apiUrl } from './core/api'

let token = localStorage.getItem('access_token')

const tabButtons = document.querySelectorAll('.tab-link')
const tabPanels = document.querySelectorAll('.tab-panel')

const analyzeBtn = document.getElementById('analyze-btn')
const targetUrlInput = document.getElementById('target-url')
const analysisResult = document.getElementById('analysis-result')
const reportContent = document.getElementById('report-content')
const postAnalysisCta = document.getElementById('post-analysis-cta')
const comparisonDashboard = document.getElementById('comparison-dashboard')
const comparisonDashboardContent = document.getElementById('comparison-dashboard-content')

const charts = {
  score: null,
  geoLatency: null,
  statusMix: null,
  hybridCorrelation: null,
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
const sitemapUrlInput = document.getElementById('sitemap-url')
const sitemapLockNote = document.getElementById('sitemap-lock-note')
const enterpriseForm = document.getElementById('enterprise-form')
const languageSelect = document.getElementById('language-select')
const planCards = document.querySelectorAll('.plan-card[data-plan]')
const competitorUrlsInput = document.getElementById('competitor-urls')
const sitemapOutput = document.getElementById('sitemap-output')
const googleLoginBtn = document.getElementById('google-login-btn')
const googleRegisterBtn = document.getElementById('google-register-btn')
const PAGE_SESSION_KEY = 'main_page_state_v1'

const urlParams = new URLSearchParams(window.location.search)
let pendingCheckoutPlan = urlParams.get('plan') || null

let latestReportData = null
let latestComparisonReports = []
let currentLanguage = localStorage.getItem('ui_lang') || 'en'
let currentUserTier = 'free'

const appState = {
  currentUrl: null,
  dateRange: '7d',
  seoMetrics: {},
  aeoMetrics: {},
  geoMetrics: {},
  isLoading: false,
  lastError: null,
}

const stateListeners = new Set()
const TAB_ACTIVE_CLASSES = [
  'bg-slate-900/70',
  'border',
  'border-violet-500/30',
  'text-white',
  'shadow-[0_0_0_1px_rgba(168,85,247,0.25)]',
]

const chartValueLabelPlugin = {
  id: 'valueLabels',
  afterDatasetsDraw(chart, _args, pluginOptions) {
    if (!pluginOptions || pluginOptions.enabled === false) return

    const { ctx } = chart
    const fontSize = Number(pluginOptions.fontSize) || 11
    const fontWeight = pluginOptions.fontWeight || '700'
    const defaultColor = pluginOptions.color || '#cbd5e1'
    const defaultOffsetY = Number(pluginOptions.offsetY) || 10

    ctx.save()
    ctx.font = `${fontWeight} ${fontSize}px Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex)
      if (meta.hidden) return

      meta.data.forEach((element, dataIndex) => {
        const raw = dataset?.data?.[dataIndex]
        const numericValue = typeof raw === 'number' ? raw : Number(raw)
        if (!Number.isFinite(numericValue) || numericValue === 0) return

        let labelText = `${numericValue}`
        if (typeof pluginOptions.formatter === 'function') {
          labelText = pluginOptions.formatter(numericValue, {
            chart,
            dataset,
            datasetIndex,
            dataIndex,
            raw,
          })
        }

        if (!labelText) return

        const point =
          typeof element.tooltipPosition === 'function'
            ? element.tooltipPosition()
            : { x: element.x, y: element.y }

        const isArc = 'innerRadius' in element
        const x = point.x
        const y = isArc ? point.y : point.y - defaultOffsetY

        ctx.fillStyle = isArc ? pluginOptions.arcColor || '#f8fafc' : defaultColor
        ctx.fillText(String(labelText), x, y)
      })
    })

    ctx.restore()
  },
}

Chart.register(chartValueLabelPlugin)

function setAppState(nextState) {
  Object.assign(appState, nextState)
  stateListeners.forEach((listener) => listener(appState))
}

function subscribeAppState(listener) {
  stateListeners.add(listener)
  return () => stateListeners.delete(listener)
}

const LOCALES = {
  en: 'en-US',
  ko: 'ko-KR',
  ja: 'ja-JP',
  zh: 'zh-CN',
}

const I18N = {
  en: {
    brandTagline: 'SEO/GEO/AEO Intelligence',
    tabAnalyze: 'Dashboard',
    tabPricing: 'Plans',
    tabEnterprise: 'Inquiry',
    tabKeyword: 'Search Rank',
    tabPrompt: 'Prompt Tracker',
    tabAeo: 'SEO/AEO Optimizer',
    gnbMain: 'Main',
    gnbKeyword: 'Search Rank',
    gnbPrompt: 'Prompt Tracker',
    gnbAeo: 'SEO/AEO Optimizer',
    workspaceEyebrow: 'Analytics Workspace',
    workspaceTitle: 'Competitive Visibility Dashboard',
    login: 'Login (Open Beta)',
    register: 'Google sign-in',
    logout: 'Logout',
    heroEyebrow: 'URL intelligence',
    heroTitle: 'Run a live audit and view all key signals in one screen',
    heroDescription:
      'Inspired by enterprise analytics layouts: KPI ribbon, chart board, and prioritized fixes.',
    heroMetaGuest: 'Guest: one URL analysis',
    heroMetaPro: 'Pro: full sitemap batch',
    heroMetaMode: 'Mode: realtime snapshot',
    competitorLabel: 'Competitor URLs (one per line)',
    competitorPlaceholder: 'https://competitor-a.com',
    competitorPolicy:
      'Open beta: multiple competitor URLs are analyzed and shown as average comparison.',
    targetUrlPlaceholder: 'https://example.com',
    analyzeButton: 'Analyze URL',
    analyzingButton: 'Analyzing...',
    analysisReportTitle: 'Analysis report',
    postCtaTitle: 'Need full sitemap analysis?',
    postCtaDescription:
      'Log in and subscribe to run full-site batch analysis (sitemap parse + URL queue + background run).',
    postCtaPricing: 'View Pricing',
    postCtaLogin: 'Login (Open Beta)',
    batchTitle: 'Full sitemap analysis (paid)',
    batchDescription: 'Backend logic is implemented. Frontend API wiring can be connected next.',
    batchRefreshPolicy: 'Refresh policy: weekly (LLM/API-intensive).',
    sitemapPlaceholder: 'https://example.com/sitemap.xml',
    batchButton: 'Start full analysis',
    pricingTitle: 'Pricing',
    pricingDescription: 'Choose a plan based on crawl depth and workflow scale.',
    pricingClickHint: 'Pro and Enterprise payments are coming soon. Open beta is active now.',
    planFreeTitle: 'Free',
    planFreeF1: 'Single URL report',
    planFreeF2: 'SEO + GEO + AEO snapshot',
    planFreeF3: 'No sitemap batch',
    planProTitle: 'Pro',
    planProF1: 'Full sitemap analysis',
    planProF2: 'URL queue + background batch',
    planProF3: 'Batch status tracking (Coming Soon)',
    planProF4: 'Weekly PDF report delivery (Coming Soon)',
    planEntTitle: 'Enterprise',
    planEntPriceLabel: 'Custom',
    planEntF1: 'Improvement strategy',
    planEntF2: 'Managed optimization workflow',
    planEntF3: 'Dedicated support',
    planEntF4: 'Weekly PDF report delivery (Coming Soon)',
    enterpriseTitle: 'Inquiry for Enterprise Improvement & Management',
    enterpriseDescription:
      'If you want ongoing site improvement and operational management, send an enterprise inquiry.',
    enterpriseBetaNote:
      'Open beta notice: limited stability. If you hit a severe error, please report it via this inquiry form.',
    companyPlaceholder: 'Company name',
    contactPlaceholder: 'Work email',
    needsPlaceholder: 'Tell us your SEO/GEO/AEO goals',
    enterpriseSubmit: 'Send inquiry',
    googleContinue: 'Continue with Google',
    loginTitle: 'Log in',
    registerTitle: 'Create account',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    loginSubmit: 'Sign in',
    registerSubmit: 'Sign up',
    loginSwitchLabel: 'Demo open beta',
    loginSwitchButton: 'Continue with Google',
    registerSwitchLabel: 'Demo open beta',
    registerSwitchButton: 'Continue with Google',
    statusPass: 'Pass',
    statusWarn: 'Warn',
    statusFail: 'Fail',
    statusInfo: 'Info',
    noDetails: 'No details',
    noGeoData: 'No GEO data',
    reachable: 'Reachable',
    issue: 'Issue',
    dashboardTitle: 'Analysis Dashboard',
    generatedAt: 'Generated at',
    seoScoreLabel: 'SEO Score',
    kpiSeoChecks: 'SEO Checks',
    kpiAeoChecks: 'AEO Checks',
    kpiGlobalReach: 'Global Reach',
    kpiAvgLatency: 'Avg Latency',
    sectionSeoEssentials: 'SEO Essentials',
    sectionAeoSignals: 'AEO Signals',
    sectionStatusMix: 'Check Status Mix',
    sectionRegionalLatency: 'Regional Latency',
    sectionContentSnapshot: 'Content Snapshot',
    sectionImmediateFixes: 'Immediate Fixes',
    sectionHybridCorrelation: 'Hybrid Correlation',
    sectionExecutiveOverview: 'Executive Overview',
    kpiMyScore: 'My SEO Score',
    kpiCompetitorAvg: 'Competitor Avg',
    kpiScoreGap: 'Score Gap',
    kpiCompetitorCount: 'Competitors',
    sectionLiveFeed: 'Live Answer Feed',
    zoneSummary: 'Summary',
    zoneAnalysis: 'Analysis',
    zoneAction: 'Action',
    emptySeoChecks: 'No SEO checks available',
    emptyAeoChecks: 'No AEO checks available',
    metaWords: 'Words',
    metaMissingAlt: 'Missing Alt',
    metaCurrencies: 'Currencies',
    metaPhoneFormats: 'Phone Formats',
    noCriticalIssues: 'No critical issues',
    noCriticalIssuesDetail: 'Core checks are passing.',
    issuePriorityP0: 'P0 - Critical',
    issuePriorityP1: 'P1 - Important',
    issuePriorityP2: 'P2 - Monitor',
    issuePriorityEmpty: 'No issues in this priority.',
    emptyUrlAlert: 'Please enter a URL.',
    guestLimitAlert:
      'Guest mode supports one single URL analysis. Login + paid plan is required for full sitemap analysis.',
    analysisFailedPrefix: 'Analysis failed',
    loginSuccess: 'Logged in successfully.',
    registrationComplete: 'Email signup is paused. Continue with Google.',
    logoutSuccess: 'Logged out.',
    sitemapLoginRequired: 'Login and paid subscription are required for full sitemap analysis.',
    sitemapNotWired:
      'Frontend API connection for full sitemap analysis will be wired in the next step. Backend batch endpoints are ready.',
    sitemapPaidOnly: 'This section requires paid tier. Showing sample output for free tier.',
    sitemapSampleOutput:
      '{\n  "status": "sample",\n  "plan_required": ["pro", "enterprise"],\n  "message": "Upgrade to run sitemap batch analysis."\n}',
    enterpriseMailPrefix: '[Enterprise Inquiry]',
    emailAuthPaused: 'Email login is temporarily paused for the demo open beta.',
    paymentComingSoon: 'Payment checkout is coming soon. Open beta is active now.',
    checkoutFailed: 'Checkout creation failed',
    checkoutMissingUrl: 'Checkout URL was not returned',
    checkoutSuccess: 'Payment completed successfully.',
    checkoutCancel: 'Checkout was canceled.',
    enterpriseContactOnly: 'Enterprise plan opens the inquiry tab.',
    paidFeatureDisabled: 'Paid feature is disabled on free tier. Sample output is shown.',
    competitorLimitExceeded: 'Free tier supports one competitor URL. Upgrade for more.',
    competitorProCap: 'Pro plan supports up to 10 competitor URLs. Use Enterprise for more.',
    competitorAddOnEstimate: 'Estimated add-on: $${amount}/month for extra competitor URLs.',
    comparingCompetitors: 'Running competitor comparison analyses...',
    competitorComparisonTitle: 'Competitor Comparison Dashboard',
    competitorAverageLabel: 'Average competitor score',
    yourUrlLabel: 'Your URL',
    competitorLabelShort: 'Competitor',
    searchRankTitle: 'Free Search Rank Tracker',
    searchRankDescription: 'Track where your target URL appears in search results for a keyword.',
    rankQueryPlaceholder: 'best ai seo platform',
    rankTrackButton: 'Check rank',
    rankTrackIdle: 'Run rank tracking to view results.',
    rankQueryMissing: 'Please enter a keyword for rank tracking.',
    rankTrackFailed: 'Rank tracking failed',
    remaining: 'Remaining',
    latencyMs: 'Latency (ms)',
    labelMetaTitle: 'Meta Title',
    labelMetaDescription: 'Meta Description',
    labelCanonical: 'Canonical',
    labelRobots: 'Robots',
    labelViewport: 'Viewport',
    labelOpenGraph: 'Open Graph',
    labelStructuredData: 'Structured Data',
    labelHreflang: 'Hreflang',
    labelHeadingStructure: 'Heading Structure',
    labelImages: 'Images',
    labelContentLength: 'Content Length',
    labelAnswerFirst: 'Answer First',
    labelContentStructure: 'Content Structure',
    labelAeoSchema: 'AEO Schema',
    labelReadability: 'Readability',
    labelEeAtSignals: 'E-E-A-T Signals',
  },
  ko: {
    brandTagline: 'SEO/GEO/AEO 인텔리전스',
    tabAnalyze: '대시보드',
    tabPricing: '요금제',
    tabEnterprise: '문의',
    tabKeyword: '검색 순위 추적',
    tabPrompt: '프롬프트 추적',
    tabAeo: 'SEO/AEO 최적화',
    gnbMain: '메인',
    gnbKeyword: '검색 순위 추적',
    gnbPrompt: '프롬프트 추적',
    gnbAeo: 'SEO/AEO 최적화',
    workspaceEyebrow: '분석 워크스페이스',
    workspaceTitle: '경쟁 가시성 대시보드',
    login: '로그인(오픈베타)',
    register: 'Google 로그인',
    logout: '로그아웃',
    heroEyebrow: 'URL 인텔리전스',
    heroTitle: '라이브 감사를 실행하고 핵심 신호를 한 화면에서 확인하세요',
    heroDescription: '엔터프라이즈 분석 도구 레이아웃을 참고한 KPI/차트/우선수정 중심 화면입니다.',
    heroMetaGuest: '게스트: URL 1회 분석',
    heroMetaPro: '프로: 전체 사이트맵 배치',
    heroMetaMode: '모드: 실시간 스냅샷',
    competitorLabel: '경쟁사 URL (한 줄에 하나)',
    competitorPlaceholder: 'https://competitor-a.com',
    competitorPolicy:
      '오픈 베타: 경쟁사 URL 여러 개를 분석하고 평균 비교까지 제공합니다.',
    targetUrlPlaceholder: 'https://example.com',
    analyzeButton: 'URL 분석',
    analyzingButton: '분석 중...',
    analysisReportTitle: '분석 리포트',
    postCtaTitle: '전체 사이트맵 분석이 필요하신가요?',
    postCtaDescription: '로그인 후 구독하면 전체 사이트 배치 분석(사이트맵 파싱 + URL 큐 + 백그라운드 실행)이 가능합니다.',
    postCtaPricing: '요금제 보기',
    postCtaLogin: '로그인(오픈베타)',
    batchTitle: '전체 사이트맵 분석 (유료)',
    batchDescription: '백엔드 로직은 구현 완료되었습니다. 프론트 API 연동만 남았습니다.',
    batchRefreshPolicy: '갱신 주기: 매주 (LLM/API 고비용 기능).',
    sitemapPlaceholder: 'https://example.com/sitemap.xml',
    batchButton: '전체 분석 시작',
    pricingTitle: '요금제',
    pricingDescription: '크롤링 깊이와 운영 규모에 맞춰 선택하세요.',
    pricingClickHint: 'Pro/Enterprise 결제는 오픈 예정입니다. 현재는 오픈 베타 체험이 가능합니다.',
    planFreeTitle: '무료',
    planFreeF1: '단일 URL 리포트',
    planFreeF2: 'SEO + GEO + AEO 스냅샷',
    planFreeF3: '사이트맵 배치 미지원',
    planProTitle: '프로',
    planProF1: '전체 사이트맵 분석',
    planProF2: 'URL 큐 + 백그라운드 배치',
    planProF3: '배치 상태 추적 (Coming Soon)',
    planProF4: '주간 PDF 보고 전송 기능 (Coming Soon)',
    planEntTitle: '엔터프라이즈',
    planEntPriceLabel: '맞춤형',
    planEntF1: '개선 전략 수립',
    planEntF2: '운영형 최적화 워크플로우',
    planEntF3: '전담 지원',
    planEntF4: '주간 PDF 보고 전송 기능 (Coming Soon)',
    enterpriseTitle: '엔터프라이즈 개선/운영 문의',
    enterpriseDescription: '지속적인 사이트 개선과 운영 관리를 원하시면 문의를 남겨주세요.',
    enterpriseBetaNote: '오픈 베타 안내: 안정성이 제한적일 수 있습니다. 심각한 오류가 발생하면 문의 폼으로 제보해주세요.',
    companyPlaceholder: '회사명',
    contactPlaceholder: '업무용 이메일',
    needsPlaceholder: 'SEO/GEO/AEO 목표를 알려주세요',
    enterpriseSubmit: '문의 보내기',
    googleContinue: 'Google로 계속하기',
    loginTitle: '로그인',
    registerTitle: '계정 만들기',
    emailPlaceholder: '이메일',
    passwordPlaceholder: '비밀번호',
    loginSubmit: '로그인',
    registerSubmit: '가입하기',
    loginSwitchLabel: '데모 오픈 베타',
    loginSwitchButton: 'Google로 계속하기',
    registerSwitchLabel: '데모 오픈 베타',
    registerSwitchButton: 'Google로 계속하기',
    statusPass: '통과',
    statusWarn: '주의',
    statusFail: '실패',
    statusInfo: '정보',
    noDetails: '상세 정보 없음',
    noGeoData: 'GEO 데이터 없음',
    reachable: '접속 가능',
    issue: '이슈',
    dashboardTitle: '분석 대시보드',
    generatedAt: '생성 시각',
    seoScoreLabel: 'SEO 점수',
    kpiSeoChecks: 'SEO 체크',
    kpiAeoChecks: 'AEO 체크',
    kpiGlobalReach: '글로벌 도달',
    kpiAvgLatency: '평균 지연',
    sectionSeoEssentials: 'SEO 핵심 요소',
    sectionAeoSignals: 'AEO 신호',
    sectionStatusMix: '체크 상태 분포',
    sectionRegionalLatency: '지역별 지연시간',
    sectionContentSnapshot: '콘텐츠 스냅샷',
    sectionImmediateFixes: '즉시 수정 항목',
    sectionHybridCorrelation: '하이브리드 상관 분석',
    sectionExecutiveOverview: '요약 개요',
    kpiMyScore: '내 SEO 점수',
    kpiCompetitorAvg: '경쟁사 평균',
    kpiScoreGap: '점수 차이',
    kpiCompetitorCount: '경쟁사 수',
    sectionLiveFeed: '실시간 답변 피드',
    zoneSummary: '요약',
    zoneAnalysis: '분석',
    zoneAction: '실행',
    emptySeoChecks: 'SEO 체크 데이터가 없습니다',
    emptyAeoChecks: 'AEO 체크 데이터가 없습니다',
    metaWords: '단어 수',
    metaMissingAlt: '누락 Alt',
    metaCurrencies: '통화 표기',
    metaPhoneFormats: '전화 포맷',
    noCriticalIssues: '치명 이슈 없음',
    noCriticalIssuesDetail: '핵심 체크가 정상입니다.',
    issuePriorityP0: 'P0 - 긴급',
    issuePriorityP1: 'P1 - 중요',
    issuePriorityP2: 'P2 - 모니터링',
    issuePriorityEmpty: '이 우선순위에는 이슈가 없습니다.',
    emptyUrlAlert: 'URL을 입력해주세요.',
    guestLimitAlert: '게스트 모드는 단일 URL 1회 분석만 가능합니다. 전체 사이트맵 분석은 로그인 + 유료 플랜이 필요합니다.',
    analysisFailedPrefix: '분석 실패',
    loginSuccess: '로그인되었습니다.',
    registrationComplete: '이메일 회원가입은 일시 중단되었습니다. Google 로그인을 사용해주세요.',
    logoutSuccess: '로그아웃되었습니다.',
    sitemapLoginRequired: '전체 사이트맵 분석은 로그인과 유료 구독이 필요합니다.',
    sitemapNotWired: '전체 사이트맵 분석의 프론트 API 연동은 다음 단계에서 연결됩니다. 백엔드 배치 엔드포인트는 준비되어 있습니다.',
    sitemapPaidOnly: '이 섹션은 유료 전용입니다. 무료 계정에는 예시 결과를 표시합니다.',
    sitemapSampleOutput:
      '{\n  "status": "sample",\n  "plan_required": ["pro", "enterprise"],\n  "message": "업그레이드 후 사이트맵 배치 분석을 실행할 수 있습니다."\n}',
    enterpriseMailPrefix: '[엔터프라이즈 문의]',
    emailAuthPaused: '데모 오픈 베타 기간에는 이메일 로그인이 일시 중단됩니다.',
    paymentComingSoon: '결제 체크아웃은 오픈 예정입니다. 현재는 오픈 베타를 이용해주세요.',
    checkoutFailed: '결제 세션 생성 실패',
    checkoutMissingUrl: '체크아웃 URL이 반환되지 않았습니다',
    checkoutSuccess: '결제가 완료되었습니다.',
    checkoutCancel: '결제가 취소되었습니다.',
    enterpriseContactOnly: 'Enterprise 플랜은 문의 탭으로 이동합니다.',
    paidFeatureDisabled: '무료 티어에서는 유료 기능이 비활성화됩니다. 예시 결과를 표시합니다.',
    competitorLimitExceeded: '무료 티어는 경쟁사 URL 1개까지 지원합니다. 업그레이드 후 확장하세요.',
    competitorProCap: 'Pro 플랜의 경쟁사 URL 최대치는 10개입니다. 그 이상은 Enterprise를 이용하세요.',
    competitorAddOnEstimate: '예상 추가 과금: 추가 경쟁사 URL에 대해 월 $${amount}',
    comparingCompetitors: '경쟁사 비교 분석을 실행 중입니다...',
    competitorComparisonTitle: '경쟁사 비교 대시보드',
    competitorAverageLabel: '경쟁사 평균 점수',
    yourUrlLabel: '내 URL',
    competitorLabelShort: '경쟁사',
    searchRankTitle: '무료 검색 순위 추적',
    searchRankDescription: '키워드 기준으로 검색 결과에서 타겟 URL 노출 순위를 확인합니다.',
    rankQueryPlaceholder: '예: ai seo 플랫폼',
    rankTrackButton: '순위 확인',
    rankTrackIdle: '순위 추적을 실행하면 결과가 표시됩니다.',
    rankQueryMissing: '순위 추적용 키워드를 입력해주세요.',
    rankTrackFailed: '순위 추적 실패',
    remaining: '잔여',
    latencyMs: '지연시간 (ms)',
    labelMetaTitle: '메타 타이틀',
    labelMetaDescription: '메타 설명',
    labelCanonical: '캐노니컬',
    labelRobots: '로봇',
    labelViewport: '뷰포트',
    labelOpenGraph: '오픈 그래프',
    labelStructuredData: '구조화 데이터',
    labelHreflang: 'Hreflang',
    labelHeadingStructure: '헤딩 구조',
    labelImages: '이미지',
    labelContentLength: '콘텐츠 길이',
    labelAnswerFirst: '정답 우선',
    labelContentStructure: '콘텐츠 구조',
    labelAeoSchema: 'AEO 스키마',
    labelReadability: '가독성',
    labelEeAtSignals: 'E-E-A-T 신호',
  },
  ja: {
    brandTagline: 'SEO/GEO/AEO インテリジェンス',
    tabAnalyze: 'ダッシュボード',
    tabPricing: '料金',
    tabEnterprise: '問い合わせ',
    tabKeyword: '検索順位トラッキング',
    tabPrompt: 'プロンプト追跡',
    tabAeo: 'SEO/AEO 最適化',
    gnbMain: 'メイン',
    gnbKeyword: '検索順位トラッキング',
    gnbPrompt: 'プロンプト追跡',
    gnbAeo: 'SEO/AEO 最適化',
    workspaceEyebrow: '分析ワークスペース',
    workspaceTitle: '競合可視性ダッシュボード',
    login: 'ログイン（オープンベータ）',
    register: 'Google ログイン',
    logout: 'ログアウト',
    heroEyebrow: 'URL インテリジェンス',
    heroTitle: 'ライブ監査を実行し、主要シグナルを1画面で確認',
    heroDescription: 'エンタープライズ分析UIに基づくKPI・チャート・優先修正ビューです。',
    heroMetaGuest: 'ゲスト: URL 1回分析',
    heroMetaPro: 'Pro: サイトマップ一括分析',
    heroMetaMode: 'モード: リアルタイムスナップショット',
    competitorLabel: '競合 URL（1行に1件）',
    competitorPlaceholder: 'https://competitor-a.com',
    competitorPolicy:
      'オープンベータ: 複数の競合URLを分析し、平均比較を表示します。',
    targetUrlPlaceholder: 'https://example.com',
    analyzeButton: 'URL分析',
    analyzingButton: '分析中...',
    analysisReportTitle: '分析レポート',
    postCtaTitle: 'サイトマップ全体分析が必要ですか？',
    postCtaDescription: 'ログインして購読すると、サイト全体のバッチ分析を実行できます。',
    postCtaPricing: '料金を見る',
    postCtaLogin: 'ログイン（オープンベータ）',
    batchTitle: 'サイトマップ全体分析（有料）',
    batchDescription: 'バックエンド実装は完了しています。フロントAPI接続のみ残っています。',
    batchRefreshPolicy: '更新ポリシー: 毎週 (LLM/API 高コスト機能)。',
    sitemapPlaceholder: 'https://example.com/sitemap.xml',
    batchButton: '全体分析を開始',
    pricingTitle: '料金',
    pricingDescription: 'クロール深度と運用規模に合わせて選択してください。',
    pricingClickHint: 'Pro / Enterprise の決済は近日公開です。現在はオープンベータをご利用ください。',
    planFreeTitle: '無料',
    planFreeF1: '単一URLレポート',
    planFreeF2: 'SEO + GEO + AEO スナップショット',
    planFreeF3: 'サイトマップ一括なし',
    planProTitle: 'Pro',
    planProF1: 'サイトマップ全体分析',
    planProF2: 'URLキュー + バックグラウンド処理',
    planProF3: 'バッチ状況トラッキング (Coming Soon)',
    planProF4: '週次 PDF レポート配信 (Coming Soon)',
    planEntTitle: 'エンタープライズ',
    planEntPriceLabel: 'カスタム',
    planEntF1: '改善戦略',
    planEntF2: '運用型最適化ワークフロー',
    planEntF3: '専任サポート',
    planEntF4: '週次 PDF レポート配信 (Coming Soon)',
    enterpriseTitle: 'エンタープライズ改善/運用',
    enterpriseDescription: '継続的な改善と運用管理をご希望の場合はお問い合わせください。',
    enterpriseBetaNote:
      'オープンベータのお知らせ: 安定性が限定される場合があります。重大なエラーはこの問い合わせフォームからご報告ください。',
    companyPlaceholder: '会社名',
    contactPlaceholder: '業務用メール',
    needsPlaceholder: 'SEO/GEO/AEOの目標を入力してください',
    enterpriseSubmit: '問い合わせを送信',
    googleContinue: 'Google で続行',
    loginTitle: 'ログイン',
    registerTitle: 'アカウント作成',
    emailPlaceholder: 'メール',
    passwordPlaceholder: 'パスワード',
    loginSubmit: 'サインイン',
    registerSubmit: '登録',
    loginSwitchLabel: 'デモオープンベータ',
    loginSwitchButton: 'Google で続行',
    registerSwitchLabel: 'デモオープンベータ',
    registerSwitchButton: 'Google で続行',
    statusPass: '合格',
    statusWarn: '警告',
    statusFail: '失敗',
    statusInfo: '情報',
    noDetails: '詳細なし',
    noGeoData: 'GEOデータなし',
    reachable: '到達可能',
    issue: '問題',
    dashboardTitle: '分析ダッシュボード',
    generatedAt: '生成時刻',
    seoScoreLabel: 'SEO スコア',
    kpiSeoChecks: 'SEO チェック',
    kpiAeoChecks: 'AEO チェック',
    kpiGlobalReach: 'グローバル到達',
    kpiAvgLatency: '平均遅延',
    sectionSeoEssentials: 'SEO 主要項目',
    sectionAeoSignals: 'AEO シグナル',
    sectionStatusMix: 'ステータス分布',
    sectionRegionalLatency: '地域別遅延',
    sectionContentSnapshot: 'コンテンツ概要',
    sectionImmediateFixes: '即時修正項目',
    sectionHybridCorrelation: 'ハイブリッド相関',
    sectionExecutiveOverview: 'エグゼクティブ概要',
    kpiMyScore: '自社 SEO スコア',
    kpiCompetitorAvg: '競合平均',
    kpiScoreGap: 'スコア差',
    kpiCompetitorCount: '競合数',
    sectionLiveFeed: 'ライブ回答フィード',
    zoneSummary: '要約',
    zoneAnalysis: '分析',
    zoneAction: '実行',
    emptySeoChecks: 'SEOチェックがありません',
    emptyAeoChecks: 'AEOチェックがありません',
    metaWords: '単語数',
    metaMissingAlt: 'Alt欠落',
    metaCurrencies: '通貨表記',
    metaPhoneFormats: '電話形式',
    noCriticalIssues: '重大な問題なし',
    noCriticalIssuesDetail: '主要チェックは正常です。',
    issuePriorityP0: 'P0 - 緊急',
    issuePriorityP1: 'P1 - 重要',
    issuePriorityP2: 'P2 - 監視',
    issuePriorityEmpty: 'この優先度に問題はありません。',
    emptyUrlAlert: 'URLを入力してください。',
    guestLimitAlert: 'ゲストモードでは単一URL分析は1回のみです。サイトマップ全体分析にはログインと有料プランが必要です。',
    analysisFailedPrefix: '分析失敗',
    loginSuccess: 'ログインしました。',
    registrationComplete: 'メール登録は一時停止中です。Google ログインをご利用ください。',
    logoutSuccess: 'ログアウトしました。',
    sitemapLoginRequired: 'サイトマップ全体分析にはログインと有料購読が必要です。',
    sitemapNotWired: 'サイトマップ全体分析のフロントAPI接続は次のステップで実装されます。',
    sitemapPaidOnly: 'このセクションは有料専用です。無料アカウントにはサンプル結果を表示します。',
    sitemapSampleOutput:
      '{\n  "status": "sample",\n  "plan_required": ["pro", "enterprise"],\n  "message": "アップグレード後にサイトマップ一括分析を実行できます。"\n}',
    enterpriseMailPrefix: '[エンタープライズ問い合わせ]',
    emailAuthPaused: 'デモオープンベータ期間中はメールログインを一時停止しています。',
    paymentComingSoon: '決済チェックアウトは近日公開です。現在はオープンベータをご利用ください。',
    checkoutFailed: '決済セッション作成失敗',
    checkoutMissingUrl: 'チェックアウトURLが返されませんでした',
    checkoutSuccess: '決済が完了しました。',
    checkoutCancel: '決済はキャンセルされました。',
    enterpriseContactOnly: 'Enterprise プランは問い合わせタブを開きます。',
    paidFeatureDisabled: '無料ティアでは有料機能は無効です。サンプル結果を表示します。',
    competitorLimitExceeded: '無料ティアは競合 URL を1件までサポートします。アップグレードで拡張できます。',
    competitorProCap: 'Pro プランの競合 URL 上限は 10 件です。超過分は Enterprise を利用してください。',
    competitorAddOnEstimate: '追加競合 URL の想定追加料金: 月額 $${amount}',
    comparingCompetitors: '競合比較分析を実行中です...',
    competitorComparisonTitle: '競合比較ダッシュボード',
    competitorAverageLabel: '競合平均スコア',
    yourUrlLabel: '自社 URL',
    competitorLabelShort: '競合',
    searchRankTitle: '無料検索順位トラッカー',
    searchRankDescription: 'キーワードに対して対象URLの検索順位を確認します。',
    rankQueryPlaceholder: '例: ai seo platform',
    rankTrackButton: '順位を確認',
    rankTrackIdle: '順位トラッキングを実行すると結果が表示されます。',
    rankQueryMissing: '順位トラッキング用キーワードを入力してください。',
    rankTrackFailed: '順位トラッキング失敗',
    remaining: '残り',
    latencyMs: '遅延 (ms)',
    labelMetaTitle: 'メタタイトル',
    labelMetaDescription: 'メタディスクリプション',
    labelCanonical: 'カノニカル',
    labelRobots: 'Robots',
    labelViewport: 'Viewport',
    labelOpenGraph: 'Open Graph',
    labelStructuredData: '構造化データ',
    labelHreflang: 'Hreflang',
    labelHeadingStructure: '見出し構造',
    labelImages: '画像',
    labelContentLength: 'コンテンツ長',
    labelAnswerFirst: '回答優先',
    labelContentStructure: 'コンテンツ構造',
    labelAeoSchema: 'AEO スキーマ',
    labelReadability: '可読性',
    labelEeAtSignals: 'E-E-A-T シグナル',
  },
  zh: {
    brandTagline: 'SEO/GEO/AEO 智能分析',
    tabAnalyze: '仪表盘',
    tabPricing: '价格',
    tabEnterprise: '咨询',
    tabKeyword: '搜索排名追踪',
    tabPrompt: '提示词追踪',
    tabAeo: 'SEO/AEO 优化',
    gnbMain: '主页',
    gnbKeyword: '搜索排名追踪',
    gnbPrompt: '提示词追踪',
    gnbAeo: 'SEO/AEO 优化',
    workspaceEyebrow: '分析工作区',
    workspaceTitle: '竞争可见性仪表盘',
    login: '登录（开放测试）',
    register: 'Google 登录',
    logout: '退出登录',
    heroEyebrow: 'URL 智能分析',
    heroTitle: '执行实时审计，并在一个页面查看全部关键信号',
    heroDescription: '参考企业分析产品布局，提供 KPI、图表与优先修复视图。',
    heroMetaGuest: '访客：可分析 1 个 URL',
    heroMetaPro: 'Pro：完整站点地图批量分析',
    heroMetaMode: '模式：实时快照',
    competitorLabel: '竞争对手 URL（每行一个）',
    competitorPlaceholder: 'https://competitor-a.com',
    competitorPolicy:
      '开放测试: 支持分析多个竞争对手 URL 并显示平均对比。',
    targetUrlPlaceholder: 'https://example.com',
    analyzeButton: '分析 URL',
    analyzingButton: '分析中...',
    analysisReportTitle: '分析报告',
    postCtaTitle: '需要完整站点地图分析吗？',
    postCtaDescription: '登录并订阅后，可运行全站批量分析。',
    postCtaPricing: '查看价格',
    postCtaLogin: '登录（开放测试）',
    batchTitle: '完整站点地图分析（付费）',
    batchDescription: '后端逻辑已完成，前端 API 接线可在下一步完成。',
    batchRefreshPolicy: '刷新策略: 每周 (LLM/API 高成本功能)。',
    sitemapPlaceholder: 'https://example.com/sitemap.xml',
    batchButton: '开始完整分析',
    pricingTitle: '价格',
    pricingDescription: '根据抓取深度与运营规模选择方案。',
    pricingClickHint: '专业版/企业版支付即将开放。当前可先体验开放测试。',
    planFreeTitle: '免费',
    planFreeF1: '单 URL 报告',
    planFreeF2: 'SEO + GEO + AEO 快照',
    planFreeF3: '不支持站点地图批量',
    planProTitle: '专业版',
    planProF1: '完整站点地图分析',
    planProF2: 'URL 队列 + 后台批处理',
    planProF3: '批处理状态跟踪 (Coming Soon)',
    planProF4: '每周 PDF 报告发送功能 (Coming Soon)',
    planEntTitle: '企业版',
    planEntPriceLabel: '定制',
    planEntF1: '优化策略',
    planEntF2: '托管优化工作流',
    planEntF3: '专属支持',
    planEntF4: '每周 PDF 报告发送功能 (Coming Soon)',
    enterpriseTitle: '企业优化与运营',
    enterpriseDescription: '如需持续优化和运营管理，请提交企业咨询。',
    enterpriseBetaNote: '开放测试提示：稳定性可能受限。如遇严重错误，请通过该咨询表单反馈。',
    companyPlaceholder: '公司名称',
    contactPlaceholder: '工作邮箱',
    needsPlaceholder: '请描述你的 SEO/GEO/AEO 目标',
    enterpriseSubmit: '发送企业咨询',
    googleContinue: '使用 Google 继续',
    loginTitle: '登录',
    registerTitle: '创建账号',
    emailPlaceholder: '邮箱',
    passwordPlaceholder: '密码',
    loginSubmit: '登录',
    registerSubmit: '注册',
    loginSwitchLabel: '演示开放测试',
    loginSwitchButton: '使用 Google 继续',
    registerSwitchLabel: '演示开放测试',
    registerSwitchButton: '使用 Google 继续',
    statusPass: '通过',
    statusWarn: '警告',
    statusFail: '失败',
    statusInfo: '信息',
    noDetails: '暂无详情',
    noGeoData: '暂无 GEO 数据',
    reachable: '可达',
    issue: '问题',
    dashboardTitle: '分析仪表盘',
    generatedAt: '生成时间',
    seoScoreLabel: 'SEO 评分',
    kpiSeoChecks: 'SEO 检查',
    kpiAeoChecks: 'AEO 检查',
    kpiGlobalReach: '全球可达',
    kpiAvgLatency: '平均延迟',
    sectionSeoEssentials: 'SEO 核心项',
    sectionAeoSignals: 'AEO 信号',
    sectionStatusMix: '状态分布',
    sectionRegionalLatency: '区域延迟',
    sectionContentSnapshot: '内容快照',
    sectionImmediateFixes: '立即修复项',
    sectionHybridCorrelation: '混合相关性',
    sectionExecutiveOverview: '总览摘要',
    kpiMyScore: '我的 SEO 分数',
    kpiCompetitorAvg: '竞品平均',
    kpiScoreGap: '分数差',
    kpiCompetitorCount: '竞品数量',
    sectionLiveFeed: '实时回答流',
    zoneSummary: '摘要',
    zoneAnalysis: '分析',
    zoneAction: '行动',
    emptySeoChecks: '暂无 SEO 检查数据',
    emptyAeoChecks: '暂无 AEO 检查数据',
    metaWords: '词数',
    metaMissingAlt: '缺失 Alt',
    metaCurrencies: '货币标记',
    metaPhoneFormats: '电话格式',
    noCriticalIssues: '无关键问题',
    noCriticalIssuesDetail: '核心检查均通过。',
    issuePriorityP0: 'P0 - 紧急',
    issuePriorityP1: 'P1 - 重要',
    issuePriorityP2: 'P2 - 观察',
    issuePriorityEmpty: '该优先级暂无问题。',
    emptyUrlAlert: '请输入 URL。',
    guestLimitAlert: '访客模式仅支持 1 次单 URL 分析。完整站点地图分析需要登录并订阅付费方案。',
    analysisFailedPrefix: '分析失败',
    loginSuccess: '登录成功。',
    registrationComplete: '邮箱注册已暂停，请使用 Google 登录。',
    logoutSuccess: '已退出登录。',
    sitemapLoginRequired: '完整站点地图分析需要登录和付费订阅。',
    sitemapNotWired: '完整站点地图分析的前端 API 接线将在下一步完成，后端已就绪。',
    sitemapPaidOnly: '此区域仅限付费用户。免费账号将显示示例结果。',
    sitemapSampleOutput:
      '{\n  "status": "sample",\n  "plan_required": ["pro", "enterprise"],\n  "message": "升级后可执行站点地图批量分析。"\n}',
    enterpriseMailPrefix: '[企业咨询]',
    emailAuthPaused: '演示开放测试期间，邮箱登录暂时停用。',
    paymentComingSoon: '支付结账即将开放，当前请先体验开放测试。',
    checkoutFailed: '创建支付会话失败',
    checkoutMissingUrl: '未返回支付链接',
    checkoutSuccess: '支付已完成。',
    checkoutCancel: '支付已取消。',
    enterpriseContactOnly: 'Enterprise 方案将打开咨询标签页。',
    paidFeatureDisabled: '免费层级下付费功能不可用。显示示例结果。',
    competitorLimitExceeded: '免费层级仅支持 1 个竞争对手 URL。升级后可扩展。',
    competitorProCap: 'Pro 方案最多支持 10 个竞争对手 URL。超过请使用 Enterprise。',
    competitorAddOnEstimate: '额外竞争对手 URL 预估附加费用: 每月 $${amount}',
    comparingCompetitors: '正在执行竞争对手对比分析...',
    competitorComparisonTitle: '竞争对手对比仪表盘',
    competitorAverageLabel: '竞争对手平均分',
    yourUrlLabel: '我的 URL',
    competitorLabelShort: '竞争对手',
    searchRankTitle: '免费搜索排名追踪',
    searchRankDescription: '按关键词查看目标 URL 在搜索结果中的位置。',
    rankQueryPlaceholder: '例如：ai seo platform',
    rankTrackButton: '查看排名',
    rankTrackIdle: '运行排名追踪后显示结果。',
    rankQueryMissing: '请输入用于排名追踪的关键词。',
    rankTrackFailed: '排名追踪失败',
    remaining: '剩余',
    latencyMs: '延迟 (ms)',
    labelMetaTitle: 'Meta 标题',
    labelMetaDescription: 'Meta 描述',
    labelCanonical: 'Canonical',
    labelRobots: 'Robots',
    labelViewport: 'Viewport',
    labelOpenGraph: 'Open Graph',
    labelStructuredData: '结构化数据',
    labelHreflang: 'Hreflang',
    labelHeadingStructure: '标题结构',
    labelImages: '图片',
    labelContentLength: '内容长度',
    labelAnswerFirst: '答案优先',
    labelContentStructure: '内容结构',
    labelAeoSchema: 'AEO Schema',
    labelReadability: '可读性',
    labelEeAtSignals: 'E-E-A-T 信号',
  },
}

function t(key) {
  return I18N[currentLanguage]?.[key] || I18N.en[key] || key
}

function setText(id, key) {
  const element = document.getElementById(id)
  if (element) element.textContent = t(key)
}

function setPlaceholder(id, key) {
  const element = document.getElementById(id)
  if (element) element.placeholder = t(key)
}

function applyLanguage(lang) {
  currentLanguage = I18N[lang] ? lang : 'en'
  localStorage.setItem('ui_lang', currentLanguage)
  if (languageSelect) languageSelect.value = currentLanguage
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage

  setText('brand-tagline', 'brandTagline')
  setText('tab-main-link', 'gnbMain')
  setText('tab-analyze-btn', 'tabAnalyze')
  setText('tab-pricing-btn', 'tabPricing')
  setText('tab-enterprise-btn', 'tabEnterprise')
  setText('tab-keyword-link', 'tabKeyword')
  setText('tab-prompt-link', 'tabPrompt')
  setText('tab-aeo-link', 'tabAeo')
  setText('gnb-main', 'gnbMain')
  setText('gnb-keyword', 'gnbKeyword')
  setText('gnb-prompt', 'gnbPrompt')
  setText('gnb-aeo', 'gnbAeo')
  setText('workspace-eyebrow', 'workspaceEyebrow')
  setText('workspace-title', 'workspaceTitle')
  setText('open-login-btn', 'login')
  setText('open-register-btn', 'register')
  setText('logout-btn', 'logout')
  setText('hero-eyebrow', 'heroEyebrow')
  setText('hero-title', 'heroTitle')
  setText('hero-description', 'heroDescription')
  setText('hero-meta-guest', 'heroMetaGuest')
  setText('hero-meta-pro', 'heroMetaPro')
  setText('hero-meta-mode', 'heroMetaMode')
  setText('competitor-label', 'competitorLabel')
  setText('competitor-policy', 'competitorPolicy')
  setPlaceholder('target-url', 'targetUrlPlaceholder')
  setPlaceholder('competitor-urls', 'competitorPlaceholder')
  setText('analyze-btn', 'analyzeButton')
  setText('analysis-report-title', 'analysisReportTitle')
  setText('comparison-dashboard-title', 'competitorComparisonTitle')
  setText('post-cta-title', 'postCtaTitle')
  setText('post-cta-description', 'postCtaDescription')
  setText('cta-open-pricing', 'postCtaPricing')
  setText('cta-open-login', 'postCtaLogin')
  setText('batch-title', 'batchTitle')
  setText('batch-description', 'batchDescription')
  setText('batch-refresh-policy', 'batchRefreshPolicy')
  setPlaceholder('sitemap-url', 'sitemapPlaceholder')
  setText('sitemap-analyze-btn', 'batchButton')
  if (sitemapOutput && !sitemapOutput.dataset.hasResult) {
    sitemapOutput.dataset.state = 'idle'
    sitemapOutput.textContent = t('sitemapPaidOnly')
  }
  setText('pricing-title', 'pricingTitle')
  setText('pricing-description', 'pricingDescription')
  setText('pricing-click-hint', 'pricingClickHint')
  setText('plan-free-title', 'planFreeTitle')
  setText('plan-free-f1', 'planFreeF1')
  setText('plan-free-f2', 'planFreeF2')
  setText('plan-free-f3', 'planFreeF3')
  setText('plan-pro-title', 'planProTitle')
  setText('plan-pro-f1', 'planProF1')
  setText('plan-pro-f2', 'planProF2')
  setText('plan-pro-f3', 'planProF3')
  setText('plan-pro-f4', 'planProF4')
  setText('plan-ent-title', 'planEntTitle')
  setText('plan-ent-price-label', 'planEntPriceLabel')
  setText('plan-ent-f1', 'planEntF1')
  setText('plan-ent-f2', 'planEntF2')
  setText('plan-ent-f3', 'planEntF3')
  setText('plan-ent-f4', 'planEntF4')
  setText('enterprise-title', 'enterpriseTitle')
  setText('enterprise-description', 'enterpriseDescription')
  setText('enterprise-beta-note', 'enterpriseBetaNote')
  setPlaceholder('company-name', 'companyPlaceholder')
  setPlaceholder('contact-email', 'contactPlaceholder')
  setPlaceholder('enterprise-needs', 'needsPlaceholder')
  setText('enterprise-submit', 'enterpriseSubmit')
  setText('login-title', 'loginTitle')
  setText('register-title', 'registerTitle')
  setPlaceholder('email', 'emailPlaceholder')
  setPlaceholder('password', 'passwordPlaceholder')
  setPlaceholder('reg-email', 'emailPlaceholder')
  setPlaceholder('reg-password', 'passwordPlaceholder')
  setText('login-submit', 'loginSubmit')
  setText('register-submit', 'registerSubmit')
  setText('google-login-btn', 'googleContinue')
  setText('google-register-btn', 'googleContinue')
  setText('login-switch-label', 'loginSwitchLabel')
  setText('to-register', 'loginSwitchButton')
  setText('register-switch-label', 'registerSwitchLabel')
  setText('to-login', 'registerSwitchButton')
  setText('email-auth-paused-note', 'emailAuthPaused')

  if (latestReportData) {
    renderReport(latestReportData, latestComparisonReports)
    renderComparisonDashboard(latestReportData, latestComparisonReports)
    if (postAnalysisCta) {
      postAnalysisCta.classList.remove('hidden')
    }
  }
}

function savePageSessionState() {
  const snapshot = {
    targetUrl: targetUrlInput?.value || '',
    competitorUrls: competitorUrlsInput?.value || '',
    reportData: latestReportData,
    comparisonReports: latestComparisonReports,
    postCtaVisible: postAnalysisCta ? !postAnalysisCta.classList.contains('hidden') : false,
  }

  sessionStorage.setItem(PAGE_SESSION_KEY, JSON.stringify(snapshot))
}

function restorePageSessionState() {
  const raw = sessionStorage.getItem(PAGE_SESSION_KEY)
  if (!raw) return

  try {
    const saved = JSON.parse(raw)

    if (targetUrlInput && typeof saved.targetUrl === 'string') {
      targetUrlInput.value = saved.targetUrl
    }
    if (competitorUrlsInput && typeof saved.competitorUrls === 'string') {
      competitorUrlsInput.value = saved.competitorUrls
    }

    if (saved?.reportData && typeof saved.reportData === 'object') {
      latestReportData = saved.reportData
      latestComparisonReports = Array.isArray(saved.comparisonReports)
        ? saved.comparisonReports
        : []

      renderReport(latestReportData, latestComparisonReports)
      renderComparisonDashboard(latestReportData, latestComparisonReports)

      if (postAnalysisCta && saved.postCtaVisible) {
        postAnalysisCta.classList.remove('hidden')
      }
    }
  } catch {
    sessionStorage.removeItem(PAGE_SESSION_KEY)
  }
}

function isPaidTier() {
  return currentUserTier === 'pro' || currentUserTier === 'enterprise'
}

function applyTierUi() {
  if (!sitemapAnalyzeBtn) return
  const disabled = !isPaidTier()
  sitemapAnalyzeBtn.disabled = disabled
  if (sitemapUrlInput) {
    sitemapUrlInput.disabled = disabled
  }
  if (sitemapLockNote) {
    sitemapLockNote.classList.toggle('hidden', !disabled)
  }
  if (disabled) {
    renderSitemapSample()
  }
}

function renderSitemapSample() {
  if (!sitemapOutput) return
  sitemapOutput.dataset.hasResult = '1'
  sitemapOutput.dataset.state = 'sample'
  sitemapOutput.textContent = `${t('paidFeatureDisabled')}\n\n${t('sitemapSampleOutput')}`
}

async function syncCurrentUserTier() {
  if (!token) {
    currentUserTier = 'free'
    applyTierUi()
    return
  }

  try {
    const response = await fetch(apiUrl('/api/users/me'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      currentUserTier = 'free'
      applyTierUi()
      return
    }
    const data = await response.json()
    currentUserTier = (data?.tier || 'free').toLowerCase()
    applyTierUi()
  } catch {
    currentUserTier = 'free'
    applyTierUi()
  }
}

function parseCompetitorUrls() {
  const raw = competitorUrlsInput?.value || ''
  return raw
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function validateCompetitorLimit(competitorUrls) {
  if (!competitorUrls.length) {
    return { valid: true, addOnAmount: 0 }
  }
  return { valid: true, addOnAmount: 0 }
}

async function createCheckoutSession(plan) {
  pendingCheckoutPlan = plan
  switchTab('pricing')
  alert(t('paymentComingSoon'))
}

function handlePlanSelection(plan) {
  const normalized = (plan || '').toLowerCase()
  if (normalized === 'free') {
    return
  }

  if (normalized === 'enterprise') {
    switchTab('enterprise')
    alert(t('enterpriseContactOnly'))
    return
  }

  if (normalized === 'pro') {
    createCheckoutSession(normalized)
  }
}

function setAuthButtons() {
  openLoginBtn.classList.remove('hidden')
  openRegisterBtn.classList.add('hidden')
  logoutBtn.classList.add('hidden')
}

function openAuthModal(mode) {
  authModal.classList.remove('hidden')
  registerContainer.classList.add('hidden')
  loginContainer.classList.remove('hidden')
}

function closeAuthModal() {
  authModal.classList.add('hidden')
}

function switchTab(tabName) {
  tabButtons.forEach((button) => {
    if (!button.dataset?.tab) return
    const isActive = button.dataset.tab === tabName
    button.classList.toggle('active', isActive)
    if (isActive) {
      button.classList.add(...TAB_ACTIVE_CLASSES)
    } else {
      button.classList.remove(...TAB_ACTIVE_CLASSES)
    }
    button.setAttribute('aria-selected', isActive ? 'true' : 'false')
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
  return new Intl.DateTimeFormat(LOCALES[currentLanguage] || LOCALES.en, {
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
  if (kind === 'pass') {
    return {
      className:
        'inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/25',
      label: t('statusPass'),
    }
  }
  if (kind === 'warn') {
    return {
      className:
        'inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-500/25',
      label: t('statusWarn'),
    }
  }
  if (kind === 'fail') {
    return {
      className:
        'inline-flex items-center rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-200 ring-1 ring-rose-500/25',
      label: t('statusFail'),
    }
  }
  return {
    className:
      'inline-flex items-center rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-200 ring-1 ring-slate-500/25',
    label: t('statusInfo'),
  }
}

function collectSeoChecks(seoResult) {
  if (!seoResult || typeof seoResult !== 'object') return []
  return [
    { label: t('labelMetaTitle'), data: seoResult.meta_title },
    { label: t('labelMetaDescription'), data: seoResult.meta_description },
    { label: t('labelCanonical'), data: seoResult.canonical },
    { label: t('labelRobots'), data: seoResult.robots },
    { label: t('labelViewport'), data: seoResult.viewport },
    { label: t('labelOpenGraph'), data: seoResult.open_graph },
    { label: t('labelStructuredData'), data: seoResult.structured_data },
    { label: t('labelHreflang'), data: seoResult.hreflang },
    { label: t('labelHeadingStructure'), data: seoResult.heading_structure },
    { label: t('labelImages'), data: seoResult.images },
    { label: t('labelContentLength'), data: seoResult.content_length },
  ]
    .filter((item) => item.data && typeof item.data === 'object')
    .map((item) => {
      const status = item.data.status || t('statusInfo')
      const statusType = normalizeStatus(item.data.status || '')
      const detail = item.data.details || ''
      return {
        ...item,
        domain: 'seo',
        status,
        statusType,
        detail,
        why: detail || t('noDetails'),
        fixSteps:
          statusType === 'fail'
            ? 'Apply technical fix immediately and re-run crawl verification.'
            : statusType === 'warn'
            ? 'Tune this SEO signal and validate in next analysis run.'
            : 'Keep current SEO setting and monitor regressions.',
        expectedImpact:
          statusType === 'fail'
            ? 'High impact on crawlability/ranking confidence.'
            : statusType === 'warn'
            ? 'Medium impact on consistency and discoverability.'
            : 'Low immediate risk; maintain baseline quality.',
        references: 'SEO Foundation',
      }
    })
}

function collectAeoChecks(aeoResult) {
  if (!aeoResult || typeof aeoResult !== 'object') return []
  return [
    { label: t('labelAnswerFirst'), data: aeoResult.answer_first },
    { label: t('labelContentStructure'), data: aeoResult.content_structure },
    { label: t('labelAeoSchema'), data: aeoResult.structured_data_deep_dive },
    { label: t('labelReadability'), data: aeoResult.readability_signal },
    { label: t('labelEeAtSignals'), data: aeoResult.e_e_a_t_signals },
  ]
    .filter((item) => item.data && typeof item.data === 'object')
    .map((item) => {
      const status = item.data.status || t('statusInfo')
      const statusType = normalizeStatus(item.data.status || '')
      const detail = item.data.details || ''
      return {
        ...item,
        domain: 'aeo',
        status,
        statusType,
        detail,
        why: detail || t('noDetails'),
        fixSteps:
          statusType === 'fail'
            ? 'Update answer-first structure/schema and retest model responses.'
            : statusType === 'warn'
            ? 'Strengthen entity clarity and content framing for AI summaries.'
            : 'Maintain current AEO/GEO structure and monitor mention drift.',
        expectedImpact:
          statusType === 'fail'
            ? 'High impact on AI mention/share visibility.'
            : statusType === 'warn'
            ? 'Medium impact on answer quality and citation rate.'
            : 'Low immediate risk; preserve current mention quality.',
        references: 'AEO/GEO Intelligence',
      }
    })
}

function renderStatusRows(checks, emptyText) {
  if (!checks.length) {
    return `<p class="rounded-xl border border-slate-800/60 bg-slate-950/35 px-4 py-3 text-sm text-slate-400">${emptyText}</p>`
  }

  return checks
    .map((check) => {
      const badge = toBadge(check.status)
      return `
        <li class="flex items-start justify-between gap-4 rounded-xl border border-slate-700/60 bg-slate-950/35 px-4 py-3">
          <div>
            <p class="text-[15px] font-semibold text-white">${escapeHtml(check.label)}</p>
            <p class="mt-1 text-sm leading-6 text-slate-300">${escapeHtml(check.detail || t('noDetails'))}</p>
          </div>
          <span class="${badge.className}">${badge.label}</span>
        </li>
      `
    })
    .join('')
}

function renderGeoRows(geoResult) {
  if (!geoResult || typeof geoResult !== 'object') {
    return `<p class="rounded-xl border border-slate-800/60 bg-slate-950/35 px-4 py-3 text-sm text-slate-400">${t('noGeoData')}</p>`
  }

  return Object.entries(geoResult)
    .map(([region, info]) => {
      const ok = Number(info.status) >= 200 && Number(info.status) < 400
      return `
        <li class="flex items-center justify-between gap-3 rounded-xl border border-slate-800/60 bg-slate-950/35 px-4 py-2">
          <strong class="text-sm text-white">${escapeHtml(region)}</strong>
          <span class="${
            ok
              ? 'inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-200'
              : 'inline-flex items-center rounded-full bg-rose-500/15 px-2 py-1 text-xs font-semibold text-rose-200'
          }">${ok ? t('reachable') : t('issue')}</span>
          <span class="text-xs font-semibold text-slate-300">${Number(info.load_time_ms) || 0} ms</span>
        </li>
      `
    })
    .join('')
}

function renderLiveFeed(checks) {
  const rows = checks.slice(0, 6)
  if (!rows.length) {
    return `<p class="rounded-xl border border-slate-800/60 bg-slate-950/35 px-4 py-3 text-sm text-slate-400">${t('noDetails')}</p>`
  }

  return `
    <ul class="space-y-3">
      ${rows
        .map(
          (check) => `
            <li class="rounded-xl border px-4 py-3 ${
              check.domain === 'seo'
                ? 'border-sky-500/25 bg-sky-500/10'
                : 'border-fuchsia-500/25 bg-fuchsia-500/10'
            }">
              <strong class="block text-sm text-white">${escapeHtml(check.label)}</strong>
              <span class="mt-1 block text-xs text-slate-200">${escapeHtml(check.detail || t('noDetails'))}</span>
            </li>
          `
        )
        .join('')}
    </ul>
  `
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
  const hybridCanvas = document.getElementById('hybrid-correlation-chart')

  if (!scoreCanvas || !geoCanvas || !statusCanvas) return

  const scoreColor = seoScore >= 80 ? '#16a34a' : seoScore >= 60 ? '#f59e0b' : '#dc2626'

  charts.score = new Chart(scoreCanvas, {
    type: 'doughnut',
    data: {
      labels: [t('seoScoreLabel'), t('remaining')],
      datasets: [
        {
          data: [seoScore, Math.max(0, 100 - seoScore)],
          backgroundColor: [scoreColor, '#e5e7eb'],
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
        valueLabels: {
          enabled: true,
          arcColor: '#f8fafc',
          formatter: (value, context) => (context.dataIndex === 0 ? `${value}%` : ''),
        },
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
          label: t('latencyMs'),
          data: geoEntries.map(([, info]) => Number(info.load_time_ms) || 0),
          backgroundColor: geoEntries.map(([, info]) => {
            const latency = Number(info.load_time_ms) || 0
            if (latency <= 900) return '#16a34a'
            if (latency <= 1600) return '#f59e0b'
            return '#dc2626'
          }),
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        valueLabels: {
          enabled: true,
          color: '#cbd5e1',
          formatter: (value) => `${value}ms`,
          offsetY: 12,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
        },
        x: {
          ticks: { color: '#cbd5e1' },
          grid: { display: false },
        },
      },
    },
  })

  charts.statusMix = new Chart(statusCanvas, {
    type: 'doughnut',
    data: {
      labels: [t('statusPass'), t('statusWarn'), t('statusFail'), t('statusInfo')],
      datasets: [
        {
          data: [statusCounts.pass, statusCounts.warn, statusCounts.fail, statusCounts.info],
          backgroundColor: ['#16a34a', '#f59e0b', '#dc2626', '#64748b'],
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
            color: '#cbd5e1',
          },
        },
        valueLabels: {
          enabled: true,
          arcColor: '#f8fafc',
        },
      },
    },
  })

  if (hybridCanvas) {
    const seoRankEquivalent = Math.max(1, 101 - seoScore)
    const mentionSignal = statusCounts.pass + statusCounts.warn

    charts.hybridCorrelation = new Chart(hybridCanvas, {
      type: 'bar',
      data: {
        labels: ['Current'],
        datasets: [
          {
            type: 'line',
            label: 'SEO Rank Signal',
            data: [seoRankEquivalent],
            yAxisID: 'y',
            borderColor: '#0f172a',
            backgroundColor: '#0f172a',
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#0f172a',
          },
          {
            label: 'AEO Mention Signal',
            data: [mentionSignal],
            yAxisID: 'y1',
            backgroundColor: 'rgba(30, 64, 175, 0.75)',
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              color: '#cbd5e1',
            },
          },
          valueLabels: {
            enabled: true,
            color: '#cbd5e1',
            offsetY: 12,
          },
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            reverse: true,
            beginAtZero: false,
            ticks: { color: '#cbd5e1' },
            grid: { color: 'rgba(148, 163, 184, 0.2)' },
          },
          y1: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            ticks: { color: '#cbd5e1' },
            grid: { drawOnChartArea: false },
          },
          x: {
            ticks: { color: '#cbd5e1' },
            grid: { display: false },
          },
        },
      },
    })
  }
}

function renderReport(data, competitorReports = []) {
  latestReportData = data
  latestComparisonReports = competitorReports

  const seoResult = data?.seo_result || {}
  const aeoResult = data?.aeo_result || {}
  const geoResult = data?.geo_result || {}

  const seoScore = Number(seoResult.score) || 0
  const competitorScores = competitorReports
    .map((entry) => Number(entry?.seo_result?.score) || 0)
    .filter((score) => Number.isFinite(score))
  const competitorAvgScore = competitorScores.length
    ? Math.round(competitorScores.reduce((sum, score) => sum + score, 0) / competitorScores.length)
    : 0
  const scoreGap = seoScore - competitorAvgScore
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
    <section id="report-overview" class="space-y-4 rounded-2xl border border-violet-500/25 bg-slate-900/65 p-6 backdrop-blur-xl">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 class="text-xl font-bold text-white">${t('dashboardTitle')}</h3>
          <p class="mt-1 text-sm text-slate-300">${escapeHtml(data.url || '')}</p>
          <p class="mt-1 text-xs text-slate-400">${t('generatedAt')} ${formatTime(new Date())}</p>
        </div>
        <div class="h-36 w-36 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-3"><canvas id="score-chart"></canvas></div>
      </div>
      <div class="rounded-xl border border-slate-800/60 bg-slate-950/35 p-4">
        <h4 class="text-sm font-bold text-white">${t('sectionExecutiveOverview')}</h4>
        <div class="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-6">
          <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('kpiMyScore')}</p><h4 class="mt-1 text-lg font-bold text-white">${seoScore}</h4></article>
          <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('kpiCompetitorAvg')}</p><h4 class="mt-1 text-lg font-bold text-white">${competitorScores.length ? competitorAvgScore : '-'}</h4></article>
          <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('kpiScoreGap')}</p><h4 class="mt-1 text-lg font-bold ${scoreGap >= 0 ? 'text-emerald-300' : 'text-rose-300'}">${competitorScores.length ? scoreGap : '-'}</h4></article>
          <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('kpiCompetitorCount')}</p><h4 class="mt-1 text-lg font-bold text-white">${competitorScores.length}</h4></article>
          <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('kpiSeoChecks')}</p><h4 class="mt-1 text-lg font-bold text-white">${seoPass}/${seoChecks.length || 0}</h4></article>
          <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('kpiAeoChecks')}</p><h4 class="mt-1 text-lg font-bold text-white">${aeoPass}/${aeoChecks.length || 0}</h4></article>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <span class="rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">Critical ${statusCounts.fail}</span>
        <span class="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">Caution ${statusCounts.warn}</span>
        <span class="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Safe ${statusCounts.pass}</span>
      </div>
      <div class="flex flex-wrap gap-2 text-xs font-semibold">
        <a href="#report-seo" class="rounded-lg border border-slate-700/60 bg-slate-950/35 px-3 py-1 text-slate-200 transition hover:text-white">${t('sectionSeoEssentials')}</a>
        <a href="#report-aeo" class="rounded-lg border border-slate-700/60 bg-slate-950/35 px-3 py-1 text-slate-200 transition hover:text-white">${t('sectionAeoSignals')}</a>
        <a href="#report-latency" class="rounded-lg border border-slate-700/60 bg-slate-950/35 px-3 py-1 text-slate-200 transition hover:text-white">${t('sectionRegionalLatency')}</a>
        <a href="#report-fixes" class="rounded-lg border border-slate-700/60 bg-slate-950/35 px-3 py-1 text-slate-200 transition hover:text-white">${t('sectionImmediateFixes')}</a>
      </div>
    </section>
    <section class="grid gap-4 xl:grid-cols-2">
      <article id="report-seo" class="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 backdrop-blur-xl"><h4 class="text-sm font-bold text-white">${t('sectionSeoEssentials')}</h4><ul class="mt-3 space-y-2">${renderStatusRows(seoChecks, t('emptySeoChecks'))}</ul></article>
      <article id="report-aeo" class="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 backdrop-blur-xl"><h4 class="text-sm font-bold text-white">${t('sectionAeoSignals')}</h4><ul class="mt-3 space-y-2">${renderStatusRows(aeoChecks, t('emptyAeoChecks'))}</ul></article>
      <article id="report-latency" class="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 backdrop-blur-xl"><h4 class="text-sm font-bold text-white">${t('sectionRegionalLatency')}</h4><div class="mt-3 h-56"><canvas id="geo-latency-chart"></canvas></div><ul class="mt-3 space-y-2">${renderGeoRows(geoResult)}</ul></article>
      <article class="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 backdrop-blur-xl"><h4 class="text-sm font-bold text-white">${t('sectionStatusMix')}</h4><div class="mt-3 h-56"><canvas id="status-mix-chart"></canvas></div></article>
      <article class="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 backdrop-blur-xl xl:col-span-2"><h4 class="text-sm font-bold text-white">${t('sectionHybridCorrelation')}</h4><div class="mt-3 h-56"><canvas id="hybrid-correlation-chart"></canvas></div></article>
      <article class="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 backdrop-blur-xl xl:col-span-2"><h4 class="text-sm font-bold text-white">${t('sectionContentSnapshot')}</h4><div class="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4"><div class="rounded-xl border border-slate-800/60 bg-slate-950/35 p-3"><span class="block text-xs text-slate-400">${t('metaWords')}</span><strong class="text-lg text-white">${words}</strong></div><div class="rounded-xl border border-slate-800/60 bg-slate-950/35 p-3"><span class="block text-xs text-slate-400">${t('metaMissingAlt')}</span><strong class="text-lg text-white">${missingAlt}</strong></div><div class="rounded-xl border border-slate-800/60 bg-slate-950/35 p-3"><span class="block text-xs text-slate-400">${t('metaCurrencies')}</span><strong class="text-lg text-white">${seoResult?.geo_signals?.found_currencies?.length || 0}</strong></div><div class="rounded-xl border border-slate-800/60 bg-slate-950/35 p-3"><span class="block text-xs text-slate-400">${t('metaPhoneFormats')}</span><strong class="text-lg text-white">${seoResult?.geo_signals?.found_phones?.length || 0}</strong></div></div></article>
    </section>
    <section id="report-fixes">
      <article class="rounded-2xl border border-amber-500/25 bg-slate-900/60 p-6 backdrop-blur-xl"><h4 class="text-sm font-bold text-white">${t('sectionImmediateFixes')}</h4><div class="mt-3">${renderIssueBoard(issueList, escapeHtml, { p0: t('issuePriorityP0'), p1: t('issuePriorityP1'), p2: t('issuePriorityP2'), empty: t('issuePriorityEmpty') })}</div></article>
    </section>
  `

  reportContent.innerHTML = html
  analysisResult.classList.remove('hidden')

  destroyCharts()
  renderCharts({ seoScore, geoResult, statusCounts })
}

function renderComparisonDashboard(primaryReport, competitorReports) {
  if (!comparisonDashboard || !comparisonDashboardContent) return
  if (!competitorReports.length) {
    comparisonDashboard.classList.add('hidden')
    comparisonDashboardContent.innerHTML = ''
    return
  }

  const rows = [
    {
      url: primaryReport.url,
      score: Number(primaryReport?.seo_result?.score) || 0,
      type: t('yourUrlLabel'),
    },
    ...competitorReports.map((entry) => ({
      url: entry.url,
      score: Number(entry?.seo_result?.score) || 0,
      type: t('competitorLabelShort'),
    })),
  ]
  const competitorOnly = rows.filter((row) => row.type === t('competitorLabelShort'))
  const competitorAverage = competitorOnly.length
    ? Math.round(
        competitorOnly.reduce((sum, row) => sum + (Number(row.score) || 0), 0) /
          competitorOnly.length
      )
    : 0

  comparisonDashboardContent.innerHTML = `
    <div class="space-y-4 rounded-xl border border-slate-800/60 bg-slate-950/35 p-4">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('kpiMyScore')}</p><h4 class="mt-1 text-lg font-bold text-white">${Number(primaryReport?.seo_result?.score) || 0}</h4></article>
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('competitorAverageLabel')}</p><h4 class="mt-1 text-lg font-bold text-white">${competitorOnly.length ? competitorAverage : '-'}</h4></article>
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('kpiScoreGap')}</p><h4 class="mt-1 text-lg font-bold ${(Number(primaryReport?.seo_result?.score) || 0) - competitorAverage >= 0 ? 'text-emerald-300' : 'text-rose-300'}">${competitorOnly.length ? (Number(primaryReport?.seo_result?.score) || 0) - competitorAverage : '-'}</h4></article>
        <article class="rounded-xl border border-slate-800/60 bg-slate-900/55 p-3"><p class="text-xs text-slate-400">${t('kpiCompetitorCount')}</p><h4 class="mt-1 text-lg font-bold text-white">${competitorOnly.length}</h4></article>
      </div>
      <ul class="space-y-2">${renderComparisonRows(rows, escapeHtml)}</ul>
    </div>
  `
  comparisonDashboard.classList.remove('hidden')
}

analyzeBtn.addEventListener('click', async () => {
  const url = targetUrlInput.value.trim()
  if (!url) {
    alert(t('emptyUrlAlert'))
    return
  }

  setAppState({
    isLoading: true,
    currentUrl: url,
    lastError: null,
  })

  try {
    const competitorUrls = parseCompetitorUrls()
    const effectiveCompetitorUrls = [...new Set(competitorUrls)]
    const competitorValidation = validateCompetitorLimit(effectiveCompetitorUrls)
    if (!competitorValidation.valid) {
      throw new Error(competitorValidation.message)
    }

    const headers = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const res = await fetch(apiUrl('/api/analyze'), {
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
    const seoMetrics = data?.seo_result || {}
    const aeoMetrics = data?.aeo_result || {}
    const geoMetrics = data?.geo_result || {}

    let competitorReports = []
    if (effectiveCompetitorUrls.length) {
      if (competitorValidation.addOnAmount > 0) {
        alert(
          t('competitorAddOnEstimate').replace(
            '${amount}',
            String(competitorValidation.addOnAmount)
          )
        )
      }

      const competitorRequests = effectiveCompetitorUrls.map(async (competitorUrl) => {
        const competitorResponse = await fetch(apiUrl('/api/analyze'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            url: competitorUrl,
            include_aeo: false,
            include_pagespeed: false,
          }),
        })
        if (!competitorResponse.ok) return null
        return competitorResponse.json()
      })
      competitorReports = (await Promise.all(competitorRequests)).filter(Boolean)
    }

    setAppState({ seoMetrics, aeoMetrics, geoMetrics })
    renderReport(data, competitorReports)
    renderComparisonDashboard(data, competitorReports)
    postAnalysisCta.classList.remove('hidden')
    savePageSessionState()
  } catch (err) {
    setAppState({ lastError: err.message })
    alert(`${t('analysisFailedPrefix')}: ${err.message}`)
  } finally {
    setAppState({ isLoading: false })
  }
})

tabButtons.forEach((button) => {
  if (!button.dataset?.tab) return
  button.addEventListener('click', () => switchTab(button.dataset.tab))
})

openLoginBtn.addEventListener('click', () => alert(t('emailAuthPaused')))
openRegisterBtn.addEventListener('click', () => alert(t('emailAuthPaused')))
closeAuthModalBtn.addEventListener('click', closeAuthModal)
toRegister.addEventListener('click', () => alert(t('emailAuthPaused')))
toLogin.addEventListener('click', () => alert(t('emailAuthPaused')))
authModal.addEventListener('click', (event) => {
  if (event.target === authModal) closeAuthModal()
})

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  alert(t('emailAuthPaused'))
})

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  alert(t('emailAuthPaused'))
})

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('access_token')
  token = null
  syncCurrentUserTier()
  setAuthButtons()
  alert(t('logoutSuccess'))
})

ctaOpenPricing.addEventListener('click', () => switchTab('pricing'))
ctaOpenLogin.addEventListener('click', () => alert(t('emailAuthPaused')))

async function startGoogleOAuth() {
  alert(t('emailAuthPaused'))
}

if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', startGoogleOAuth)
}

if (googleRegisterBtn) {
  googleRegisterBtn.addEventListener('click', startGoogleOAuth)
}

planCards.forEach((card) => {
  card.addEventListener('click', () => {
    const plan = card.dataset.plan || ''
    handlePlanSelection(plan)
  })
})

sitemapAnalyzeBtn.addEventListener('click', () => {
  if (!token || !isPaidTier()) {
    switchTab('pricing')
    renderSitemapSample()
    alert(t('sitemapLoginRequired'))
    return
  }

  alert(t('sitemapNotWired'))
})

enterpriseForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const company = document.getElementById('company-name').value.trim()
  const email = document.getElementById('contact-email').value.trim()
  const needs = document.getElementById('enterprise-needs').value.trim()

  const subject = encodeURIComponent(`${t('enterpriseMailPrefix')} ${company}`)
  const body = encodeURIComponent(`Company: ${company}\nEmail: ${email}\n\nNeeds:\n${needs}`)
  window.location.href = `mailto:enterprise@searchscope.example?subject=${subject}&body=${body}`
})

if (languageSelect) {
  languageSelect.addEventListener('change', (event) => {
    applyLanguage(event.target.value)
  })
}

subscribeAppState((state) => {
  if (!analyzeBtn) return
  analyzeBtn.disabled = state.isLoading
  analyzeBtn.innerText = state.isLoading ? t('analyzingButton') : t('analyzeButton')
})

setAuthButtons()

const initialTab = urlParams.get('tab') || 'analyze'
switchTab(initialTab)

if (urlParams.get('openLogin') === '1') {
  alert(t('emailAuthPaused'))
}

const checkoutState = urlParams.get('checkout')
if (checkoutState === 'success') {
  alert(t('checkoutSuccess'))
}
if (checkoutState === 'cancel') {
  alert(t('checkoutCancel'))
}

const oauthToken = urlParams.get('oauth_token')
if (oauthToken) {
  localStorage.removeItem('access_token')
  token = null
  const cleanUrl = new URL(window.location.href)
  cleanUrl.searchParams.delete('oauth_token')
  cleanUrl.searchParams.set('auth', 'paused')
  window.history.replaceState({}, '', cleanUrl.toString())
  alert(t('emailAuthPaused'))
}

applyLanguage(currentLanguage)
restorePageSessionState()
syncCurrentUserTier()
