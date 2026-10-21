import { create } from 'zustand';

// ============================================
// LCLU Dashboard State Management
// Handles: Engine Toggle, Mode Switch, Map State
// ============================================

export type EngineMode = 'online' | 'offline';
export type UserMode = 'student' | 'professional';
export type AnalysisType = 'lclu' | 'carbon' | 'biomass' | 'change-detection';

export interface AOI {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    name: string;
    area_km2?: number;
  };
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'raster' | 'vector' | 'classification';
  visible: boolean;
  opacity: number;
  source: EngineMode;
  url?: string;
}

export interface AnalysisResult {
  id: string;
  type: AnalysisType;
  timestamp: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  engine: EngineMode;
  stats?: {
    totalArea: number;
    classDistribution: Record<string, number>;
    carbonStock?: number;
    biomass?: number;
    accuracy?: number;
  };
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'raster' | 'vector' | 'training' | 'script';
  size: number;
  format: string;
  uploadedAt: string;
  status: 'uploading' | 'ready' | 'error';
  metadata?: {
    bands?: number;
    width?: number;
    height?: number;
    crs?: string;
    featureCount?: number;
    classCount?: number;
  };
  localPath?: string;
}

export interface GEEScript {
  id: string;
  name: string;
  code: string;
  language: 'python' | 'javascript';
  createdAt: string;
  lastRun?: string;
  isTemplate: boolean;
  category: 'lclu' | 'carbon' | 'change' | 'custom';
}

export interface ScriptOutput {
  id: string;
  timestamp: string;
  type: 'stdout' | 'stderr' | 'info' | 'success' | 'error';
  message: string;
}

export interface AnalysisParameters {
  startDate: string;
  endDate: string;
  scale: number;
  cloudThreshold: number;
  classifier: 'random_forest' | 'svm' | 'gradient_boosting' | 'deep_learning';
  trainingDataAsset?: string;
  numberOfTrees: number;
  biome: 'tropical' | 'subtropical' | 'temperate' | 'boreal';
}

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

type PanelType = 'layers' | 'analysis' | 'results' | 'settings' | 'architecture' | 'data-input' | 'gee-scripts';

interface AppState {
  // Engine State
  engineMode: EngineMode;
  isEngineSwitching: boolean;
  engineStatus: 'connected' | 'disconnected' | 'initializing';
  
  // User Mode
  userMode: UserMode;
  
  // Map State
  mapCenter: [number, number];
  mapZoom: number;
  aoi: AOI | null;
  layers: MapLayer[];
  
  // Analysis State
  analysisType: AnalysisType | null;
  analysisResults: AnalysisResult[];
  isProcessing: boolean;
  processingProgress: number;
  
  // Student Wizard
  wizardSteps: WizardStep[];
  wizardActive: boolean;
  currentWizardStep: number;
  
  // Data Input State
  uploadedFiles: UploadedFile[];
  analysisParams: AnalysisParameters;
  geeAssetId: string;
  
  // GEE Script State
  geeScripts: GEEScript[];
  activeScript: GEEScript | null;
  scriptOutputs: ScriptOutput[];
  isScriptRunning: boolean;
  
  // UI State
  sidebarOpen: boolean;
  activePanel: PanelType;
  
  // Actions
  setEngineMode: (mode: EngineMode) => void;
  setEngineStatus: (status: 'connected' | 'disconnected' | 'initializing') => void;
  setUserMode: (mode: UserMode) => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  setAOI: (aoi: AOI | null) => void;
  addLayer: (layer: MapLayer) => void;
  removeLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  setAnalysisType: (type: AnalysisType | null) => void;
  addAnalysisResult: (result: AnalysisResult) => void;
  setIsProcessing: (processing: boolean) => void;
  setProcessingProgress: (progress: number) => void;
  setWizardActive: (active: boolean) => void;
  setCurrentWizardStep: (step: number) => void;
  completeWizardStep: (stepId: number) => void;
  setSidebarOpen: (open: boolean) => void;
  setActivePanel: (panel: PanelType) => void;
  
