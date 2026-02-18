import asyncio
import os
import sys

import uvicorn


def _as_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    is_render = bool(os.getenv("RENDER")) or bool(os.getenv("RENDER_SERVICE_ID"))

    default_reload = "false" if is_render else "true"
    reload_enabled = _as_bool(os.getenv("UVICORN_RELOAD", default_reload))

    host = os.getenv("HOST", "0.0.0.0" if is_render else "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))

    uvicorn.run("api.main:app", host=host, port=port, reload=reload_enabled)
