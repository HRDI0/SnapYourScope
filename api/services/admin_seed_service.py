from .. import auth, models
from ..config import ADMIN_SEED_EMAIL, ADMIN_SEED_ENABLED, ADMIN_SEED_PASSWORD


def seed_admin_account(db):
    if not ADMIN_SEED_ENABLED:
        return {"executed": False, "reason": "ADMIN_SEED_ENABLED is false"}

    email = (ADMIN_SEED_EMAIL or "").strip().lower()
    password = (ADMIN_SEED_PASSWORD or "").strip()
    if not email or not password:
        return {
            "executed": False,
            "reason": "ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD not configured",
        }

    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        user.tier = "enterprise"
        user.is_active = True
        user.hashed_password = auth.get_password_hash(password)
        db.commit()
        return {"executed": True, "status": "updated", "email": email}

    user = models.User(
        email=email,
        hashed_password=auth.get_password_hash(password),
        tier="enterprise",
        is_active=True,
    )
    db.add(user)
    db.commit()
    return {"executed": True, "status": "created", "email": email}
