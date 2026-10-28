# 🌍 GeoCarbon Dashboard

## Hybrid Online/Offline LCLU Mapping & Carbon Stock Analysis Platform

A professional-grade geospatial web dashboard for Land Cover/Land Use (LCLU) classification and Carbon Stock/Sink calculation. Features a dual-engine architecture that seamlessly switches between Google Earth Engine (cloud) and NVIDIA GPU (local edge) processing.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Map View │  │  Wizard  │  │ Analysis │  │  Architecture │  │
│  │ Leaflet  │  │ Student  │  │  Panel   │  │   Documentation│  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
│                    Zustand State Management                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API + WebSocket
┌────────────────────────────┴────────────────────────────────────┐
│                    Backend (FastAPI)                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Engine Toggle Router                     │   │
│  │            ┌──────────┐     ┌──────────┐                │   │
│  │            │  Online   │     │ Offline  │                │   │
│  │            │  (GEE)    │ ←→  │  (GPU)   │                │   │
│  │            └──────────┘     └──────────┘                │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │  Analysis    │  │   Layers     │  │    Export        │     │
│  │  Router      │  │   Router     │  │    Router        │     │
│  └──────────────┘  └──────────────┘  └──────────────────┘     │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────┴───────┐  ┌────────┴────────┐  ┌───────┴───────┐
│  Google Earth │  │   PostgreSQL    │  │  NVIDIA GPU   │
│   Engine      │  │   + PostGIS     │  │  (RAPIDS)     │
│  (Cloud)      │  │   + Redis       │  │  (Local)      │
└───────────────┘  └─────────────────┘  └───────────────┘
```

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TailwindCSS, Zustand, Leaflet, Recharts |
| **Backend** | Python 3.10+, FastAPI, Celery, Redis |
| **Online Engine** | Google Earth Engine (ee Python API), s2cloudless |
| **Offline Engine** | NVIDIA CUDA 12.x, CuPy, RAPIDS (cuDF, cuSpatial), TensorRT |
| **Database** | PostgreSQL 16 + PostGIS 3.4, MBTiles (offline cache) |
| **Geospatial** | Rasterio, GeoPandas, Shapely, PyProj |
| **ML/DL** | PyTorch, scikit-learn (RF), TensorRT (inference) |

---

## 📁 Project Structure

```
geocarbon-dashboard/
├── src/                          # React Frontend
│   ├── App.tsx                   # Main application component
│   ├── components/
│   │   ├── Header.tsx            # Engine toggle + Mode switch
│   │   ├── Sidebar.tsx           # Navigation + Layer management
│   │   ├── MapView.tsx           # Leaflet map with AOI tools
│   │   ├── WizardPanel.tsx       # Student guided wizard
│   │   ├── AnalysisPanel.tsx     # Analysis execution + results
│   │   ├── ArchitecturePanel.tsx # System documentation
│   │   └── StatusBar.tsx         # System metrics
│   ├── store/
│   │   └── appStore.ts           # Zustand global state
│   └── index.css                 # TailwindCSS + custom styles
│
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── main.py               # FastAPI entry + Engine Registry
│   │   ├── routers/
│   │   │   ├── engine.py         # Engine toggle endpoints
│   │   │   ├── analysis.py       # Analysis execution
│   │   │   ├── layers.py         # Layer management
│   │   │   └── export.py         # Data export
│   │   ├── engines/
│   │   │   ├── base.py           # Abstract engine interface
│   │   │   ├── gee_engine.py     # GEE implementation
│   │   │   └── gpu_engine.py     # NVIDIA GPU implementation
│   │   ├── processing/
│   │   │   ├── online/
│   │   │   │   └── lclu_gee.py   # Script A: GEE LCLU + Carbon
│   │   │   └── offline/
│   │   │       └── carbon_gpu.py # Script B: GPU Carbon Calc
│   │   └── core/
│   │       └── config.py         # Pydantic settings
│   ├── database/
│   │   └── schemas/
│   │       └── postgis_schema.sql
│   └── requirements.txt
│
├── docker-compose.yml            # Full stack deployment
└── README.md
```

---

## 🔑 Key Features

### Engine Toggle (Online ↔ Offline)
- **Online (GEE)**: Cloud-scale processing using Google's infrastructure
- **Offline (GPU)**: Local NVIDIA GPU processing with RAPIDS acceleration
- Seamless switching via abstract engine interface

### Dual User Modes
- **Student Mode**: Guided Map Wizard with step-by-step instructions
- **Professional Mode**: Advanced tools (band math, accuracy assessment, custom training)

### Analysis Pipeline
1. **LCLU Classification**: Random Forest on Sentinel-2 with s2cloudless masking
2. **Carbon Stock**: GEDI-based AGB → IPCC carbon conversion
3. **Change Detection**: Multi-temporal land cover change analysis
4. **Biomass Estimation**: Allometric equations + GEDI LiDAR

---

## 🎯 Development Phases

### ✅ Phase 1-2 (Complete)
- [x] Project architecture & directory structure
- [x] FastAPI backend with engine toggle
- [x] GEE LCLU classification pipeline (Script A)
- [x] GPU carbon stock calculation (Script B)
- [x] Zustand state management
- [x] Frontend dashboard UI
- [x] PostgreSQL + PostGIS schema

### 🔄 Phase 3 (Next: Frontend UI & Map Wizard)
- [ ] Full interactive AOI drawing tools (polygon, rectangle, freehand)
- [ ] Real-time WebSocket progress streaming
- [ ] Professional mode: Band math calculator UI
- [ ] Professional mode: Accuracy assessment (confusion matrix, Kappa)
- [ ] Professional mode: Custom training point collection
- [ ] Time-series chart component (NDVI trends)
- [ ] Layer composition & blending controls
- [ ] Export dialog with format options

### 📋 Phase 4 (NVIDIA Deep Learning & 3D)
- [ ] U-Net model for DL-based LCLU segmentation
- [ ] TensorRT engine optimization for real-time inference
- [ ] CesiumJS 3D terrain visualization
- [ ] NVIDIA Omniverse digital twin integration
- [ ] Custom ML training pipeline (fine-tune on user data)
- [ ] Active learning loop (model suggests uncertain pixels)

### 📋 Phase 5 (Production)
- [ ] Multi-user authentication & authorization
- [ ] Project management & collaboration
- [ ] Automated report generation (PDF)
- [ ] API rate limiting & caching
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline

---

## 🛠️ Setup & Running

### Frontend (Development)
```bash
npm install
npm run dev
```

### Backend (Development)
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

## 📊 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/engine/toggle` | Switch engine (online/offline) |
| GET | `/api/v1/engine/status` | Get engine status |
| POST | `/api/v1/analysis/lclu` | Run LCLU classification |
| POST | `/api/v1/analysis/carbon` | Calculate carbon stock |
| POST | `/api/v1/analysis/biomass` | Estimate AGB |
| POST | `/api/v1/analysis/change` | Change detection |
| GET | `/api/v1/layers` | List map layers |
| POST | `/api/v1/export/geotiff` | Export as GeoTIFF |
| WS | `/ws/progress/{task_id}` | Real-time progress |

---

## 📝 License

MIT License - GeoCarbon Dashboard Team
