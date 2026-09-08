from typing import Set

FREE_PROVIDERS: Set[str] = {
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.fr",
    "hotmail.com", "hotmail.co.uk", "outlook.com", "live.com", "msn.com",
    "icloud.com", "me.com", "mac.com", "aol.com", "proton.me", "protonmail.com",
    "zoho.com", "mail.com", "gmx.com", "gmx.net", "yandex.com", "yandex.ru"
}

def is_free_provider(domain: str) -> bool:
    """
    Checks if domain belongs to a free email provider.
    """
    if not domain:
        return False
    return domain.lower() in FREE_PROVIDERS

def is_business_email(domain: str, is_free: bool, is_disposable: bool) -> bool:
    """
    Determines if email domain is a business/corporate email domain.
    """
    if not domain:
        return False
    return not is_free and not is_disposable
