"""
Script A: Online/GEE Processing Engine
======================================
Google Earth Engine implementation for:
1. Sentinel-2 image collection with s2cloudless cloud masking
2. Random Forest LCLU classification
3. Above-Ground Biomass (AGB) estimation using GEDI data
4. Carbon Stock calculation (AGB → Carbon using IPCC factors)

This script runs entirely in GEE's cloud infrastructure,
leveraging parallel processing across Google's data centers.

Author: GeoCarbon Team
"""

import ee
import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime


# ============================================
# Configuration
# ============================================

# LCLU Class Schema (CCI Land Cover compatible)
LCLU_CLASSES = {
    1: {"name": "Forest", "color": "#059669"},
    2: {"name": "Agriculture", "color": "#84cc16"},
    3: {"name": "Water", "color": "#3b82f6"},
    4: {"name": "Urban", "color": "#d97706"},
    5: {"name": "Bare Soil", "color": "#6b7280"},
}

# IPCC Biomass-to-Carbon conversion factor
# For tropical forests: 0.47; Global average: 0.48
BIOMASS_TO_CARBON_FACTOR = 0.47

# Random Forest parameters
RF_PARAMS = {
    "numberOfTrees": 200,
    "seed": 42,
    "variablesPerSplit": None,  # sqrt(n_features) default
    "minLeafPopulation": 5,
}


# ============================================
# Cloud Masking (s2cloudless)
# ============================================

def apply_s2cloudless_mask(
    image: ee.Image,
    cloud_prob_threshold: int = 40
) -> ee.Image:
    """
    Apply s2cloudless cloud and shadow masking to Sentinel-2 imagery.
    
    Why s2cloudless?
    - Uses a machine learning model trained specifically for Sentinel-2
    - Better than simple QA band masking for tropical regions
    - Handles thin cirrus and cloud shadows more accurately
    - Probability-based thresholding allows tuning per region
    
    Args:
        image: Sentinel-2 L2A image with s2cloudless probability band
        cloud_prob_threshold: Probability threshold (0-100) for cloud classification
            - Lower (20-30): More aggressive masking, fewer false negatives
            - Higher (50-60): Less masking, may miss thin clouds
            - Recommended for tropics: 30-40
    
    Returns:
        Cloud-masked image with 'cloud_mask' band
    """
    # Get cloud probability band (added by s2cloudless script)
    cloud_prob = image.select('probability')
    
    # Create cloud mask: probability > threshold = cloud
    cloud_mask = cloud_prob.gt(cloud_prob_threshold)
    
    # Additional shadow detection using NIR band
    # Cloud shadows appear dark in NIR
    nir = image.select('B8')
    shadow_mask = nir.lt(0.15)  # Dark pixels in NIR
    
    # Combine cloud and shadow masks
    combined_mask = cloud_mask.Or(shadow_mask).focal_min(2).focal_max(4)
    
    # Apply mask - set masked pixels to null
    return image.updateMask(combined_mask.Not())


def get_sentinel2_collection(
    aoi: ee.Geometry,
    start_date: str,
    end_date: str,
    cloud_cover_pct: int = 20
) -> ee.ImageCollection:
    """
    Build a cloud-free Sentinel-2 composite for the given AOI and date range.
    
    Processing chain:
    1. Filter Sentinel-2 L2A (surface reflectance, already atmospherically corrected)
    2. Filter by AOI intersection and date range
    3. Filter by cloud cover percentage
    4. Apply s2cloudless masking
    5. Create median composite (reduces remaining noise)
    
    Args:
        aoi: Area of Interest as ee.Geometry
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        cloud_cover_pct: Maximum scene cloud cover percentage
    
    Returns:
        ee.ImageCollection: Cloud-masked Sentinel-2 collection
    """
    # Import s2cloudless probability layer
    s2_cloudless = (
        ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY')
        .filterBounds(aoi)
        .filterDate(start_date, end_date)
    )
    
    # Import Sentinel-2 L2A (Harmonized)
    s2_sr = (
        ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(aoi)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloud_cover_pct))
    )
    
    # Join S2 SR with cloud probability
    def join_with_cloud_prob(sr_image):
        cloud_prob = s2_cloudless.filter(
            ee.Filter.eq('system:index', sr_image.get('system:index'))
        ).first()
        return sr_image.addBands(cloud_prob.select('probability'))
    
    # Apply cloud masking to each image
    def mask_and_clean(image):
        masked = apply_s2cloudless_mask(image)
        # Select only the bands we need for classification
        return masked.select([
            'B2',   # Blue (490nm) - 10m
            'B3',   # Green (560nm) - 10m
            'B4',   # Red (665nm) - 10m
            'B8',   # NIR (842nm) - 10m
            'B11',  # SWIR1 (1610nm) - 20m
            'B12',  # SWIR2 (2190nm) - 20m
        ])
    
    # Process collection
    s2_with_prob = s2_sr.map(join_with_cloud_prob)
    s2_masked = s2_with_prob.map(mask_and_clean)
    
    return s2_masked


