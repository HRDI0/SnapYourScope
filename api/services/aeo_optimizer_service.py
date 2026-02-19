import json
import re
from typing import Any, Dict, List, Optional

from ..logger import setup_logger
from .llm_service import LlmService


logger = setup_logger("api.services.aeo_optimizer")


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
    def _collect_status_context(
        section: Dict[str, Any], limit: int = 40
    ) -> List[Dict[str, str]]:
        rows: List[Dict[str, str]] = []
        for key, value in section.items():
            if not isinstance(value, dict):
                continue

            status = str(value.get("status") or "").strip()
            if not status:
                continue

            message = str(value.get("message") or "").strip()
            rows.append(
                {
                    "key": key,
                    "status": status,
                    "message": message[:220],
                }
            )

            if len(rows) >= limit:
                break

        return rows

    @staticmethod
    def _normalize_priority(value: Any) -> str:
        text = str(value or "").strip().lower()
        if text in {"high", "h", "critical", "urgent"}:
            return "high"
        if text in {"low", "l", "minor"}:
            return "low"
        return "medium"

    @staticmethod
    def _extract_json_payload(text: str) -> Optional[Dict[str, Any]]:
        if not text:
            return None

        candidate = text.strip()
        if candidate.startswith("```"):
            lines = candidate.splitlines()
            if lines:
                first = lines[0].strip().lower()
                if first.startswith("```"):
                    lines = lines[1:]
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            candidate = "\n".join(lines).strip()

        def _to_payload(value: Any) -> Optional[Dict[str, Any]]:
            if isinstance(value, list):
                return {"recommendations": value}

            if isinstance(value, dict):
                if isinstance(value.get("recommendations"), list):
                    return value

                for alias in (
                    "items",
                    "actions",
                    "suggestions",
                    "recommendation_list",
                ):
                    alias_value = value.get(alias)
                    if isinstance(alias_value, list):
                        return {
                            "summary": str(value.get("summary") or "").strip(),
                            "recommendations": alias_value,
                        }

                has_title = bool(str(value.get("title") or "").strip())
                has_detail = bool(
                    str(
                        value.get("detail")
                        or value.get("description")
                        or value.get("action")
                        or value.get("recommendation")
                        or ""
                    ).strip()
                )
                if has_title and has_detail:
                    return {"recommendations": [value]}

            return None

        try:
            parsed = json.loads(candidate)
            payload = _to_payload(parsed)
            if payload is not None:
                return payload
        except Exception:
            pass

        decoder = json.JSONDecoder()
        for start_index, char in enumerate(candidate):
            if char not in {"{", "["}:
                continue
            try:
                parsed_obj, _ = decoder.raw_decode(candidate[start_index:])
                payload = _to_payload(parsed_obj)
                if payload is not None:
                    return payload
            except Exception:
                continue

        return None

    @staticmethod
    def _normalize_llm_recommendations(items: Any) -> List[Dict[str, Any]]:
        if not isinstance(items, list):
            return []

        normalized: List[Dict[str, Any]] = []
        seen_titles = set()

        for item in items:
            if not isinstance(item, dict):
                continue

            title = str(
                item.get("title")
                or item.get("name")
                or item.get("heading")
                or item.get("recommendation")
                or item.get("action")
                or ""
            ).strip()
            detail = str(
                item.get("detail")
                or item.get("description")
                or item.get("action")
                or item.get("recommendation")
                or item.get("rationale")
                or item.get("why")
                or item.get("content")
                or ""
            ).strip()

            if not detail and title:
                detail = title
            if not title and detail:
                title = detail[:80]

            category = str(item.get("category") or "general").strip().lower()
            priority = AeoOptimizerService._normalize_priority(item.get("priority"))

            if not title or not detail:
                continue

            title_key = title.lower()
            if title_key in seen_titles:
                continue

            normalized.append(
                {
                    "priority": priority,
                    "category": category,
                    "title": title,
                    "detail": detail,
                    "references": AeoOptimizerService.RESEARCH_REFERENCES,
                }
            )
            seen_titles.add(title_key)

            if len(normalized) >= 12:
                break

        return normalized

    @staticmethod
    def _extract_recommendations_from_text(text: str) -> List[Dict[str, Any]]:
        if not text:
            return []

        lines = [line.strip() for line in text.splitlines() if line.strip()]
        if not lines:
            return []

        candidates: List[str] = []
        for line in lines:
            cleaned = re.sub(r"^\s*(?:[-*]|\d+[.)])\s*", "", line).strip()
            if len(cleaned) < 16:
                continue
            candidates.append(cleaned)
            if len(candidates) >= 12:
                break

        if not candidates:
            sentence_parts = [
                part.strip() for part in re.split(r"[\n\.]+", text) if part.strip()
            ]
            candidates = [part for part in sentence_parts if len(part) >= 16][:12]

        items: List[Dict[str, Any]] = []
        for candidate in candidates:
            lower = candidate.lower()
            priority = "medium"
            if any(token in lower for token in ("critical", "urgent", "high")):
                priority = "high"
            elif any(token in lower for token in ("minor", "low")):
                priority = "low"

            title = candidate.split(":", 1)[0].strip()
            if len(title) > 80:
                title = title[:80].rstrip()

            items.append(
                {
                    "priority": priority,
                    "category": "general",
                    "title": title,
                    "detail": candidate,
                }
            )

        return items

    @staticmethod
    def _build_optimizer_prompt(
        url: str,
        analysis_result: Dict[str, Any],
        rule_result: Dict[str, Any],
    ) -> str:
        seo = analysis_result.get("seo_result") or {}
        aeo = analysis_result.get("aeo_result") or {}
        geo = analysis_result.get("geo_result") or {}

        prompt_context = {
            "target_url": url,
            "seo_score": seo.get("seo_score"),
            "aeo_score": aeo.get("aeo_score"),
            "geo_status": geo.get("regional_status"),
            "seo_checks": AeoOptimizerService._collect_status_context(seo),
            "aeo_checks": AeoOptimizerService._collect_status_context(aeo),
            "rule_based_seed_recommendations": [
                {
                    "priority": item.get("priority"),
                    "category": item.get("category"),
                    "title": item.get("title"),
                    "detail": item.get("detail"),
                }
                for item in (rule_result.get("recommendations") or [])
            ],
        }

        response_template = {
            "summary": "<one sentence summary using current scores/checks>",
            "recommendations": [
                {
                    "priority": "high",
                    "category": "technical_seo",
                    "title": "<action title 1>",
                    "detail": "<action detail 1 with source check key>",
                },
                {
                    "priority": "high",
                    "category": "answer_structure",
                    "title": "<action title 2>",
                    "detail": "<action detail 2 with source check key>",
                },
                {
                    "priority": "medium",
                    "category": "structured_data",
                    "title": "<action title 3>",
                    "detail": "<action detail 3 with source check key>",
                },
                {
                    "priority": "medium",
                    "category": "trust_signals",
                    "title": "<action title 4>",
                    "detail": "<action detail 4 with source check key>",
                },
                {
                    "priority": "medium",
                    "category": "readability_structure",
                    "title": "<action title 5>",
                    "detail": "<action detail 5 with source check key>",
                },
                {
                    "priority": "medium",
                    "category": "technical_seo",
                    "title": "<action title 6>",
                    "detail": "<action detail 6 with source check key>",
                },
                {
                    "priority": "low",
                    "category": "geo_paper_alignment",
                    "title": "<action title 7>",
                    "detail": "<action detail 7 with source check key>",
                },
                {
                    "priority": "low",
                    "category": "geo_paper_alignment",
                    "title": "<action title 8>",
                    "detail": "<action detail 8 with source check key>",
                },
            ],
        }

        prompt = (
            "You are an SEO/AEO optimization analyst. "
            "Use the provided Playwright-rendered analysis context and seed rule recommendations. "
            "Fill the JSON template values only while keeping the exact keys and list structure. "
            "Use context-specific recommendations; do not repeat the same generic text across sites. "
            "Use at least 4 different source check keys from context in recommendation details. "
            "Each detail must include one source check key in square brackets, for example [source:meta_title]. "
            "Return one strict JSON object only. Use plain ASCII double quotes only. "
            "Do not include markdown fences, prose, or extra keys.\n"
            f"Response Template JSON:\n{json.dumps(response_template, ensure_ascii=False)}\n"
            f"Context JSON:\n{json.dumps(prompt_context, ensure_ascii=False)}"
        )

        return prompt

    @staticmethod
    def _build_json_repair_prompt(raw_text: str) -> str:
        response_template = {
            "summary": "<one sentence summary>",
            "recommendations": [
                {
                    "priority": "high",
                    "category": "technical_seo",
                    "title": "<action title>",
                    "detail": "<action detail>",
                }
            ],
        }

        return (
            "Convert the following text into strict JSON only. "
            "Use this exact JSON template keys and object shape. "
            "Return only JSON with no markdown or explanation.\n"
            f"Template JSON:\n{json.dumps(response_template, ensure_ascii=False)}\n"
            f"Raw text:\n{raw_text[:9000]}"
        )

    @staticmethod
    def _openai_response_format() -> Dict[str, Any]:
        return {
            "type": "json_schema",
            "name": "seo_aeo_optimizer_response",
            "strict": True,
            "schema": {
                "type": "object",
                "additionalProperties": False,
                "required": ["summary", "recommendations"],
                "properties": {
                    "summary": {"type": "string"},
                    "recommendations": {
                        "type": "array",
                        "minItems": 6,
                        "maxItems": 12,
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": [
                                "priority",
                                "category",
                                "title",
                                "detail",
                            ],
                            "properties": {
                                "priority": {
                                    "type": "string",
                                    "enum": ["high", "medium", "low"],
                                },
                                "category": {"type": "string"},
                                "title": {"type": "string"},
                                "detail": {"type": "string"},
                            },
                        },
                    },
                },
            },
        }

    @staticmethod
    def _optimizer_max_output_tokens() -> int:
        import os

        raw_value = (os.getenv("OPTIMIZER_MAX_OUTPUT_TOKENS", "2400") or "2400").strip()
        try:
            parsed = int(raw_value)
        except Exception:
            parsed = 2400
        return max(800, min(parsed, 6000))

    @staticmethod
    def build_recommendations_with_llm(
        url: str,
        analysis_result: Dict[str, Any],
        rule_result: Dict[str, Any],
    ) -> Dict[str, Any]:
        prompt = AeoOptimizerService._build_optimizer_prompt(
            url=url,
            analysis_result=analysis_result,
            rule_result=rule_result,
        )

        try:
            response_format = AeoOptimizerService._openai_response_format()
            max_output_tokens = AeoOptimizerService._optimizer_max_output_tokens()
            llm_text, provider, model, latency_ms, _ = LlmService.call_with_fallback(
                prompt=prompt,
                preferred_provider="gpt",
                response_format=response_format,
                max_output_tokens=max_output_tokens,
            )
            parsed = AeoOptimizerService._extract_json_payload(llm_text)
            if not parsed and llm_text:
                repair_prompt = AeoOptimizerService._build_json_repair_prompt(llm_text)
                repair_text, _, _, _, _ = LlmService.call_with_fallback(
                    prompt=repair_prompt,
                    preferred_provider="gpt",
                    response_format=response_format,
                    max_output_tokens=max_output_tokens,
                )
                parsed = AeoOptimizerService._extract_json_payload(repair_text)
            if not parsed and llm_text:
                parsed = {
                    "summary": "",
                    "recommendations": AeoOptimizerService._extract_recommendations_from_text(
                        llm_text
                    ),
                }
            llm_recommendations = AeoOptimizerService._normalize_llm_recommendations(
                parsed.get("recommendations") if parsed else []
            )

            if llm_recommendations:
                summary_text = str((parsed or {}).get("summary") or "").strip()
                return {
                    "url": url,
                    "recommendation_count": len(llm_recommendations),
                    "recommendations": llm_recommendations,
                    "notes": summary_text or rule_result.get("notes", ""),
                    "references": AeoOptimizerService.RESEARCH_REFERENCES,
                    "generation_meta": {
                        "mode": "llm",
                        "provider_used": provider,
                        "model_name": model,
                        "latency_ms": latency_ms,
                        "rule_seed_count": int(
                            rule_result.get("recommendation_count") or 0
                        ),
                    },
                }

            logger.warning(
                "AEO optimizer LLM returned no usable recommendation rows; falling back to rules"
            )
        except Exception as error:
            logger.warning("AEO optimizer LLM generation failed: %s", error)

        fallback = dict(rule_result)
        fallback["generation_meta"] = {
            "mode": "rule_fallback",
            "provider_used": None,
            "model_name": None,
            "latency_ms": 0,
            "rule_seed_count": int(rule_result.get("recommendation_count") or 0),
        }
        return fallback

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
