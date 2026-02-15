import json
import os
import uuid
from importlib import import_module
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from ..config import (
    R2_ACCESS_KEY_ID,
    R2_BUCKET_NAME,
    R2_ENDPOINT,
    R2_SECRET_ACCESS_KEY,
    STORAGE_BACKEND,
    STORAGE_LOCAL_DIR,
    STORAGE_PUBLIC_BASE_URL,
    SUPABASE_BUCKET_NAME,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL,
)
from ..logger import setup_logger


logger = setup_logger("api.services.blob_storage")


class BlobStorageService:
    @staticmethod
    def _build_blob_name(namespace: str) -> str:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        random_id = uuid.uuid4().hex[:10]
        safe_namespace = namespace.replace("/", "_")
        return f"{safe_namespace}_{timestamp}_{random_id}.json"

    @staticmethod
    def save_json_blob(namespace: str, payload: Dict[str, Any]) -> Dict[str, str]:
        backend = (STORAGE_BACKEND or "local").lower().strip()
        blob_name = BlobStorageService._build_blob_name(namespace)
        safe_namespace = namespace.replace("/", "_")

        if backend == "r2":
            try:
                return BlobStorageService._save_r2_blob(
                    namespace=safe_namespace,
                    blob_name=blob_name,
                    payload=payload,
                )
            except Exception as e:
                logger.warning(f"R2 upload failed. Falling back to local storage: {e}")
                local_meta = BlobStorageService._save_local_blob(
                    namespace=safe_namespace,
                    blob_name=blob_name,
                    payload=payload,
                )
                local_meta["fallback_reason"] = str(e)
                return local_meta

        if backend == "supabase":
            try:
                return BlobStorageService._save_supabase_blob(
                    namespace=safe_namespace,
                    blob_name=blob_name,
                    payload=payload,
                )
            except Exception as e:
                logger.warning(
                    f"Supabase upload failed. Falling back to local storage: {e}"
                )
                local_meta = BlobStorageService._save_local_blob(
                    namespace=safe_namespace,
                    blob_name=blob_name,
                    payload=payload,
                )
                local_meta["fallback_reason"] = str(e)
                return local_meta

        if backend != "local":
            logger.warning(
                f"Unknown storage backend '{backend}'. Falling back to local storage."
            )

        return BlobStorageService._save_local_blob(
            namespace=safe_namespace,
            blob_name=blob_name,
            payload=payload,
        )

    @staticmethod
    def _save_local_blob(
        namespace: str, blob_name: str, payload: Dict[str, Any]
    ) -> Dict[str, str]:
        base_dir = Path(STORAGE_LOCAL_DIR)
        base_dir.mkdir(parents=True, exist_ok=True)
        file_path = base_dir / blob_name

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, default=str)

        blob_ref = str(file_path).replace("\\", "/")
        if STORAGE_PUBLIC_BASE_URL:
            blob_ref = f"{STORAGE_PUBLIC_BASE_URL.rstrip('/')}/{blob_name}"

        return {
            "storage_backend": "local",
            "blob_ref": blob_ref,
            "blob_name": blob_name,
            "blob_size_bytes": str(os.path.getsize(file_path)),
        }

    @staticmethod
    def _save_r2_blob(
        namespace: str, blob_name: str, payload: Dict[str, Any]
    ) -> Dict[str, str]:
        if not all(
            [
                R2_BUCKET_NAME,
                R2_ENDPOINT,
                R2_ACCESS_KEY_ID,
                R2_SECRET_ACCESS_KEY,
            ]
        ):
            raise RuntimeError("R2 backend selected but R2 env vars are incomplete")

        try:
            boto3_module = import_module("boto3")
        except Exception as e:
            raise RuntimeError("boto3 is required for R2 backend") from e

        object_key = f"{namespace}/{blob_name}"
        body_text = json.dumps(payload, ensure_ascii=False, default=str)
        body_bytes = body_text.encode("utf-8")

        client = boto3_module.client(
            "s3",
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        )
        client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=object_key,
            Body=body_bytes,
            ContentType="application/json",
        )

        if STORAGE_PUBLIC_BASE_URL:
            blob_ref = f"{STORAGE_PUBLIC_BASE_URL.rstrip('/')}/{object_key}"
        else:
            blob_ref = f"r2://{R2_BUCKET_NAME}/{object_key}"

        return {
            "storage_backend": "r2",
            "blob_ref": blob_ref,
            "blob_name": blob_name,
            "blob_size_bytes": str(len(body_bytes)),
        }

    @staticmethod
    def _save_supabase_blob(
        namespace: str, blob_name: str, payload: Dict[str, Any]
    ) -> Dict[str, str]:
        if not all([SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET_NAME]):
            raise RuntimeError(
                "Supabase backend selected but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_BUCKET_NAME are incomplete"
            )

        raise RuntimeError(
            "Supabase storage scaffold is configured but upload implementation is not connected yet"
        )
