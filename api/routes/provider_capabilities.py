from fastapi import APIRouter

from ..services.provider_service import ProviderService

router = APIRouter(tags=["Providers"])


@router.get("/provider/capabilities")
async def get_provider_capabilities():
    return ProviderService.capability_report()
