import os

from sqlalchemy import create_engine, inspect

from api.database import Base
from api.models import (  # noqa: F401
    AeoRecommendationRun,
    AnalysisReport,
    BillingSubscription,
    PromptTrackRun,
    SitemapBatchItem,
    SitemapBatchJob,
    User,
    UserAuthProvider,
)


def main():
    database_url = os.getenv("DATABASE_URL", "sqlite:///./seo_analysis.db")
    engine_kwargs = {}
    if database_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}

    engine = create_engine(database_url, **engine_kwargs)
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    tables = sorted(inspector.get_table_names())

    print("Migration rehearsal database URL:", database_url)
    print("Detected tables:")
    for table_name in tables:
        print("-", table_name)


if __name__ == "__main__":
    main()
