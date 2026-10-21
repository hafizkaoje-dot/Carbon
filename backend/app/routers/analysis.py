"""Analysis Router - Handles LCLU, Carbon, Biomass, and Change Detection requests."""

from fastapi import APIRouter, Depends
from typing import Dict, Any

router = APIRouter()


@router.post("/lclu")
async def run_lclu_classification(request: Dict[str, Any]) -> Dict[str, Any]:
    """Run LCLU classification using the active engine."""
    return {"task_id": "lclu_001", "status": "queued", "engine": "online"}


@router.post("/carbon")
async def calculate_carbon_stock(request: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate carbon stock using the active engine."""
    return {"task_id": "carbon_001", "status": "queued", "engine": "online"}


@router.post("/biomass")
async def estimate_biomass(request: Dict[str, Any]) -> Dict[str, Any]:
    """Estimate above-ground biomass."""
    return {"task_id": "biomass_001", "status": "queued", "engine": "online"}


@router.post("/change")
async def detect_changes(request: Dict[str, Any]) -> Dict[str, Any]:
    """Run temporal change detection."""
    return {"task_id": "change_001", "status": "queued", "engine": "online"}
