const languageSelect = document.getElementById('language-select')
const loginBtn = document.getElementById('landing-login-btn')
const planCards = document.querySelectorAll('.landing-plan-card[data-plan]')

let currentLanguage = localStorage.getItem('ui_lang') || 'en'

const I18N = {
  en: {
    landingTagline: 'Lightweight URL-based SEO/AEO intelligence',
    navMain: 'Main',
    navDashboard: 'Dashboard',
    navPrompt: 'Prompt Tracker',
    navOptimizer: 'SEO/AEO Optimizer',
    navPricing: 'Pricing',
    navInquiry: 'Inquiry',
    eyebrow: 'Visibility Operating System',
    heroTitle: 'Track your brand in web search and AI answers from one workflow',
    heroDescription:
      'Built for teams that need practical SEO + AEO execution: quick URL audits, paid prompt tracking, and recommendation workflows.',
    openDashboard: 'Open Dashboard',
    tryPrompt: 'Try Prompt Tracker',
    loginButton: 'Login (Open Beta)',
    loginPaused: 'Login is temporarily paused during open beta. Guest demo mode is active.',
    whatNow: 'What you can run now',
    li1: 'Single URL SEO/AEO/GEO analysis (beta scope)',
    li2: 'Integrated URL dashboard with SEO/AEO recommendations',
    li3: 'Prompt tracking demo with usage cap',
    li4: 'Some features may not fully work yet during open beta, and bugs may occur.',
    feature1Title: 'SEO & AEO Dashboard',
    feature1Desc: 'Analyze technical and answer-engine signals with chart-based diagnostics.',
    feature2Title: 'Prompt Tracking',
    feature2Desc: 'Score brand visibility by tier: not mentioned, mentioned, linked, core mention.',
    feature3Title: 'Integrated Dashboard',
    feature3Desc: 'See URL health, issue priorities, and optimization actions in one compact report.',
    feature4Title: 'SEO/AEO Optimizer',
    feature4Desc: 'Generate practical recommendations based on URL audit outputs and SEO/AEO principles.',
    plansTitle: 'Plans',
    planFreeTitle: 'Free',
    planFreeF1: 'Single URL dashboard audit',
    planFreeF2: 'Prompt tracking demo (up to 5 per request)',
    planProTitle: 'Pro',
    planProPriceLabel: 'Open Beta',
    planProF1: 'Sitemap batch analysis',
    planProF2: 'Prompt tracking and scoring',
    planProF3: 'AEO optimization recommendations',
    planProF4: 'Weekly PDF report delivery (Coming Soon)',
    planEntTitle: 'Enterprise',
    planEntF1: 'Workflow and policy customization',
    planEntF2: 'Provider strategy and reliability controls',
    planEntF3: 'Weekly PDF report delivery (Coming Soon)',
    planHint: 'Pro/Enterprise checkout is coming soon. Use open beta features now.',
    enterpriseContactOnly: 'Enterprise opens the inquiry tab.',
    goProduct: 'Go to product',
    checkoutFailed: 'Checkout creation failed',
    paymentComingSoon: 'Payment checkout is coming soon. Open beta is active now.',
  },
  ko: {
    landingTagline: '가벼운 URL 기반 SEO/AEO 인텔리전스',
    navMain: '메인',
    navDashboard: '대시보드',
    navPrompt: '프롬프트 추적',
    navOptimizer: 'SEO/AEO 최적화',
    navPricing: '요금제',
    navInquiry: '문의',
    eyebrow: '가시성 운영 시스템',
    heroTitle: '웹 검색과 AI 답변에서 브랜드 노출을 한 워크플로우로 추적',
    heroDescription: '빠른 URL 진단, 유료 프롬프트 추적, 추천 워크플로우를 위한 실전형 분석 도구입니다.',
    openDashboard: '대시보드 열기',
    tryPrompt: '프롬프트 추적 시작',
    loginButton: '로그인(오픈베타)',
    loginPaused: '오픈 베타 기간에는 로그인이 일시 중단됩니다. 현재 게스트 데모 모드가 활성화되어 있습니다.',
    whatNow: '지금 바로 가능한 기능',
    li1: '단일 URL SEO/AEO/GEO 분석 (베타 범위)',
    li2: 'SEO/AEO 추천이 통합된 URL 대시보드',
    li3: '사용량 제한이 있는 프롬프트 추적 데모',
    li4: '오픈 베타 기간에는 일부 기능이 완전히 동작하지 않을 수 있으며 버그가 발생할 수 있습니다.',
    feature1Title: 'SEO & AEO 대시보드',
    feature1Desc: '기술/답변엔진 신호를 차트 중심으로 분석합니다.',
    feature2Title: '프롬프트 추적',
    feature2Desc: '미언급/언급/링크 언급/핵심 언급 티어로 브랜드 가시성을 점수화합니다.',
    feature3Title: '통합 대시보드',
    feature3Desc: 'URL 상태, 우선 이슈, 최적화 액션을 한 화면에서 확인합니다.',
    feature4Title: 'SEO/AEO 최적화',
    feature4Desc: 'URL 진단 결과 기반의 실전형 개선안을 제공합니다.',
    plansTitle: '요금제',
    planFreeTitle: '무료',
    planFreeF1: '단일 URL 대시보드 진단',
    planFreeF2: '프롬프트 추적 데모 (요청당 최대 5개)',
    planProTitle: '프로',
    planProPriceLabel: '오픈 베타',
    planProF1: '사이트맵 배치 분석',
    planProF2: '프롬프트 추적 및 점수화',
    planProF3: 'AEO 최적화 추천',
    planProF4: '주간 PDF 보고 전송 기능 (Coming Soon)',
    planEntTitle: '엔터프라이즈',
    planEntF1: '워크플로우/정책 커스터마이징',
    planEntF2: '공급자 전략/신뢰성 제어',
    planEntF3: '주간 PDF 보고 전송 기능 (Coming Soon)',
    planHint: 'Pro/Enterprise 결제는 오픈 예정입니다. 현재는 오픈 베타를 이용하세요.',
    enterpriseContactOnly: 'Enterprise는 문의 탭으로 이동합니다.',
    goProduct: '제품으로 이동',
    checkoutFailed: '결제 세션 생성 실패',
    paymentComingSoon: '결제 체크아웃은 오픈 예정입니다. 현재는 오픈 베타를 이용해주세요.',
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
    loginButton: 'ログイン（オープンベータ）',
    loginPaused: 'オープンベータ期間中はログインを一時停止しています。現在はゲストデモモードをご利用ください。',
    whatNow: '今すぐ実行できる機能',
    li1: '単一 URL SEO/AEO/GEO 分析（ベータ範囲）',
    li2: 'SEO/AEO 推奨を統合した URL ダッシュボード',
    li3: '利用上限付きプロンプト追跡デモ',
    li4: 'オープンベータ期間中は一部機能が完全に動作しない場合があり、不具合が発生することがあります。',
    feature1Title: 'SEO & AEO ダッシュボード',
    feature1Desc: '技術シグナルと回答エンジンシグナルを可視化します。',
    feature2Title: 'プロンプト追跡',
    feature2Desc: '未言及/言及/リンク言及/コア言及でスコア化します。',
    feature3Title: '統合ダッシュボード',
    feature3Desc: 'URL 状態、優先課題、最適化アクションを1画面で確認します。',
    feature4Title: 'SEO/AEO 最適化',
    feature4Desc: 'URL 監査結果に基づく改善案を提示します。',
    plansTitle: 'プラン',
    planFreeTitle: '無料',
    planFreeF1: '単一 URL ダッシュボード監査',
    planFreeF2: 'プロンプト追跡デモ (1リクエスト最大5件)',
    planProTitle: 'Pro',
    planProPriceLabel: 'オープンベータ',
    planProF1: 'サイトマップ一括分析',
    planProF2: 'プロンプト追跡とスコアリング',
    planProF3: 'AEO 最適化提案',
    planProF4: '週次 PDF レポート配信 (Coming Soon)',
    planEntTitle: 'Enterprise',
    planEntF1: 'ワークフロー/ポリシーのカスタマイズ',
    planEntF2: 'プロバイダー戦略と信頼性制御',
    planEntF3: '週次 PDF レポート配信 (Coming Soon)',
    planHint: 'Pro / Enterprise の決済は近日公開です。現在はオープンベータをご利用ください。',
    enterpriseContactOnly: 'Enterprise は問い合わせタブを開きます。',
    goProduct: '製品へ移動',
    checkoutFailed: '決済セッション作成に失敗しました',
    paymentComingSoon: '決済チェックアウトは近日公開です。現在はオープンベータをご利用ください。',
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
    loginButton: '登录（开放测试）',
    loginPaused: '开放测试期间登录功能暂时停用。当前可使用访客演示模式。',
    whatNow: '当前可用功能',
    li1: '单 URL SEO/AEO/GEO 分析（开放测试范围）',
    li2: '集成 SEO/AEO 推荐的 URL 仪表盘',
    li3: '带配额限制的提示词追踪演示',
    li4: '开放测试期间，部分功能可能无法完全正常运行，也可能出现错误。',
    feature1Title: 'SEO & AEO 仪表盘',
    feature1Desc: '用图表分析技术信号与回答引擎信号。',
    feature2Title: '提示词追踪',
    feature2Desc: '按未提及/提及/带链接提及/核心提及进行评分。',
    feature3Title: '集成仪表盘',
    feature3Desc: '在一个紧凑视图中查看 URL 状态、优先问题和优化动作。',
    feature4Title: 'SEO/AEO 优化',
    feature4Desc: '基于 URL 审计输出生成可执行建议。',
    plansTitle: '方案',
    planFreeTitle: '免费',
    planFreeF1: '单 URL 仪表盘审计',
    planFreeF2: '提示词追踪演示 (每次请求最多 5 条)',
    planProTitle: '专业版',
    planProPriceLabel: '开放测试',
    planProF1: '站点地图批量分析',
    planProF2: '提示词追踪与评分',
    planProF3: 'AEO 优化建议',
    planProF4: '每周 PDF 报告发送功能 (Coming Soon)',
    planEntTitle: '企业版',
    planEntF1: '工作流/策略定制',
    planEntF2: '提供方策略与可靠性控制',
    planEntF3: '每周 PDF 报告发送功能 (Coming Soon)',
    planHint: '专业版/企业版支付即将开放。当前可先体验开放测试。',
    enterpriseContactOnly: '企业版将打开咨询标签。',
    goProduct: '进入产品',
    checkoutFailed: '创建支付会话失败',
    paymentComingSoon: '支付结账即将开放，当前请先体验开放测试。',
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
  setText('landing-nav-prompt', 'navPrompt')
  setText('landing-nav-optimizer', 'navOptimizer')
  setText('landing-nav-pricing', 'navPricing')
  setText('landing-nav-inquiry', 'navInquiry')
  setText('landing-eyebrow', 'eyebrow')
  setText('landing-hero-title', 'heroTitle')
  setText('landing-hero-description', 'heroDescription')
  setText('landing-open-dashboard', 'openDashboard')
  setText('landing-try-prompt', 'tryPrompt')
  setText('landing-login-btn', 'loginButton')
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
  setText('landing-plan-pro-price-label', 'planProPriceLabel')
  setText('landing-plan-pro-f1', 'planProF1')
  setText('landing-plan-pro-f2', 'planProF2')
  setText('landing-plan-pro-f3', 'planProF3')
  setText('landing-plan-pro-f4', 'planProF4')
  setText('landing-plan-ent-title', 'planEntTitle')
  setText('landing-plan-ent-f1', 'planEntF1')
  setText('landing-plan-ent-f2', 'planEntF2')
  setText('landing-plan-ent-f3', 'planEntF3')
  setText('landing-plan-hint', 'planHint')
  setText('landing-go-product', 'goProduct')
}

async function createCheckout(plan) {
  window.location.href = '/app.html?tab=pricing'
  alert(t('paymentComingSoon'))
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

if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    alert(t('loginPaused'))
  })
}
