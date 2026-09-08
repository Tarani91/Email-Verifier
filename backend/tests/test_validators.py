import pytest
from app.validators.syntax_validator import normalize_email_string, validate_syntax
from app.validators.disposable_validator import is_disposable_domain
from app.validators.role_validator import is_role_account
from app.validators.provider_validator import is_free_provider, is_business_email

def test_normalize_email():
    raw = "  GOOD@GMAIL.COM \n\t"
    normalized = normalize_email_string(raw)
    assert normalized == "good@gmail.com"

def test_syntax_validator_valid():
    is_valid, domain, reason = validate_syntax("user.name@example.com")
    assert is_valid is True
    assert domain == "example.com"
    assert reason == ""

def test_syntax_validator_invalid():
    is_valid, domain, reason = validate_syntax("bad@@gmail")
    assert is_valid is False

def test_disposable_validator():
    assert is_disposable_domain("mailinator.com") is True
    assert is_disposable_domain("10minutemail.com") is True
    assert is_disposable_domain("gmail.com") is False

def test_role_validator():
    assert is_role_account("admin@company.com") is True
    assert is_role_account("sales@company.com") is True
    assert is_role_account("support@company.com") is True
    assert is_role_account("john.doe@company.com") is False

def test_provider_validator():
    assert is_free_provider("gmail.com") is True
    assert is_free_provider("yahoo.com") is True
    assert is_free_provider("mycompany.io") is False

    assert is_business_email("mycompany.io", is_free=False, is_disposable=False) is True
    assert is_business_email("gmail.com", is_free=True, is_disposable=False) is False