  // Data Input Actions
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (id: string) => void;
  setAnalysisParams: (params: Partial<AnalysisParameters>) => void;
  setGeeAssetId: (id: string) => void;
  
  // GEE Script Actions
  setActiveScript: (script: GEEScript | null) => void;
  updateScriptCode: (code: string) => void;
  addScriptOutput: (output: ScriptOutput) => void;
  clearScriptOutputs: () => void;
  setIsScriptRunning: (running: boolean) => void;
  saveScript: (script: GEEScript) => void;
  deleteScript: (id: string) => void;
}

// Default wizard steps for Student Mode
const defaultWizardSteps: WizardStep[] = [
  { id: 1, title: 'Define Area of Interest', description: 'Draw or select your study area on the map', completed: false, active: true },
  { id: 2, title: 'Select Date Range', description: 'Choose the temporal window for analysis', completed: false, active: false },
  { id: 3, title: 'Choose Classification', description: 'Select LCLU classes or use default scheme', completed: false, active: false },
  { id: 4, title: 'Configure Processing', description: 'Set resolution, cloud cover threshold', completed: false, active: false },
  { id: 5, title: 'Run Analysis', description: 'Execute the classification pipeline', completed: false, active: false },
  { id: 6, title: 'Review Results', description: 'Explore maps, charts, and export data', completed: false, active: false },
];

// Default analysis parameters
const defaultAnalysisParams: AnalysisParameters = {
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  scale: 10,
  cloudThreshold: 30,
  classifier: 'random_forest',
  numberOfTrees: 200,
  biome: 'tropical',
};

