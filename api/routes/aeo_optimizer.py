import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import auth, database, models
from ..services.aeo_optimizer_service import AeoOptimizerService
from ..services.analysis_service import AnalysisService

router = APIRouter(tags=["AEO Optimizer"])


class AeoRecommendationRequest(BaseModel):
    url: str


@router.post("/aeo-optimizer/recommend")
async def recommend_aeo_optimization(
    request: AeoRecommendationRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    tier = (getattr(current_user, "tier", "free") or "free").lower()
    if tier not in {"pro", "enterprise"}:
        raise HTTPException(
            status_code=403,
            detail="AEO optimization recommendation is a paid feature (pro or enterprise).",
        )

    try:
        analysis = await AnalysisService.analyze_url(
            url=request.url,
            include_aeo=True,
            include_pagespeed=False,
        )
        recommendation = AeoOptimizerService.build_recommendations(
            url=request.url,
            analysis_result=analysis,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    run = models.AeoRecommendationRun(
        user_id=current_user.id,
        target_url=request.url,
        status="completed",
        result_json=json.dumps(recommendation, default=str),
    )
    db.add(run)
    db.commit()

    return {
        "tracking_mode": "weekly",
        "result": recommendation,
    }
