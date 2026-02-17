from typing import Any, Dict, List


class AeoOptimizerService:
    RESEARCH_REFERENCES = [
        {
            "title": "Google Search Central: Helpful content guidelines",
            "url": "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
        },
        {
            "title": "Google Search Central: Structured data introduction",
            "url": "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
        },
        {
            "title": "NIST AI RMF 1.0",
            "url": "https://www.nist.gov/itl/ai-risk-management-framework",
        },
        {
            "title": "GEO: Generative Engine Optimization (arXiv:2311.09735)",
            "url": "https://arxiv.org/abs/2311.09735",
        },
    ]

    @staticmethod
    def build_recommendations(
        url: str, analysis_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        seo = analysis_result.get("seo_result") or {}
        aeo = analysis_result.get("aeo_result") or {}

        recommendations: List[Dict[str, Any]] = []

        answer_first = (aeo.get("answer_first") or {}).get("status", "")
        if "Fail" in answer_first or "Warn" in answer_first:
            recommendations.append(
                {
                    "priority": "high",
                    "category": "answer_structure",
                    "title": "Add direct answer blocks early",
                    "detail": "Place concise answer-first paragraphs in the first visible section for common query intents.",
                    "references": AeoOptimizerService.RESEARCH_REFERENCES[:2],
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
                    "references": AeoOptimizerService.RESEARCH_REFERENCES[:2],
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
                    "references": AeoOptimizerService.RESEARCH_REFERENCES[:2],
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
                    "references": AeoOptimizerService.RESEARCH_REFERENCES,
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
                    "references": AeoOptimizerService.RESEARCH_REFERENCES,
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
                    "references": AeoOptimizerService.RESEARCH_REFERENCES[:2],
                }
            )

        canonical_status = (seo.get("canonical") or {}).get("status", "")
        if "Fail" in canonical_status or "Warn" in canonical_status:
            recommendations.append(
                {
                    "priority": "high",
                    "category": "technical_seo",
                    "title": "Fix canonical consistency",
                    "detail": "Set canonical URLs on all indexable pages to prevent duplicate-content ambiguity and ranking dilution.",
                    "references": AeoOptimizerService.RESEARCH_REFERENCES[:2],
                }
            )

        heading_status = (seo.get("heading_structure") or {}).get("status", "")
        if "Fail" in heading_status or "Warn" in heading_status:
            recommendations.append(
                {
                    "priority": "high",
                    "category": "technical_seo",
                    "title": "Normalize heading hierarchy",
                    "detail": "Use one clear H1 and consistent H2/H3 structure aligned to page intent clusters for better SEO and answer extraction.",
                    "references": AeoOptimizerService.RESEARCH_REFERENCES[:2],
                }
            )

        image_missing_alt = int((seo.get("images") or {}).get("missing_alt") or 0)
        if image_missing_alt > 0:
            recommendations.append(
                {
                    "priority": "medium",
                    "category": "technical_seo",
                    "title": "Recover missing image alt attributes",
                    "detail": f"Add descriptive alt text to {image_missing_alt} images to improve semantic understanding and accessibility signals.",
                    "references": AeoOptimizerService.RESEARCH_REFERENCES[:2],
                }
            )

        title_status = (seo.get("meta_title") or {}).get("status", "")
        desc_status = (seo.get("meta_description") or {}).get("status", "")
        if (
            "Fail" in title_status
            or "Warn" in title_status
            or "Fail" in desc_status
            or "Warn" in desc_status
        ):
            recommendations.append(
                {
                    "priority": "medium",
                    "category": "technical_seo",
                    "title": "Tune title and meta description quality",
                    "detail": "Adjust title/description lengths and intent wording so search snippets and AI summaries align with target queries.",
                    "references": AeoOptimizerService.RESEARCH_REFERENCES[:2],
                }
            )

        recommendations.extend(
            [
                {
                    "priority": "medium",
                    "category": "geo_paper_alignment",
                    "title": "Add evidence-rich passages (GEO)",
                    "detail": "Convert generic claims to quantifiable facts and source-backed statements. GEO reports higher citation likelihood when pages include measurable evidence (Sec. 2.2.2, Table 1).",
                    "references": AeoOptimizerService.RESEARCH_REFERENCES,
                },
                {
                    "priority": "low",
                    "category": "geo_paper_alignment",
                    "title": "Increase quote and source density (GEO)",
                    "detail": "Add expert quotations and explicit source links near key claims. GEO highlights quote/citation strategies as strong visibility levers in generative answers (Sec. 2.2.2, Table 1).",
                    "references": AeoOptimizerService.RESEARCH_REFERENCES,
                },
                {
                    "priority": "medium",
                    "category": "geo_paper_alignment",
                    "title": "Use authoritative but clear language",
                    "detail": "Prefer confident, structured prose over vague wording and avoid keyword stuffing. GEO indicates better generative inclusion with fluent, authoritative text (Sec. 2.2.2, Sec. 4).",
                    "references": AeoOptimizerService.RESEARCH_REFERENCES,
                },
                {
                    "priority": "medium",
                    "category": "geo_paper_alignment",
                    "title": "Match query intent by section design",
                    "detail": "For technical queries, prioritize terminology + data; for general queries, prioritize concise explanation + references. GEO shows strategy effects vary by domain/intent (Sec. 5.1).",
                    "references": AeoOptimizerService.RESEARCH_REFERENCES,
                },
            ]
        )

        return {
            "url": url,
            "recommendation_count": len(recommendations),
            "recommendations": recommendations,
            "notes": "Recommendations combine traditional technical SEO checks and AEO/GEO guidance grounded in GEO paper findings (arXiv:2311.09735).",
            "references": AeoOptimizerService.RESEARCH_REFERENCES,
        }
