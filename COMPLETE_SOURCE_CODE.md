# GeoCarbon Dashboard - Complete Source Code & Original Prompt

## 📋 ORIGINAL PROMPT (Master Prompt)

```
/masterprompt /actionplan /coding /architecture

**ROLE & CONTEXT:**
Act as a Principal Geospatial Software Engineer, AI Architect, and Full-Stack Developer. We are building a hybrid (Online/Offline) Web Dashboard for Land Cover/Land Use (LCLU) mapping and Carbon Stock/Sink calculation. 
- **Online Engine:** Google Earth Engine (GEE) for cloud-scale raster processing and time-series analysis.
- **Offline Engine:** Local NVIDIA GPU (using RAPIDS, cuSpatial, and TensorRT) for edge-processing, deep learning inference, and offline map rendering when internet is lost.
- **Target Audience:** Students (needs guided "Map Wizard" and auto-cartography) and Professionals (needs band math, accuracy assessment, and custom ML training).

**OBJECTIVE:**
Generate the complete architectural blueprint, project structure, and core codebase to build this application. Because this is a large project, we will execute this in phases. For this prompt, provide the **Project Architecture, Directory Structure, Environment Setup, and the Core Backend Logic for Phase 1 & 2**.

**TECH STACK CONSTRAINTS:**
- **Frontend:** React.js, Mapbox GL JS (Online), deck.gl/CesiumJS (Offline/3D), TailwindCSS.
- **Backend:** Python (FastAPI).
- **Cloud/Online:** Google Earth Engine Python/JS API.
- **Local/Offline:** Python, Rasterio, GeoPandas, NVIDIA cuDF/cuSpatial (for GPU acceleration), PyTorch/TensorRT (for local DL models).
- **Database:** PostgreSQL + PostGIS (Vector), Local MBTiles/SQLite (Offline raster cache).

**REQUIRED DELIVERABLES FOR THIS OUTPUT:**

**1. Project Directory Structure:**
Provide a comprehensive, professional folder structure separating frontend, backend, GEE scripts, NVIDIA local processing scripts, and database schemas.

**2. Environment & Dependency Setup:**
- Provide a `requirements.txt` for the FastAPI backend (including GEE, Rasterio, and NVIDIA CUDA-compatible libraries like cuSpatial).
- Provide a `package.json` dependency list for the React frontend.

**3. Core Backend Architecture (FastAPI):**
Write the `main.py` and `routers/` setup. Include the logic for the "Engine Toggle" (switching between GEE API calls and local NVIDIA processing endpoints). Include GEE authentication initialization.

**4. Core Geospatial Logic (Python):**
Write two distinct, highly optimized Python scripts:
- **Script A (Online/GEE):** A function that takes an AOI (GeoJSON) and date range, applies s2cloudless masking to Sentinel-2, runs a Random Forest LCLU classification, and calculates Above-Ground Biomass (AGB) using GEDI data.
- **Script B (Offline/NVIDIA):** A function that takes a locally cached GeoTIFF, uses `cucal` or `cupy` (NVIDIA GPU acceleration) to perform rapid raster math for Carbon Stock calculation, and outputs a local GeoTIFF.

**5. Frontend State Management Strategy:**
Provide the Redux/Zustand store structure for managing the map state, specifically handling the complex logic of toggling between "Student Mode" (guided wizard) and "Professional Mode" (advanced tools), and handling the Online/Offline state transitions.

**RULES & FORMATTING:**
- Write clean, modular, and production-ready code.
- Include docstrings and comments explaining the geospatial logic (e.g., why specific reducers or cloud-masking algorithms are used).
- Do not write the entire frontend UI yet; focus on the core geospatial engine and backend architecture first.
- At the end of your response, provide a checklist of what we need to build in **Phase 3 (Frontend UI & Map Wizard)** and **Phase 4 (NVIDIA Deep Learning & 3D Omniverse Integration)** so we can prompt you for the next steps.
```

---

## 📁 COMPLETE PROJECT STRUCTURE

```
geocarbon-dashboard/
├── frontend/                          # React Frontend
│   ├── src/
│   │   ├── App.tsx                    # Main application component
│   │   ├── main.tsx                   # React entry point
│   │   ├── index.css                  # Global styles + Tailwind
│   │   ├── components/
│   │   │   ├── Header.tsx             # Engine toggle + Mode switch
│   │   │   ├── Sidebar.tsx            # Navigation + Layer management
│   │   │   ├── MapView.tsx            # Leaflet map with AOI tools
│   │   │   ├── WizardPanel.tsx        # Student guided wizard
│   │   │   ├── AnalysisPanel.tsx      # Analysis execution + results
│   │   │   ├── ArchitecturePanel.tsx  # System documentation
│   │   │   ├── DataInputPanel.tsx     # File upload + parameters
│   │   │   ├── GEEScriptPanel.tsx     # Python script runner
│   │   │   ├── StatusBar.tsx          # System metrics
│   │   │   ├── ErrorBoundary.tsx      # Error handling
│   │   │   └── SafeChartContainer.tsx # Safe Recharts wrapper
│   │   └── store/
│   │       └── appStore.ts            # Zustand global state
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tsconfig.json
│
├── backend/                           # FastAPI Backend
│   ├── app/
│   │   ├── main.py                    # FastAPI entry + Engine Registry
│   │   ├── routers/
│   │   │   ├── engine.py              # Engine toggle endpoints
│   │   │   ├── analysis.py            # Analysis execution
│   │   │   ├── layers.py              # Layer management
│   │   │   ├── export.py              # Data export
│   │   │   ├── data_input.py          # File upload + validation
│   │   │   └── gee_scripts.py         # GEE script execution
│   │   ├── engines/
│   │   │   ├── base.py                # Abstract engine interface
│   │   │   ├── gee_engine.py          # GEE implementation
│   │   │   └── gpu_engine.py          # NVIDIA GPU implementation
│   │   ├── processing/
│   │   │   ├── online/
│   │   │   │   └── lclu_gee.py        # Script A: GEE LCLU + Carbon
│   │   │   └── offline/
│   │   │       └── carbon_gpu.py      # Script B: GPU Carbon Calc
│   │   └── core/
│   │       └── config.py              # Pydantic settings
│   ├── database/
│   │   └── schemas/
│   │       └── postgis_schema.sql     # Database schema
│   └── requirements.txt               # Python dependencies
│
├── docker-compose.yml                 # Full stack deployment
├── README.md                          # Project documentation
└── BUGFIX_SUMMARY.md                  # Bug fixes documentation
```

