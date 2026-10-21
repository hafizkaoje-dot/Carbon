import { useState, useRef, useEffect } from 'react';
import { useAppStore, GEEScript, ScriptOutput } from '../store/appStore';
import { Play, Save, Plus, Trash2, FileCode, Terminal, Copy, Download, X, Clock, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';

export function GEEScriptPanel() {
  const {
    geeScripts, activeScript, setActiveScript, updateScriptCode,
    scriptOutputs, addScriptOutput, clearScriptOutputs,
    isScriptRunning, setIsScriptRunning, saveScript, deleteScript,
    setActivePanel, engineMode,
  } = useAppStore();

  const [showTemplates, setShowTemplates] = useState(true);
  const [scriptName, setScriptName] = useState(activeScript?.name || 'Untitled Script');
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [scriptOutputs]);

  // Update name when active script changes
  useEffect(() => {
    if (activeScript) {
      setScriptName(activeScript.name);
    }
  }, [activeScript?.id]);

  const handleRun = () => {
    if (!activeScript) return;
    
    clearScriptOutputs();
    setIsScriptRunning(true);

    // Add initial output
    addScriptOutput({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `🚀 Executing script on ${engineMode === 'online' ? 'Google Earth Engine' : 'Local GPU'}...`,
    });

    // Simulate script execution with progressive output
    const outputLines = generateSimulatedOutput(activeScript);
    let lineIndex = 0;

    const interval = setInterval(() => {
      if (lineIndex >= outputLines.length) {
        clearInterval(interval);
        setIsScriptRunning(false);
        addScriptOutput({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'success',
          message: '✅ Script execution completed successfully.',
        });
        return;
      }

      addScriptOutput({
        id: Date.now().toString() + lineIndex,
        timestamp: new Date().toISOString(),
        type: outputLines[lineIndex].type,
        message: outputLines[lineIndex].message,
      });
      lineIndex++;
    }, 600);
  };

  const handleNewScript = () => {
    const newScript: GEEScript = {
      id: `script-${Date.now()}`,
      name: 'Untitled Script',
      code: `import ee\n\nee.Initialize(project='projects/geocarbon-lclu')\n\n# Your code here\nprint('Hello from GEE!')`,
      language: 'python',
      createdAt: new Date().toISOString(),
      isTemplate: false,
      category: 'custom',
    };
    setActiveScript(newScript);
    saveScript(newScript);
  };

  const handleSave = () => {
    if (!activeScript) return;
    const updated = { ...activeScript, name: scriptName };
    saveScript(updated);
    addScriptOutput({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `💾 Script "${scriptName}" saved.`,
    });
  };

  const handleCopyCode = () => {
    if (activeScript) {
      navigator.clipboard.writeText(activeScript.code);
      addScriptOutput({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'info',
        message: '📋 Code copied to clipboard.',
      });
    }
  };

  const handleDownload = () => {
    if (!activeScript) return;
    const blob = new Blob([activeScript.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeScript.name.replace(/\s+/g, '_')}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const userScripts = geeScripts.filter(s => !s.isTemplate);
  const templateScripts = geeScripts.filter(s => s.isTemplate);

  return (
    <div className="absolute inset-0 bg-slate-900/98 backdrop-blur-md z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <FileCode size={20} className="text-emerald-400" />
          <div>
            <h2 className="text-base font-bold text-white">GEE Script Runner</h2>
            <p className="text-[10px] text-slate-400">Execute Python scripts on Google Earth Engine</p>
          </div>
        </div>
        <button
          onClick={() => setActivePanel('layers')}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X size={16} className="text-slate-400" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Script List Sidebar */}
        <div className="w-64 border-r border-slate-700 flex flex-col shrink-0 overflow-hidden">
          {/* Actions */}
          <div className="p-3 border-b border-slate-700 flex gap-2">
            <button
              onClick={handleNewScript}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-medium rounded-lg transition-colors"
            >
              <Plus size={12} />
              <span>New Script</span>
            </button>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-medium rounded-lg transition-colors"
            >
              <Save size={12} />
              <span>Save</span>
            </button>
          </div>

          {/* Script List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* User Scripts */}
            {userScripts.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2 py-1">My Scripts</p>
                {userScripts.map((script) => (
                  <button
                    key={script.id}
                    onClick={() => setActiveScript(script)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                      activeScript?.id === script.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <FileCode size={12} className={activeScript?.id === script.id ? 'text-emerald-400' : 'text-slate-500'} />
                    <span className="text-[11px] truncate flex-1">{script.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteScript(script.id); }}
                      className="p-0.5 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={10} className="text-slate-500" />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {/* Templates */}
            <div>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-1 w-full text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2 py-1 hover:text-slate-400"
              >
                <ChevronDown size={10} className={`transition-transform ${showTemplates ? '' : '-rotate-90'}`} />
                Templates
              </button>
              {showTemplates && templateScripts.map((script) => (
                <button
                  key={script.id}
                  onClick={() => setActiveScript(script)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                    activeScript?.id === script.id
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    script.category === 'lclu' ? 'bg-emerald-400' :
                    script.category === 'carbon' ? 'bg-blue-400' :
                    script.category === 'change' ? 'bg-violet-400' :
                    'bg-slate-400'
                  }`} />
                  <span className="text-[11px] truncate flex-1">{script.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor + Console */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Script Name + Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700 bg-slate-800/50">
            <input
              type="text"
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              className="flex-1 bg-transparent text-sm font-medium text-white border-none outline-none"
              placeholder="Script name..."
            />
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyCode}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                title="Copy code"
              >
                <Copy size={13} className="text-slate-400" />
              </button>
              <button
                onClick={handleDownload}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                title="Download .py"
              >
                <Download size={13} className="text-slate-400" />
              </button>
              <div className="w-px h-5 bg-slate-700 mx-1" />
              <button
                onClick={handleRun}
                disabled={isScriptRunning || !activeScript}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {isScriptRunning ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play size={13} />
                )}
                <span>{isScriptRunning ? 'Running...' : 'Run'}</span>
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 relative overflow-hidden">
              <textarea
                value={activeScript?.code || ''}
                onChange={(e) => updateScriptCode(e.target.value)}
                spellCheck={false}
                className="absolute inset-0 w-full h-full bg-slate-950 text-emerald-300 font-mono text-xs p-4 resize-none outline-none leading-relaxed"
                style={{ tabSize: 4 }}
                placeholder="# Write your GEE Python script here..."
              />
            </div>

            {/* Console Output */}
            <div className="h-52 border-t border-slate-700 flex flex-col shrink-0">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-1.5">
                  <Terminal size={12} className="text-slate-400" />
                  <span className="text-[10px] font-semibold text-slate-400">Console Output</span>
                  {isScriptRunning && (
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  )}
                </div>
                <button
                  onClick={clearScriptOutputs}
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 bg-slate-950 font-mono text-[11px] space-y-1">
                {scriptOutputs.length === 0 ? (
                  <p className="text-slate-600 italic">Run a script to see output here...</p>
                ) : (
                  scriptOutputs.map((output) => (
                    <div key={output.id} className="flex items-start gap-2">
                      <span className="text-slate-600 text-[9px] shrink-0 mt-0.5">
                        {new Date(output.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={
                        output.type === 'error' ? 'text-red-400' :
                        output.type === 'stderr' ? 'text-amber-400' :
                        output.type === 'success' ? 'text-emerald-400' :
                        output.type === 'info' ? 'text-cyan-400' :
                        'text-slate-300'
                      }>
                        {output.message}
                      </span>
                    </div>
                  ))
                )}
                <div ref={consoleEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Simulated Output Generator
// ============================================
function generateSimulatedOutput(script: GEEScript): { type: ScriptOutput['type']; message: string }[] {
  const outputs: { type: ScriptOutput['type']; message: string }[] = [];

  if (script.category === 'lclu') {
    outputs.push(
      { type: 'info', message: '📡 Connecting to Google Earth Engine...' },
      { type: 'success', message: '✅ GEE authenticated (project: geocarbon-lclu)' },
      { type: 'info', message: '🛰️ Loading Sentinel-2 L2A collection...' },
      { type: 'stdout', message: 'Found 47 images in date range (2024-01-01 to 2024-12-31)' },
      { type: 'info', message: '☁️ Applying s2cloudless cloud masking...' },
      { type: 'stdout', message: 'After masking: 32 clear images remaining' },
      { type: 'info', message: '📊 Computing spectral indices (NDVI, NDWI, NDBI)...' },
      { type: 'stdout', message: 'Stacked 11 bands for classification' },
      { type: 'info', message: '🌲 Loading training data (500 points)...' },
      { type: 'stdout', message: 'Class distribution: Forest=150, Agri=120, Water=80, Urban=90, Bare=60' },
      { type: 'info', message: '🧠 Training Random Forest (200 trees)...' },
      { type: 'stdout', message: 'OOB Accuracy: 0.89 | Kappa: 0.86' },
      { type: 'info', message: '🗺️ Classifying image (scale=10m)...' },
      { type: 'stdout', message: 'Classification complete. Processing time: 12.4s' },
      { type: 'info', message: '📤 Exporting to Google Drive...' },
      { type: 'success', message: '✅ Task started: lclu_classification (ID: ABC123DEF)' },
    );
  } else if (script.category === 'carbon') {
    outputs.push(
      { type: 'info', message: '📡 Connecting to Google Earth Engine...' },
      { type: 'success', message: '✅ GEE authenticated' },
      { type: 'info', message: '🌳 Loading GEDI L4A Above-Ground Biomass...' },
      { type: 'stdout', message: 'Found 1,247 GEDI footprints in AOI' },
      { type: 'info', message: '📊 Creating mean AGB composite...' },
      { type: 'stdout', message: 'Mean AGB: 142.3 t/ha (forest areas)' },
      { type: 'info', message: '🔄 Smoothing GEDI surface (1km radius)...' },
      { type: 'info', message: '🌿 Applying IPCC carbon factor (tropical: 0.47)...' },
      { type: 'stdout', message: 'Carbon stock range: 0 - 70.9 tC/ha' },
      { type: 'info', message: '📐 Computing total carbon stock...' },
      { type: 'success', message: '🌍 Total Carbon Stock: 2,847.5 tC' },
      { type: 'stdout', message: '  Forest: 2,156.3 tC (75.7%)' },
      { type: 'stdout', message: '  Agriculture: 423.1 tC (14.9%)' },
      { type: 'stdout', message: '  Urban: 268.1 tC (9.4%)' },
      { type: 'info', message: '📤 Exporting carbon stock map...' },
      { type: 'success', message: '✅ Export started: carbon_stock_map' },
    );
  } else if (script.category === 'change') {
    outputs.push(
      { type: 'info', message: '📡 Connecting to Google Earth Engine...' },
      { type: 'success', message: '✅ GEE authenticated' },
      { type: 'info', message: '🛰️ Loading Sentinel-2 for Period 1 (2018)...' },
      { type: 'stdout', message: 'Period 1: 38 clear images' },
      { type: 'info', message: '🛰️ Loading Sentinel-2 for Period 2 (2024)...' },
      { type: 'stdout', message: 'Period 2: 32 clear images' },
      { type: 'info', message: '📊 Computing NDVI difference...' },
      { type: 'stdout', message: 'NDVI range: -0.45 to +0.52' },
      { type: 'info', message: '🔍 Classifying change...' },
      { type: 'stdout', message: 'Vegetation gain: 12.4 km² (7.9%)' },
      { type: 'stdout', message: 'Vegetation loss: 8.7 km² (5.5%)' },
      { type: 'stdout', message: 'Stable: 135.7 km² (86.6%)' },
      { type: 'success', message: '✅ Change detection export started' },
    );
  } else {
    outputs.push(
      { type: 'info', message: '📡 Connecting to Google Earth Engine...' },
      { type: 'success', message: '✅ GEE authenticated' },
      { type: 'stdout', message: 'Hello from GEE!' },
      { type: 'success', message: '✅ Script completed.' },
    );
  }

  return outputs;
}
