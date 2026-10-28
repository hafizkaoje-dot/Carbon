"""
Abstract base class for processing engines.
Defines the interface that both GEE (online) and GPU (offline) engines must implement.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel


class AnalysisRequest(BaseModel):
    """Standard request format for all analysis operations."""
    aoi_geojson: Dict[str, Any]
    start_date: str
    end_date: str
    scale: int = 10
    cloud_threshold: int = 30
    output_format: str = "geotiff"


class AnalysisResponse(BaseModel):
    """Standard response format for all analysis operations."""
    task_id: str
    status: str
    engine: str
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class ProcessingEngine(ABC):
    """
    Abstract interface for geospatial processing engines.
    
    Both GEEEngine and GPUEngine implement this interface,
    allowing the backend to switch between them transparently.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Engine name identifier."""
        pass
    
    @property
    @abstractmethod
    def mode(self) -> str:
        """'online' or 'offline'"""
        pass
    
    @abstractmethod
    async def check_health(self) -> Dict[str, Any]:
        """Check if engine is available and healthy."""
        pass
    
    @abstractmethod
    async def run_lclu_classification(self, request: AnalysisRequest) -> AnalysisResponse:
        """Run LCLU classification."""
        pass
    
    @abstractmethod
    async def calculate_carbon_stock(self, request: AnalysisRequest) -> AnalysisResponse:
        """Calculate carbon stock."""
        pass
    
    @abstractmethod
    async def estimate_biomass(self, request: AnalysisRequest) -> AnalysisResponse:
        """Estimate above-ground biomass."""
        pass
    
    @abstractmethod
    async def detect_changes(self, request: AnalysisRequest) -> AnalysisResponse:
        """Run temporal change detection."""
        pass
    
    @abstractmethod
    async def export_result(self, task_id: str, format: str) -> str:
        """Export analysis result to file."""
        pass
