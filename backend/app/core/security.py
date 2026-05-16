"""Security helpers used by the API.

Contains functions for password hashing/verification and JWT
creation. These utilities are small wrappers around established
libraries (`passlib` and `python-jose`) and keep authentication
concerns isolated from business logic.

IMPORTANT: ``SECRET_KEY`` is currently hard-coded for local
development. Store secrets in environment variables or a secret
manager in production.
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext

# Secret key to sign the JWT token (In production, move this to a .env file!)
SECRET_KEY = "super_secret_credify_key_change_me_later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing context (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if ``plain_password`` matches ``hashed_password``.

    This uses the configured ``pwd_context`` (bcrypt) for verification.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash ``password`` and return the hashed string for storage."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Encode a JWT token embedding ``data`` with an expiration claim.

    ``data`` should include identifying claims (for example, ``sub`` or
    a user role). If ``expires_delta`` is omitted, a short default is
    used (15 minutes). The returned token is suitable for use as a
    bearer access token in Authorization headers.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt