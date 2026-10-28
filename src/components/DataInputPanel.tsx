import { useState, useRef } from 'react';
import { useAppStore, UploadedFile } from '../store/appStore';
import { Upload, FileText, MapPin, Database, Trash2, CheckCircle, AlertCircle, X, FolderUp, Globe, Layers, Calendar, Settings2 } from 'lucide-react';

type InputTab = 'upload' | 'aoi' | 'training' | 'parameters';

export function DataInputPanel() {
  const { setActivePanel } = useAppStore();
  const [activeTab, setActiveTab] = useState<InputTab>('upload');

  return (
    <div className="absolute inset-0 bg-slate-900/98 backdrop-blur-md z-20 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Upload size={20} className="text-cyan-400" />
              Data Input
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Upload rasters, define training data, and configure analysis parameters
            </p>
          </div>
          <button
            onClick={() => setActivePanel('layers')}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-slate-800 rounded-xl p-1 border border-slate-700">
          {[
            { id: 'upload' as InputTab, label: 'Upload Files', icon: FolderUp },
            { id: 'aoi' as InputTab, label: 'Area of Interest', icon: MapPin },
            { id: 'training' as InputTab, label: 'Training Data', icon: Database },
            { id: 'parameters' as InputTab, label: 'Parameters', icon: Settings2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-700 text-white border border-slate-600'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'upload' && <UploadTab />}
        {activeTab === 'aoi' && <AOITab />}
        {activeTab === 'training' && <TrainingTab />}
        {activeTab === 'parameters' && <ParametersTab />}
      </div>
    </div>
  );
}

// ============================================
// Upload Tab
// ============================================
function UploadTab() {
  const { uploadedFiles, addUploadedFile, removeUploadedFile } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(processFile);
  };

  const processFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let fileType: UploadedFile['type'] = 'raster';
    
    if (['tif', 'tiff', 'geotiff'].includes(ext)) fileType = 'raster';
    else if (['geojson', 'json', 'shp', 'kml'].includes(ext)) fileType = 'vector';
    else if (['csv'].includes(ext)) fileType = 'training';
    
    const newFile: UploadedFile = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: fileType,
      size: file.size,
      format: ext.toUpperCase(),
      uploadedAt: new Date().toISOString(),
      status: 'ready',
      metadata: {
        bands: fileType === 'raster' ? 6 : undefined,
        width: fileType === 'raster' ? 5000 : undefined,
        height: fileType === 'raster' ? 5000 : undefined,
        crs: 'EPSG:4326',
        featureCount: fileType === 'vector' ? 150 : undefined,
      },
    };
    
    addUploadedFile(newFile);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10'
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".tif,.tiff,.geojson,.json,.shp,.csv,.kml"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload size={40} className={`mx-auto mb-3 ${isDragging ? 'text-cyan-400' : 'text-slate-500'}`} />
        <h3 className="text-sm font-semibold text-white mb-1">
          {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
        </h3>
        <p className="text-xs text-slate-400">
          Supported: GeoTIFF (.tif), GeoJSON (.geojson), Shapefile (.shp), CSV (.csv)
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="text-[10px] text-slate-500 bg-slate-700/50 px-2 py-1 rounded">Raster: GeoTIFF, COG</span>
          <span className="text-[10px] text-slate-500 bg-slate-700/50 px-2 py-1 rounded">Vector: GeoJSON, Shapefile</span>
          <span className="text-[10px] text-slate-500 bg-slate-700/50 px-2 py-1 rounded">Training: CSV, GeoJSON</span>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText size={14} className="text-emerald-400" />
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  file.type === 'raster' ? 'bg-emerald-500/20' :
                  file.type === 'vector' ? 'bg-blue-500/20' :
                  'bg-amber-500/20'
                }`}>
                  {file.type === 'raster' ? <Layers size={16} className="text-emerald-400" /> :
                   file.type === 'vector' ? <MapPin size={16} className="text-blue-400" /> :
                   <Database size={16} className="text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">{formatSize(file.size)}</span>
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500">{file.format}</span>
                    {file.metadata?.bands && (
                      <>
                        <span className="text-[10px] text-slate-600">•</span>
                        <span className="text-[10px] text-slate-500">{file.metadata.bands} bands</span>
                      </>
                    )}
                    {file.metadata?.crs && (
                      <>
                        <span className="text-[10px] text-slate-600">•</span>
                        <span className="text-[10px] text-slate-500">{file.metadata.crs}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle size={12} className="text-emerald-400" />
                  <button
                    onClick={() => removeUploadedFile(file.id)}
                    className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} className="text-slate-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Info */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
        <h4 className="text-xs font-semibold text-slate-300 mb-2">💡 Data Requirements</h4>
        <ul className="text-[10px] text-slate-400 space-y-1.5">
          <li>• <strong>Raster files</strong> must be georeferenced GeoTIFFs (with CRS metadata)</li>
          <li>• <strong>Training data</strong> CSV should have columns: lat, lng, class (1-5)</li>
          <li>• <strong>Vector files</strong> must be in WGS84 (EPSG:4326) projection</li>
          <li>• Maximum file size: 2GB per file (larger files use chunked upload)</li>
          <li>• Files are stored locally for offline processing or uploaded to GEE for cloud processing</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================
// AOI Tab
// ============================================
function AOITab() {
  const { aoi, setAOI, mapCenter } = useAppStore();
  const [aoiMethod, setAoiMethod] = useState<'draw' | 'coordinates' | 'upload' | 'gee'>('draw');

  return (
    <div className="space-y-6">
      {/* Method Selection */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'draw' as const, label: 'Draw on Map', icon: '🖊️', desc: 'Interactive polygon drawing' },
          { id: 'coordinates' as const, label: 'Enter Coordinates', icon: '📍', desc: 'Manual lat/lng bounds' },
          { id: 'upload' as const, label: 'Upload GeoJSON', icon: '📁', desc: 'Import from file' },
          { id: 'gee' as const, label: 'GEE Asset', icon: '☁️', desc: 'Use GEE geometry asset' },
        ].map((method) => (
          <button
            key={method.id}
            onClick={() => setAoiMethod(method.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              aoiMethod === method.id
                ? 'bg-slate-800 border-cyan-500/50 ring-1 ring-cyan-500/30'
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
            }`}
          >
            <span className="text-lg">{method.icon}</span>
            <p className="text-xs font-medium text-white mt-1">{method.label}</p>
            <p className="text-[10px] text-slate-500">{method.desc}</p>
          </button>
        ))}
      </div>

      {/* Method-specific input */}
      {aoiMethod === 'coordinates' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-white">Bounding Box Coordinates</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">West (Longitude)</label>
              <input type="number" step="0.001" defaultValue="98.2" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">South (Latitude)</label>
              <input type="number" step="0.001" defaultValue="7.8" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">East (Longitude)</label>
              <input type="number" step="0.001" defaultValue="98.5" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">North (Latitude)</label>
              <input type="number" step="0.001" defaultValue="8.1" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white" />
            </div>
          </div>
          <button
            onClick={() => {
              setAOI({
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [[[98.2, 7.8], [98.5, 7.8], [98.5, 8.1], [98.2, 8.1], [98.2, 7.8]]],
                },
                properties: { name: 'Manual BBox', area_km2: 962.5 },
              });
            }}
            className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Set AOI
          </button>
        </div>
      )}

      {aoiMethod === 'gee' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-white">GEE Asset ID</h4>
          <input
            type="text"
            placeholder="users/username/aoi_geometry"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white font-mono"
          />
          <p className="text-[10px] text-slate-500">Enter the full Earth Engine asset path for your AOI geometry.</p>
          <button className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors">
            Load from GEE
          </button>
        </div>
      )}

      {aoiMethod === 'draw' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <p className="text-xs text-slate-300 mb-2">
            🖊️ Use the <span className="text-cyan-400 font-medium">pin tool</span> on the map to draw your AOI polygon.
          </p>
          <p className="text-[10px] text-slate-500">Click at least 5 points to close the polygon. You can also use the rectangle tool for quick bounding boxes.</p>
        </div>
      )}

      {aoiMethod === 'upload' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <label className="block">
            <span className="text-xs font-semibold text-white block mb-2">Upload GeoJSON File</span>
            <input
              type="file"
              accept=".geojson,.json"
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30 file:cursor-pointer"
            />
          </label>
        </div>
      )}

      {/* Current AOI Display */}
      {aoi && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-emerald-400" />
            <h4 className="text-xs font-semibold text-emerald-400">AOI Set Successfully</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div>
              <span className="text-slate-500">Name:</span>
              <span className="text-white ml-1">{aoi.properties.name}</span>
            </div>
            <div>
              <span className="text-slate-500">Area:</span>
              <span className="text-white ml-1">{aoi.properties.area_km2} km²</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Center:</span>
              <span className="text-white ml-1 font-mono">{mapCenter[0].toFixed(4)}°N, {mapCenter[1].toFixed(4)}°E</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Training Data Tab
// ============================================
function TrainingTab() {
  const { geeAssetId, setGeeAssetId, uploadedFiles } = useAppStore();
  const trainingFiles = uploadedFiles.filter(f => f.type === 'training');

  return (
    <div className="space-y-6">
      {/* Source Selection */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
        <h4 className="text-xs font-semibold text-white">Training Data Source</h4>
        
        {/* Option 1: GEE Asset */}
        <div className="space-y-2">
          <label className="text-[10px] text-slate-500 flex items-center gap-1.5">
            <Globe size={10} className="text-emerald-400" />
            GEE FeatureCollection Asset
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={geeAssetId}
              onChange={(e) => setGeeAssetId(e.target.value)}
              placeholder="users/username/training_points"
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white font-mono"
            />
            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors">
              Load
            </button>
          </div>
        </div>

        {/* Option 2: Upload CSV */}
        <div className="space-y-2">
          <label className="text-[10px] text-slate-500 flex items-center gap-1.5">
            <Upload size={10} className="text-cyan-400" />
            Upload CSV Training Data
          </label>
          <input
            type="file"
            accept=".csv,.geojson"
            className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30 file:cursor-pointer"
          />
          <p className="text-[10px] text-slate-500">CSV format: lat, lng, class (1=Forest, 2=Agriculture, 3=Water, 4=Urban, 5=Bare)</p>
        </div>

        {/* Option 3: Auto-generate from WorldCover */}
        <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-violet-300">Auto-generate from ESA WorldCover</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Creates 500 stratified random samples</p>
            </div>
            <button className="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-[10px] font-medium rounded-lg transition-colors">
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Training Files */}
      {trainingFiles.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-white mb-2">Loaded Training Data</h4>
          {trainingFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-amber-500/30">
              <Database size={16} className="text-amber-400" />
              <div className="flex-1">
                <p className="text-xs font-medium text-white">{file.name}</p>
                <p className="text-[10px] text-slate-500">
                  {file.metadata?.featureCount || '?'} features • {file.format}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Class Distribution Preview */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <h4 className="text-xs font-semibold text-white mb-3">Class Distribution (Preview)</h4>
        <div className="space-y-2">
          {[
            { name: 'Forest', count: 120, color: 'bg-emerald-500' },
            { name: 'Agriculture', count: 95, color: 'bg-lime-500' },
            { name: 'Water', count: 45, color: 'bg-blue-500' },
            { name: 'Urban', count: 65, color: 'bg-amber-500' },
            { name: 'Bare Soil', count: 30, color: 'bg-slate-500' },
          ].map((cls) => (
            <div key={cls.name} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-sm ${cls.color}`} />
              <span className="text-[10px] text-slate-400 w-20">{cls.name}</span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${cls.color} rounded-full`} style={{ width: `${(cls.count / 150) * 100}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 w-8 text-right">{cls.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Parameters Tab
// ============================================
function ParametersTab() {
  const { analysisParams, setAnalysisParams } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Temporal Parameters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
        <h4 className="text-xs font-semibold text-white flex items-center gap-2">
          <Calendar size={14} className="text-cyan-400" />
          Temporal Settings
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Start Date</label>
            <input
              type="date"
              value={analysisParams.startDate}
              onChange={(e) => setAnalysisParams({ startDate: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">End Date</label>
            <input
              type="date"
              value={analysisParams.endDate}
              onChange={(e) => setAnalysisParams({ endDate: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* Spatial Parameters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
        <h4 className="text-xs font-semibold text-white flex items-center gap-2">
          <Settings2 size={14} className="text-amber-400" />
          Spatial & Processing Settings
        </h4>
        
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Spatial Resolution (meters)</label>
          <select
            value={analysisParams.scale}
            onChange={(e) => setAnalysisParams({ scale: Number(e.target.value) })}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white"
          >
            <option value={10}>10m (Sentinel-2 native)</option>
            <option value={20}>20m (Faster processing)</option>
            <option value={30}>30m (Quick overview)</option>
            <option value={100}>100m (Regional scale)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 block mb-2">
            Cloud Cover Threshold: {analysisParams.cloudThreshold}%
          </label>
          <input
            type="range"
            min="0"
            max="80"
            value={analysisParams.cloudThreshold}
            onChange={(e) => setAnalysisParams({ cloudThreshold: Number(e.target.value) })}
            className="w-full accent-cyan-500"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            {analysisParams.cloudThreshold <= 20 ? '✅ Low - best for clear imagery' :
             analysisParams.cloudThreshold <= 40 ? '⚡ Medium - recommended for tropics' :
             '⚠️ High - may include cloudy pixels'}
          </p>
        </div>
      </div>

      {/* Classifier Settings */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
        <h4 className="text-xs font-semibold text-white flex items-center gap-2">
          🧠 Classifier Settings
        </h4>
        
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Algorithm</label>
          <select
            value={analysisParams.classifier}
            onChange={(e) => setAnalysisParams({ classifier: e.target.value as any })}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white"
          >
            <option value="random_forest">Random Forest (200 trees)</option>
            <option value="svm">Support Vector Machine</option>
            <option value="gradient_boosting">Gradient Boosting (XGBoost)</option>
            <option value="deep_learning">Deep Learning (U-Net, GPU only)</option>
          </select>
        </div>

        {analysisParams.classifier === 'random_forest' && (
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Number of Trees</label>
            <input
              type="number"
              value={analysisParams.numberOfTrees}
              onChange={(e) => setAnalysisParams({ numberOfTrees: Number(e.target.value) })}
              min="50"
              max="1000"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
        )}
      </div>

      {/* Biome Selection */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
        <h4 className="text-xs font-semibold text-white">🌿 Biome (for Carbon Calculation)</h4>
        <div className="grid grid-cols-2 gap-2">
          {(['tropical', 'subtropical', 'temperate', 'boreal'] as const).map((biome) => (
            <button
              key={biome}
              onClick={() => setAnalysisParams({ biome })}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                analysisParams.biome === biome
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {biome}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-500">
          Determines the IPCC biomass-to-carbon conversion factor (0.47-0.50)
        </p>
      </div>
    </div>
  );
}
