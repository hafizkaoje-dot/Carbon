-- ============================================
-- GeoCarbon Dashboard - PostGIS Database Schema
-- ============================================
-- PostgreSQL + PostGIS for vector data storage
-- Stores: AOI boundaries, training points, results, metadata
-- ============================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ============================================
-- Projects Table
-- ============================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id UUID REFERENCES users(id),
    settings JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- AOI (Area of Interest) Table
-- ============================================
CREATE TABLE aois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    area_km2 FLOAT GENERATED ALWAYS AS (ST_Area(geometry::geography) / 1e6) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for spatial queries
    CONSTRAINT enforce_valid_geom CHECK (ST_IsValid(geometry))
);

CREATE INDEX idx_aois_geometry ON aois USING GIST (geometry);
CREATE INDEX idx_aois_project ON aois (project_id);

-- ============================================
-- Analysis Results Table
-- ============================================
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    aoi_id UUID REFERENCES aois(id),
    analysis_type VARCHAR(50) NOT NULL, -- 'lclu', 'carbon', 'biomass', 'change'
    engine VARCHAR(20) NOT NULL, -- 'online' (GEE) or 'offline' (GPU)
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'complete', 'error'
    
    -- Parameters
    start_date DATE,
    end_date DATE,
    scale_meters INTEGER DEFAULT 10,
    cloud_threshold INTEGER DEFAULT 30,
    classifier VARCHAR(100),
    
    -- Results
    statistics JSONB,
    accuracy_metrics JSONB, -- OA, Kappa, per-class accuracy
    
    -- File references
    output_raster_path TEXT,
    output_tiles_path TEXT, -- MBTiles for web display
    
    -- Timing
    processing_time_seconds FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_results_project ON analysis_results (project_id);
CREATE INDEX idx_results_type ON analysis_results (analysis_type);
CREATE INDEX idx_results_status ON analysis_results (status);

-- ============================================
-- Training Points Table
-- ============================================
CREATE TABLE training_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    geometry GEOMETRY(Point, 4326) NOT NULL,
    class_label INTEGER NOT NULL, -- 1=Forest, 2=Agriculture, 3=Water, 4=Urban, 5=Bare
    class_name VARCHAR(50),
    confidence FLOAT DEFAULT 1.0, -- 0-1 confidence in label
    source VARCHAR(50), -- 'field', 'visual', 'worldcover', 'generated'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_training_geometry ON training_points USING GIST (geometry);
CREATE INDEX idx_training_class ON training_points (class_label);

-- ============================================
-- Map Layers Cache Table
-- ============================================
CREATE TABLE map_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    layer_type VARCHAR(50) NOT NULL, -- 'raster', 'vector', 'classification'
    source_engine VARCHAR(20), -- 'online' or 'offline'
    
    -- Storage
    file_path TEXT,
    mbtiles_path TEXT, -- For offline tile cache
    cog_url TEXT, -- Cloud-optimized GeoTIFF URL
    
    -- Metadata
    bounds GEOMETRY(Polygon, 4326),
    min_zoom INTEGER DEFAULT 0,
    max_zoom INTEGER DEFAULT 18,
    band_count INTEGER,
    nodata_value FLOAT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_layers_bounds ON map_layers USING GIST (bounds);

-- ============================================
-- Carbon Stock Zonal Statistics
-- ============================================
CREATE TABLE carbon_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID REFERENCES analysis_results(id) ON DELETE CASCADE,
    zone_name VARCHAR(255),
    zone_geometry GEOMETRY(Polygon, 4326),
    
    -- Carbon metrics
    area_ha FLOAT,
    agb_tons FLOAT, -- Above-ground biomass in tonnes
    carbon_stock_tc FLOAT, -- Carbon stock in tonnes of Carbon
    carbon_density_tc_ha FLOAT, -- Carbon per hectare
    
    -- Per-class breakdown
    class_breakdown JSONB, -- {"Forest": 145.2, "Agriculture": 32.1, ...}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_carbon_result ON carbon_statistics (result_id);
CREATE INDEX idx_carbon_geometry ON carbon_statistics USING GIST (zone_geometry);

-- ============================================
-- Users Table (simplified)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'student', -- 'student' or 'professional'
    gee_credentials JSONB, -- Encrypted GEE service account key
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
