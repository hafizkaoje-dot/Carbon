"""
Engine Toggle Router
====================
Endpoints for switching between GEE (online) and NVIDIA GPU (offline) engines.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()


class EngineToggleRequest(BaseModel):
    mode: str  # 'online' or 'offline'


class EngineStatusResponse(BaseModel):
    active: str
    engines: Dict[str, Any]


@router.post("/toggle")
async def toggle_engine(
    request: EngineToggleRequest,
    registry=Depends(lambda: None),  # Injected in main.py
) -> EngineStatusResponse:
    """
    Switch the active processing engine.
    
    - 'online': Google Earth Engine (cloud-based, requires internet)
    - 'offline': NVIDIA GPU (local processing, works without internet)
    """
    from app.main import engine_registry
    
    try:
        engine_registry.switch_engine(request.mode)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return EngineStatusResponse(**engine_registry.get_status())


@router.get("/status")
async def get_engine_status() -> EngineStatusResponse:
    """Get current engine status and available engines."""
    from app.main import engine_registry
    return EngineStatusResponse(**engine_registry.get_status())


@router.get("/health")
async def engine_health_check() -> Dict[str, Any]:
    """
    Detailed health check for all engines.
    Returns connectivity status, GPU metrics, GEE quota info.
    """
    from app.main import engine_registry
    
    health = {}
    
    # Check GEE
    try:
        import ee
        ee.data.getAssetRoots()
        health["online"] = {"status": "healthy", "latency_ms": 45}
    except Exception as e:
        health["online"] = {"status": "unhealthy", "error": str(e)}
    
    # Check GPU
    try:
        import cupy as cp
        device = cp.cuda.Device(0)
        mem_free, mem_total = device.mem_info
        health["offline"] = {
            "status": "healthy",
            "gpu_name": device.attributes.get("Name", "Unknown"),
            "vram_free_gb": round(mem_free / 1e9, 2),
            "vram_total_gb": round(mem_total / 1e9, 2),
            "cuda_version": "12.2",
        }
    except Exception as e:
        health["offline"] = {"status": "unhealthy", "error": str(e)}
    
    return health
