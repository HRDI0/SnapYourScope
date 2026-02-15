import os
import json
from importlib import import_module
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import auth, database, models
from ..logger import setup_logger

router = APIRouter(tags=["Billing"])
logger = setup_logger("api.billing")


class CheckoutSessionRequest(BaseModel):
    plan: str
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class PortalSessionRequest(BaseModel):
    return_url: Optional[str] = None


def _load_stripe():
    try:
        stripe = import_module("stripe")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Stripe SDK is not available: {e}",
        )

    secret_key = os.getenv("STRIPE_SECRET_KEY", "").strip()
    if not secret_key:
        raise HTTPException(
            status_code=500,
            detail="STRIPE_SECRET_KEY is not configured.",
        )

    setattr(stripe, "api_key", secret_key)
    return stripe


def _stripe_price_id(plan: str) -> str:
    normalized = (plan or "").strip().lower()
    if normalized == "pro":
        return os.getenv("STRIPE_PRICE_PRO_MONTHLY", "").strip()
    if normalized == "enterprise":
        return os.getenv("STRIPE_PRICE_ENTERPRISE_MONTHLY", "").strip()
    return ""


def _to_datetime(timestamp: Optional[int]) -> Optional[datetime]:
    if not timestamp:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)


def _safe_int(value: Optional[str]) -> Optional[int]:
    try:
        return int(value) if value is not None else None
    except Exception:
        return None


def _build_event_payload_summary(event: dict) -> str:
    data_object = event.get("data", {}).get("object", {})
    summary = {
        "id": event.get("id"),
        "type": event.get("type"),
        "created": event.get("created"),
        "object_id": data_object.get("id"),
        "customer": data_object.get("customer"),
        "subscription": data_object.get("subscription"),
    }
    return json.dumps(summary, default=str)


def _start_webhook_event(db: Session, event: dict) -> models.BillingWebhookEvent:
    event_id = str(event.get("id") or "").strip()
    event_type = str(event.get("type") or "").strip()

    existing = (
        db.query(models.BillingWebhookEvent)
        .filter(models.BillingWebhookEvent.provider == "stripe")
        .filter(models.BillingWebhookEvent.event_id == event_id)
        .first()
    )
    payload_json = _build_event_payload_summary(event)

    if existing:
        setattr(existing, "event_type", event_type)
        setattr(existing, "status", "processing")
        setattr(existing, "attempts", int(getattr(existing, "attempts", 0) or 0) + 1)
        setattr(existing, "payload_json", payload_json)
        setattr(existing, "error_message", None)
        return existing

    webhook_event = models.BillingWebhookEvent(
        provider="stripe",
        event_id=event_id,
        event_type=event_type,
        status="processing",
        attempts=1,
        payload_json=payload_json,
        error_message=None,
    )
    db.add(webhook_event)
    return webhook_event


def _find_or_create_subscription(
    db: Session,
    user_id: int,
    customer_id: str,
    subscription_id: str,
    plan: str,
):
    subscription = (
        db.query(models.BillingSubscription)
        .filter(models.BillingSubscription.stripe_subscription_id == subscription_id)
        .first()
    )

    if subscription:
        setattr(subscription, "user_id", user_id)
        setattr(subscription, "provider", "stripe")
        setattr(subscription, "plan", plan)
        setattr(subscription, "stripe_customer_id", customer_id)
        return subscription

    subscription = models.BillingSubscription(
        user_id=user_id,
        provider="stripe",
        plan=plan,
        stripe_customer_id=customer_id,
        stripe_subscription_id=subscription_id,
    )
    db.add(subscription)
    return subscription


def _apply_user_tier(db: Session, user_id: int, plan: str, active: bool):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return

    if active and plan in {"pro", "enterprise"}:
        setattr(user, "tier", plan)
    else:
        setattr(user, "tier", "free")


@router.get("/billing/config")
async def billing_config():
    return {
        "publishable_key": os.getenv("STRIPE_PUBLISHABLE_KEY", ""),
        "providers": {
            "stripe": {
                "enabled": bool(os.getenv("STRIPE_SECRET_KEY", "").strip()),
                "plans": {
                    "pro": bool(os.getenv("STRIPE_PRICE_PRO_MONTHLY", "").strip()),
                    "enterprise": bool(
                        os.getenv("STRIPE_PRICE_ENTERPRISE_MONTHLY", "").strip()
                    ),
                },
            }
        },
    }


@router.post("/billing/create-checkout-session")
async def create_checkout_session(
    request: CheckoutSessionRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    plan = request.plan.strip().lower()
    if plan not in {"pro", "enterprise"}:
        raise HTTPException(status_code=400, detail="Unsupported plan")

    stripe = _load_stripe()
    price_id = _stripe_price_id(plan)
    if not price_id:
        raise HTTPException(
            status_code=400,
            detail=f"Stripe price id is not configured for plan: {plan}",
        )

    base_url = os.getenv("APP_BASE_URL", "http://localhost:5173").rstrip("/")
    success_url = request.success_url or f"{base_url}/app.html?checkout=success"
    cancel_url = request.cancel_url or f"{base_url}/app.html?checkout=cancel"

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            customer_email=current_user.email,
            client_reference_id=str(current_user.id),
            metadata={
                "plan": plan,
                "user_id": str(current_user.id),
                "provider": "stripe",
            },
            success_url=success_url,
            cancel_url=cancel_url,
            allow_promotion_codes=True,
        )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to create Stripe checkout session: {e}"
        )

    return {
        "checkout_url": session.url,
        "session_id": session.id,
        "provider": "stripe",
    }


