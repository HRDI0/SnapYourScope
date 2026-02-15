import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from api.config import STORAGE_BACKEND
from api.services.blob_storage_service import BlobStorageService


def main() -> int:
    payload = {
        "probe": "storage_connection_check",
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        result = BlobStorageService.save_json_blob(
            namespace="storage_probe",
            payload=payload,
        )
    except Exception as e:
        print("[FAIL] storage connection check failed")
        print(str(e))
        return 1

    output = {
        "configured_backend": STORAGE_BACKEND,
        "effective_backend": result.get("storage_backend"),
        "blob_ref": result.get("blob_ref"),
        "blob_name": result.get("blob_name"),
        "blob_size_bytes": result.get("blob_size_bytes"),
        "fallback_reason": result.get("fallback_reason"),
    }
    print("[OK] storage connection check passed")
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
