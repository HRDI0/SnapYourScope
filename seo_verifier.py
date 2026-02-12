import re
import json
import asyncio
import aiohttp
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup

class SeoVerifier:
    def __init__(self, html_content, target_url):
        self.soup = BeautifulSoup(html_content, 'html.parser')
        self.target_url = target_url
        self.results = {}

    async def analyze(self):
        """Run all analysis methods and return the results."""
        self.results['meta_title'] = self.check_title()
        self.results['meta_description'] = self.check_meta_description()
        self.results['canonical'] = self.check_canonical()
        self.results['robots'] = self.check_robots()
        self.results['viewport'] = self.check_viewport()
        self.results['open_graph'] = self.check_open_graph()
        self.results['structured_data'] = self.check_structured_data()
        self.results['hreflang'] = self.check_hreflang()
        self.results['heading_structure'] = self.check_headings()
        # Async check for images
        self.results['images'] = await self.check_images()
        self.results['content_length'] = self.check_content_length()
        self.results['geo_signals'] = self.check_geo_signals()
        
        # Calculate Score
        self.results['score'] = self.calculate_score()
        
        return self.results

    def calculate_score(self):
        score = 100
        # Basic deductions
        if self.results['meta_title']['status'] != '✅ Pass': score -= 10
        if self.results['meta_description']['status'] != '✅ Pass': score -= 10
        if self.results['canonical']['status'] != '✅ Pass': score -= 10
        if self.results['robots']['status'] != '✅ Pass': score -= 10
        if self.results['viewport']['status'] != '✅ Pass': score -= 10
        if self.results['open_graph']['status'] != '✅ Pass': score -= 5
        if self.results['structured_data']['status'] != '✅ Pass': score -= 5
        if self.results['hreflang']['status'] == '❌ Fail': score -= 5
        if self.results['heading_structure']['status'] != '✅ Pass': score -= 5
        if self.results['images']['status'] != '✅ Pass': score -= 5
        if self.results['content_length']['status'] != '✅ Pass': score -= 5
        
        return max(0, score)

    def check_title(self):
        title_tag = self.soup.find('title')
        if not title_tag:
            return {"status": "❌ Fail", "value": "Missing", "details": "Title tag is missing."}
        
        title_text = title_tag.get_text(strip=True)
        length = len(title_text)
        status = "✅ Pass" if 50 <= length <= 60 else "⚠️ Warning"
        return {
            "status": status,
            "value": title_text,
            "length": length,
            "details": f"Length: {length} chars (Recommended: 50-60)"
        }

    def check_meta_description(self):
        meta_desc = self.soup.find('meta', attrs={'name': 'description'})
        if not meta_desc:
            return {"status": "❌ Fail", "value": "Missing", "details": "Meta description is missing."}
        
        content = meta_desc.get('content', '').strip()
        length = len(content)
        status = "✅ Pass" if 150 <= length <= 160 else "⚠️ Warning"
        return {
            "status": status,
            "value": content,
            "length": length,
            "details": f"Length: {length} chars (Recommended: 150-160)"
        }

    def check_canonical(self):
        canonical = self.soup.find('link', rel='canonical')
        if not canonical:
            return {"status": "❌ Fail", "value": "Missing", "details": "Canonical tag is missing."}
        
        href = canonical.get('href', '').strip()
        is_match = href == self.target_url or href == self.target_url + '/'
        status = "✅ Pass" if is_match else "⚠️ Warning"
        return {
            "status": status,
            "value": href,
            "details": "Points to current URL (Self-referencing)" if is_match else f"Points to other URL: {href}"
        }

    def check_robots(self):
        robots = self.soup.find('meta', attrs={'name': 'robots'})
        if not robots:
            return {"status": "⚠️ Warning", "value": "Missing", "details": "Robots meta tag is missing."}
        
        content = robots.get('content', '').lower()
        if 'index' in content and 'follow' in content:
             return {"status": "✅ Pass", "value": content, "details": "Allowed to Index & Follow"}
        return {"status": "⚠️ Warning", "value": content, "details": "Does not explicitly allow index, follow"}

    def check_viewport(self):
        viewport = self.soup.find('meta', attrs={'name': 'viewport'})
        if viewport:
            return {"status": "✅ Pass", "value": viewport.get('content', ''), "details": "Viewport tag present"}
        return {"status": "❌ Fail", "value": "Missing", "details": "Viewport tag missing (Mobile friendliness issue)"}

    def check_open_graph(self):
        og_tags = ['og:title', 'og:description', 'og:image']
        found = []
        missing = []
        for tag in og_tags:
            if self.soup.find('meta', property=tag):
                found.append(tag)
            else:
                missing.append(tag)
        
        status = "✅ Pass" if not missing else "⚠️ Warning"
        return {
            "status": status,
            "found": found,
            "missing": missing,
            "details": f"Found: {', '.join(found)}. Missing: {', '.join(missing)}"
        }

    def check_structured_data(self):
        scripts = self.soup.find_all('script', type='application/ld+json')
        if not scripts:
             return {"status": "⚠️ Warning", "details": "No JSON-LD Structured Data found"}
        
        found_types = []
        errors = []
        
        for script in scripts:
            try:
                data = json.loads(script.string if script.string else '{}')
                if isinstance(data, dict):
                    if '@type' in data:
                        found_types.append(data['@type'])
                    elif '@graph' in data:
                        for item in data['@graph']:
                            if '@type' in item:
                                found_types.append(item['@type'])
                elif isinstance(data, list):
                    for item in data:
                        if '@type' in item:
                            found_types.append(item['@type'])
            except json.JSONDecodeError:
                errors.append("JSON-LD Syntax Error")

        required_types = ['Organization', 'WebSite', 'BreadcrumbList']
        present_required = [t for t in found_types if t in required_types]
        
        status = "✅ Pass" if present_required and not errors else "⚠️ Warning"
        
        return {
            "status": status,
            "found_types": found_types,
            "errors": errors,
            "details": f"Types Found: {', '.join(found_types)}" if found_types else "Key Schemas missing"
        }

    def check_hreflang(self):
        hreflangs = self.soup.find_all('link', rel='alternate', hreflang=True)
        if not hreflangs:
             return {"status": "⚠️ Warning", "details": "No hreflang tags found"}

        valid_pattern = re.compile(r'^[a-z]{2}(-[A-Z]{2})?$|^x-default$')
        invalid_codes = []
        has_x_default = False
        has_self_ref = False
        
        for link in hreflangs:
            code = link.get('hreflang')
            href = link.get('href')
            
            if code == 'x-default':
                has_x_default = True
            
            if not valid_pattern.match(code):
                invalid_codes.append(code)
            
            # Simple self-ref check
            if href and (href == self.target_url or href == self.target_url + '/'):
                has_self_ref = True

        status = "✅ Pass"
        details = []
        if invalid_codes:
            status = "❌ Fail"
            details.append(f"Invalid codes: {invalid_codes}")
        if not has_x_default:
            details.append("Missing x-default")
        if not has_self_ref:
            details.append("Missing self-referencing tag")
        
        if not details: 
            details.append("All Hreflang checks passed")
            
        return {
            "status": status,
            "count": len(hreflangs),
            "details": "; ".join(details)
        }

    def check_headings(self):
        h1_tags = self.soup.find_all('h1')
        h1_count = len(h1_tags)
        
        status = "✅ Pass" if h1_count == 1 else "❌ Fail"
        return {
            "status": status,
            "h1_count": h1_count,
            "details": f"H1 Count: {h1_count} (Recommended: 1)"
        }

    async def check_images(self):
        """Check images via HEAD checks logic."""
        images = self.soup.find_all('img')
        total = len(images)
        missing_alt = 0
        img_urls = []
        
        for img in images:
            if not img.get('alt') or not img.get('alt').strip():
                missing_alt += 1
            src = img.get('src')
            if src:
                # Handle relative URLs
                full_url = urljoin(self.target_url, src)
                if full_url.startswith('http'):
                    img_urls.append(full_url)

        # Optimization: Check first 5 images via HEAD request to save costs/time
        images_stats = {"total_size_mb": 0.0, "webp_count": 0, "checked_count": 0}
        
        async def check_head(session, url):
            try:
                # Timeout set low to avoid hanging
                async with session.head(url, timeout=3) as resp:
                    length = int(resp.headers.get('Content-Length', 0))
                    c_type = resp.headers.get('Content-Type', '').lower()
                    return length, c_type
            except:
                return 0, ''

        # Limit concurrency
        connector = aiohttp.TCPConnector(limit=5)
        async with aiohttp.ClientSession(connector=connector) as session:
            tasks = [check_head(session, url) for url in img_urls[:5]] # Check only first 5 for speed
            results = await asyncio.gather(*tasks)
            
            for length, c_type in results:
                images_stats['checked_count'] += 1
                images_stats['total_size_mb'] += length / (1024 * 1024)
                if 'webp' in c_type or 'avif' in c_type:
                    images_stats['webp_count'] += 1

        status = "✅ Pass"
        details_list = []
        
        if missing_alt > 0:
            status = "⚠️ Warning"
            details_list.append(f"{missing_alt} missing Alt text")
            
        if images_stats['checked_count'] > 0:
            avg_size = images_stats['total_size_mb'] / images_stats['checked_count']
            if avg_size > 0.2: # 200KB
                status = "⚠️ Warning"
                details_list.append(f"Large Avg Image Size: {avg_size:.2f}MB")
            
            webp_ratio = images_stats['webp_count'] / images_stats['checked_count']
            if webp_ratio < 0.5:
                details_list.append(f"Low WebP usage ({images_stats['webp_count']}/{images_stats['checked_count']})")
        
        if not details_list:
            details_list.append("All checks passed")

        return {
            "status": status,
            "total": total,
            "missing_alt": missing_alt,
            "details": ", ".join(details_list)
        }

    def check_content_length(self):
        text = self.soup.get_text(separator=' ', strip=True)
        word_count = len(text.split())
        
        status = "✅ Pass" if word_count >= 300 else "⚠️ Warning"
        return {
            "status": status,
            "word_count": word_count,
            "details": f"Word count: {word_count}"
        }

    def check_geo_signals(self):
        """Check for GEO-specific signals like currency and address formats."""
        text = self.soup.get_text()
        
        # Currency Symbols
        currencies = []
        if '₩' in text or 'KRW' in text: currencies.append("KRW (₩)")
        if '$' in text or 'USD' in text: currencies.append("USD ($)")
        if '€' in text or 'EUR' in text: currencies.append("EUR (€)")
        if '¥' in text or 'JPY' in text: currencies.append("JPY (¥)")
        
        # Phone Numbers (Simple Regex for now)
        # Korea: 02-xxx-xxxx, 010-xxxx-xxxx
        korea_phone = re.search(r'0\d{1,2}-\d{3,4}-\d{4}', text)
        # US/Intl: +1, (xxx) xxx-xxxx
        us_phone = re.search(r'\(\d{3}\) \d{3}-\d{4}', text)
        
        phones = []
        if korea_phone: phones.append("KR Phone Format")
        if us_phone: phones.append("US Phone Format")
        
        status = "ℹ️ Info"
        return {
            "status": status,
            "found_currencies": currencies,
            "found_phones": phones,
            "details": f"Currencies: {', '.join(currencies) if currencies else 'None'}, Phones: {', '.join(phones) if phones else 'None'}"
        }

    async def get_summary_markdown_async(self):
        await self.analyze()
        md = "## 🤖 Automated SEO Audit Data (Python Analysis)\n\n"
        
        # English Keys
        display_names = {
            'meta_title': 'Meta Title',
            'meta_description': 'Meta Description',
            'canonical': 'Canonical Tag',
            'robots': 'Robots Meta',
            'viewport': 'Viewport',
            'open_graph': 'Open Graph',
            'structured_data': 'Structured Data (Schema)',
            'hreflang': 'Hreflang (International)',
            'geo_signals': 'GEO Signals (Localization)',
            'heading_structure': 'Heading Structure (H1)',
            'images': 'Image Optimization',
            'content_length': 'Content Length'
        }

        for key, result in self.results.items():
            name = display_names.get(key, key.replace('_', ' ').title())
            status = result.get('status', '❓')
            details = result.get('details', '')
            value = result.get('value', '')
            
            line = f"*   **{name}**: {status}"
            if value:
                if len(str(value)) > 50:
                    value = str(value)[:50] + "..."
                line += f" (Value: `{value}`)"
            if details:
                line += f" - {details}"
            md += line + "\n"
            
        return md
