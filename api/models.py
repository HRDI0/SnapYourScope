from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    String,
    DateTime,
    Text,
    UniqueConstraint,
)
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    tier = Column(String, default="free")  # free, pro, enterprise
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AnalysisReport(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)  # Foreign Key to User
    target_url = Column(String, index=True)
    seo_score = Column(Integer)
    performance_score = Column(Integer)
    report_json = Column(Text)  # Storing full report as JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SitemapBatchJob(Base):
    __tablename__ = "sitemap_batch_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    sitemap_url = Column(String, nullable=False)
    include_aeo = Column(Boolean, default=True)
    status = Column(String, default="queued", index=True)
    total_urls = Column(Integer, default=0)
    queued_urls = Column(Integer, default=0)
    completed_urls = Column(Integer, default=0)
    failed_urls = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SitemapBatchItem(Base):
    __tablename__ = "sitemap_batch_items"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)
    target_url = Column(String, nullable=False)
    status = Column(String, default="queued", index=True)
    attempts = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    report_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class UserAuthProvider(Base):
    __tablename__ = "user_auth_providers"
    __table_args__ = (
        UniqueConstraint("provider", "subject", name="uq_user_auth_provider_subject"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    provider = Column(String, index=True)
    auth_mode = Column(String, default="api_key")
    subject = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PromptTrackRun(Base):
    __tablename__ = "prompt_track_runs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    target_url = Column(String, index=True)
    query_text = Column(Text)
    query_hash = Column(String, index=True, nullable=True)
    status = Column(String, default="completed", index=True)
    provider_used = Column(String, nullable=True)
    model_name = Column(String, nullable=True)
    mention_tier = Column(String, nullable=True)
    share_of_model_score = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    response_share_url = Column(String, nullable=True)
    result_summary_json = Column(Text, nullable=True)
    result_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AeoRecommendationRun(Base):
    __tablename__ = "aeo_recommendation_runs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    target_url = Column(String, index=True)
    status = Column(String, default="completed", index=True)
    result_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BillingSubscription(Base):
    __tablename__ = "billing_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    provider = Column(String, default="stripe", index=True)
    plan = Column(String, index=True)
    stripe_customer_id = Column(String, index=True)
    stripe_subscription_id = Column(String, unique=True, index=True)
    status = Column(String, default="pending", index=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class BillingWebhookEvent(Base):
    __tablename__ = "billing_webhook_events"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, default="stripe", index=True)
    event_id = Column(String, unique=True, index=True)
    event_type = Column(String, index=True)
    status = Column(String, default="processing", index=True)
    attempts = Column(Integer, default=0)
    payload_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