// Template GEE scripts
const templateScripts: GEEScript[] = [
  {
    id: 'tpl-lclu',
    name: 'LCLU Classification (Sentinel-2)',
    language: 'python',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    category: 'lclu',
    code: `import ee
import geopandas as gpd

# Initialize Earth Engine
ee.Initialize(project='projects/geocarbon-lclu')

# Define AOI (replace with your geometry)
aoi = ee.Geometry.Rectangle([98.2, 7.8, 98.5, 8.1])

# Date range
start_date = '2024-01-01'
end_date = '2024-12-31'

# Load Sentinel-2 L2A with cloud masking
def mask_s2_clouds(image):
    qa = image.select('QA60')
    cloud_mask = qa.bitwiseAnd(1 << 10).eq(0)
    shadow_mask = qa.bitwiseAnd(1 << 11).eq(0)
    return image.updateMask(cloud_mask.And(shadow_mask))

s2_collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(aoi)
    .filterDate(start_date, end_date)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(mask_s2_clouds))

# Create median composite
composite = s2_collection.median().clip(aoi)

# Calculate spectral indices
ndvi = composite.normalizedDifference(['B8', 'B4']).rename('NDVI')
ndwi = composite.normalizedDifference(['B3', 'B8']).rename('NDWI')
ndbi = composite.normalizedDifference(['B11', 'B8']).rename('NDBI')

# Stack bands for classification
bands = composite.select(['B2','B3','B4','B8','B11','B12'])
stack = bands.addBands([ndvi, ndwi, ndbi])

# Load training data (replace with your asset)
training = ee.FeatureCollection('users/your_name/training_points')

# Train Random Forest classifier
classifier = ee.Classifier.smileRandomForest(200).train(
    features=training,
    classProperty='class',
    inputProperties=stack.bandNames()
)

# Classify
classified = stack.classify(classifier)

# Export result
task = ee.batch.Export.image.toDrive(
    image=classified,
    description='lclu_classification',
    folder='geocarbon_exports',
    region=aoi,
    scale=10,
    maxPixels=1e13
)
task.start()
print(f'Task started: {task.status()}')`,
  },
  {
    id: 'tpl-carbon',
    name: 'Carbon Stock (GEDI + IPCC)',
    language: 'python',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    category: 'carbon',
    code: `import ee

ee.Initialize(project='projects/geocarbon-lclu')

# AOI
aoi = ee.Geometry.Rectangle([98.2, 7.8, 98.5, 8.1])

# Load GEDI L4A Above-Ground Biomass
gedi = (ee.ImageCollection('LARSE/GEDI/GEDI04_A_002')
    .filterBounds(aoi)
    .filterDate('2019-04-01', '2023-12-31'))

# Create mean AGB composite
agb = gedi.map(lambda img: img.select('agbd')).mean()

# Smooth to fill gaps
agb_smooth = agb.focal_mean(radius=1000, units='meters')

# IPCC Biomass-to-Carbon factor (tropical = 0.47)
CARBON_FACTOR = 0.47
carbon_stock = agb_smooth.multiply(CARBON_FACTOR).rename('carbon_tC_ha')

# Load LCLU to mask non-vegetated areas
lclu = ee.Image('users/your_name/lclu_result')
forest_mask = lclu.eq(1)  # Forest class

# Apply mask - only forest has significant carbon
carbon_forest = carbon_stock.updateMask(forest_mask)

# Calculate total carbon
pixel_area = ee.Image.pixelArea().divide(10000)  # hectares
total_carbon = carbon_forest.multiply(pixel_area).reduceRegion(
    reducer=ee.Reducer.sum(),
    geometry=aoi,
    scale=30,
    maxPixels=1e13
)

print(f'Total Carbon Stock: {total_carbon.getInfo()} tC')

# Export
task = ee.batch.Export.image.toDrive(
    image=carbon_stock,
    description='carbon_stock_map',
    folder='geocarbon_exports',
    region=aoi,
    scale=30,
    maxPixels=1e13
)
task.start()
print('Carbon stock export started')`,
  },
  {
    id: 'tpl-change',
    name: 'Change Detection (Multi-temporal)',
    language: 'python',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    category: 'change',
    code: `import ee

ee.Initialize(project='projects/geocarbon-lclu')

aoi = ee.Geometry.Rectangle([98.2, 7.8, 98.5, 8.1])

# Define time periods
period1_start = '2018-01-01'
period1_end = '2018-12-31'
period2_start = '2024-01-01'
period2_end = '2024-12-31'

def get_composite(start, end, aoi):
    """Create cloud-free Sentinel-2 composite."""
    def mask_clouds(img):
        qa = img.select('QA60')
        mask = qa.bitwiseAnd(1 << 10).eq(0)
        return img.updateMask(mask)
    
    collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(aoi)
        .filterDate(start, end)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
        .map(mask_clouds))
    return collection.median().clip(aoi)

# Get composites for both periods
comp1 = get_composite(period1_start, period1_end, aoi)
comp2 = get_composite(period2_start, period2_end, aoi)

# Calculate NDVI for both periods
ndvi1 = comp1.normalizedDifference(['B8', 'B4']).rename('NDVI_t1')
ndvi2 = comp2.normalizedDifference(['B8', 'B4']).rename('NDVI_t2')

# NDVI difference (change indicator)
ndvi_change = ndvi2.subtract(ndvi1).rename('NDVI_change')

# Classify change magnitude
# > 0.1 = vegetation gain, < -0.1 = vegetation loss
change_class = ndvi_change.expression(
    "(change > 0.1) ? 1 : (change < -0.1) ? 3 : 2",
    {'change': ndvi_change}
).rename('change_class').toInt()

# Calculate area of change
pixel_area = ee.Image.pixelArea().divide(10000)
change_area = change_class.multiply(pixel_area)

# Statistics
stats = change_class.reduceRegion(
    reducer=ee.Reducer.frequencyHistogram(),
    geometry=aoi,
    scale=30
)
print(f'Change histogram: {stats.getInfo()}')

# Export
task = ee.batch.Export.image.toDrive(
    image=change_class,
    description='land_cover_change',
    folder='geocarbon_exports',
    region=aoi,
    scale=30,
    maxPixels=1e13
)
task.start()
print('Change detection export started')`,
  },
  {
    id: 'tpl-custom',
    name: 'Custom Script (Blank)',
    language: 'python',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    category: 'custom',
    code: `import ee

# Initialize Earth Engine
ee.Initialize(project='projects/geocarbon-lclu')

# Define your AOI
aoi = ee.Geometry.Rectangle([98.2, 7.8, 98.5, 8.1])

# Your custom analysis here
# ...

print('Script executed successfully')`,
  },
];

