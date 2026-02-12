import asyncio
import os
import sys
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from playwright_stealth import Stealth
import google.generativeai as genai
from bs4 import BeautifulSoup

# Windows Emoji Support
sys.stdout.reconfigure(encoding='utf-8')

# 1. .env 로드
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("❌ Error: GOOGLE_API_KEY is missing in .env file.")
    exit()

genai.configure(api_key=GOOGLE_API_KEY)
# 복잡한 지시사항을 잘 따르도록 시스템 프롬프트 강화
model = genai.GenerativeModel('gemini-2.5-flash', 
    system_instruction="You are a Senior Technical SEO Consultant & International Growth Expert.")

async def run_seo_analysis(target_url):
    print(f"🚀 Starting Advanced Analysis: {target_url}")
    print("-" * 50)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        # [Bot Evasion] Stealth 모드 적용
        await Stealth().apply_stealth_async(page)

        # 리소스 차단 (속도/비용 최적화)
        await page.route("**/*", lambda route: route.abort() 
            if route.request.resource_type in ["image", "media", "font", "stylesheet"] 
            else route.continue_())

        try:
            await page.goto(target_url, wait_until="domcontentloaded", timeout=30000)
            html_content = await page.content()
            
            soup = BeautifulSoup(html_content, 'html.parser')

            # [데이터 추출 1] Head 정보 (메타태그, 타이틀, 캐노니컬, Hreflang 분석용)
            head_tag = soup.find('head')
            head_html = str(head_tag)[:15000] if head_tag else "No <head> tag found"

            # [데이터 추출 2] Body 본문 (콘텐츠 품질 분석용)
            for tag in soup(["script", "style", "svg", "path", "noscript", "iframe"]):
                tag.decompose()
            clean_text = soup.get_text(separator=' ', strip=True)[:10000]

            # [데이터 추출 3] 헤딩 구조 (H1 ~ H3)
            headings = []
            for h in soup.find_all(['h1', 'h2', 'h3']):
                headings.append(f"<{h.name}> {h.get_text(strip=True)}")
            heading_structure = "\n".join(headings[:30])

            # [데이터 추출 4] 이미지 (Alt 태그 분석용)
            images = []
            for img in soup.find_all('img'):
                src = img.get('src')
                alt = img.get('alt')
                if src:
                    images.append(f"- Src: {src} | Alt: {alt}")
            image_summary = "\n".join(images[:20])

        except Exception as e:
            print(f"❌ Connection Error: {e}")
            await browser.close()
            return

        await browser.close()

    print("🤖 Analyzing with Gemini 2.5 Flash (Advanced Mode)...")
    
    # ============================================================
    # [고도화된 프롬프트] Global SEO Tool 기능 반영
    # ============================================================
    # [SEO Verifier 실행]
    try:
        from seo_verifier import SeoVerifier
        from aeo_verifier import AeoVerifier
        from api_manager import ApiManager
        from pagespeed_checker import PageSpeedChecker
        
        # Initialize API Manager & PageSpeed Checker
        api_manager = ApiManager()
        pagespeed_checker = PageSpeedChecker(api_manager)
        
        # [Simulated Paid/Free Logic]
        user_tier = "FREE" 
        print(f"👤 User Tier: {user_tier} (Single Analysis Mode)")
        
        # 1. SEO Analysis (Async)
        seo_verifier = SeoVerifier(html_content, target_url)
        automated_seo_report = await seo_verifier.get_summary_markdown_async()
        
        # 2. AEO Analysis
        aeo_verifier = AeoVerifier(html_content)
        automated_aeo_report = aeo_verifier.get_summary_markdown()

        # 3. PageSpeed Analysis (Async)
        # In 'Mass' mode, this would require PAID tier
        print("⚡ Running PageSpeed Analysis...")
        pagespeed_report = await pagespeed_checker.analyze(target_url)
        
    except Exception as e:
        automated_seo_report = f"❌ Verification Error: {e}"
        automated_aeo_report = "❌ AEO Verification Failed"
        pagespeed_report = "❌ PageSpeed Analysis Failed"
        print(f"Error during verification: {e}")

    # ============================================================
    # [최적화된 프롬프트] 데이터 기반 분석 + 인사이트 요청
    # ============================================================
    prompt = f"""
    Act as a 'Google Search Central' Expert and Senior Technical SEO Auditor.
    Your goal is to provide a high-level strategic analysis based on the provided [Automated Audit Data] and [Raw Content].
    
    [Target URL]: {target_url}

    [Automated SEO Audit Data] (Technical & Content Signals)
    {automated_seo_report}

    [Automated AEO Audit Data] (AI Search Engine Optimization Signals for GPT/Perplexity)
    {automated_aeo_report}

    [PageSpeed Insights Data] (Core Web Vitals & Performance)
    {pagespeed_report}
    
    [Raw Content Sample]
    1. Heading Structure (First 30):
    {heading_structure}
    
    2. Content Summary (Excerpt):
    {clean_text[:2000]}...

    3. Image Sample (First 10):
    {image_summary}

    [Analysis Instructions]
    1. **Synthesize**: Combine the 'Automated Audit Data' with the 'Raw Content' to identify the *Root Causes* of any failures.
    2. **Content Quality Check**: Analyze the provided text sample. Is it SEO-friendly? Does it match the intent of the Page Title?
    3. **International SEO**: Review the Hreflang and GEO findings. If there are failures, explain *why* they matter for this specific site.
    4. **AEO Strategy (GPT/Perplexity)**: based on the [Automated AEO Audit Data], analyze if this content is likely to be cited by AI Answer Engines. Focus on structure, direct answers, and schema.
    5. **Performance Review**: Analyze the [PageSpeed Insights Data]. If the score is low, suggest specific technical fixes (e.g. image optimization, JS reduction).
    6. **Actionable Advice**: For every "Warning" or "Fail" in the Automated Data, provide a specific fix.

    ---
    **[Output Format Requirements]**
    1.  **Language:** English.
    2.  **Format:** Markdown.
    3.  **Structure:**
        *   **📊 Executive Summary:** 3-line summary of the site's status (SEO/AEO/Performance).
        *   **1. Technical Analysis:** 
            *   Briefly summarize the [Automated Audit Data] findings.
        *   **2. Content & Semantics:**
            *   Analyze H1-H6 hierarchy and Keyword alignment.
        *   **3. International SEO & GEO:**
            *   Specific advice on Hreflang and Localization (Currency/Phone).
        *   **4. 🤖 AEO Prediction (GPT/Perplexity):**
            *   Will this rank in AI Search? Why/Why not?
            *   Advice to improve "Answerability".
        *   **5. ⚡ Performance & Core Web Vitals:**
            *   Analysis of PageSpeed scores and LCP/CLS/INP.
        *   **🚀 Top 3 Priority Fixes:**
            1.  [High Impact] ...
            2.  [Quick Win] ...
            3.  [Strategic] ...
    """

    try:
        response = model.generate_content(prompt)
        print("\n" + "="*30 + " [Professional SEO Report] " + "="*30)
        print(response.text)
        
    except Exception as e:
        print(f"❌ API Error: {e}")

if __name__ == "__main__":
    # 테스트 URL (글로벌 사이트 추천)
    target = "https://www.apple.com/kr/" 
    asyncio.run(run_seo_analysis(target))