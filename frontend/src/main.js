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
const languageSelect = document.getElementById('language-select')
const planCards = document.querySelectorAll('.plan-card[data-plan]')
const competitorUrlsInput = document.getElementById('competitor-urls')
const sitemapOutput = document.getElementById('sitemap-output')

const urlParams = new URLSearchParams(window.location.search)
let pendingCheckoutPlan = urlParams.get('plan') || null

let latestReportData = null
let currentLanguage = localStorage.getItem('ui_lang') || 'en'
let currentUserTier = 'free'

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
    tabEnterprise: 'Enterprise',
    tabKeyword: 'Keyword Rank',
    tabPrompt: 'Prompt Tracker',
    tabAeo: 'AEO Optimizer',
    gnbMain: 'Main',
    gnbKeyword: 'Keyword Rank',
    gnbPrompt: 'Prompt Tracker',
    gnbAeo: 'AEO Optimizer',
    workspaceEyebrow: 'Analytics Workspace',
    workspaceTitle: 'Competitive Visibility Dashboard',
    login: 'Log in',
    register: 'Get started',
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
      'Free: 1 competitor | Paid: 5 included, +$3/month each above 5 | Pro hard cap: 10 (Enterprise for more)',
    targetUrlPlaceholder: 'https://example.com',
    analyzeButton: 'Analyze URL',
    analyzingButton: 'Analyzing...',
    analysisReportTitle: 'Analysis report',
    postCtaTitle: 'Need full sitemap analysis?',
    postCtaDescription:
      'Log in and subscribe to run full-site batch analysis (sitemap parse + URL queue + background run).',
    postCtaPricing: 'View Pricing',
    postCtaLogin: 'Login to upgrade',
    batchTitle: 'Full sitemap analysis (paid)',
    batchDescription: 'Backend logic is implemented. Frontend API wiring can be connected next.',
    batchRefreshPolicy: 'Refresh policy: weekly (LLM/API-intensive).',
    sitemapPlaceholder: 'https://example.com/sitemap.xml',
    batchButton: 'Start full analysis',
    pricingTitle: 'Pricing',
    pricingDescription: 'Choose a plan based on crawl depth and workflow scale.',
    pricingClickHint: 'Click Pro to continue checkout. Enterprise opens inquiry.',
    planFreeTitle: 'Free',
    planFreeF1: 'Single URL report',
    planFreeF2: 'SEO + GEO + AEO snapshot',
    planFreeF3: 'No sitemap batch',
    planProTitle: 'Pro',
    planProF1: 'Full sitemap analysis',
    planProF2: 'URL queue + background batch',
    planProF3: 'Batch status tracking',
    planEntTitle: 'Enterprise',
    planEntPriceLabel: 'Custom',
    planEntF1: 'Improvement strategy',
    planEntF2: 'Managed optimization workflow',
    planEntF3: 'Dedicated support',
    enterpriseTitle: 'Enterprise Improvement & Management',
    enterpriseDescription:
      'If you want ongoing site improvement and operational management, send an enterprise inquiry.',
    companyPlaceholder: 'Company name',
    contactPlaceholder: 'Work email',
    needsPlaceholder: 'Tell us your SEO/GEO/AEO goals',
    enterpriseSubmit: 'Send enterprise inquiry',
    loginTitle: 'Log in',
    registerTitle: 'Create account',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    loginSubmit: 'Sign in',
    registerSubmit: 'Sign up',
    loginSwitchLabel: 'No account?',
    loginSwitchButton: 'Create one',
    registerSwitchLabel: 'Already registered?',
    registerSwitchButton: 'Back to login',
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
    emptySeoChecks: 'No SEO checks available',
    emptyAeoChecks: 'No AEO checks available',
    metaWords: 'Words',
    metaMissingAlt: 'Missing Alt',
    metaCurrencies: 'Currencies',
    metaPhoneFormats: 'Phone Formats',
    noCriticalIssues: 'No critical issues',
    noCriticalIssuesDetail: 'Core checks are passing.',
    emptyUrlAlert: 'Please enter a URL.',
    guestLimitAlert:
      'Guest mode supports one single URL analysis. Login + paid plan is required for full sitemap analysis.',
    analysisFailedPrefix: 'Analysis failed',
    loginSuccess: 'Logged in successfully.',
    registrationComplete: 'Registration complete. Please login.',
    logoutSuccess: 'Logged out.',
    sitemapLoginRequired: 'Login and paid subscription are required for full sitemap analysis.',
    sitemapNotWired:
      'Frontend API connection for full sitemap analysis will be wired in the next step. Backend batch endpoints are ready.',
    sitemapPaidOnly: 'This section requires paid tier. Showing sample output for free tier.',
    sitemapSampleOutput:
      '{\n  "status": "sample",\n  "plan_required": ["pro", "enterprise"],\n  "message": "Upgrade to run sitemap batch analysis."\n}',
    enterpriseMailPrefix: '[Enterprise Inquiry]',
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
    competitorComparisonTitle: 'Competitor Comparison (SEO Score)',
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
    tabEnterprise: '엔터프라이즈',
    tabKeyword: '키워드 순위',
    tabPrompt: '프롬프트 추적',
    tabAeo: 'AEO 최적화',
    gnbMain: '메인',
    gnbKeyword: '키워드 순위',
    gnbPrompt: '프롬프트 추적',
    gnbAeo: 'AEO 최적화',
    workspaceEyebrow: '분석 워크스페이스',
    workspaceTitle: '경쟁 가시성 대시보드',
    login: '로그인',
    register: '시작하기',
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
      '무료: 1개 | 유료: 5개 포함, 5개 초과 시 URL당 월 $3 | Pro 최대 10개 (그 이상 Enterprise)',
    targetUrlPlaceholder: 'https://example.com',
    analyzeButton: 'URL 분석',
    analyzingButton: '분석 중...',
    analysisReportTitle: '분석 리포트',
    postCtaTitle: '전체 사이트맵 분석이 필요하신가요?',
    postCtaDescription: '로그인 후 구독하면 전체 사이트 배치 분석(사이트맵 파싱 + URL 큐 + 백그라운드 실행)이 가능합니다.',
    postCtaPricing: '요금제 보기',
    postCtaLogin: '로그인하고 업그레이드',
    batchTitle: '전체 사이트맵 분석 (유료)',
    batchDescription: '백엔드 로직은 구현 완료되었습니다. 프론트 API 연동만 남았습니다.',
    batchRefreshPolicy: '갱신 주기: 매주 (LLM/API 고비용 기능).',
    sitemapPlaceholder: 'https://example.com/sitemap.xml',
    batchButton: '전체 분석 시작',
    pricingTitle: '요금제',
    pricingDescription: '크롤링 깊이와 운영 규모에 맞춰 선택하세요.',
    pricingClickHint: 'Pro는 결제 진행, Enterprise는 문의 탭으로 이동합니다.',
    planFreeTitle: '무료',
    planFreeF1: '단일 URL 리포트',
    planFreeF2: 'SEO + GEO + AEO 스냅샷',
    planFreeF3: '사이트맵 배치 미지원',
    planProTitle: '프로',
    planProF1: '전체 사이트맵 분석',
    planProF2: 'URL 큐 + 백그라운드 배치',
    planProF3: '배치 상태 추적',
    planEntTitle: '엔터프라이즈',
    planEntPriceLabel: '맞춤형',
    planEntF1: '개선 전략 수립',
    planEntF2: '운영형 최적화 워크플로우',
    planEntF3: '전담 지원',
    enterpriseTitle: '엔터프라이즈 개선/운영',
    enterpriseDescription: '지속적인 사이트 개선과 운영 관리를 원하시면 문의를 남겨주세요.',
    companyPlaceholder: '회사명',
    contactPlaceholder: '업무용 이메일',
    needsPlaceholder: 'SEO/GEO/AEO 목표를 알려주세요',
    enterpriseSubmit: '엔터프라이즈 문의 보내기',
    loginTitle: '로그인',
    registerTitle: '계정 만들기',
    emailPlaceholder: '이메일',
    passwordPlaceholder: '비밀번호',
    loginSubmit: '로그인',
    registerSubmit: '가입하기',
    loginSwitchLabel: '계정이 없나요?',
    loginSwitchButton: '회원가입',
    registerSwitchLabel: '이미 가입했나요?',
    registerSwitchButton: '로그인으로',
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
    emptySeoChecks: 'SEO 체크 데이터가 없습니다',
    emptyAeoChecks: 'AEO 체크 데이터가 없습니다',
    metaWords: '단어 수',
    metaMissingAlt: '누락 Alt',
    metaCurrencies: '통화 표기',
    metaPhoneFormats: '전화 포맷',
    noCriticalIssues: '치명 이슈 없음',
    noCriticalIssuesDetail: '핵심 체크가 정상입니다.',
    emptyUrlAlert: 'URL을 입력해주세요.',
    guestLimitAlert: '게스트 모드는 단일 URL 1회 분석만 가능합니다. 전체 사이트맵 분석은 로그인 + 유료 플랜이 필요합니다.',
    analysisFailedPrefix: '분석 실패',
    loginSuccess: '로그인되었습니다.',
    registrationComplete: '회원가입 완료. 로그인해주세요.',
    logoutSuccess: '로그아웃되었습니다.',
    sitemapLoginRequired: '전체 사이트맵 분석은 로그인과 유료 구독이 필요합니다.',
    sitemapNotWired: '전체 사이트맵 분석의 프론트 API 연동은 다음 단계에서 연결됩니다. 백엔드 배치 엔드포인트는 준비되어 있습니다.',
    sitemapPaidOnly: '이 섹션은 유료 전용입니다. 무료 계정에는 예시 결과를 표시합니다.',
    sitemapSampleOutput:
      '{\n  "status": "sample",\n  "plan_required": ["pro", "enterprise"],\n  "message": "업그레이드 후 사이트맵 배치 분석을 실행할 수 있습니다."\n}',
    enterpriseMailPrefix: '[엔터프라이즈 문의]',
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
    competitorComparisonTitle: '경쟁사 비교 (SEO 점수)',
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
    tabEnterprise: 'エンタープライズ',
    workspaceEyebrow: '分析ワークスペース',
    workspaceTitle: '競合可視性ダッシュボード',
    login: 'ログイン',
    register: '始める',
    logout: 'ログアウト',
    heroEyebrow: 'URL インテリジェンス',
    heroTitle: 'ライブ監査を実行し、主要シグナルを1画面で確認',
    heroDescription: 'エンタープライズ分析UIに基づくKPI・チャート・優先修正ビューです。',
    heroMetaGuest: 'ゲスト: URL 1回分析',
    heroMetaPro: 'Pro: サイトマップ一括分析',
    heroMetaMode: 'モード: リアルタイムスナップショット',
    targetUrlPlaceholder: 'https://example.com',
    analyzeButton: 'URL分析',
    analyzingButton: '分析中...',
    analysisReportTitle: '分析レポート',
    postCtaTitle: 'サイトマップ全体分析が必要ですか？',
    postCtaDescription: 'ログインして購読すると、サイト全体のバッチ分析を実行できます。',
    postCtaPricing: '料金を見る',
    postCtaLogin: 'ログインしてアップグレード',
    batchTitle: 'サイトマップ全体分析（有料）',
    batchDescription: 'バックエンド実装は完了しています。フロントAPI接続のみ残っています。',
    sitemapPlaceholder: 'https://example.com/sitemap.xml',
    batchButton: '全体分析を開始',
    pricingTitle: '料金',
    pricingDescription: 'クロール深度と運用規模に合わせて選択してください。',
    pricingClickHint: 'Pro または Enterprise をクリックすると決済に進みます。',
    planFreeTitle: '無料',
    planFreeF1: '単一URLレポート',
    planFreeF2: 'SEO + GEO + AEO スナップショット',
    planFreeF3: 'サイトマップ一括なし',
    planProTitle: 'Pro',
    planProF1: 'サイトマップ全体分析',
    planProF2: 'URLキュー + バックグラウンド処理',
    planProF3: 'バッチ状況トラッキング',
    planEntTitle: 'エンタープライズ',
    planEntPriceLabel: 'カスタム',
    planEntF1: '改善戦略',
    planEntF2: '運用型最適化ワークフロー',
    planEntF3: '専任サポート',
    enterpriseTitle: 'エンタープライズ改善/運用',
    enterpriseDescription: '継続的な改善と運用管理をご希望の場合はお問い合わせください。',
    companyPlaceholder: '会社名',
    contactPlaceholder: '業務用メール',
    needsPlaceholder: 'SEO/GEO/AEOの目標を入力してください',
    enterpriseSubmit: '問い合わせを送信',
    loginTitle: 'ログイン',
    registerTitle: 'アカウント作成',
    emailPlaceholder: 'メール',
    passwordPlaceholder: 'パスワード',
    loginSubmit: 'サインイン',
    registerSubmit: '登録',
    loginSwitchLabel: 'アカウントがありませんか？',
    loginSwitchButton: '作成する',
    registerSwitchLabel: 'すでに登録済みですか？',
    registerSwitchButton: 'ログインへ',
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
    emptySeoChecks: 'SEOチェックがありません',
    emptyAeoChecks: 'AEOチェックがありません',
    metaWords: '単語数',
    metaMissingAlt: 'Alt欠落',
    metaCurrencies: '通貨表記',
    metaPhoneFormats: '電話形式',
    noCriticalIssues: '重大な問題なし',
    noCriticalIssuesDetail: '主要チェックは正常です。',
    emptyUrlAlert: 'URLを入力してください。',
    guestLimitAlert: 'ゲストモードでは単一URL分析は1回のみです。サイトマップ全体分析にはログインと有料プランが必要です。',
    analysisFailedPrefix: '分析失敗',
    loginSuccess: 'ログインしました。',
    registrationComplete: '登録完了。ログインしてください。',
    logoutSuccess: 'ログアウトしました。',
    sitemapLoginRequired: 'サイトマップ全体分析にはログインと有料購読が必要です。',
    sitemapNotWired: 'サイトマップ全体分析のフロントAPI接続は次のステップで実装されます。',
    enterpriseMailPrefix: '[エンタープライズ問い合わせ]',
    checkoutFailed: '決済セッション作成失敗',
    checkoutMissingUrl: 'チェックアウトURLが返されませんでした',
    checkoutSuccess: '決済が完了しました。',
    checkoutCancel: '決済はキャンセルされました。',
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
    tabEnterprise: '企业版',
    workspaceEyebrow: '分析工作区',
    workspaceTitle: '竞争可见性仪表盘',
    login: '登录',
    register: '开始使用',
    logout: '退出登录',
    heroEyebrow: 'URL 智能分析',
    heroTitle: '执行实时审计，并在一个页面查看全部关键信号',
    heroDescription: '参考企业分析产品布局，提供 KPI、图表与优先修复视图。',
    heroMetaGuest: '访客：可分析 1 个 URL',
    heroMetaPro: 'Pro：完整站点地图批量分析',
    heroMetaMode: '模式：实时快照',
    targetUrlPlaceholder: 'https://example.com',
    analyzeButton: '分析 URL',
    analyzingButton: '分析中...',
    analysisReportTitle: '分析报告',
    postCtaTitle: '需要完整站点地图分析吗？',
    postCtaDescription: '登录并订阅后，可运行全站批量分析。',
    postCtaPricing: '查看价格',
    postCtaLogin: '登录并升级',
    batchTitle: '完整站点地图分析（付费）',
    batchDescription: '后端逻辑已完成，前端 API 接线可在下一步完成。',
    sitemapPlaceholder: 'https://example.com/sitemap.xml',
    batchButton: '开始完整分析',
    pricingTitle: '价格',
    pricingDescription: '根据抓取深度与运营规模选择方案。',
    pricingClickHint: '点击专业版或企业版进入支付。',
    planFreeTitle: '免费',
    planFreeF1: '单 URL 报告',
    planFreeF2: 'SEO + GEO + AEO 快照',
    planFreeF3: '不支持站点地图批量',
    planProTitle: '专业版',
    planProF1: '完整站点地图分析',
    planProF2: 'URL 队列 + 后台批处理',
    planProF3: '批处理状态跟踪',
    planEntTitle: '企业版',
    planEntPriceLabel: '定制',
    planEntF1: '优化策略',
    planEntF2: '托管优化工作流',
    planEntF3: '专属支持',
    enterpriseTitle: '企业优化与运营',
    enterpriseDescription: '如需持续优化和运营管理，请提交企业咨询。',
    companyPlaceholder: '公司名称',
    contactPlaceholder: '工作邮箱',
    needsPlaceholder: '请描述你的 SEO/GEO/AEO 目标',
    enterpriseSubmit: '发送企业咨询',
    loginTitle: '登录',
    registerTitle: '创建账号',
    emailPlaceholder: '邮箱',
    passwordPlaceholder: '密码',
    loginSubmit: '登录',
    registerSubmit: '注册',
    loginSwitchLabel: '没有账号？',
    loginSwitchButton: '创建一个',
    registerSwitchLabel: '已注册？',
    registerSwitchButton: '返回登录',
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
    emptySeoChecks: '暂无 SEO 检查数据',
    emptyAeoChecks: '暂无 AEO 检查数据',
    metaWords: '词数',
    metaMissingAlt: '缺失 Alt',
    metaCurrencies: '货币标记',
    metaPhoneFormats: '电话格式',
    noCriticalIssues: '无关键问题',
    noCriticalIssuesDetail: '核心检查均通过。',
    emptyUrlAlert: '请输入 URL。',
    guestLimitAlert: '访客模式仅支持 1 次单 URL 分析。完整站点地图分析需要登录并订阅付费方案。',
    analysisFailedPrefix: '分析失败',
    loginSuccess: '登录成功。',
    registrationComplete: '注册完成，请登录。',
    logoutSuccess: '已退出登录。',
    sitemapLoginRequired: '完整站点地图分析需要登录和付费订阅。',
    sitemapNotWired: '完整站点地图分析的前端 API 接线将在下一步完成，后端已就绪。',
    enterpriseMailPrefix: '[企业咨询]',
    checkoutFailed: '创建支付会话失败',
    checkoutMissingUrl: '未返回支付链接',
    checkoutSuccess: '支付已完成。',
    checkoutCancel: '支付已取消。',
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
  setText('plan-ent-title', 'planEntTitle')
  setText('plan-ent-price-label', 'planEntPriceLabel')
  setText('plan-ent-f1', 'planEntF1')
  setText('plan-ent-f2', 'planEntF2')
  setText('plan-ent-f3', 'planEntF3')
  setText('enterprise-title', 'enterpriseTitle')
  setText('enterprise-description', 'enterpriseDescription')
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
  setText('login-switch-label', 'loginSwitchLabel')
  setText('to-register', 'loginSwitchButton')
  setText('register-switch-label', 'registerSwitchLabel')
  setText('to-login', 'registerSwitchButton')

  if (latestReportData) {
    renderReport(latestReportData)
  }
}

