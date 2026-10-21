import { useAppStore } from './store/appStore';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { WizardPanel } from './components/WizardPanel';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ArchitecturePanel } from './components/ArchitecturePanel';
import { DataInputPanel } from './components/DataInputPanel';
import { GEEScriptPanel } from './components/GEEScriptPanel';
import { StatusBar } from './components/StatusBar';

export default function App() {
  const { userMode, wizardActive, sidebarOpen, activePanel } = useAppStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* Header with Engine Toggle & Mode Switch */}
      <Header />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <Sidebar />
        )}
        
        {/* Map + Panels */}
        <div className="flex-1 relative">
          {/* Map View */}
          <MapView />
          
          {/* Wizard Overlay for Student Mode */}
          {wizardActive && userMode === 'student' && (
            <WizardPanel />
          )}
          
          {/* Analysis Overlay */}
          {activePanel === 'analysis' && (
            <AnalysisPanel />
          )}
          
          {/* Architecture Documentation */}
          {activePanel === 'architecture' && (
            <ArchitecturePanel />
          )}
          
          {/* Data Input Panel */}
          {activePanel === 'data-input' && (
            <DataInputPanel />
          )}
          
          {/* GEE Script Runner */}
          {activePanel === 'gee-scripts' && (
            <GEEScriptPanel />
          )}
        </div>
      </div>
      
      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}
