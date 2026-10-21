import { useAppStore, EngineMode, UserMode } from '../store/appStore';
import { Cloud, Cpu, GraduationCap, Briefcase, Wifi, WifiOff, Menu } from 'lucide-react';

export function Header() {
  const {
    engineMode, setEngineMode, engineStatus, isEngineSwitching,
    userMode, setUserMode, sidebarOpen, setSidebarOpen
  } = useAppStore();

  const handleEngineToggle = () => {
    const newMode: EngineMode = engineMode === 'online' ? 'offline' : 'online';
    setEngineMode(newMode);
    // Simulate engine switch
    setTimeout(() => {
      useAppStore.getState().setEngineStatus('connected');
    }, 1500);
  };

  const handleModeToggle = () => {
    const newMode: UserMode = userMode === 'student' ? 'professional' : 'student';
    setUserMode(newMode);
  };

  return (
    <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 shrink-0">
      {/* Left: Logo + Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold">🌍</span>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">GeoCarbon Dashboard</h1>
            <p className="text-[10px] text-slate-400 leading-tight">LCLU Mapping & Carbon Stock Analysis</p>
          </div>
        </div>
      </div>

      {/* Center: Engine Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-slate-900 rounded-full p-1 border border-slate-600">
          <button
            onClick={() => engineMode !== 'online' && handleEngineToggle()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              engineMode === 'online'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Cloud size={14} />
            <span>GEE Cloud</span>
          </button>
          <button
            onClick={() => engineMode !== 'offline' && handleEngineToggle()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              engineMode === 'offline'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Cpu size={14} />
            <span>Local GPU</span>
          </button>
        </div>

        {/* Engine Status Indicator */}
        <div className="flex items-center gap-1.5">
          {isEngineSwitching ? (
            <div className="flex items-center gap-1.5 text-yellow-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-xs">Switching...</span>
            </div>
          ) : engineStatus === 'connected' ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              {engineMode === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span className="text-xs">{engineMode === 'online' ? 'GEE Connected' : 'GPU Ready'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-red-400">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <span className="text-xs">Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Mode Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-900 rounded-full p-1 border border-slate-600">
          <button
            onClick={() => userMode !== 'student' && handleModeToggle()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              userMode === 'student'
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/50'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <GraduationCap size={14} />
            <span>Student</span>
          </button>
          <button
            onClick={() => userMode !== 'professional' && handleModeToggle()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              userMode === 'professional'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Briefcase size={14} />
            <span>Professional</span>
          </button>
        </div>
      </div>
    </header>
  );
}
