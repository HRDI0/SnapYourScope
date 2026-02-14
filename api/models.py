from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text
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
    status = Column(String, default="completed", index=True)
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
