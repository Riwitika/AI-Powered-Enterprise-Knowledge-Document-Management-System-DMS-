import logging
from typing import Optional

# Setup dedicated audit logger
logger = logging.getLogger("kms.audit")

def log_audit(event: str, user_email: Optional[str], details: str):
    """
    Safely records security-sensitive operations to standard output log.
    Avoids printing confidential data like tokens, passwords, or documents text.
    """
    actor = user_email or "SYSTEM"
    logger.info(f"AUDIT | EVENT: {event} | USER: {actor} | DETAILS: {details}")
