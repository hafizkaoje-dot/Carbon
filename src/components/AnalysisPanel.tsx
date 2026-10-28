import { useState } from 'react';
import { useAppStore, AnalysisType } from '../store/appStore';
import { Play, BarChart3, Leaf, TreePine, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { SafeChartContainer } from './SafeChartContainer';
import { ErrorBoundary } from './ErrorBoundary';

const analysisOptions = [
  { id: 'lclu' as AnalysisType, label: 'LCLU Classification', icon: BarChart3, color: 'emerald', description: 'Random Forest land cover mapping' },
  { id: 'carbon' as AnalysisType, label: 'Carbon Stock', icon: Leaf, color: 'blue', description: 'Above-ground biomass & carbon estimation' },
  { id: 'biomass' as AnalysisType, label: 'AGB Estimation', icon: TreePine, color: 'amber', description: 'GEDI-based biomass calculation' },
  { id: 'change-detection' as AnalysisType, label: 'Change Detection', icon: RefreshCw, color: 'violet', description: 'Temporal land cover change analysis' },
];

// Mock results data
const classDistribution = [
  { name: 'Forest', value: 42, color: '#059669' },
  { name: 'Agriculture', value: 28, color: '#84cc16' },
  { name: 'Water', value: 12, color: '#3b82f6' },
  { name: 'Urban', value: 13, color: '#d97706' },
  { name: 'Bare Soil', value: 5, color: '#6b7280' },
];

const carbonData = [
  { zone: 'Zone A', forest: 145, agriculture: 32, urban: 8 },
  { zone: 'Zone B', forest: 178, agriculture: 28, urban: 12 },
  { zone: 'Zone C', forest: 92, agriculture: 45, urban: 18 },
  { zone: 'Zone D', forest: 156, agriculture: 38, urban: 6 },
];

export function AnalysisPanel() {
  const { engineMode, analysisType, setAnalysisType, isProcessing, setIsProcessing, processingProgress, setProcessingProgress, addAnalysisResult } = useAppStore();
  const [showResults, setShowResults] = useState(false);

  const handleRunAnalysis = () => {
    if (!analysisType) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setShowResults(false);

    // Simulate processing
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsProcessing(false);
        setShowResults(true);
        addAnalysisResult({
          id: Date.now().toString(),
          type: analysisType!,
          timestamp: new Date().toISOString(),
          status: 'complete',
          engine: engineMode,
          stats: {
            totalArea: 156.8,
            classDistribution: { Forest: 42, Agriculture: 28, Water: 12, Urban: 13, 'Bare Soil': 5 },
            carbonStock: 2847.5,
            biomass: 5210.3,
            accuracy: 0.89,
          }
        });
      }
      setProcessingProgress(progress);
    }, 500);
  };

  return (
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-20 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Analysis Engine</h2>
            <p className="text-xs text-slate-400 mt-1">
              Running on <span className={engineMode === 'online' ? 'text-emerald-400' : 'text-amber-400'}>
                {engineMode === 'online' ? 'Google Earth Engine (Cloud)' : 'NVIDIA GPU (Local)'}
              </span>
            </p>
          </div>
          <button
            onClick={() => useAppStore.getState().setActivePanel('layers')}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        {/* Analysis Type Selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {analysisOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = analysisType === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setAnalysisType(option.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500/50 ring-1 ring-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className={`text-${option.color}-400`} />
                  <span className="text-sm font-medium text-white">{option.label}</span>
                </div>
                <p className="text-[10px] text-slate-500">{option.description}</p>
                {isSelected && (
                  <div className="mt-2 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">Selected</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium text-white">Processing...</span>
              </div>
              <span className="text-xs text-slate-400">{Math.round(processingProgress)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center gap-4 text-[10px] text-slate-500">
              <span>Engine: {engineMode === 'online' ? 'GEE' : 'CUDA'}</span>
              <span>•</span>
              <span>ETA: {Math.max(1, Math.round((100 - processingProgress) / 10))}s</span>
              <span>•</span>
              <span>AOI: 156.8 km²</span>
            </div>
          </div>
        )}

        {/* Run Button */}
        {!isProcessing && !showResults && (
          <button
            onClick={handleRunAnalysis}
            disabled={!analysisType}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Play size={16} />
            <span>Run {analysisType ? analysisOptions.find(o => o.id === analysisType)?.label : 'Analysis'}</span>
          </button>
        )}

        {/* Results */}
        {showResults && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <h3 className="text-base font-semibold text-white">Results</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                Accuracy: 89%
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                <p className="text-[10px] text-slate-500">Total Area</p>
                <p className="text-lg font-bold text-white">156.8</p>
                <p className="text-[10px] text-slate-400">km²</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                <p className="text-[10px] text-slate-500">Carbon Stock</p>
                <p className="text-lg font-bold text-emerald-400">2,847</p>
                <p className="text-[10px] text-slate-400">tC</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                <p className="text-[10px] text-slate-500">Biomass</p>
                <p className="text-lg font-bold text-amber-400">5,210</p>
                <p className="text-[10px] text-slate-400">t/ha</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                <p className="text-[10px] text-slate-500">OA Score</p>
                <p className="text-lg font-bold text-violet-400">0.89</p>
                <p className="text-[10px] text-slate-400">Kappa: 0.86</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-4">
              {/* Pie Chart */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h4 className="text-xs font-semibold text-slate-300 mb-3">Class Distribution</h4>
                <ErrorBoundary>
                  <SafeChartContainer width="100%" height={200}>
                    {({ width, height }) => (
                      <PieChart width={width} height={height}>
                        <Pie
                          data={classDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          dataKey="value"
                          label={({ name, value }) => `${name} ${value}%`}
                        >
                          {classDistribution.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    )}
                  </SafeChartContainer>
                </ErrorBoundary>
              </div>

              {/* Bar Chart */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h4 className="text-xs font-semibold text-slate-300 mb-3">Carbon by Zone (tC/ha)</h4>
                <ErrorBoundary>
                  <SafeChartContainer width="100%" height={200}>
                    {({ width, height }) => (
                      <BarChart data={carbonData} width={width} height={height}>
                        <XAxis dataKey="zone" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip />
                        <Bar dataKey="forest" fill="#059669" name="Forest" />
                        <Bar dataKey="agriculture" fill="#84cc16" name="Agriculture" />
                        <Bar dataKey="urban" fill="#d97706" name="Urban" />
                      </BarChart>
                    )}
                  </SafeChartContainer>
                </ErrorBoundary>
              </div>
            </div>

            {/* Export Options */}
            <div className="flex items-center gap-3 pt-2">
              <button className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-xs font-medium rounded-lg transition-colors">
                📥 Export GeoTIFF
              </button>
              <button className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-xs font-medium rounded-lg transition-colors">
                📊 Export CSV Stats
              </button>
              <button className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-xs font-medium rounded-lg transition-colors">
                📋 Export Report
              </button>
            </div>
          </div>
        )}

        {/* Warning for no AOI */}
        {!analysisType && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertTriangle size={14} className="text-amber-400" />
            <p className="text-xs text-amber-400">Select an analysis type above to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}