# ============================================
# Spectral Indices
# ============================================

def compute_spectral_indices(image: ee.Image) -> ee.Image:
    """
    Compute spectral indices that enhance class separability.
    
    These indices are critical for Random Forest classification because they
    provide non-linear transformations that help the model separate classes
    that overlap in raw spectral space.
    
    Indices computed:
    - NDVI: Vegetation vigor (NIR-Red)/(NIR+Red)
    - NDWI: Water content (Green-NIR)/(Green+NIR)
    - NDBI: Built-up index (SWIR-NIR)/(SWIR+NIR)
    - NBR: Normalized Burn Ratio (NIR-SWIR2)/(NIR+SWIR2)
    - EVI: Enhanced Vegetation Index (reduces atmospheric effects)
    """
    # NDVI - Normalized Difference Vegetation Index
    ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
    
    # NDWI - Normalized Difference Water Index (McFeeters)
    ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI')
    
    # NDBI - Normalized Difference Built-up Index
    ndbi = image.normalizedDifference(['B11', 'B8']).rename('NDBI')
    
    # NBR - Normalized Burn Ratio
    nbr = image.normalizedDifference(['B8', 'B12']).rename('NBR')
    
    # EVI - Enhanced Vegetation Index
    # EVI = 2.5 * (NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1)
    evi = image.expression(
        '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
        {
            'NIR': image.select('B8'),
            'RED': image.select('B4'),
            'BLUE': image.select('B2'),
        }
    ).rename('EVI')
    
    return image.addBands([ndvi, ndwi, ndbi, nbr, evi])


# ============================================
# LCLU Classification (Random Forest)
# ============================================

def classify_lclu(
    composite: ee.Image,
    training_points: ee.FeatureCollection,
    aoi: ee.Geometry,
    scale: int = 10
) -> ee.Image:
    """
    Run Random Forest classification on the spectral composite.
    
    Why Random Forest?
    - Handles non-linear relationships between spectral bands and classes
    - Robust to outliers and noisy training data
    - Provides built-in feature importance (OOB error)
    - No need for feature scaling or distribution assumptions
    - Works well with the mix of spectral bands and indices
    
    Args:
        composite: Multi-band spectral image (6 raw + 5 indices = 11 bands)
        training_points: Labeled sample points with 'class' property
        aoi: Area of Interest geometry
        scale: Output resolution in meters (10m = Sentinel-2 native)
    
    Returns:
        Classified image with class labels (1-5)
    """
    # Add spectral indices
    composite_with_indices = compute_spectral_indices(composite)
    
    # Define band names for classification
    band_names = [
        'B2', 'B3', 'B4', 'B8', 'B11', 'B12',  # Raw bands
        'NDVI', 'NDWI', 'NDBI', 'NBR', 'EVI',    # Indices
    ]
    
    # Sample training data from the composite
    training_data = composite_with_indices.sampleRegions(
        collection=training_points,
        properties=['class'],
        scale=scale,
        geometries=False,
    )
    
    # Train Random Forest classifier
    classifier = ee.Classifier.smileRandomForest(**RF_PARAMS).train(
        features=training_data,
        classProperty='class',
        inputProperties=band_names,
    )
    
    # Classify the entire image
    classified = composite_with_indices.select(band_names).classify(classifier)
    
    return classified.rename('lclu_class')


