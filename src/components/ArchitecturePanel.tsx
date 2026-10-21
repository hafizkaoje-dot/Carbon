import { useAppStore } from '../store/appStore';
import { X, Server, Cloud, Cpu, Database, Globe, Layers, Shield } from 'lucide-react';

export function ArchitecturePanel() {
  const { setActivePanel } = useAppStore();

  return (
    <div className="absolute inset-0 bg-slate-900/98 backdrop-blur-md z-20 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers size={20} className="text-cyan-400" />
              System Architecture
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hybrid Online/Offline Geospatial Processing Pipeline
            </p>
          </div>
          <button
            onClick={() => setActivePanel('layers')}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Architecture Diagram */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">High-Level Architecture</h3>
          <div className="grid grid-cols-3 gap-4">
            {/* Frontend */}
            <div className="bg-slate-900/60 rounded-lg p-4 border border-violet-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={16} className="text-violet-400" />
                <h4 className="text-xs font-semibold text-violet-400">Frontend (React)</h4>
              </div>
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• Mapbox GL JS / Leaflet</div>
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• deck.gl / CesiumJS (3D)</div>
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• Zustand State Management</div>
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• TailwindCSS + shadcn/ui</div>
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• Map Wizard (Student Mode)</div>
              </div>
            </div>

            {/* Backend */}
            <div className="bg-slate-900/60 rounded-lg p-4 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Server size={16} className="text-emerald-400" />
                <h4 className="text-xs font-semibold text-emerald-400">Backend (FastAPI)</h4>
              </div>
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• Engine Toggle Router</div>
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• GEE API Integration</div>
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• NVIDIA GPU Processing</div>
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• WebSocket (Progress)</div>
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• Task Queue (Celery)</div>
              </div>
            </div>

            {/* Data Layer */}
            <div className="bg-slate-900/60 rounded-lg p-4 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Database size={16} className="text-amber-400" />
                <h4 className="text-xs font-semibold text-amber-400">Data Layer</h4>
              </div>
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• PostgreSQL + PostGIS</div>
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• MBTiles (Offline Cache)</div>
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• SQLite (Metadata)</div>
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• Redis (Task Queue)</div>
                <div className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded">• S3/MinIO (Raster Store)</div>
              </div>
            </div>
          </div>

          {/* Engine Toggle Flow */}
          <div className="mt-6 p-4 bg-slate-900/40 rounded-lg border border-slate-700">
            <h4 className="text-xs font-semibold text-white mb-3">Engine Toggle Flow</h4>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                <Cloud size={14} className="text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">GEE Online</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-[10px] text-slate-500">↔</div>
                <span className="text-[9px] text-slate-600">Engine Toggle</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                <Cpu size={14} className="text-amber-400" />
                <span className="text-[10px] text-amber-400 font-medium">NVIDIA Local</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2">
              Abstract interface allows seamless switching between cloud and edge processing
            </p>
          </div>
        </div>

        {/* Directory Structure */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Project Directory Structure</h3>
          <pre className="text-[10px] text-slate-400 font-mono bg-slate-900/60 p-4 rounded-lg overflow-x-auto leading-relaxed">
{`geocarbon-dashboard/
├── frontend/                    # React Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/            # MapView, LayerControl, DrawTools
│   │   │   ├── Wizard/         # Student Map Wizard
│   │   │   ├── Analysis/       # Analysis panels & forms
│   │   │   ├── Charts/         # Recharts visualizations
│   │   │   └── Layout/         # Header, Sidebar, StatusBar
│   │   ├── store/
│   │   │   ├── appStore.ts     # Zustand global state
│   │   │   ├── mapStore.ts     # Map-specific state
│   │   │   └── analysisStore.ts # Analysis results state
│   │   ├── services/
│   │   │   ├── api.ts          # FastAPI client
│   │   │   ├── gee.ts          # GEE JS API wrapper
│   │   │   └── websocket.ts    # Progress streaming
│   │   └── utils/
│   │       ├── geojson.ts      # GeoJSON utilities
│   │       └── colors.ts       # LCLU color schemes
│   └── package.json
│
├── backend/                     # FastAPI Application
│   ├── app/
│   │   ├── main.py             # FastAPI entry point
│   │   ├── routers/
│   │   │   ├── engine.py       # Engine toggle endpoints
│   │   │   ├── analysis.py     # Analysis execution
│   │   │   ├── layers.py       # Layer management
│   │   │   └── export.py       # Data export
│   │   ├── engines/
│   │   │   ├── base.py         # Abstract engine interface
│   │   │   ├── gee_engine.py   # Google Earth Engine impl
│   │   │   └── gpu_engine.py   # NVIDIA GPU impl
│   │   ├── processing/
│   │   │   ├── online/
│   │   │   │   ├── lclu_gee.py       # GEE LCLU classification
│   │   │   │   ├── carbon_gee.py     # GEE carbon calculation
│   │   │   │   └── cloud_mask.py     # s2cloudless implementation
│   │   │   └── offline/
│   │   │       ├── lclu_gpu.py       # GPU-accelerated LCLU
│   │   │       ├── carbon_gpu.py     # cuSpatial carbon calc
│   │   │       └── dl_inference.py   # TensorRT model inference
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   └── core/               # Config, auth, deps
│   ├── requirements.txt
│   └── alembic/                # DB migrations
│
├── gee_scripts/                 # GEE JavaScript/Python scripts
│   ├── lclu_classifier.js
│   ├── carbon_stock.js
│   └── change_detection.js
│
├── ml_models/                   # Deep Learning models
│   ├── unet_lclu/              # U-Net for segmentation
│   ├── tensorrt/               # Optimized TRT engines
│   └── training/               # Training scripts
│
├── database/                    # Database schemas
│   ├── migrations/
│   ├── schemas/
│   │   ├── postgis_schema.sql
│   │   └── offline_cache.sql
│   └── seeds/
│
└── docker/                      # Containerization
    ├── docker-compose.yml
    ├── Dockerfile.backend
    └── Dockerfile.gpu
`}
          </pre>
        </div>

        {/* Tech Stack Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Cloud size={14} className="text-emerald-400" />
              Online Engine (GEE)
            </h3>
            <div className="space-y-2">
              <div className="text-[10px] text-slate-400">
                <span className="text-emerald-400 font-medium">Sentinel-2 L2A</span> — 10m multispectral imagery
              </div>
              <div className="text-[10px] text-slate-400">
                <span className="text-emerald-400 font-medium">s2cloudless</span> — Cloud/shadow masking via EE
              </div>
              <div className="text-[10px] text-slate-400">
                <span className="text-emerald-400 font-medium">Random Forest</span> — 200 trees, OOB validation
              </div>
              <div className="text-[10px] text-slate-400">
                <span className="text-emerald-400 font-medium">GEDI L4A</span> — Above-ground biomass (30m)
              </div>
              <div className="text-[10px] text-slate-400">
                <span className="text-emerald-400 font-medium">IPCC Factors</span> — Biomass → Carbon conversion
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Cpu size={14} className="text-amber-400" />
              Offline Engine (NVIDIA GPU)
            </h3>
            <div className="space-y-2">
              <div className="text-[10px] text-slate-400">
                <span className="text-amber-400 font-medium">cuDF/cuSpatial</span> — GPU DataFrame operations
              </div>
              <div className="text-[10px] text-slate-400">
                <span className="text-amber-400 font-medium">CuPy</span> — NumPy-compatible GPU arrays
              </div>
              <div className="text-[10px] text-slate-400">
                <span className="text-amber-400 font-medium">TensorRT</span> — Optimized DL inference
              </div>
              <div className="text-[10px] text-slate-400">
                <span className="text-amber-400 font-medium">Rasterio + COG</span> — Cloud-optimized GeoTIFF
              </div>
              <div className="text-[10px] text-slate-400">
                <span className="text-amber-400 font-medium">MBTiles</span> — Offline tile cache (SQLite)
              </div>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={14} className="text-cyan-400" />
            Backend API Endpoints
          </h3>
          <div className="space-y-2">
            {[
              { method: 'POST', path: '/api/v1/engine/toggle', desc: 'Switch between GEE/GPU engine' },
              { method: 'POST', path: '/api/v1/analysis/lclu', desc: 'Run LCLU classification' },
              { method: 'POST', path: '/api/v1/analysis/carbon', desc: 'Calculate carbon stock' },
              { method: 'POST', path: '/api/v1/analysis/biomass', desc: 'Estimate AGB from GEDI' },
              { method: 'POST', path: '/api/v1/analysis/change', desc: 'Temporal change detection' },
              { method: 'GET', path: '/api/v1/layers', desc: 'List available map layers' },
              { method: 'POST', path: '/api/v1/export/geotiff', desc: 'Export result as GeoTIFF' },
              { method: 'WS', path: '/ws/progress/{task_id}', desc: 'Real-time processing progress' },
            ].map((endpoint) => (
              <div key={endpoint.path} className="flex items-center gap-3 p-2 bg-slate-900/40 rounded-lg">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                  endpoint.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-violet-500/20 text-violet-400'
                }`}>
                  {endpoint.method}
                </span>
                <code className="text-[10px] text-slate-300 font-mono">{endpoint.path}</code>
                <span className="text-[10px] text-slate-500 ml-auto">{endpoint.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phase Roadmap */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Development Phases</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold">✓</div>
                <h4 className="text-xs font-semibold text-emerald-400">Phase 1-2 (Current)</h4>
              </div>
              <ul className="text-[10px] text-slate-400 space-y-1">
                <li>• Project architecture & setup</li>
                <li>• FastAPI backend with engine toggle</li>
                <li>• GEE LCLU classification pipeline</li>
                <li>• GPU carbon stock calculation</li>
                <li>• Zustand state management</li>
              </ul>
            </div>
            <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-violet-500/30 rounded-full flex items-center justify-center text-[10px] font-bold text-violet-400">3</div>
                <h4 className="text-xs font-semibold text-violet-400">Phase 3 (Next)</h4>
              </div>
              <ul className="text-[10px] text-slate-400 space-y-1">
                <li>• Full Map Wizard UI implementation</li>
                <li>• Interactive AOI drawing tools</li>
                <li>• Real-time WebSocket progress</li>
                <li>• Professional mode advanced tools</li>
                <li>• Band math & accuracy assessment</li>
              </ul>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-amber-500/30 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-400">4</div>
                <h4 className="text-xs font-semibold text-amber-400">Phase 4</h4>
              </div>
              <ul className="text-[10px] text-slate-400 space-y-1">
                <li>• NVIDIA DL model integration</li>
                <li>• TensorRT optimized inference</li>
                <li>• CesiumJS 3D terrain visualization</li>
                <li>• Omniverse digital twin</li>
                <li>• Custom ML training pipeline</li>
              </ul>
            </div>
            <div className="p-3 bg-slate-500/10 border border-slate-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-slate-500/30 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">5</div>
                <h4 className="text-xs font-semibold text-slate-400">Phase 5</h4>
              </div>
              <ul className="text-[10px] text-slate-400 space-y-1">
                <li>• Multi-user collaboration</li>
                <li>• Project management system</li>
                <li>• Automated report generation</li>
                <li>• API rate limiting & auth</li>
                <li>• Production deployment (K8s)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
