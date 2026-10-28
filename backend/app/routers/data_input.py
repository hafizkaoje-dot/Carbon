"""
Data Input Router
=================
Handles file uploads, AOI validation, and data preprocessing.
"""

import os
import uuid
import json
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter()

# Upload directory
UPLOAD_DIR = os.path.join(settings.EXPORT_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class AOIRequest(BaseModel):
    """AOI validation request."""
    geojson: dict
    name: Optional[str] = "User AOI"


class FileMetadata(BaseModel):
    """Metadata for uploaded files."""
    id: str
    name: str
    type: str  # 'raster', 'vector', 'training'
    size: int
    format: str
    local_path: str
    metadata: Optional[dict] = None


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a geospatial file (GeoTIFF, GeoJSON, CSV, Shapefile).
    
    Supported formats:
    - Raster: .tif, .tiff, .geotiff
    - Vector: .geojson, .json, .shp, .kml
    - Training: .csv (with lat, lng, class columns)
    """
    # Validate file extension
    allowed_extensions = {
        'tif', 'tiff', 'geotiff',  # Raster
        'geojson', 'json', 'shp', 'kml',  # Vector
        'csv',  # Training data
    }
    
    ext = file.filename.split('.')[-1].lower() if file.filename else ''
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: .{ext}. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Save file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Determine file type
    file_type = "raster"
    if ext in ('geojson', 'json', 'shp', 'kml'):
        file_type = "vector"
    elif ext == 'csv':
        file_type = "training"
    
    # Extract metadata
    metadata = {}
    if file_type == "raster":
        try:
            import rasterio
            with rasterio.open(file_path) as src:
                metadata = {
                    "bands": src.count,
                    "width": src.width,
                    "height": src.height,
                    "crs": str(src.crs),
                    "bounds": list(src.bounds),
                    "dtype": str(src.dtypes[0]),
                    "nodata": src.nodata,
                }
        except Exception as e:
            metadata = {"error": f"Could not read raster metadata: {str(e)}"}
    
    elif file_type == "vector":
        try:
            import geopandas as gpd
            gdf = gpd.read_file(file_path)
            metadata = {
                "feature_count": len(gdf),
                "crs": str(gdf.crs),
                "columns": list(gdf.columns),
                "bounds": list(gdf.total_bounds),
            }
        except Exception as e:
            metadata = {"error": f"Could not read vector metadata: {str(e)}"}
    
    elif file_type == "training":
        try:
            import pandas as pd
            df = pd.read_csv(file_path)
            metadata = {
                "rows": len(df),
                "columns": list(df.columns),
                "has_lat": "lat" in df.columns or "latitude" in df.columns,
                "has_lng": "lng" in df.columns or "longitude" in df.columns or "lon" in df.columns,
                "has_class": "class" in df.columns or "label" in df.columns,
            }
        except Exception as e:
            metadata = {"error": f"Could not read CSV metadata: {str(e)}"}
    
    return FileMetadata(
        id=file_id,
        name=file.filename or "unknown",
        type=file_type,
        size=len(content),
        format=ext.upper(),
        local_path=file_path,
        metadata=metadata,
    )


@router.post("/aoi/validate")
async def validate_aoi(request: AOIRequest):
    """
    Validate an AOI GeoJSON and compute area.
    """
    try:
        from shapely.geometry import shape
        geom = shape(request.geojson.get("geometry", {}))
        
        if not geom.is_valid:
            geom = geom.buffer(0)  # Attempt to fix
        
        area_km2 = geom.area * 111320 * 111320 / 1e6  # Approximate
        
        return {
            "valid": True,
            "name": request.name,
            "area_km2": round(area_km2, 2),
            "bounds": list(geom.bounds),
            "centroid": list(geom.centroid.coords[0]),
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}


@router.get("/files")
async def list_uploaded_files():
    """List all uploaded files with metadata."""
    files = []
    if os.path.exists(UPLOAD_DIR):
        for filename in os.listdir(UPLOAD_DIR):
            filepath = os.path.join(UPLOAD_DIR, filename)
            if os.path.isfile(filepath):
                files.append({
                    "name": filename,
                    "size": os.path.getsize(filepath),
                    "path": filepath,
                })
    return {"files": files, "count": len(files)}


@router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """Delete an uploaded file."""
    # Find file by ID prefix
    for filename in os.listdir(UPLOAD_DIR):
        if filename.startswith(file_id):
            filepath = os.path.join(UPLOAD_DIR, filename)
            os.remove(filepath)
            return {"deleted": True, "file_id": file_id}
    
    raise HTTPException(status_code=404, detail="File not found")
