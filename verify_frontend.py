import os
import sys
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = os.path.abspath("screenshots")
if not os.path.exists(SCREENSHOT_DIR):
    os.makedirs(SCREENSHOT_DIR)

PAGES = [
    {
        "name": "index",
        "url": "/",
        "selectors": [
            "#landing-nav-main",
            "#language-select",
            "#landing-open-dashboard",
            "#landing-hero-title",
        ],
    },
    {
        "name": "app_dashboard",
        "url": "/app.html",
        "selectors": [
            "#tab-main-link",
            "#workspace-title",
            "#target-url",
            "#analyze-btn",
        ],
    },
    {
        "name": "keyword_rank",
        "url": "/keyword-rank.html",
        "selectors": ["#kr-nav-keyword", "#kr-title", "#kr-query-single", "#kr-submit"],
    },
    {
        "name": "prompt_tracker",
        "url": "/prompt-tracker.html",
        "selectors": [
            "#pt-nav-prompt",
            "#pt-title",
            "#prompt-query",
            "#pt-prompt-submit",
        ],
    },
    {
        "name": "aeo_optimizer",
        "url": "/aeo-optimizer.html",
        "selectors": ["#ao-nav-aeo", "#ao-title", "#optimizer-url", "#ao-submit"],
    },
]


def verify_pages():
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        print(f"Starting verification on {BASE_URL}")

        for page_def in PAGES:
            name = page_def["name"]
            url = f"{BASE_URL}{page_def['url']}"
            print(f"Checking {name} at {url}...")

            try:
                page.goto(url)
                page.wait_for_load_state("networkidle")

                # Verify selectors
                missing = []
                for selector in page_def["selectors"]:
                    if not page.is_visible(selector):
                        missing.append(selector)

                status = "PASS" if not missing else "FAIL"

                # Check dark mode (basic check of body background)
                bg_color = page.eval_on_selector(
                    "body", "e => getComputedStyle(e).backgroundColor"
                )
                # slate-950 is #020617 which is rgb(2, 6, 23)
                is_dark = "rgb(2, 6, 23)" in bg_color or "2, 6, 23" in bg_color
                if not is_dark:
                    print(
                        f"  WARNING: Body background color {bg_color} might not be slate-950"
                    )

                # Screenshot
                screenshot_path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
                page.screenshot(path=screenshot_path, full_page=True)

                result = {
                    "page": name,
                    "status": status,
                    "missing_selectors": missing,
                    "screenshot": screenshot_path,
                    "dark_mode_check": is_dark,
                }
                results.append(result)
                print(f"  {status}: Saved screenshot to {screenshot_path}")
                if missing:
                    print(f"  Missing elements: {missing}")

            except Exception as e:
                print(f"  ERROR checking {name}: {e}")
                results.append({"page": name, "status": "ERROR", "error": str(e)})

        browser.close()
        return results


if __name__ == "__main__":
    results = verify_pages()

    print("\n--- SUMMARY ---")
    all_passed = True
    for r in results:
        if r["status"] != "PASS":
            all_passed = False
            print(
                f"FAIL: {r['page']} - Missing: {r.get('missing_selectors')} Error: {r.get('error')}"
            )
        else:
            print(f"PASS: {r['page']}")

    sys.exit(0 if all_passed else 1)
