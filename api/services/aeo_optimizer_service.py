from typing import Dict, List


class AeoOptimizerService:
    @staticmethod
    def build_recommendations(url: str, analysis_result: Dict) -> Dict:
        seo = analysis_result.get("seo_result") or {}
        aeo = analysis_result.get("aeo_result") or {}

        recommendations: List[Dict] = []

        answer_first = (aeo.get("answer_first") or {}).get("status", "")
        if "Fail" in answer_first or "Warn" in answer_first:
            recommendations.append(
                {
                    "priority": "high",
                    "category": "answer_structure",
                    "title": "Add direct answer blocks early",
                    "detail": "Place concise answer-first paragraphs in the first visible section for common query intents.",
                }
            )

        structure_status = (aeo.get("content_structure") or {}).get("status", "")
        if "Fail" in structure_status or "Warn" in structure_status:
            recommendations.append(
                {
                    "priority": "high",
                    "category": "readability_structure",
                    "title": "Increase scannable structure",
                    "detail": "Use clear heading hierarchy, bullet lists, and short paragraphs for easier extraction by answer engines.",
                }
            )

        schema_status = (aeo.get("structured_data_deep_dive") or {}).get("status", "")
        if "Fail" in schema_status or "Warn" in schema_status:
            recommendations.append(
                {
                    "priority": "high",
                    "category": "structured_data",
                    "title": "Strengthen schema for answer engines",
                    "detail": "Add/upgrade FAQPage, HowTo, and Organization-level schema where applicable.",
                }
            )

        eeat_status = (aeo.get("e_e_a_t_signals") or {}).get("status", "")
        if "Fail" in eeat_status or "Warn" in eeat_status:
            recommendations.append(
                {
                    "priority": "medium",
                    "category": "trust_signals",
                    "title": "Improve E-E-A-T signals",
                    "detail": "Expose author credentials, cite trustworthy sources, and maintain updated About/Contact trust pages.",
                }
            )

        readability_status = (aeo.get("readability_signal") or {}).get("status", "")
        if "Fail" in readability_status or "Warn" in readability_status:
            recommendations.append(
                {
                    "priority": "medium",
                    "category": "language_quality",
                    "title": "Improve linguistic clarity",
                    "detail": "Reduce sentence complexity and remove ambiguity to increase extraction confidence in generated answers.",
                }
            )

        sd_status = (seo.get("structured_data") or {}).get("status", "")
        if "Fail" in sd_status or "Warn" in sd_status:
            recommendations.append(
                {
                    "priority": "medium",
                    "category": "technical_seo",
                    "title": "Fix baseline structured data gaps",
                    "detail": "Validate JSON-LD and ensure schema fields are complete and syntactically correct.",
                }
            )

        recommendations.extend(
            [
                {
                    "priority": "medium",
                    "category": "geo_paper_alignment",
                    "title": "Add evidence-rich passages",
                    "detail": "Include concrete facts, statistics, and cited statements in key sections to improve generative citation likelihood.",
                },
                {
                    "priority": "low",
                    "category": "geo_paper_alignment",
                    "title": "Increase quote and source density",
                    "detail": "Add expert quotes and outbound references to authoritative sources for higher answer-engine trust.",
                },
            ]
        )

        return {
            "url": url,
            "recommendation_count": len(recommendations),
            "recommendations": recommendations,
            "notes": "Recommendations are based on current URL audit and GEO/AEO optimization principles from arXiv:2311.09735.",
        }
