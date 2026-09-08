from typing import Set

ROLE_PREFIXES: Set[str] = {
    "admin", "administrator", "sales", "support", "info", "billing",
    "contact", "marketing", "hr", "humanresources", "hello", "office",
    "team", "careers", "jobs", "help", "enquiries", "enquiry", "inquiries",
    "inquiry", "service", "customerservice", "accounting", "accounts",
    "finance", "media", "press", "legal", "compliance", "privacy",
    "security", "postmaster", "hostmaster", "webmaster", "abuse",
    "all", "everyone", "staff", "management", "board", "executive"
}

def is_role_account(email: str) -> bool:
    """
    Checks if local part of email starts with or matches a role prefix.
    """
    if not email or "@" not in email:
        return False
    local_part = email.split("@")[0].lower()
    
    # Check exact match or prefix before separator (+ or .)
    clean_local = local_part.split("+")[0].split(".")[0]
    return clean_local in ROLE_PREFIXES or local_part in ROLE_PREFIXES
