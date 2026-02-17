import secrets
import time
from datetime import timedelta
from urllib.parse import urlencode

import requests
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .. import database, models, auth
from ..config import (
    AUTH_TEMP_DISABLED,
    FRONTEND_APP_URL,
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URI,
)
from ..schemas import user as user_schemas

router = APIRouter(tags=["Authentication"])

GOOGLE_STATE_TTL_SECONDS = 600
_GOOGLE_OAUTH_STATES = {}


def _prune_google_states(now_ts: float):
    expired = [
        key
        for key, expiry in _GOOGLE_OAUTH_STATES.items()
        if not isinstance(expiry, (int, float)) or expiry < now_ts
    ]
    for key in expired:
        _GOOGLE_OAUTH_STATES.pop(key, None)


def _normalize_email(value: str) -> str:
    return (value or "").strip().lower()


def _ensure_auth_enabled() -> None:
    if AUTH_TEMP_DISABLED:
        raise HTTPException(
            status_code=503,
            detail="Authentication is temporarily paused during open beta.",
        )


@router.post("/register", response_model=user_schemas.UserResponse)
def register_user(
    user: user_schemas.UserCreate, db: Session = Depends(database.get_db)
):
    _ensure_auth_enabled()
    normalized_email = _normalize_email(user.email)

    # Check if user exists
    db_user = (
        db.query(models.User)
        .filter(func.lower(models.User.email) == normalized_email)
        .first()
    )
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=normalized_email, hashed_password=hashed_password)
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    db.refresh(new_user)
    return new_user


@router.post("/token", response_model=user_schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db),
):
    _ensure_auth_enabled()
    normalized_email = _normalize_email(form_data.username)
    user = (
        db.query(models.User)
        .filter(func.lower(models.User.email) == normalized_email)
        .first()
    )
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "tier": user.tier}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/auth/google/login-url")
def get_google_login_url():
    _ensure_auth_enabled()
    if not GOOGLE_OAUTH_CLIENT_ID or not GOOGLE_OAUTH_CLIENT_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID/GOOGLE_OAUTH_CLIENT_SECRET.",
        )

    now_ts = time.time()
    _prune_google_states(now_ts)
    state = secrets.token_urlsafe(24)
    _GOOGLE_OAUTH_STATES[state] = now_ts + GOOGLE_STATE_TTL_SECONDS

    params = {
        "client_id": GOOGLE_OAUTH_CLIENT_ID,
        "redirect_uri": GOOGLE_OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    }
    login_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {"login_url": login_url}


@router.get("/auth/google/callback")
def google_oauth_callback(
    code: str, state: str, db: Session = Depends(database.get_db)
):
    _ensure_auth_enabled()
    now_ts = time.time()
    _prune_google_states(now_ts)
    expiry = _GOOGLE_OAUTH_STATES.pop(state, None)
    if not expiry or expiry < now_ts:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    token_response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": GOOGLE_OAUTH_CLIENT_ID,
            "client_secret": GOOGLE_OAUTH_CLIENT_SECRET,
            "redirect_uri": GOOGLE_OAUTH_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        timeout=20,
    )
    if token_response.status_code >= 400:
        raise HTTPException(
            status_code=400, detail="Failed to exchange Google OAuth code"
        )

    token_payload = token_response.json()
    id_token = token_payload.get("id_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="Google id_token missing")

    userinfo_response = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {token_payload.get('access_token', '')}"},
        timeout=20,
    )
    if userinfo_response.status_code >= 400:
        raise HTTPException(
            status_code=400, detail="Failed to fetch Google user profile"
        )

    userinfo = userinfo_response.json()
    email = _normalize_email(userinfo.get("email") or "")
    if not email:
        raise HTTPException(
            status_code=400, detail="Google account email is unavailable"
        )

    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if not user:
        user = models.User(
            email=email,
            hashed_password=auth.get_password_hash(secrets.token_urlsafe(32)),
            tier="free",
        )
        db.add(user)
        db.flush()

    google_subject = (userinfo.get("sub") or "").strip()
    if not google_subject:
        raise HTTPException(
            status_code=400, detail="Google account subject is unavailable"
        )

    existing_provider = (
        db.query(models.UserAuthProvider)
        .filter(
            models.UserAuthProvider.provider == "google",
            models.UserAuthProvider.subject == google_subject,
        )
        .first()
    )
    existing_provider_user_id = (
        getattr(existing_provider, "user_id", None)
        if existing_provider is not None
        else None
    )
    if existing_provider_user_id is not None and existing_provider_user_id != user.id:
        raise HTTPException(
            status_code=400,
            detail="This Google account is already linked to another user.",
        )

    provider_row = (
        db.query(models.UserAuthProvider)
        .filter(
            models.UserAuthProvider.user_id == user.id,
            models.UserAuthProvider.provider == "google",
        )
        .first()
    )
    if provider_row is None:
        provider_row = models.UserAuthProvider(
            user_id=user.id,
            provider="google",
            auth_mode="oauth",
            subject=google_subject,
            is_active=True,
        )
        db.add(provider_row)
    elif str(getattr(provider_row, "subject", "")) != google_subject:
        setattr(provider_row, "subject", google_subject)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Google account is already linked. Use the existing account.",
        )

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "tier": user.tier}, expires_delta=access_token_expires
    )

    redirect_target = f"{FRONTEND_APP_URL}?oauth_token={access_token}"
    return RedirectResponse(url=redirect_target, status_code=302)


@router.get("/users/me", response_model=user_schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
