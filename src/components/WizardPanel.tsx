import { useAppStore } from '../store/appStore';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Sparkles, X } from 'lucide-react';

export function WizardPanel() {
  const { wizardSteps, currentWizardStep, completeWizardStep, setWizardActive, userMode } = useAppStore();

  if (userMode !== 'student') return null;

  const currentStep = wizardSteps.find(s => s.id === currentWizardStep);

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw]">
      <div className="bg-slate-800/95 backdrop-blur-md border border-violet-500/30 rounded-2xl shadow-2xl shadow-violet-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50 bg-violet-500/5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-400" />
            <h3 className="text-sm font-semibold text-violet-300">Map Wizard</h3>
            <span className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
              Step {currentWizardStep}/{wizardSteps.length}
            </span>
          </div>
          <button
            onClick={() => setWizardActive(false)}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={14} className="text-slate-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-5 pt-3">
          <div className="flex items-center gap-1">
            {wizardSteps.map((step, idx) => (
              <div key={step.id} className="flex-1 flex items-center">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step.completed ? 'bg-emerald-500' :
                  step.id === currentWizardStep ? 'bg-violet-500' :
                  'bg-slate-700'
                }`} />
                {idx < wizardSteps.length - 1 && <div className="w-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-5 py-4">
          <h4 className="text-base font-semibold text-white mb-1">{currentStep?.title}</h4>
          <p className="text-xs text-slate-400 mb-4">{currentStep?.description}</p>

          {/* Step-specific content */}
          {currentWizardStep === 1 && (
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-slate-300 mb-2">
                📍 Click the <span className="text-emerald-400 font-medium">pin icon</span> on the map toolbar, 
                then click on the map to draw your Area of Interest (AOI).
              </p>
              <p className="text-[10px] text-slate-500">
                Tip: You need at least 5 points to close the polygon. The AOI defines where analysis will run.
              </p>
            </div>
          )}
          {currentWizardStep === 2 && (
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Start Date</label>
                  <input
                    type="date"
                    defaultValue="2024-01-01"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">End Date</label>
                  <input
                    type="date"
                    defaultValue="2024-12-31"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                💡 Shorter date ranges = faster processing. Use dry season dates for less cloud cover.
              </p>
            </div>
          )}
          {currentWizardStep === 3 && (
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-slate-300 mb-2">Select your classification scheme:</p>
              <div className="space-y-2">
                {['Default (5 classes: Forest, Agriculture, Water, Urban, Bare)', 'Detailed (10 classes)', 'Custom Schema'].map((scheme, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="classification"
                      defaultChecked={i === 0}
                      className="accent-violet-500"
                    />
                    <span className="text-xs text-slate-300">{scheme}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {currentWizardStep === 4 && (
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Spatial Resolution</label>
                  <select className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white">
                    <option>10m (Sentinel-2 native)</option>
                    <option>20m (Faster processing)</option>
                    <option>30m (Quick overview)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Cloud Cover Threshold</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="20"
                    className="w-full accent-violet-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">20% - Recommended for tropical regions</p>
                </div>
              </div>
            </div>
          )}
          {currentWizardStep === 5 && (
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 text-center">
              <div className="text-3xl mb-2">🚀</div>
              <p className="text-xs text-slate-300 mb-2">Ready to run analysis!</p>
              <p className="text-[10px] text-slate-500">
                The system will: 1) Fetch Sentinel-2 imagery → 2) Apply cloud mask → 
                3) Calculate spectral indices → 4) Run Random Forest classifier → 5) Calculate Carbon Stock
              </p>
            </div>
          )}
          {currentWizardStep === 6 && (
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-xs text-slate-300 mb-2">Analysis Complete!</p>
              <p className="text-[10px] text-slate-500">
                Your LCLU map and carbon stock estimates are ready. Explore the results on the map and in the charts.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/50">
          <button
            onClick={() => useAppStore.getState().setCurrentWizardStep(Math.max(1, currentWizardStep - 1))}
            disabled={currentWizardStep === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Previous</span>
          </button>

          {currentWizardStep < wizardSteps.length ? (
            <button
              onClick={() => {
                completeWizardStep(currentWizardStep);
              }}
              className="flex items-center gap-1 px-4 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => setWizardActive(false)}
              className="flex items-center gap-1 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <CheckCircle size={14} />
              <span>Finish</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