export const useAppStore = create<AppState>((set) => ({
  // Initial State
  engineMode: 'online',
  isEngineSwitching: false,
  engineStatus: 'connected',
  
  userMode: 'student',
  
  mapCenter: [7.9465, 98.3677], // Phuket, Thailand as default
  mapZoom: 10,
  aoi: null,
  layers: [
    { id: 'basemap', name: 'Base Map', type: 'raster', visible: true, opacity: 1, source: 'online' },
    { id: 'sentinel2', name: 'Sentinel-2 RGB', type: 'raster', visible: false, opacity: 0.8, source: 'online' },
    { id: 'lclu-result', name: 'LCLU Classification', type: 'classification', visible: false, opacity: 0.7, source: 'online' },
    { id: 'carbon-stock', name: 'Carbon Stock (tC/ha)', type: 'raster', visible: false, opacity: 0.7, source: 'online' },
  ],
  
  analysisType: null,
  analysisResults: [],
  isProcessing: false,
  processingProgress: 0,
  
  wizardSteps: defaultWizardSteps,
  wizardActive: false,
  currentWizardStep: 1,
  
  // Data Input State
  uploadedFiles: [],
  analysisParams: defaultAnalysisParams,
  geeAssetId: '',
  
  // GEE Script State
  geeScripts: templateScripts,
  activeScript: templateScripts[0],
  scriptOutputs: [],
  isScriptRunning: false,
  
  sidebarOpen: true,
  activePanel: 'layers',
  
  // Actions
  setEngineMode: (mode) => set({ engineMode: mode, isEngineSwitching: true }),
  setEngineStatus: (status) => set({ engineStatus: status, isEngineSwitching: false }),
  setUserMode: (mode) => set({ userMode: mode, wizardActive: mode === 'student' }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  setAOI: (aoi) => set({ aoi }),
  addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer] })),
  removeLayer: (id) => set((state) => ({ layers: state.layers.filter(l => l.id !== id) })),
  toggleLayerVisibility: (id) => set((state) => ({
    layers: state.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
  })),
  setAnalysisType: (type) => set({ analysisType: type }),
  addAnalysisResult: (result) => set((state) => ({ analysisResults: [...state.analysisResults, result] })),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setProcessingProgress: (progress) => set({ processingProgress: progress }),
  setWizardActive: (active) => set({ wizardActive: active }),
  setCurrentWizardStep: (step) => set({ currentWizardStep: step }),
  completeWizardStep: (stepId) => set((state) => ({
    wizardSteps: state.wizardSteps.map(s => 
      s.id === stepId ? { ...s, completed: true } : s
    ),
    currentWizardStep: stepId + 1,
  })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  
  // Data Input Actions
  addUploadedFile: (file) => set((state) => ({ uploadedFiles: [...state.uploadedFiles, file] })),
  removeUploadedFile: (id) => set((state) => ({ uploadedFiles: state.uploadedFiles.filter(f => f.id !== id) })),
  setAnalysisParams: (params) => set((state) => ({ analysisParams: { ...state.analysisParams, ...params } })),
  setGeeAssetId: (id) => set({ geeAssetId: id }),
  
  // GEE Script Actions
  setActiveScript: (script) => set({ activeScript: script }),
  updateScriptCode: (code) => set((state) => ({
    activeScript: state.activeScript ? { ...state.activeScript, code } : null,
  })),
  addScriptOutput: (output) => set((state) => ({ scriptOutputs: [...state.scriptOutputs, output] })),
  clearScriptOutputs: () => set({ scriptOutputs: [] }),
  setIsScriptRunning: (running) => set({ isScriptRunning: running }),
  saveScript: (script) => set((state) => ({
    geeScripts: state.geeScripts.some(s => s.id === script.id)
      ? state.geeScripts.map(s => s.id === script.id ? script : s)
      : [...state.geeScripts, script],
  })),
  deleteScript: (id) => set((state) => ({
    geeScripts: state.geeScripts.filter(s => s.id !== id),
    activeScript: state.activeScript?.id === id ? null : state.activeScript,
  })),
}));
