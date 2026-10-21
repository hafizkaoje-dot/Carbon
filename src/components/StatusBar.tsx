import { useAppStore } from '../store/appStore';
import { Activity, HardDrive, Cpu, Wifi, Clock } from 'lucide-react';

export function StatusBar() {
  const { engineMode, engineStatus, isProcessing, processingProgress, userMode } = useAppStore();

  return (
    <footer className="h-7 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-4 shrink-0">
      {/* Left: System Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Activity size={10} className="text-emerald-400" />
          <span className="text-[10px] text-slate-400">
            {engineMode === 'online' ? 'GEE API' : 'NVIDIA CUDA'}
          </span>
          <div className={`w-1.5 h-1.5 rounded-full ${
            engineStatus === 'connected' ? 'bg-emerald-400' :
            engineStatus === 'initializing' ? 'bg-yellow-400 animate-pulse' :
            'bg-red-400'
          }`} />
        </div>

        {isProcessing && (
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-400">{Math.round(processingProgress)}%</span>
          </div>
        )}
      </div>

      {/* Center: Info */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-slate-500">
          Mode: <span className={userMode === 'student' ? 'text-violet-400' : 'text-blue-400'}>{userMode}</span>
        </span>
        <span className="text-[10px] text-slate-600">|</span>
        <span className="text-[10px] text-slate-500">
          Engine: <span className={engineMode === 'online' ? 'text-emerald-400' : 'text-amber-400'}>{engineMode}</span>
        </span>
      </div>

      {/* Right: System Metrics */}
      <div className="flex items-center gap-3">
        {engineMode === 'offline' && (
          <>
            <div className="flex items-center gap-1">
              <Cpu size={10} className="text-amber-400" />
              <span className="text-[10px] text-slate-400">GPU: 23%</span>
            </div>
            <div className="flex items-center gap-1">
              <HardDrive size={10} className="text-amber-400" />
              <span className="text-[10px] text-slate-400">VRAM: 4.2/24GB</span>
            </div>
          </>
        )}
        {engineMode === 'online' && (
          <div className="flex items-center gap-1">
            <Wifi size={10} className="text-emerald-400" />
            <span className="text-[10px] text-slate-400">Latency: 45ms</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock size={10} className="text-slate-500" />
          <span className="text-[10px] text-slate-500">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </footer>
  );
}
