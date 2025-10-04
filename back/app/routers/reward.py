"""
Reward system endpoints for beginner UX
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.response import APIResponse
from app.schemas.model import RewardResponse
from app.services.prediction_service import PredictionService

router = APIRouter(prefix="/reward", tags=["Rewards"])


@router.get("/{planet_id}", response_model=APIResponse[RewardResponse])
async def check_reward(
    planet_id: int,
    db: Session = Depends(get_db)
):
    """
    Check if planet discovery earns a reward

    Rewards are granted when:
    - Planet has ≥ 90% probability of being an exoplanet

    Reward tiers:
    - 99%+: Level 3 (Highest) - 100 points
    - 95-99%: Level 2 - 100 points
    - 90-95%: Level 1 - 100 points

    Integrates with frontend for:
    - Point tracking
    - Upgrade system (3 levels)
    - Achievement badges
    """
    reward = PredictionService.calculate_reward(db, planet_id)

    return APIResponse(
        success=True,
        message="Reward check completed",
        data=reward
    )