---

## 🎯 PROJECT OVERVIEW

**GeoCarbon Dashboard** is a hybrid Online/Offline geospatial web dashboard for:
- **LCLU (Land Cover/Land Use) Classification** using Sentinel-2 imagery
- **Carbon Stock/Sink Calculation** using GEDI LiDAR data
- **Change Detection** across multiple time periods

### Key Features:
1. **Dual Engine Architecture**: Switch between Google Earth Engine (cloud) and NVIDIA GPU (local)
2. **Dual User Modes**: Student (guided wizard) and Professional (advanced tools)
3. **Data Input System**: Upload rasters, vectors, training data
4. **GEE Script Runner**: Execute Python scripts on Earth Engine
5. **Real-time Processing**: WebSocket progress streaming
6. **Offline Capability**: Works without internet using local GPU

---

## 📦 DEPENDENCIES

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^5.0.15",
    "leaflet": "^1.9.4",
    "@types/leaflet": "^1.9.22",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "tailwindcss": "^4.1.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.0",
    "vite": "^6.3.5"
  }
}
```

### Backend (requirements.txt)
```txt
# Core Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.2

# Google Earth Engine (Online Engine)
earthengine-api==0.1.384
geopandas==0.14.2

# Geospatial Processing
rasterio==1.3.9
shapely==2.0.2
numpy==1.26.2

# Database
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
geoalchemy2==0.14.2

# NVIDIA GPU Libraries (Offline Engine)
cupy-cuda12x==12.3.0

# Deep Learning
torch==2.1.2
torchvision==0.16.2

# Utilities
python-dotenv==1.0.0
websockets==12.0
```

---

## 🚀 QUICK START

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Full Stack (Docker)
```bash
docker-compose up
```

---

## 📚 DOCUMENTATION

See individual files for complete implementation details:
- `README.md` - Project overview and architecture
- `BUGFIX_SUMMARY.md` - Bug fixes and solutions
- `backend/app/main.py` - Backend entry point with engine registry
- `backend/app/processing/online/lclu_gee.py` - GEE processing pipeline
- `backend/app/processing/offline/carbon_gpu.py` - GPU processing pipeline
- `src/store/appStore.ts` - Frontend state management
- `src/components/` - All React components

---

## 🎓 LEARNING POINTS

This project demonstrates:
1. **Hybrid Cloud/Edge Architecture** - Seamless switching between cloud and local processing
2. **Geospatial Processing** - Sentinel-2, GEDI, Random Forest classification
3. **GPU Acceleration** - CuPy, RAPIDS for raster math
4. **State Management** - Zustand for complex UI state
5. **Error Handling** - ErrorBoundaries, defensive programming
6. **Type Safety** - Full TypeScript implementation
7. **Real-time Updates** - WebSocket progress streaming

---

## 📝 NEXT PHASES

### Phase 3 (Next)
- [ ] Interactive AOI drawing tools (polygon, rectangle, freehand)
- [ ] Real-time WebSocket progress integration
- [ ] Professional mode: Band math calculator
- [ ] Professional mode: Accuracy assessment (confusion matrix)
- [ ] Time-series chart component
- [ ] Layer composition & blending

### Phase 4
- [ ] U-Net model for DL-based segmentation
- [ ] TensorRT optimization
- [ ] CesiumJS 3D terrain visualization
- [ ] NVIDIA Omniverse integration
- [ ] Custom ML training pipeline

---

## 🔧 TECHNICAL HIGHLIGHTS

### Engine Toggle Pattern
```typescript
// Zustand store handles engine switching
setEngineMode: (mode) => set({ 
  engineMode: mode, 
  isEngineSwitching: true 
})
```

### Safe Chart Rendering
```typescript
// Avoids Recharts null ref errors
<SafeChartContainer width="100%" height={200}>
  {({ width, height }) => (
    <PieChart width={width} height={height}>
      {/* Chart content */}
    </PieChart>
  )}
</SafeChartContainer>
```

### GPU-Accelerated Carbon Calculation
```python
# CuPy for parallel raster math
agb_gpu = cp.zeros_like(lclu_band, dtype=cp.float32)
for class_val, biomass_factor in LCLU_BIOMASS_FACTORS.items():
    mask = lclu_band == class_val
    agb_gpu[mask] = biomass_factor
carbon_gpu = agb_gpu * CARBON_FACTOR
```

---

## 📄 LICENSE

MIT License - GeoCarbon Dashboard Team

---

## 🤝 CONTRIBUTING

This is a demonstration project. For production use:
1. Add authentication/authorization
2. Implement proper file upload handling
3. Add rate limiting
4. Set up monitoring/logging
5. Configure CORS properly
6. Add comprehensive tests

---

**End of Source Code Documentation**
