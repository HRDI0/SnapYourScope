import logging
import os
import sys
import re
from logging.handlers import RotatingFileHandler

# Ensure log directory exists
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

ALLOWED_LOG_LEVEL = logging.DEBUG


class SensitiveFilter(logging.Filter):
    """Redact sensitive information from logs."""

    def filter(self, record):
        msg = record.getMessage()

        patterns = [
            (
                r'("(?:password|passwd|token|access_token|refresh_token|authorization|email|username)"\s*:\s*")[^"]*(")',
                r"\1***REDACTED***\2",
            ),
            (
                r"('(?:password|passwd|token|access_token|refresh_token|authorization|email|username)'\s*:\s*')[^']*(')",
                r"\1***REDACTED***\2",
            ),
            (
                r"((?:password|passwd|token|access_token|refresh_token|authorization|email|username)=)[^&\s]+",
                r"\1***REDACTED***",
            ),
            (r"(Bearer\s+)[A-Za-z0-9\-_.]+", r"\1***REDACTED***"),
        ]

        for pattern, replacement in patterns:
            msg = re.sub(pattern, replacement, msg)

        record.args = ()
        record.msg = msg
        return True


def setup_logger(name):
    logger = logging.getLogger(name)
    logger.setLevel(ALLOWED_LOG_LEVEL)

    # Check if handlers already exist to avoid duplicate logs
    if not logger.handlers:
        # File Handler
        file_handler = RotatingFileHandler(
            os.path.join(LOG_DIR, "app.log"),
            maxBytes=5 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8",
        )
        file_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        file_handler.setFormatter(file_formatter)
        file_handler.addFilter(SensitiveFilter())  # Add Filter
        logger.addHandler(file_handler)

        # Console Handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_formatter = logging.Formatter(
            "%(asctime)s - %(levelname)s - %(message)s"
        )
        console_handler.setFormatter(console_formatter)
        console_handler.addFilter(SensitiveFilter())  # Add Filter
        logger.addHandler(console_handler)

    return logger
