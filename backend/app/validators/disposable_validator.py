from typing import Set

DISPOSABLE_DOMAINS: Set[str] = {
    "mailinator.com", "10minutemail.com", "guerrillamail.com", "tempmail.com",
    "trashmail.com", "yopmail.com", "sharklasers.com", "dispostable.com",
    "getnada.com", "throwawaymail.com", "temp-mail.org", "maildrop.cc",
    "crazymailing.com", "fakeinbox.com", "inboxalias.com", "mailcatch.com",
    "mailnesia.com", "mintemail.com", "mytemp.email", "nada.ltd",
    "noclickemail.com", "nowmymail.com", "owlymail.com", "receive-smtp.com",
    "receiveemail.org", "spambox.us", "spamgourmet.com", "temp-mail.ru",
    "tempail.com", "tempr.email", "tmpmail.net", "trashmail.net",
    "mohmal.com", "burnermail.io", "disposablemail.com", "dropmail.me"
}

def is_disposable_domain(domain: str) -> bool:
    """
    Checks if a domain belongs to a disposable email service.
    """
    if not domain:
        return False
    domain_lower = domain.lower()
    return domain_lower in DISPOSABLE_DOMAINS
