from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import database, models, auth
from ..logger import setup_logger
from typing import List
# from ..schemas import analyze as analyze_schemas # Removed invalid import

router = APIRouter()
logger = setup_logger("api.routes.history")


@router.get("/history", response_model=List[dict])
async def get_history(
    skip: int = 0,
    limit: int = 10,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    logger.info(f"Fetching history for user_id={current_user.id}")
    reports = (
        db.query(models.AnalysisReport)
        .filter(models.AnalysisReport.user_id == current_user.id)
        .order_by(models.AnalysisReport.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    # Convert to simpler format
    return [
        {
            "id": r.id,
            "url": r.target_url,
            "seo_score": r.seo_score,
            "performance_score": r.performance_score,
            "created_at": r.created_at,
        }
        for r in reports
    ]
