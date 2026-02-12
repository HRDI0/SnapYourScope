import re
from bs4 import BeautifulSoup

class AeoVerifier:
    def __init__(self, html_content):
        self.soup = BeautifulSoup(html_content, 'html.parser')
        self.results = {}

    def analyze(self):
        """Run all AEO analysis methods."""
        self.results['answer_first'] = self.check_answer_first()
        self.results['content_structure'] = self.check_content_structure()
        self.results['structured_data_deep_dive'] = self.check_structured_data_deep_dive()
        self.results['readability_signal'] = self.check_readability_signal()
        self.results['e_e_a_t_signals'] = self.check_eeat_signals()
        return self.results

    def check_answer_first(self):
        """Check if the main keyword or question is answered in the first 100 words."""
        # Simple heuristic: Check if the first paragraph is concise (under 50 words) 
        # which often indicates a direct answer or summary.
        first_p = self.soup.find('p')
        if not first_p:
             return {"status": "⚠️ Warning", "details": "No paragraph found at start."}
        
        text = first_p.get_text(strip=True)
        word_count = len(text.split())
        
        status = "✅ Pass" if 10 <= word_count <= 60 else "⚠️ Warning"
        return {
            "status": status,
            "word_count": word_count,
            "details": "First paragraph is concise (potential direct answer)." if status == "✅ Pass" else "First paragraph might be too long or too short for a direct answer."
        }

    def check_content_structure(self):
        """Check for lists and tables which AI loves."""
        tables = len(self.soup.find_all('table'))
        lists = len(self.soup.find_all(['ul', 'ol']))
        
        details = []
        if tables > 0: details.append(f"{tables} Tables found")
        if lists > 0: details.append(f"{lists} Lists found")
        
        status = "✅ Pass" if tables > 0 or lists > 0 else "ℹ️ Info"
        return {
            "status": status,
            "details": ", ".join(details) if details else "No tables or lists found (AI prefers structured data)."
        }

    def check_structured_data_deep_dive(self):
        """Check for specific schemas that trigger Rich Results/AI Citation."""
        import json
        scripts = self.soup.find_all('script', type='application/ld+json')
        found_types = []
        
        critical_aeo_schemas = ['FAQPage', 'HowTo', 'Article', 'NewsArticle', 'Product']
        
        for script in scripts:
            try:
                data = json.loads(script.string if script.string else '{}')
                # Recursive function to find types in nested JSON-LD
                def find_type(obj):
                    if isinstance(obj, dict):
                        if '@type' in obj:
                            t = obj['@type']
                            if isinstance(t, list): found_types.extend(t)
                            else: found_types.append(t)
                        for v in obj.values(): find_type(v)
                    elif isinstance(obj, list):
                        for i in obj: find_type(i)
                
                find_type(data)
            except: pass
            
        found_critical = [t for t in found_types if t in critical_aeo_schemas]
        
        status = "✅ Pass" if found_critical else "⚠️ Warning"
        return {
            "status": status,
            "found_critical": found_critical,
            "details": f"Found AI-Preferred Schemas: {', '.join(found_critical)}" if found_critical else "No high-value AEO schemas (FAQ, HowTo, Article) found."
        }

    def check_readability_signal(self):
        """Estimate readability (simple heuristic for now)."""
        # AI prefers simple, clear sentences.
        text = self.soup.get_text(separator=' ', strip=True)[:5000]
        sentences = re.split(r'[.!?]+', text)
        sentences = [s for s in sentences if len(s.strip()) > 0]
        
        if not sentences:
             return {"status": "❓ Unknown", "details": "No text content found."}
             
        avg_words = sum(len(s.split()) for s in sentences) / len(sentences)
        
        # Lower average sentence length is generally better for readability/AI
        status = "✅ Pass" if avg_words < 20 else "⚠️ Warning"
        return {
            "status": status,
            "avg_sentence_length": round(avg_words, 1),
            "details": f"Avg Sentence Length: {round(avg_words, 1)} words (AI prefers < 20)."
        }

    def check_eeat_signals(self):
        """Check for E-E-A-T signals like Author, About page links."""
        text_content = self.soup.get_text().lower()
        links = [a.get('href', '').lower() for a in self.soup.find_all('a')]
        
        has_author = 'author' in text_content or any('author' in l for l in links)
        has_about = any('about' in l for l in links)
        has_privacy = any('privacy' in l for l in links) or any('terms' in l for l in links)
        
        signals = []
        if has_author: signals.append("Author Info")
        if has_about: signals.append("About Page")
        if has_privacy: signals.append("Privacy/Terms")
        
        status = "✅ Pass" if len(signals) >= 2 else "⚠️ Warning"
        return {
            "status": status,
            "signals": signals,
            "details": f"Found Trust Signals: {', '.join(signals)}" if signals else "Low Trust Signals (Missing Author/About/Privacy)."
        }

    def get_summary_markdown(self):
        self.analyze()
        md = "## 🤖 AEO (Answer Engine Optimization) Audit\n\n"
        
        display_names = {
            'answer_first': 'Answer-First Structure',
            'content_structure': 'Content Structuring (Lists/Tables)',
            'structured_data_deep_dive': 'AI-Rich Schema',
            'readability_signal': 'Readability (Sentence Length)',
            'e_e_a_t_signals': 'E-E-A-T Trust Signals',
        }

        for key, result in self.results.items():
            name = display_names.get(key, key.replace('_', ' ').title())
            status = result.get('status', '❓')
            details = result.get('details', '')
            
            md += f"*   **{name}**: {status} - {details}\n"
            
        return md