# ============================================
# Carbon Stock Calculation (GEDI + IPCC)
# ============================================

def calculate_carbon_stock(
    classified: ee.Image,
    aoi: ee.Geometry,
    scale: int = 30
) -> ee.Image:
    """
    Calculate Above-Ground Biomass (AGB) and Carbon Stock using GEDI data.
    
    Methodology:
    1. Load GEDI L4A (Level 4A) footprint data - provides AGB estimates at
       individual footprint locations (~25m diameter footprints)
    2. Interpolate GEDI footprints to create a continuous AGB surface
    3. Apply land-cover-specific biomass expansion factors
    4. Convert AGB to carbon stock using IPCC default factor (0.47)
    
    Why GEDI?
    - Spaceborne LiDAR provides direct 3D structure measurements
    - Much more accurate than optical-only biomass estimation
    - Global coverage with ~51°N to 51°S latitude range
    - L4A product provides gridded AGB at 1km resolution
    
    Args:
        classified: LCLU classified image
        aoi: Area of Interest
        scale: Output resolution (30m for GEDI compatibility)
    
    Returns:
        Image with 'agb' (t/ha) and 'carbon_stock' (tC/ha) bands
    """
    # Load GEDI L4A Above-Ground Biomass
    gedi = (
        ee.ImageCollection('LARSE/GEDI/GEDI04_A_002')
        .filterBounds(aoi)
        .filterDate('2019-04-01', '2023-12-31')
    )
    
    # Create mean AGB composite from GEDI footprints
    # 'beam' contains the AGB estimate for each GEDI shot
    gedi_agb = gedi.map(
        lambda img: img.select('agbd').rename('gedi_agb')
    ).mean()
    
    # Smooth GEDI to fill gaps using interpolation
    # GEDI has sparse coverage, so we smooth to create continuous surface
    gedi_smooth = gedi_agb.focal_mean(radius=1000, units='meters')
    
    # Apply land-cover specific biomass modifiers
    # Different land cover types have different biomass-to-AGB relationships
    biomass_modifiers = ee.Image.constant([
        1.0,   # Forest: use GEDI directly
        0.15,  # Agriculture: ~15% of forest biomass
        0.0,   # Water: no biomass
        0.05,  # Urban: minimal vegetation biomass
        0.02,  # Bare soil: negligible
    ])
    
    # Get the modifier for each pixel based on LCLU class
    # Reclassify to get modifier values
    modifier = classified.remap(
        [1, 2, 3, 4, 5],      # from: class values
        [1.0, 0.15, 0.0, 0.05, 0.02],  # to: biomass multipliers
    )
    
    # Calculate AGB: GEDI biomass × land cover modifier
    agb = gedi_smooth.multiply(modifier).rename('agb')
    
    # Convert AGB to Carbon Stock using IPCC factor
    # Carbon = AGB × 0.47 (IPCC 2006 default for tropical biomass)
    carbon_stock = agb.multiply(BIOMASS_TO_CARBON_FACTOR).rename('carbon_stock')
    
    return agb.addBands(carbon_stock)


# ============================================
# Main Pipeline Function
# ============================================

