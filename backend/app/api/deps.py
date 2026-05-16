"""Dependency helpers for API routes.

This module exposes two commonly used FastAPI dependencies:

- ``get_db``: yields a SQLAlchemy session for use inside path
  operations and dependencies. Ensures the session is closed after
  the request completes.

- ``get_current_user``: decodes a JWT access token, validates it, and
  loads the corresponding ``User`` from the database. Raises a
  401 Unauthorized HTTPException when the token is invalid or the
  user cannot be found.

Keeping these helpers in one module keeps authentication and session
management consistent across the API routers.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.security import SECRET_KEY, ALGORITHM
from app.db.database import SessionLocal
from app.db.models import User

# OAuth2 scheme tells FastAPI which endpoint issues tokens to clients
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_db():
    """Yield a database session for request-scoped usage.

    Use this dependency in path operations to receive a SQLAlchemy
    ``Session`` instance. The session is closed automatically when the
    request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Resolve and return the currently authenticated ``User``.

    Steps:
    1. Decode the JWT token using ``SECRET_KEY`` and ``ALGORITHM``.
    2. Extract the subject (``sub``) claim containing the user id.
    3. Load the user from the database.
    4. Raise HTTP 401 if validation fails.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Load user from DB and raise if missing
    user = db.query(User).filter(User.user_id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user