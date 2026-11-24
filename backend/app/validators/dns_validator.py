import asyncio
import dns.asyncresolver
import dns.resolver
from typing import Tuple, Dict
from app.core.config import settings

# Global cache for domain DNS lookups to avoid repetitive network requests
# Key: domain, Value: (domain_exists, has_mx, primary_mx_record, error_reason)
_DNS_CACHE: Dict[str, Tuple[bool, bool, str, str]] = {}
_CACHE_LOCK = asyncio.Lock()

async def check_domain_and_mx(domain: str) -> Tuple[bool, bool, str, str]:
    """
    Checks if domain exists and has valid MX records.
    Returns: (domain_exists, has_mx, primary_mx_record, reason)
    """
    if not domain:
        return False, False, "", "No domain provided"
        
    domain_lower = domain.lower()

    async with _CACHE_LOCK:
        if domain_lower in _DNS_CACHE:
            return _DNS_CACHE[domain_lower]

    resolver = dns.asyncresolver.Resolver()
    resolver.timeout = settings.DNS_TIMEOUT_SECONDS
    resolver.lifetime = settings.DNS_TIMEOUT_SECONDS

    domain_exists = False
    has_mx = False
    primary_mx = ""
    reason = ""

    try:
        # Step 1: Check MX records with strict timeout
        mx_answers = await asyncio.wait_for(
            resolver.resolve(domain_lower, "MX"),
            timeout=settings.DNS_TIMEOUT_SECONDS + 0.5
        )
        if mx_answers and len(mx_answers) > 0:
            domain_exists = True
            has_mx = True
            # Get MX with lowest preference number
            sorted_mx = sorted(mx_answers, key=lambda r: r.preference)
            primary_mx = str(sorted_mx[0].exchange).rstrip(".")
            reason = f"MX server found: {primary_mx}"
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
        # MX record not found, check A / AAAA record as fallback mail server
        try:
            a_answers = await asyncio.wait_for(
                resolver.resolve(domain_lower, "A"),
                timeout=settings.DNS_TIMEOUT_SECONDS + 0.5
            )
            if a_answers and len(a_answers) > 0:
                domain_exists = True
                has_mx = False
                reason = "No MX Record found (Fallback A record exists)"
            else:
                domain_exists = False
                has_mx = False
                reason = "Domain does not exist (NXDOMAIN)"
        except Exception:
            domain_exists = False
            has_mx = False
            reason = "Domain does not exist or has no DNS records"
    except (dns.resolver.Timeout, asyncio.TimeoutError):
        domain_exists = True  # Assume domain exists to avoid harsh penalty
        has_mx = False
        reason = "DNS lookup timed out"
    except Exception as e:
        domain_exists = False
        has_mx = False
        reason = f"DNS query failure: {str(e)}"

    result = (domain_exists, has_mx, primary_mx, reason)

    async with _CACHE_LOCK:
        _DNS_CACHE[domain_lower] = result

    return result