function isPaidTier() {
  return currentUserTier === 'pro' || currentUserTier === 'enterprise'
}

function applyTierUi() {
  if (!sitemapAnalyzeBtn) return
  const disabled = !isPaidTier()
  sitemapAnalyzeBtn.disabled = disabled
  if (disabled) {
    renderSitemapSample()
  }
}

function renderSitemapSample() {
  if (!sitemapOutput) return
  sitemapOutput.dataset.hasResult = '1'
  sitemapOutput.textContent = `${t('paidFeatureDisabled')}\n\n${t('sitemapSampleOutput')}`
}

async function syncCurrentUserTier() {
  if (!token) {
    currentUserTier = 'free'
    applyTierUi()
    return
  }

  try {
    const response = await fetch('/api/users/me', {
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

  if (!isPaidTier() && competitorUrls.length > 1) {
    return { valid: false, message: t('competitorLimitExceeded') }
  }

  if (currentUserTier === 'pro' && competitorUrls.length > 10) {
    return { valid: false, message: t('competitorProCap') }
  }

  if (isPaidTier() && competitorUrls.length > 5) {
    return { valid: true, addOnAmount: (competitorUrls.length - 5) * 3 }
  }

  return { valid: true, addOnAmount: 0 }
}

async function createCheckoutSession(plan) {
  if (!token) {
    pendingCheckoutPlan = plan
    openAuthModal('login')
    return
  }

  try {
    const response = await fetch('/api/billing/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        plan,
        success_url: `${window.location.origin}/app.html?checkout=success`,
        cancel_url: `${window.location.origin}/app.html?checkout=cancel&tab=pricing`,
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

    if (!data.checkout_url) {
      throw new Error(t('checkoutMissingUrl'))
    }

    window.location.href = data.checkout_url
  } catch (error) {
    alert(`${t('checkoutFailed')}: ${error.message}`)
  }
}

function handlePlanSelection(plan) {
  const normalized = (plan || '').toLowerCase()
  if (normalized === 'free') {
    switchTab('analyze')
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
  if (kind === 'pass') return { className: 'badge-pass', label: t('statusPass') }
  if (kind === 'warn') return { className: 'badge-warn', label: t('statusWarn') }
  if (kind === 'fail') return { className: 'badge-fail', label: t('statusFail') }
  return { className: 'badge-info', label: t('statusInfo') }
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
    .map((item) => ({
      ...item,
      status: item.data.status || t('statusInfo'),
      statusType: normalizeStatus(item.data.status || ''),
      detail: item.data.details || '',
    }))
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
    .map((item) => ({
      ...item,
      status: item.data.status || t('statusInfo'),
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
            <p class="status-detail">${escapeHtml(check.detail || t('noDetails'))}</p>
          </div>
          <span class="status-badge ${badge.className}">${badge.label}</span>
        </li>
      `
    })
    .join('')
}

function renderGeoRows(geoResult) {
  if (!geoResult || typeof geoResult !== 'object') {
    return `<p class="dashboard-empty">${t('noGeoData')}</p>`
  }

  return Object.entries(geoResult)
    .map(([region, info]) => {
      const ok = Number(info.status) >= 200 && Number(info.status) < 400
      return `
        <li class="geo-row">
          <strong>${escapeHtml(region)}</strong>
          <span class="geo-status ${ok ? 'status-ok' : 'status-bad'}">${ok ? t('reachable') : t('issue')}</span>
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
      labels: [t('seoScoreLabel'), t('remaining')],
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
          label: t('latencyMs'),
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
      labels: [t('statusPass'), t('statusWarn'), t('statusFail'), t('statusInfo')],
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

function renderReport(data, competitorReports = []) {
  latestReportData = data

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
  const comparisonRows = [
    { url: data.url, score: seoScore, type: t('yourUrlLabel') },
    ...competitorReports.map((entry) => ({
      url: entry.url,
      score: Number(entry?.seo_result?.score) || 0,
      type: t('competitorLabelShort'),
    })),
  ]

  const html = `
    <section class="dashboard-hero">
      <div>
        <h3>${t('dashboardTitle')}</h3>
        <p class="dashboard-url">${escapeHtml(data.url || '')}</p>
        <p class="dashboard-sub">${t('generatedAt')} ${formatTime(new Date())}</p>
      </div>
      <div class="score-shell">
        <div class="chart-box chart-score"><canvas id="score-chart"></canvas></div>
        <div class="score-center">
          <strong>${seoScore}</strong>
          <span>${t('seoScoreLabel')}</span>
        </div>
      </div>
    </section>

    <section class="kpi-grid">
      <article class="kpi-card"><p>${t('kpiSeoChecks')}</p><h4>${seoPass}/${seoChecks.length || 0}</h4></article>
      <article class="kpi-card"><p>${t('kpiAeoChecks')}</p><h4>${aeoPass}/${aeoChecks.length || 0}</h4></article>
      <article class="kpi-card"><p>${t('kpiGlobalReach')}</p><h4>${successfulRegions}/${geoEntries.length || 0}</h4></article>
      <article class="kpi-card"><p>${t('kpiAvgLatency')}</p><h4>${avgLatency}ms</h4></article>
    </section>

    <section class="dashboard-card">
      <div class="card-head"><h4>${t('competitorComparisonTitle')}</h4></div>
      <ul class="issue-list">
        ${comparisonRows
          .map(
            (row) =>
              `<li><strong>${escapeHtml(row.type)}: ${escapeHtml(row.url || '')}</strong><span>SEO ${escapeHtml(String(row.score))}</span></li>`
          )
          .join('')}
      </ul>
    </section>

    <section class="dashboard-grid">
      <article class="dashboard-card">
        <div class="card-head"><h4>${t('sectionSeoEssentials')}</h4></div>
        <ul class="status-list">${renderStatusRows(seoChecks, t('emptySeoChecks'))}</ul>
      </article>

      <article class="dashboard-card">
        <div class="card-head"><h4>${t('sectionAeoSignals')}</h4></div>
        <ul class="status-list">${renderStatusRows(aeoChecks, t('emptyAeoChecks'))}</ul>
      </article>

      <article class="dashboard-card dashboard-chart-card">
        <div class="card-head"><h4>${t('sectionStatusMix')}</h4></div>
        <div class="chart-box chart-medium"><canvas id="status-mix-chart"></canvas></div>
      </article>

      <article class="dashboard-card dashboard-chart-card">
        <div class="card-head"><h4>${t('sectionRegionalLatency')}</h4></div>
        <div class="chart-box chart-medium"><canvas id="geo-latency-chart"></canvas></div>
        <ul class="geo-list">${renderGeoRows(geoResult)}</ul>
      </article>

      <article class="dashboard-card">
        <div class="card-head"><h4>${t('sectionContentSnapshot')}</h4></div>
        <div class="meta-grid">
          <div class="meta-chip"><span>${t('metaWords')}</span><strong>${words}</strong></div>
          <div class="meta-chip"><span>${t('metaMissingAlt')}</span><strong>${missingAlt}</strong></div>
          <div class="meta-chip"><span>${t('metaCurrencies')}</span><strong>${
            seoResult?.geo_signals?.found_currencies?.length || 0
          }</strong></div>
          <div class="meta-chip"><span>${t('metaPhoneFormats')}</span><strong>${
            seoResult?.geo_signals?.found_phones?.length || 0
          }</strong></div>
        </div>
      </article>

      <article class="dashboard-card">
        <div class="card-head"><h4>${t('sectionImmediateFixes')}</h4></div>
        <ul class="issue-list">
          ${
            issueList.length
              ? issueList
                  .map(
                    (issue) => `<li><strong>${escapeHtml(issue.label)}</strong><span>${escapeHtml(issue.detail || issue.status)}</span></li>`
                  )
                  .join('')
              : `<li><strong>${t('noCriticalIssues')}</strong><span>${t('noCriticalIssuesDetail')}</span></li>`
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
    alert(t('emptyUrlAlert'))
    return
  }

  if (!token && guestSingleUsed) {
    postAnalysisCta.classList.remove('hidden')
    switchTab('pricing')
    alert(t('guestLimitAlert'))
    return
  }

  analyzeBtn.disabled = true
  analyzeBtn.innerText = t('analyzingButton')

  try {
    const competitorUrls = parseCompetitorUrls()
    const competitorValidation = validateCompetitorLimit(competitorUrls)
    if (!competitorValidation.valid) {
      throw new Error(competitorValidation.message)
    }

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
    let competitorReports = []
    if (competitorUrls.length) {
      if (competitorValidation.addOnAmount > 0) {
        alert(
          t('competitorAddOnEstimate').replace(
            '${amount}',
            String(competitorValidation.addOnAmount)
          )
        )
      }

      const competitorRequests = competitorUrls.map(async (competitorUrl) => {
        const competitorResponse = await fetch('/api/analyze', {
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

    renderReport(data, competitorReports)
    postAnalysisCta.classList.remove('hidden')

    if (!token) {
      guestSingleUsed = true
      sessionStorage.setItem('guest_single_used', '1')
    }
  } catch (err) {
    alert(`${t('analysisFailedPrefix')}: ${err.message}`)
  } finally {
    analyzeBtn.disabled = false
    analyzeBtn.innerText = t('analyzeButton')
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
    await syncCurrentUserTier()
    setAuthButtons()
    closeAuthModal()
    alert(t('loginSuccess'))

    if (pendingCheckoutPlan) {
      const plan = pendingCheckoutPlan
      pendingCheckoutPlan = null
      createCheckoutSession(plan)
    }
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

    alert(t('registrationComplete'))
    openAuthModal('login')
  } catch (err) {
    alert(err.message)
  }
})

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('access_token')
  token = null
  syncCurrentUserTier()
  setAuthButtons()
  alert(t('logoutSuccess'))
})

ctaOpenPricing.addEventListener('click', () => switchTab('pricing'))
ctaOpenLogin.addEventListener('click', () => openAuthModal('login'))

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

setAuthButtons()

const initialTab = urlParams.get('tab') || 'analyze'
switchTab(initialTab)

if (urlParams.get('openLogin') === '1' && !token) {
  openAuthModal('login')
}

const checkoutState = urlParams.get('checkout')
if (checkoutState === 'success') {
  alert(t('checkoutSuccess'))
}
if (checkoutState === 'cancel') {
  alert(t('checkoutCancel'))
}

applyLanguage(currentLanguage)
syncCurrentUserTier()
