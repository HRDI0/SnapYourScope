import json
import os


REQUIRED_CORE_KEYS = [
    "JWT_SECRET_KEY",
    "DATABASE_URL",
    "CORS_ORIGINS",
    "APP_BASE_URL",
]

REQUIRED_BILLING_KEYS = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_PRO_MONTHLY",
    "STRIPE_PRICE_ENTERPRISE_MONTHLY",
]

REQUIRED_R2_KEYS = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_ENDPOINT",
]


def _missing(keys):
    return [key for key in keys if not os.getenv(key, "").strip()]


def main() -> int:
    storage_backend = os.getenv("STORAGE_BACKEND", "local").strip().lower() or "local"
    core_missing = _missing(REQUIRED_CORE_KEYS)
    billing_missing = _missing(REQUIRED_BILLING_KEYS)
    r2_missing = _missing(REQUIRED_R2_KEYS) if storage_backend == "r2" else []

    llm_ready = any(
        os.getenv(key, "").strip()
        for key in [
            "OPENAI_API_KEY",
            "GEMINI_API_KEY",
            "GOOGLE_API_KEY",
            "PERPLEXITY_API_KEY",
            "AZURE_OPENAI_API_KEY",
            "AZURE_OPENAI_ACCESS_TOKEN",
        ]
    )
    search_ready = any(
        os.getenv(key, "").strip()
        for key in [
            "GOOGLE_SEARCH_API_KEY",
            "GOOGLE_SEARCH_CX",
            "BING_SEARCH_API_KEY",
            "NAVER_CLIENT_ID",
            "NAVER_CLIENT_SECRET",
        ]
    )

    checks = {
        "core_ready": len(core_missing) == 0,
        "billing_ready": len(billing_missing) == 0,
        "storage_ready": len(r2_missing) == 0,
        "llm_provider_configured": llm_ready,
        "search_provider_configured": search_ready,
    }

    report = {
        "profile": "staging",
        "storage_backend": storage_backend,
        "core_missing": core_missing,
        "billing_missing": billing_missing,
        "r2_missing": r2_missing,
        "checks": checks,
        "note": "No external connection calls were executed by this script.",
    }

    required_ready = (
        checks["core_ready"] and checks["billing_ready"] and checks["storage_ready"]
    )
    status = "[OK] staging readiness" if required_ready else "[WARN] staging readiness"
    print(status)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if required_ready else 1


if __name__ == "__main__":
    raise SystemExit(main())
