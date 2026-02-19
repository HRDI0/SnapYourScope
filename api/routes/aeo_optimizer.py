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
    current_user: models.User | None = Depends(auth.get_current_user_optional),
    db: Session = Depends(database.get_db),
):
    try:
        analysis = await AnalysisService.analyze_url(
            url=request.url,
            include_aeo=True,
            include_pagespeed=False,
        )
        rule_recommendation = AeoOptimizerService.build_recommendations(
            url=request.url,
            analysis_result=analysis,
        )
        recommendation = AeoOptimizerService.build_recommendations_with_llm(
            url=request.url,
            analysis_result=analysis,
            rule_result=rule_recommendation,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    run = models.AeoRecommendationRun(
        user_id=current_user.id if current_user is not None else 0,
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
