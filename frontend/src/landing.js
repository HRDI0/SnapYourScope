import './landing.css'

const languageSelect = document.getElementById('language-select')
const planCards = document.querySelectorAll('.landing-plan-card[data-plan]')

let currentLanguage = localStorage.getItem('ui_lang') || 'en'

const I18N = {
  en: {
    landingTagline: 'Lightweight URL-based SEO/AEO intelligence',
    navMain: 'Main',
    navDashboard: 'Dashboard',
    navKeyword: 'Keyword Rank',
    navPrompt: 'Prompt Tracker',
    navOptimizer: 'SEO/AEO Optimizer',
    navPricing: 'Pricing',
    navInquiry: 'Inquiry',
    eyebrow: 'Visibility Operating System',
    heroTitle: 'Track your brand in web search and AI answers from one workflow',
    heroDescription:
      'Built for teams that need practical SEO + AEO execution: quick URL audits, paid prompt tracking, and recommendation workflows.',
    openDashboard: 'Open Dashboard',
    openKeyword: 'Open Keyword Rank',
    tryPrompt: 'Try Prompt Tracker',
    whatNow: 'What you can run now',
    li1: 'Single URL SEO/AEO/GEO analysis',
    li2: 'Free web search rank tracking (Google/Bing/Naver)',
    li3: 'Paid prompt tracking with share-of-model scoring',
    li4: 'Paid SEO/AEO optimization recommendations',
    feature1Title: 'SEO & AEO Dashboard',
    feature1Desc: 'Analyze technical and answer-engine signals with chart-based diagnostics.',
    feature2Title: 'Prompt Tracking',
    feature2Desc: 'Score brand visibility by tier: not mentioned, mentioned, linked, core mention.',
    feature3Title: 'Search Rank Monitor',
    feature3Desc: 'Check the position where your brand URL appears in web search results.',
    feature4Title: 'SEO/AEO Optimizer',
    feature4Desc: 'Generate practical recommendations based on URL audit outputs and SEO/AEO principles.',
    plansTitle: 'Plans',
    planFreeTitle: 'Free',
    planFreeF1: 'Single URL dashboard audit',
    planFreeF2: 'Search rank tracking (API-key based)',
    planProTitle: 'Pro',
    planProF1: 'Sitemap batch analysis',
    planProF2: 'Prompt tracking and scoring',
    planProF3: 'AEO optimization recommendations',
    planEntTitle: 'Enterprise',
    planEntF1: 'Workflow and policy customization',
    planEntF2: 'Provider strategy and reliability controls',
    planHint: 'Click Pro or Enterprise to continue to checkout.',
    enterpriseContactOnly: 'Enterprise opens the inquiry tab.',
    goProduct: 'Go to product',
    checkoutFailed: 'Checkout creation failed',
  },
  ko: {
    landingTagline: '가벼운 URL 기반 SEO/AEO 인텔리전스',
    navMain: '메인',
    navDashboard: '대시보드',
    navKeyword: '키워드 순위',
    navPrompt: '프롬프트 추적',
    navOptimizer: 'SEO/AEO 최적화',
    navPricing: '요금제',
    navInquiry: '문의',
    eyebrow: '가시성 운영 시스템',
    heroTitle: '웹 검색과 AI 답변에서 브랜드 노출을 한 워크플로우로 추적',
    heroDescription: '빠른 URL 진단, 유료 프롬프트 추적, 추천 워크플로우를 위한 실전형 분석 도구입니다.',
    openDashboard: '대시보드 열기',
    openKeyword: '키워드 순위 열기',
    tryPrompt: '프롬프트 추적 시작',
    whatNow: '지금 바로 가능한 기능',
    li1: '단일 URL SEO/AEO/GEO 분석',
    li2: '무료 웹 검색 순위 추적 (Google/Bing/Naver)',
    li3: '유료 share-of-model 점수 기반 프롬프트 추적',
    li4: '유료 SEO/AEO 최적화 추천',
    feature1Title: 'SEO & AEO 대시보드',
    feature1Desc: '기술/답변엔진 신호를 차트 중심으로 분석합니다.',
    feature2Title: '프롬프트 추적',
    feature2Desc: '미언급/언급/링크 언급/핵심 언급 티어로 브랜드 가시성을 점수화합니다.',
    feature3Title: '검색 순위 모니터',
    feature3Desc: '검색 결과에서 브랜드 URL이 몇 위에 노출되는지 확인합니다.',
    feature4Title: 'SEO/AEO 최적화',
    feature4Desc: 'URL 진단 결과 기반의 실전형 개선안을 제공합니다.',
    plansTitle: '요금제',
    planFreeTitle: '무료',
    planFreeF1: '단일 URL 대시보드 진단',
    planFreeF2: '검색 순위 추적 (API 키 기반)',
    planProTitle: '프로',
    planProF1: '사이트맵 배치 분석',
    planProF2: '프롬프트 추적 및 점수화',
    planProF3: 'AEO 최적화 추천',
    planEntTitle: '엔터프라이즈',
    planEntF1: '워크플로우/정책 커스터마이징',
    planEntF2: '공급자 전략/신뢰성 제어',
    planHint: 'Pro 또는 Enterprise를 클릭하면 결제로 이동합니다.',
    enterpriseContactOnly: 'Enterprise는 문의 탭으로 이동합니다.',
    goProduct: '제품으로 이동',
    checkoutFailed: '결제 세션 생성 실패',
  },
  ja: {
    landingTagline: '軽量な URL ベース SEO/AEO インテリジェンス',
    navMain: 'メイン',
    navDashboard: 'ダッシュボード',
    navPrompt: 'プロンプト追跡',
    navOptimizer: 'SEO/AEO 最適化',
    navPricing: '料金',
    navInquiry: '問い合わせ',
    eyebrow: '可視性オペレーティングシステム',
    heroTitle: 'Web 検索と AI 回答でのブランド可視性を一つのワークフローで追跡',
    heroDescription: 'URL 監査、プロンプト追跡、最適化提案を実運用向けに提供します。',
    openDashboard: 'ダッシュボードを開く',
    tryPrompt: 'プロンプト追跡を試す',
    whatNow: '今すぐ実行できる機能',
    li1: '単一 URL SEO/AEO/GEO 分析',
    li2: '無料の検索順位追跡 (Google/Bing/Naver)',
    li3: '有料の share-of-model スコア追跡',
    li4: '有料 SEO/AEO 最適化提案',
    feature1Title: 'SEO & AEO ダッシュボード',
    feature1Desc: '技術シグナルと回答エンジンシグナルを可視化します。',
    feature2Title: 'プロンプト追跡',
    feature2Desc: '未言及/言及/リンク言及/コア言及でスコア化します。',
    feature3Title: '検索順位モニター',
    feature3Desc: '検索結果でのブランド URL の順位を確認します。',
    feature4Title: 'SEO/AEO 最適化',
    feature4Desc: 'URL 監査結果に基づく改善案を提示します。',
    plansTitle: 'プラン',
    planFreeTitle: '無料',
    planFreeF1: '単一 URL ダッシュボード監査',
    planFreeF2: '検索順位追跡 (API キー方式)',
    planProTitle: 'Pro',
    planProF1: 'サイトマップ一括分析',
    planProF2: 'プロンプト追跡とスコアリング',
    planProF3: 'AEO 最適化提案',
    planEntTitle: 'Enterprise',
    planEntF1: 'ワークフロー/ポリシーのカスタマイズ',
    planEntF2: 'プロバイダー戦略と信頼性制御',
    planHint: 'Pro または Enterprise をクリックすると決済に進みます。',
    goProduct: '製品へ移動',
    checkoutFailed: '決済セッション作成に失敗しました',
  },
  zh: {
    landingTagline: '轻量级 URL SEO/AEO 智能分析',
    navMain: '主页',
    navDashboard: '仪表盘',
    navPrompt: '提示词追踪',
    navOptimizer: 'SEO/AEO 优化',
    navPricing: '价格',
    navInquiry: '咨询',
    eyebrow: '可见性操作系统',
    heroTitle: '在网页搜索与 AI 回答中统一追踪你的品牌',
    heroDescription: '提供快速 URL 审计、付费提示词追踪和优化建议。',
    openDashboard: '打开仪表盘',
    tryPrompt: '试用提示词追踪',
    whatNow: '当前可用功能',
    li1: '单 URL SEO/AEO/GEO 分析',
    li2: '免费搜索排名追踪 (Google/Bing/Naver)',
    li3: '付费 share-of-model 评分追踪',
    li4: '付费 SEO/AEO 优化建议',
    feature1Title: 'SEO & AEO 仪表盘',
    feature1Desc: '用图表分析技术信号与回答引擎信号。',
    feature2Title: '提示词追踪',
    feature2Desc: '按未提及/提及/带链接提及/核心提及进行评分。',
    feature3Title: '搜索排名监控',
    feature3Desc: '查看品牌 URL 在搜索结果中的位置。',
    feature4Title: 'SEO/AEO 优化',
    feature4Desc: '基于 URL 审计输出生成可执行建议。',
    plansTitle: '方案',
    planFreeTitle: '免费',
    planFreeF1: '单 URL 仪表盘审计',
    planFreeF2: '搜索排名追踪 (API Key)',
    planProTitle: '专业版',
    planProF1: '站点地图批量分析',
    planProF2: '提示词追踪与评分',
    planProF3: 'AEO 优化建议',
    planEntTitle: '企业版',
    planEntF1: '工作流/策略定制',
    planEntF2: '提供方策略与可靠性控制',
    planHint: '点击专业版或企业版进入支付。',
    goProduct: '进入产品',
    checkoutFailed: '创建支付会话失败',
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
  localStorage.setItem('ui_lang', currentLanguage)
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage
  if (languageSelect) languageSelect.value = currentLanguage

  setText('landing-tagline', 'landingTagline')
  setText('landing-nav-main', 'navMain')
  setText('landing-nav-dashboard', 'navDashboard')
  setText('landing-nav-keyword', 'navKeyword')
  setText('landing-nav-prompt', 'navPrompt')
  setText('landing-nav-optimizer', 'navOptimizer')
  setText('landing-nav-pricing', 'navPricing')
  setText('landing-nav-inquiry', 'navInquiry')
  setText('landing-eyebrow', 'eyebrow')
  setText('landing-hero-title', 'heroTitle')
  setText('landing-hero-description', 'heroDescription')
  setText('landing-open-dashboard', 'openDashboard')
  setText('landing-open-keyword', 'openKeyword')
  setText('landing-try-prompt', 'tryPrompt')
  setText('landing-what-now', 'whatNow')
  setText('landing-li-1', 'li1')
  setText('landing-li-2', 'li2')
  setText('landing-li-3', 'li3')
  setText('landing-li-4', 'li4')
  setText('landing-feature-1-title', 'feature1Title')
  setText('landing-feature-1-desc', 'feature1Desc')
  setText('landing-feature-2-title', 'feature2Title')
  setText('landing-feature-2-desc', 'feature2Desc')
  setText('landing-feature-3-title', 'feature3Title')
  setText('landing-feature-3-desc', 'feature3Desc')
  setText('landing-feature-4-title', 'feature4Title')
  setText('landing-feature-4-desc', 'feature4Desc')
  setText('landing-plans-title', 'plansTitle')
  setText('landing-plan-free-title', 'planFreeTitle')
  setText('landing-plan-free-f1', 'planFreeF1')
  setText('landing-plan-free-f2', 'planFreeF2')
  setText('landing-plan-pro-title', 'planProTitle')
  setText('landing-plan-pro-f1', 'planProF1')
  setText('landing-plan-pro-f2', 'planProF2')
  setText('landing-plan-pro-f3', 'planProF3')
  setText('landing-plan-ent-title', 'planEntTitle')
  setText('landing-plan-ent-f1', 'planEntF1')
  setText('landing-plan-ent-f2', 'planEntF2')
  setText('landing-plan-hint', 'planHint')
  setText('landing-go-product', 'goProduct')
}

async function createCheckout(plan) {
  const token = localStorage.getItem('access_token')
  if (!token) {
    const redirect = encodeURIComponent('/app.html?tab=pricing&openLogin=1')
    window.location.href = `/app.html?tab=pricing&openLogin=1&plan=${encodeURIComponent(plan)}&next=${redirect}`
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
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.detail || JSON.stringify(data))
    }

    if (data.checkout_url) {
      window.location.href = data.checkout_url
      return
    }

    throw new Error('Missing checkout_url')
  } catch (error) {
    alert(`${t('checkoutFailed')}: ${error.message}`)
  }
}

planCards.forEach((card) => {
  card.addEventListener('click', async () => {
    const plan = card.dataset.plan
    if (!plan || plan === 'free') return
    if (plan === 'enterprise') {
      alert(t('enterpriseContactOnly'))
      window.location.href = '/app.html?tab=enterprise'
      return
    }
    await createCheckout(plan)
  })
})

if (languageSelect) {
  languageSelect.addEventListener('change', (event) => {
    applyLanguage(event.target.value)
  })
}

applyLanguage(currentLanguage)