@router.post("/billing/create-portal-session")
async def create_portal_session(
    request: PortalSessionRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    subscription = (
        db.query(models.BillingSubscription)
        .filter(models.BillingSubscription.user_id == current_user.id)
        .order_by(models.BillingSubscription.updated_at.desc())
        .first()
    )

    if subscription is None:
        raise HTTPException(status_code=404, detail="No active customer record found")

    if getattr(subscription, "provider", "stripe") != "stripe":
        raise HTTPException(
            status_code=400,
            detail="Billing portal is currently supported for Stripe subscriptions only.",
        )

    stripe = _load_stripe()
    customer_id = getattr(subscription, "stripe_customer_id", None)
    if not customer_id:
        raise HTTPException(status_code=404, detail="No active customer record found")

    base_url = os.getenv("APP_BASE_URL", "http://localhost:5173").rstrip("/")
    return_url = request.return_url or f"{base_url}/app.html?tab=pricing"

    try:
        portal = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to create portal session: {e}"
        )

    return {"portal_url": portal.url}


@router.post("/billing/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(database.get_db)):
    stripe = _load_stripe()
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()

    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")

    if not webhook_secret:
        raise HTTPException(
            status_code=500, detail="STRIPE_WEBHOOK_SECRET is not configured."
        )

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid webhook signature: {e}")

    event_id = str(event.get("id") or "").strip()
    if not event_id:
        raise HTTPException(status_code=400, detail="Webhook event id is missing")

    existing_processed = (
        db.query(models.BillingWebhookEvent)
        .filter(models.BillingWebhookEvent.provider == "stripe")
        .filter(models.BillingWebhookEvent.event_id == event_id)
        .filter(models.BillingWebhookEvent.status == "processed")
        .first()
    )
    if existing_processed:
        return {
            "received": True,
            "idempotent": True,
            "event_id": event_id,
        }

    webhook_event = _start_webhook_event(db=db, event=event)

    event_type = event.get("type", "")
    data_object = event.get("data", {}).get("object", {})

    try:
        if event_type == "checkout.session.completed":
            user_id = _safe_int(
                str(
                    data_object.get("client_reference_id")
                    or data_object.get("metadata", {}).get("user_id")
                )
            )
            if not user_id:
                raise RuntimeError("Unable to resolve user id for checkout completion")

            plan = (data_object.get("metadata", {}).get("plan") or "pro").lower()
            customer_id = data_object.get("customer", "")
            subscription_id = data_object.get("subscription", "")

            if customer_id and subscription_id:
                subscription = _find_or_create_subscription(
                    db=db,
                    user_id=user_id,
                    customer_id=customer_id,
                    subscription_id=subscription_id,
                    plan=plan,
                )
                setattr(subscription, "status", "pending")
                _apply_user_tier(db=db, user_id=user_id, plan=plan, active=True)

        elif event_type in {
            "customer.subscription.updated",
            "customer.subscription.created",
        }:
            subscription_id = data_object.get("id", "")
            customer_id = data_object.get("customer", "")
            status = (data_object.get("status") or "").lower()
            current_period_end = _to_datetime(data_object.get("current_period_end"))
            plan = data_object.get("metadata", {}).get("plan") or data_object.get(
                "items", {}
            ).get("data", [{}])[0].get("price", {}).get("nickname", "pro")
            plan = (plan or "pro").lower()

            subscription = (
                db.query(models.BillingSubscription)
                .filter(
                    models.BillingSubscription.stripe_subscription_id == subscription_id
                )
                .first()
            )
            if subscription:
                setattr(subscription, "provider", "stripe")
                setattr(subscription, "status", status)
                setattr(subscription, "current_period_end", current_period_end)
                setattr(
                    subscription,
                    "stripe_customer_id",
                    customer_id or getattr(subscription, "stripe_customer_id", None),
                )
                if plan in {"pro", "enterprise"}:
                    setattr(subscription, "plan", plan)
                _apply_user_tier(
                    db=db,
                    user_id=int(getattr(subscription, "user_id") or 0),
                    plan=str(getattr(subscription, "plan")),
                    active=status in {"active", "trialing"},
                )

        elif event_type in {"customer.subscription.deleted", "invoice.payment_failed"}:
            customer_id = data_object.get("customer", "")
            subscription_id = data_object.get("id", "")

            query = db.query(models.BillingSubscription)
            if subscription_id:
                query = query.filter(
                    models.BillingSubscription.stripe_subscription_id == subscription_id
                )
            elif customer_id:
                query = query.filter(
                    models.BillingSubscription.stripe_customer_id == customer_id
                )

            subscription = query.first()
            if subscription:
                setattr(subscription, "status", "canceled")
                _apply_user_tier(
                    db=db,
                    user_id=int(getattr(subscription, "user_id") or 0),
                    plan=str(getattr(subscription, "plan")),
                    active=False,
                )

        setattr(webhook_event, "status", "processed")
        setattr(webhook_event, "error_message", None)
        setattr(webhook_event, "processed_at", datetime.now(timezone.utc))
        db.commit()
    except Exception as e:
        db.rollback()
        try:
            failed_event = (
                db.query(models.BillingWebhookEvent)
                .filter(models.BillingWebhookEvent.provider == "stripe")
                .filter(models.BillingWebhookEvent.event_id == event_id)
                .first()
            )
            if failed_event:
                setattr(failed_event, "status", "failed")
                setattr(failed_event, "error_message", str(e)[:2000])
            db.commit()
        except Exception as inner_e:
            db.rollback()
            logger.error(f"Failed to update webhook event status: {inner_e}")
        raise HTTPException(status_code=400, detail=f"Webhook processing failed: {e}")

    return {
        "received": True,
        "idempotent": False,
        "event_id": event_id,
    }
