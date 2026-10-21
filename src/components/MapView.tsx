import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { MapPin, ZoomIn, ZoomOut, Crosshair, Maximize2 } from 'lucide-react';

export function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const { mapCenter, mapZoom, setMapCenter, setMapZoom, engineMode, aoi, setAOI } = useAppStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Dynamically import Leaflet
    const initMap = async () => {
      const L = await import('leaflet');
      
      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: mapCenter,
        zoom: mapZoom,
        zoomControl: false,
      });

      // Add tile layer based on engine mode
      const tileUrl = engineMode === 'online'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

      L.tileLayer(tileUrl, {
        attribution: engineMode === 'online' 
          ? '© OpenStreetMap contributors'
          : '© Esri',
        maxZoom: 19,
      }).addTo(map);

      // Add scale control
      L.control.scale({ imperial: false }).addTo(map);

      // Event listeners
      map.on('moveend', () => {
        const center = map.getCenter();
        setMapCenter([center.lat, center.lng]);
      });

      map.on('zoomend', () => {
        setMapZoom(map.getZoom());
      });

      leafletMapRef.current = map;
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update tile layer when engine mode changes
  useEffect(() => {
    if (!leafletMapRef.current) return;
    // In a full implementation, we'd swap tile layers here
  }, [engineMode]);

  const handleZoomIn = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.zoomOut();
    }
  };

  const handleLocate = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(mapCenter, 14);
    }
  };

  const handleToggleDraw = () => {
    setIsDrawing(!isDrawing);
    if (!isDrawing) {
      setDrawPoints([]);
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!isDrawing || !leafletMapRef.current) return;
    
    const rect = mapRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert pixel to lat/lng (simplified)
    const bounds = leafletMapRef.current.getBounds();
    const lat = bounds.getNorth() - (y / rect.height) * (bounds.getNorth() - bounds.getSouth());
    const lng = bounds.getWest() + (x / rect.width) * (bounds.getEast() - bounds.getWest());
    
    setDrawPoints([...drawPoints, [lat, lng]]);
    
    // Close polygon after 5+ points
    if (drawPoints.length >= 4) {
      const polygon: any = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[...drawPoints, [lat, lng]].map(p => [p[1], p[0]])],
        },
        properties: { name: 'User AOI', area_km2: 25.4 }
      };
      setAOI(polygon);
      setIsDrawing(false);
      setDrawPoints([]);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div
        ref={mapRef}
        className={`w-full h-full ${isDrawing ? 'cursor-crosshair' : ''}`}
        onClick={handleMapClick}
      />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleLocate}
          className="w-9 h-9 bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
        >
          <Crosshair size={16} />
        </button>
        <button
          onClick={handleToggleDraw}
          className={`w-9 h-9 border rounded-lg flex items-center justify-center transition-colors ${
            isDrawing
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              : 'bg-slate-800/90 backdrop-blur-sm border-slate-600 hover:bg-slate-700'
          }`}
          title="Draw AOI"
        >
          <MapPin size={16} />
        </button>
      </div>

      {/* AOI Info Overlay */}
      {aoi && (
        <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm border border-emerald-500/50 rounded-lg p-3 max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            <p className="text-xs font-semibold text-emerald-400">AOI Defined</p>
          </div>
          <p className="text-[10px] text-slate-400">
            {aoi.properties.name} • {aoi.properties.area_km2} km²
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Center: {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}
          </p>
        </div>
      )}

      {/* Drawing Mode Indicator */}
      {isDrawing && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/50 rounded-full px-4 py-2">
          <p className="text-xs text-emerald-400 font-medium">
            🎯 Click on map to define AOI ({drawPoints.length}/5 points)
          </p>
        </div>
      )}

      {/* Coordinates Display */}
      <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-1.5">
        <p className="text-[10px] font-mono text-slate-400">
          {mapCenter[0].toFixed(6)}°N, {mapCenter[1].toFixed(6)}°E | Zoom: {mapZoom} | 
          <span className={engineMode === 'online' ? 'text-emerald-400' : 'text-amber-400'}>
            {' '}{engineMode === 'online' ? 'GEE' : 'GPU'}
          </span>
        </p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg p-2.5">
        <p className="text-[10px] font-semibold text-slate-400 mb-1.5">LCLU Classes</p>
        <div className="space-y-1">
          {[
            { color: 'bg-emerald-600', label: 'Forest' },
            { color: 'bg-lime-500', label: 'Agriculture' },
            { color: 'bg-blue-500', label: 'Water' },
            { color: 'bg-amber-600', label: 'Urban' },
            { color: 'bg-slate-500', label: 'Bare Soil' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-2 ${item.color} rounded-sm`} />
              <span className="text-[10px] text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
