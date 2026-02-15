import json
import os


REQUIRED_CORE_KEYS = [
    "JWT_SECRET_KEY",
    "DATABASE_URL",
    "CORS_ORIGINS",
]

REQUIRED_BILLING_KEYS = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_PRO_MONTHLY",
    "STRIPE_PRICE_ENTERPRISE_MONTHLY",
]


def _missing(keys):
    return [key for key in keys if not os.getenv(key, "").strip()]


def main() -> int:
    core_missing = _missing(REQUIRED_CORE_KEYS)
    billing_missing = _missing(REQUIRED_BILLING_KEYS)

    report = {
        "core_missing": core_missing,
        "billing_missing": billing_missing,
        "storage_backend": os.getenv("STORAGE_BACKEND", "local"),
        "checks": {
            "core_ready": len(core_missing) == 0,
            "billing_ready": len(billing_missing) == 0,
        },
        "note": "No external connection calls were executed by this script.",
    }

    ready = report["checks"]["core_ready"] and report["checks"]["billing_ready"]
    status = (
        "[OK] account handoff readiness"
        if ready
        else "[WARN] account handoff readiness"
    )
    print(status)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
