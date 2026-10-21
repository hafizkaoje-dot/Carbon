"""
GeoCarbon Dashboard - FastAPI Backend
=====================================
Main entry point for the hybrid Online/Offline geospatial processing engine.

Architecture:
- Engine Toggle: Abstract interface switching between GEE (cloud) and NVIDIA GPU (local)
- Processing Pipeline: LCLU Classification → Carbon Stock → Export
- WebSocket: Real-time progress streaming to frontend

Author: GeoCarbon Team
"""

import os
import asyncio
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine as db_engine
from app.routers import engine, analysis, layers, export
from app.engines.base import ProcessingEngine
from app.engines.gee_engine import GEEEngine
from app.engines.gpu_engine import GPUEngine


# ============================================
# Application Lifecycle
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application startup/shutdown events.
    - Initialize GEE authentication on startup
    - Check NVIDIA GPU availability
    - Setup database connections
    """
    # Startup
    print("🌍 GeoCarbon Dashboard Starting...")
    
    # Initialize Google Earth Engine
    try:
        import ee
        ee.Initialize(project=settings.GEE_PROJECT)
        print("✅ Google Earth Engine initialized")
    except Exception as e:
        print(f"⚠️ GEE initialization warning: {e}")
    
    # Check GPU availability
    try:
        import cupy as cp
        device = cp.cuda.Device(0)
        print(f"✅ NVIDIA GPU detected: {device.attributes.get('Name', 'Unknown')}")
        print(f"   VRAM: {device.mem_info[1] / 1e9:.1f} GB")
    except Exception as e:
        print(f"⚠️ GPU not available: {e}")
    
    yield
    
    # Shutdown
    print("🌍 GeoCarbon Dashboard Shutting down...")


# ============================================
# FastAPI Application
# ============================================

app = FastAPI(
    title="GeoCarbon Dashboard API",
    description="Hybrid Online/Offline LCLU Mapping & Carbon Stock Analysis Engine",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for exported results
os.makedirs(settings.EXPORT_DIR, exist_ok=True)
app.mount("/exports", StaticFiles(directory=settings.EXPORT_DIR), name="exports")


# ============================================
# Engine Registry (Singleton Pattern)
# ============================================

class EngineRegistry:
    """
    Manages the active processing engine.
    Supports hot-swapping between GEE (online) and GPU (offline) engines.
    """
    
    def __init__(self):
        self._engines = {
            "online": GEEEngine(),
            "offline": GPUEngine(),
        }
        self._active_engine: str = "online"
    
    @property
    def active_engine(self) -> ProcessingEngine:
        return self._engines[self._active_engine]
    
    @property
    def active_mode(self) -> str:
        return self._active_engine
    
    def switch_engine(self, mode: str) -> ProcessingEngine:
        """
        Switch between online (GEE) and offline (GPU) processing.
        
        Args:
            mode: 'online' for Google Earth Engine, 'offline' for NVIDIA GPU
            
        Returns:
            The newly activated processing engine
        """
        if mode not in self._engines:
            raise ValueError(f"Unknown engine mode: {mode}")
        
        self._active_engine = mode
        print(f"🔄 Engine switched to: {mode}")
        return self.active_engine
    
    def get_status(self) -> dict:
        """Get status of all engines."""
        return {
            "active": self._active_engine,
            "engines": {
                "online": {
                    "type": "Google Earth Engine",
                    "status": "connected",
                    "project": settings.GEE_PROJECT,
                },
                "offline": {
                    "type": "NVIDIA GPU (RAPIDS + TensorRT)",
                    "status": "available",
                    "cuda_version": "12.2",
                },
            }
        }


# Global engine registry
engine_registry = EngineRegistry()


# ============================================
# Dependency Injection
# ============================================

def get_engine() -> ProcessingEngine:
    """Dependency: Get the active processing engine."""
    return engine_registry.active_engine


def get_engine_registry() -> EngineRegistry:
    """Dependency: Get the engine registry."""
    return engine_registry


# ============================================
# Include Routers
# ============================================

app.include_router(
    engine.router,
    prefix="/api/v1/engine",
    tags=["Engine"],
)

app.include_router(
    analysis.router,
    prefix="/api/v1/analysis",
    tags=["Analysis"],
    dependencies=[Depends(get_engine)],
)

app.include_router(
    layers.router,
    prefix="/api/v1/layers",
    tags=["Layers"],
)

app.include_router(
    export.router,
    prefix="/api/v1/export",
    tags=["Export"],
)


# ============================================
# WebSocket for Real-time Progress
# ============================================

class ConnectionManager:
    """Manages WebSocket connections for progress streaming."""
    
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, task_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[task_id] = websocket
    
    def disconnect(self, task_id: str):
        self.active_connections.pop(task_id, None)
    
    async def send_progress(self, task_id: str, progress: float, message: str = ""):
        if task_id in self.active_connections:
            await self.active_connections[task_id].send_json({
                "task_id": task_id,
                "progress": progress,
                "message": message,
                "engine": engine_registry.active_mode,
            })


ws_manager = ConnectionManager()


@app.websocket("/ws/progress/{task_id}")
async def websocket_progress(websocket: WebSocket, task_id: str):
    """
    WebSocket endpoint for real-time processing progress.
    Frontend connects here to receive updates during long-running analysis.
    """
    await ws_manager.connect(task_id, websocket)
    try:
        while True:
            # Keep connection alive, receive any client messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(task_id)


# ============================================
# Health Check
# ============================================

@app.get("/health")
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "engine": engine_registry.get_status(),
        "version": "1.0.0",
    }


# ============================================
# Root
# ============================================

@app.get("/")
async def root():
    return {
        "message": "GeoCarbon Dashboard API",
        "docs": "/docs",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
