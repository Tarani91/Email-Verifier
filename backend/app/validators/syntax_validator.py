import re
from typing import Tuple
from email_validator import validate_email, EmailNotValidError

# Regex pattern for email syntax fallback
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$"
)

def normalize_email_string(email_raw: str) -> str:
    if not email_raw:
        return ""
    # Trim leading/trailing whitespace
    email = str(email_raw).strip()
    # Remove control characters / hidden non-printable characters
    email = "".join(ch for ch in email if ch.isprintable())
    # Convert to lowercase
    return email.lower()

def validate_syntax(email: str) -> Tuple[bool, str, str]:
    """
    Validates syntax of normalized email string.
    Returns: (is_valid, domain, error_reason)
    """
    if not email:
        return False, "", "Empty email"
        
    if "@" not in email:
        return False, "", "Missing @ symbol"
        
    parts = email.split("@")
    if len(parts) != 2:
        return False, "", "Multiple @ symbols"
        
    local_part, domain = parts[0], parts[1]
    
    if not local_part:
        return False, domain, "Missing local part"
    if not domain:
        return False, "", "Missing domain"
        
    # Check with email-validator
    try:
        validated = validate_email(email, check_deliverability=False)
        return True, validated.domain.lower(), ""
    except EmailNotValidError as e:
        # Fallback to regex check if email-validator was overly strict
        if EMAIL_REGEX.match(email):
            return True, domain.lower(), ""
        return False, domain.lower(), str(e)
