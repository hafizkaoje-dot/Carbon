import { useAppStore } from '../store/appStore';
import { Layers, BarChart3, Settings, BookOpen, Map, Database, ChevronRight } from 'lucide-react';

const navItems = [
  { id: 'layers' as const, label: 'Layers', icon: Layers, description: 'Manage map layers' },
  { id: 'analysis' as const, label: 'Analysis', icon: BarChart3, description: 'Run LCLU & Carbon analysis' },
  { id: 'results' as const, label: 'Results', icon: Map, description: 'View analysis outputs' },
  { id: 'architecture' as const, label: 'Architecture', icon: BookOpen, description: 'System documentation' },
  { id: 'settings' as const, label: 'Settings', icon: Settings, description: 'Configure engines' },
];

export function Sidebar() {
  const { activePanel, setActivePanel, engineMode, userMode, layers, analysisResults } = useAppStore();

  return (
    <aside className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0 overflow-hidden">
      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-slate-700/80 text-white border border-slate-600'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-emerald-400' : ''} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{item.label}</p>
                <p className="text-[10px] text-slate-500 truncate">{item.description}</p>
              </div>
              {isActive && <ChevronRight size={14} className="text-slate-500" />}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="border-t border-slate-700 mx-3" />

      {/* Quick Stats */}
      <div className="p-3 space-y-2">
        <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/50">
            <p className="text-[10px] text-slate-500">Engine</p>
            <p className="text-xs font-semibold text-emerald-400 capitalize">{engineMode}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/50">
            <p className="text-[10px] text-slate-500">Mode</p>
            <p className="text-xs font-semibold text-violet-400 capitalize">{userMode}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/50">
            <p className="text-[10px] text-slate-500">Layers</p>
            <p className="text-xs font-semibold">{layers.filter(l => l.visible).length}/{layers.length}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/50">
            <p className="text-[10px] text-slate-500">Results</p>
            <p className="text-xs font-semibold">{analysisResults.length}</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700 mx-3" />

      {/* Active Panel Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activePanel === 'layers' && <LayersPanel />}
        {activePanel === 'results' && <ResultsPanel />}
        {activePanel === 'settings' && <SettingsPanel />}
      </div>
    </aside>
  );
}

function LayersPanel() {
  const { layers, toggleLayerVisibility } = useAppStore();

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-slate-300 mb-3">Map Layers</h3>
      {layers.map((layer) => (
        <div
          key={layer.id}
          className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-700/50"
        >
          <button
            onClick={() => toggleLayerVisibility(layer.id)}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              layer.visible ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
            }`}
          >
            {layer.visible && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{layer.name}</p>
            <p className="text-[10px] text-slate-500 capitalize">{layer.source} • {layer.type}</p>
          </div>
          <div className="flex items-center gap-1">
            <Database size={10} className="text-slate-500" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultsPanel() {
  const { analysisResults } = useAppStore();

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-slate-300 mb-3">Analysis Results</h3>
      {analysisResults.length === 0 ? (
        <div className="text-center py-8">
          <Map size={24} className="mx-auto text-slate-600 mb-2" />
          <p className="text-xs text-slate-500">No results yet</p>
          <p className="text-[10px] text-slate-600">Run an analysis to see results here</p>
        </div>
      ) : (
        analysisResults.map((result) => (
          <div key={result.id} className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium capitalize">{result.type}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                result.status === 'complete' ? 'bg-emerald-500/20 text-emerald-400' :
                result.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {result.status}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">{result.timestamp} • {result.engine}</p>
          </div>
        ))
      )}
    </div>
  );
}

function SettingsPanel() {
  const { engineMode } = useAppStore();

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-slate-300 mb-3">Engine Settings</h3>
      
      {engineMode === 'online' ? (
        <div className="space-y-2">
          <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-700/50">
            <p className="text-[10px] text-slate-500 mb-1">GEE Project</p>
            <p className="text-xs font-mono text-emerald-400">projects/geocarbon-lclu</p>
          </div>
          <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-700/50">
            <p className="text-[10px] text-slate-500 mb-1">Auth Status</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <p className="text-xs text-emerald-400">Authenticated</p>
            </div>
          </div>
          <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-700/50">
            <p className="text-[10px] text-slate-500 mb-1">Scale</p>
            <p className="text-xs">Cloud (Earth Engine Servers)</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-700/50">
            <p className="text-[10px] text-slate-500 mb-1">GPU Device</p>
            <p className="text-xs font-mono text-amber-400">NVIDIA RTX 4090 (24GB)</p>
          </div>
          <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-700/50">
            <p className="text-[10px] text-slate-500 mb-1">CUDA Version</p>
            <p className="text-xs font-mono">12.2</p>
          </div>
          <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-700/50">
            <p className="text-[10px] text-slate-500 mb-1">RAPIDS Status</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <p className="text-xs text-emerald-400">cuDF + cuSpatial Loaded</p>
            </div>
          </div>
          <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-700/50">
            <p className="text-[10px] text-slate-500 mb-1">Local Cache</p>
            <p className="text-xs">2.4 GB / 500 GB MBTiles</p>
          </div>
        </div>
      )}
    </div>
  );
}
