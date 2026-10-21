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

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

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
  
  // UI State
  sidebarOpen: boolean;
  activePanel: 'layers' | 'analysis' | 'results' | 'settings' | 'architecture';
  
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
  setActivePanel: (panel: 'layers' | 'analysis' | 'results' | 'settings' | 'architecture') => void;
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
}));
