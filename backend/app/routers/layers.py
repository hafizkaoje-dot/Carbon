"""Layers Router - Manages map layers."""

from fastapi import APIRouter
from typing import List, Dict

router = APIRouter()


@router.get("/")
async def list_layers() -> List[Dict]:
    """List available map layers."""
    return [
        {"id": "basemap", "name": "Base Map", "type": "raster", "source": "online"},
        {"id": "sentinel2", "name": "Sentinel-2 RGB", "type": "raster", "source": "online"},
        {"id": "lclu-result", "name": "LCLU Classification", "type": "classification", "source": "online"},
        {"id": "carbon-stock", "name": "Carbon Stock (tC/ha)", "type": "raster", "source": "online"},
    ]