def run_lclu_carbon_pipeline(
    aoi_geojson: dict,
    start_date: str,
    end_date: str,
    cloud_threshold: int = 30,
    scale: int = 10,
    training_data_asset: Optional[str] = None,
) -> dict:
    """
    Execute the complete LCLU + Carbon Stock analysis pipeline.
    
    This is the main entry point called by the FastAPI backend.
    
    Args:
        aoi_geojson: Area of Interest as GeoJSON dict
        start_date: Analysis start date (YYYY-MM-DD)
        end_date: Analysis end date (YYYY-MM-DD)
        cloud_threshold: s2cloudless probability threshold (default: 30)
        scale: Output spatial resolution in meters
        training_data_asset: GEE asset path for training points
    
    Returns:
        dict with:
        - lclu_image: Classified LCLU map
        - carbon_image: Carbon stock map
        - statistics: Area-weighted class distribution
        - total_carbon: Total carbon stock in tonnes
    """
    # Convert GeoJSON to ee.Geometry
    aoi = ee.Geometry(aoi_geojson['geometry'])
    
    # Step 1: Get cloud-masked Sentinel-2 collection
    print("Step 1: Fetching Sentinel-2 imagery...")
    s2_collection = get_sentinel2_collection(
        aoi=aoi,
        start_date=start_date,
        end_date=end_date,
        cloud_cover_pct=cloud_threshold,
    )
    
    # Step 2: Create median composite
    print("Step 2: Creating median composite...")
    composite = s2_collection.median().clip(aoi)
    
    # Step 3: Load or create training data
    print("Step 3: Loading training data...")
    if training_data_asset:
        training_points = ee.FeatureCollection(training_data_asset)
    else:
        # Use ESA WorldCover as proxy training data
        training_points = generate_training_from_worldcover(aoi)
    
    # Step 4: Run LCLU classification
    print("Step 4: Running Random Forest classification...")
    classified = classify_lclu(composite, training_points, aoi, scale)
    
    # Step 5: Calculate carbon stock
    print("Step 5: Calculating carbon stock from GEDI...")
    carbon_result = calculate_carbon_stock(classified, aoi, scale=30)
    
    # Step 6: Compute statistics
    print("Step 6: Computing statistics...")
    pixel_area = ee.Image.pixelArea().divide(10000)  # Convert to hectares
    
    # Area per class
    area_stats = classified.reduceRegion(
        reducer=ee.Reducer.frequencyHistogram(),
        geometry=aoi,
        scale=scale,
        maxPixels=1e13,
    )
    
    # Total carbon
    total_carbon = carbon_result.select('carbon_stock').reduceRegion(
        reducer=ee.Reducer.sum(),
        geometry=aoi,
        scale=30,
        maxPixels=1e13,
    )
    
    return {
        "lclu_image": classified,
        "carbon_image": carbon_result,
        "statistics": area_stats.getInfo(),
        "total_carbon_tC": total_carbon.getInfo(),
        "metadata": {
            "aoi_area_km2": aoi.area().divide(1e6).getInfo(),
            "date_range": f"{start_date} to {end_date}",
            "scale_m": scale,
            "cloud_threshold": cloud_threshold,
            "classifier": "Random Forest (200 trees)",
        }
    }


def generate_training_from_worldcover(aoi: ee.Geometry) -> ee.FeatureCollection:
    """
    Generate training samples from ESA WorldCover 2021.
    
    Uses the 10m ESA WorldCover product as a proxy for labeled training data.
    In production, this would be replaced with field-validated ground truth.
    """
    worldcover = ee.Image('ESA/WorldCover/v200').clip(aoi)
    
    # Remap WorldCover classes to our schema
    # WorldCover: 10=Tree, 20=Shrub, 30=Grass, 40=Crops, 50=Built, 
    #             60=Bare, 70=Snow, 80=Water, 90=Herbaceous wetland
    remapped = worldcover.remap(
        [10, 20, 30, 40, 50, 60, 80, 90],
        [1,  1,  2,  2,  4,  5,  3,  2],  # Map to our 5 classes
    )
    
    # Stratified random sampling
    training = remapped.stratifiedSample(
        numPoints=500,
        classBand='remapped',
        region=aoi,
        scale=10,
        geometries=True,
    ).rename('remapped', 'class')
    
    return training


# ============================================
# Export Functions
# ============================================

def export_to_geotiff(
    image: ee.Image,
    description: str,
    aoi: ee.Geometry,
    scale: int = 10,
    folder: str = "geocarbon_exports",
) -> ee.batch.Task:
    """
    Export an ee.Image to Google Cloud Storage as GeoTIFF.
    """
    task = ee.batch.Export.image.toCloudStorage(
        image=image,
        description=description,
        bucket=settings.GCS_BUCKET,
        fileNamePrefix=description,
        region=aoi.bounds().getInfo()['coordinates'],
        scale=scale,
        maxPixels=1e13,
        fileFormat='GeoTIFF',
        formatOptions={
            'cloudOptimized': True,
            'noDataValue': 0,
        },
    )
    task.start()
    return task
