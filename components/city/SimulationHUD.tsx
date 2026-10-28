'use client';
import React from 'react';
import {
  Activity,
  Calendar,
  Clock3,
  Coins,
  FastForward,
  FolderArchive,
  Heart,
  MessageSquare,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Sun,
  Users,
  AlertTriangle,
  Brain,
  Zap,
} from 'lucide-react';

interface SimulationHUDProps {
  year?: number;
  day: number;
  totalDays?: number;
  hour: number;
  season?: string;
  phase?: string;
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'error';
  speed: number;
  aliveCount: number;
  totalCredits: number;
  completedActionsCount: number;
  conversationsCount: number;
  tradesCount: number;
  busy: boolean;
  onTrigger: (action: 'start' | 'pause' | 'resume' | 'stop' | 'step' | 'reset') => void;
  onSpeedChange: (speed: number) => void;
  onOpenSessions: () => void;
  onOpenCivic?: () => void;
  onOpenGodMode?: () => void;
  onOpenObservatory?: () => void;
  onToggleConsole: () => void;
  showConsole: boolean;
  treasury?: number;
  mayorName?: string;
  activeCrises?: string[];
  foodSupplyActive?: boolean;
  powerGridActive?: boolean;
}

export default function SimulationHUD({
  year = 1,
  day,
  totalDays = 1,
  hour,
  season = 'Spring',
  phase = 'day',
  status,
  speed,
  aliveCount,
  totalCredits,
  completedActionsCount,
  conversationsCount,
  tradesCount,
  busy,
  onTrigger,
  onSpeedChange,
  onOpenSessions,
  onOpenCivic,
  onOpenGodMode,
  onOpenObservatory,
  onToggleConsole,
  showConsole,
  treasury,
  mayorName,
  activeCrises = [],
  foodSupplyActive = true,
  powerGridActive = true,
}: SimulationHUDProps) {
  const isNight = hour >= 21 || hour < 6;
  const isDusk = (hour >= 18 && hour < 21) || (hour >= 6 && hour < 8);
  const TimeIcon = isNight ? Moon : Sun;

  const hasActiveCrisis = activeCrises.length > 0 || !foodSupplyActive || !powerGridActive;

  // Live continuous running HH:MM:SS clock
  const [clockTime, setClockTime] = React.useState({
    hour: hour ?? 0,
    minute: 0,
    second: 0,
  });

  // When base hour updates from server, anchor hour and reset sub-hour fraction
  React.useEffect(() => {
    setClockTime({
      hour: hour ?? 0,
      minute: 0,
      second: 0,
    });
  }, [hour]);

  // High-frequency smooth tick interval when running
  React.useEffect(() => {
    if (status !== 'running') return;

    let lastTimestamp = performance.now();
    // 1 simulation hour = 2000ms / speed
    const msPerHour = Math.max(15, 2000 / (speed || 1));

    const timer = setInterval(() => {
      const now = performance.now();
      const deltaMs = now - lastTimestamp;
      lastTimestamp = now;

      // Simulated seconds elapsed in this frame
      const simSecondsPassed = (deltaMs / msPerHour) * 3600;

      setClockTime((prev) => {
        let totalSimSeconds = prev.hour * 3600 + prev.minute * 60 + prev.second + simSecondsPassed;
        const totalSimSecondsInDay = 24 * 3600;
        totalSimSeconds = ((totalSimSeconds % totalSimSecondsInDay) + totalSimSecondsInDay) % totalSimSecondsInDay;

        const h = Math.floor(totalSimSeconds / 3600);
        const m = Math.floor((totalSimSeconds % 3600) / 60);
        const s = Math.floor(totalSimSeconds % 60);

        return { hour: h, minute: m, second: s };
      });
    }, 40);

    return () => clearInterval(timer);
  }, [status, speed]);

  return (
    <div className="space-y-3">
      {/* 1. Floating AI Model Provider Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#23354d] bg-gradient-to-r from-[#0c1624]/90 via-[#0a101b]/95 to-[#0c1624]/90 px-4 py-2.5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#76f2c0]/20 to-[#38bdf8]/20 text-[#76f2c0] border border-[#76f2c0]/30 shadow-inner">
            <Sparkles size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold tracking-wide text-white">NEXUS-01 MINIATURE AI CITY 2.0</span>
              <span className="rounded-full bg-[#76f2c0]/15 px-2 py-0.5 text-[10px] font-bold text-[#76f2c0] border border-[#76f2c0]/30">
                Persistent 20 Citizens
              </span>
              <span className="rounded-full bg-[#38bdf8]/15 px-2 py-0.5 text-[10px] font-bold text-[#38bdf8] border border-[#38bdf8]/30">
                Gemini 2.5 Flash
              </span>

              {hasActiveCrisis && (
                <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-black text-rose-300 border border-rose-500/40 animate-pulse">
                  <AlertTriangle size={11} className="text-rose-400" />
                  <span>
                    CRISIS ACTIVE: {activeCrises.join(', ') || (!foodSupplyActive ? 'FOOD SHORTAGE' : 'GRID BLACKOUT')}
                  </span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Autonomous society running continuously across years without artificial limits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* God Mode Button */}
          {onOpenGodMode && (
            <button
              onClick={onOpenGodMode}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-900/50 transition-colors shadow-sm"
              title="City Overseer God Mode Controls"
            >
              <Zap size={13} className="text-amber-400" />
              <span>⚡ God Mode</span>
            </button>
          )}

          {/* AI Observatory Button */}
          {onOpenObservatory && (
            <button
              onClick={onOpenObservatory}
              className="flex items-center gap-1.5 rounded-xl border border-sky-500/50 bg-sky-950/40 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-900/50 transition-colors shadow-sm"
              title="Inspect Gemini Citizen Reasoning & Decisions"
            >
              <Brain size={13} className="text-sky-400" />
              <span>🧠 AI Observatory</span>
            </button>
          )}

          {onOpenCivic && (
            <button
              onClick={onOpenCivic}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40 transition-colors shadow-sm"
              title="Inspect Financial Ledger, Elections, and City Departments"
            >
              <Coins size={13} className="text-emerald-400" />
              <span>Civic Ledger</span>
            </button>
          )}

          <button
            onClick={onToggleConsole}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
              showConsole
                ? 'border-[#76f2c0] bg-[#76f2c0]/15 text-[#76f2c0]'
                : 'border-[#26354a] bg-[#101726] text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>Gemini Console</span>
          </button>

          <button
            onClick={onOpenSessions}
            className="flex items-center gap-1.5 rounded-xl border border-[#26354a] bg-[#101726] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <FolderArchive size={13} className="text-[#8aa8ff]" />
            <span>Saved Runs</span>
          </button>
        </div>
      </div>

      {/* 2. Floating Simulation Metrics HUD */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
        {/* Multi-Year Calendar & Live Running HH:MM:SS Clock */}
        <div className="rounded-xl border border-[#1f2e44] bg-[#0c1322]/85 p-2.5 shadow-md backdrop-blur-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-[#76f2c0]" />
              Year {year} • Day {day}
            </span>
            <div className="flex items-center gap-1">
              {status === 'running' && (
                <span className="flex items-center gap-1 text-[9px] font-extrabold text-[#76f2c0] bg-[#76f2c0]/15 border border-[#76f2c0]/40 rounded-full px-1.5 py-0.2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#76f2c0] animate-ping" />
                  LIVE
                </span>
              )}
              <TimeIcon size={13} className="text-amber-400" />
            </div>
          </div>

          {/* Running Clock Display HH:MM:SS */}
          <div className="mt-1 flex items-baseline justify-between font-mono">
            <div className="flex items-center gap-0.5 text-lg font-black tracking-wider text-white">
              <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                {String(clockTime.hour).padStart(2, '0')}
              </span>
              <span className={`text-slate-500 font-bold ${status === 'running' ? 'animate-pulse text-[#76f2c0]' : ''}`}>
                :
              </span>
              <span className="text-[#76f2c0] drop-shadow-[0_0_8px_rgba(118,242,192,0.4)]">
                {String(clockTime.minute).padStart(2, '0')}
              </span>
              <span className={`text-slate-500 font-bold ${status === 'running' ? 'animate-pulse text-amber-400' : ''}`}>
                :
              </span>
              <span className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                {String(clockTime.second).padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-400 font-sans">{season}</span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 capitalize mt-0.5">
            <span>{phase} • Total Day {totalDays}</span>
            <span className="font-mono text-[9px] text-[#76f2c0] font-bold">
              {speed > 1 ? `⚡ ${speed}x Speed` : '1x Speed'}
            </span>
          </div>
        </div>

        {/* Status Pill */}
        <div className="rounded-xl border border-[#1f2e44] bg-[#0c1322]/85 p-2.5 shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span>Status</span>
            <Activity size={13} className="text-[#76f2c0]" />
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-bold text-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                status === 'running'
                  ? 'bg-[#76f2c0] animate-pulse'
                  : status === 'paused'
                  ? 'bg-amber-400'
                  : status === 'stopped'
                  ? 'bg-rose-400'
                  : status === 'completed'
                  ? 'bg-[#8aa8ff]'
                  : 'bg-slate-500'
              }`}
            />
            <span className="capitalize text-slate-200">{status}</span>
          </div>
          <div className="text-[10px] text-slate-500">Speed: {speed}x</div>
        </div>

        {/* Living Citizens */}
        <div className="rounded-xl border border-[#1f2e44] bg-[#0c1322]/85 p-2.5 shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span>Population</span>
            <Users size={13} className="text-[#76f2c0]" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-[#76f2c0]">
            {aliveCount} / 10
          </div>
          <div className="text-[10px] text-slate-500">Living citizens</div>
        </div>

        {/* Total City Credits */}
        <div className="rounded-xl border border-[#1f2e44] bg-[#0c1322]/85 p-2.5 shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span>Treasury</span>
            <Coins size={13} className="text-amber-400" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-amber-300">
            {new Intl.NumberFormat('en-US').format(totalCredits)} Cr
          </div>
          <div className="text-[10px] text-slate-500">Circulating pool</div>
        </div>

        {/* Completed Actions */}
        <div className="rounded-xl border border-[#1f2e44] bg-[#0c1322]/85 p-2.5 shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span>Actions</span>
            <span className="text-[11px]">⚡</span>
          </div>
          <div className="mt-1 font-mono text-base font-bold text-slate-200">
            {completedActionsCount}
          </div>
          <div className="text-[10px] text-slate-500">Confirmed moves</div>
        </div>

        {/* Conversations */}
        <div className="rounded-xl border border-[#1f2e44] bg-[#0c1322]/85 p-2.5 shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span>Social Chats</span>
            <MessageSquare size={13} className="text-teal-400" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-teal-300">
            {conversationsCount}
          </div>
          <div className="text-[10px] text-slate-500">Dialogues held</div>
        </div>

        {/* Successful Trades */}
        <div className="rounded-xl border border-[#1f2e44] bg-[#0c1322]/85 p-2.5 shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span>Trades / Aid</span>
            <span className="text-[11px]">🤝</span>
          </div>
          <div className="mt-1 font-mono text-base font-bold text-purple-300">
            {tradesCount}
          </div>
          <div className="text-[10px] text-slate-500">Transfers logged</div>
        </div>
      </div>

      {/* 3. Floating Simulation Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#23354d] bg-[#0c1322]/90 p-3 shadow-lg backdrop-blur-md">
        {/* Play / Pause / Resume / Stop / Step / Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {status === 'running' ? (
            <>
              <button
                disabled={busy}
                onClick={() => onTrigger('pause')}
                className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:bg-amber-300 transition-colors shadow-md shadow-amber-500/20"
              >
                <Pause size={14} fill="currentColor" />
                <span>Pause</span>
              </button>
              <button
                disabled={busy}
                onClick={() => onTrigger('stop')}
                className="flex items-center gap-1.5 rounded-xl bg-rose-500/90 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20"
                title="Explicit Stop (Halts background worker)"
              >
                <Square size={13} fill="currentColor" />
                <span>Stop</span>
              </button>
            </>
          ) : status === 'paused' ? (
            <>
              <button
                disabled={busy}
                onClick={() => onTrigger('resume')}
                className="flex items-center gap-1.5 rounded-xl bg-[#76f2c0] px-4 py-2 text-xs font-bold text-[#07120f] hover:bg-[#9af6d0] transition-colors shadow-md shadow-[#76f2c0]/20"
              >
                <Play size={14} fill="currentColor" />
                <span>Resume</span>
              </button>
              <button
                disabled={busy}
                onClick={() => onTrigger('stop')}
                className="flex items-center gap-1.5 rounded-xl bg-rose-500/80 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20"
                title="Explicit Stop"
              >
                <Square size={13} fill="currentColor" />
                <span>Stop</span>
              </button>
            </>
          ) : (
            <button
              disabled={busy}
              onClick={() => onTrigger('start')}
              className="flex items-center gap-1.5 rounded-xl bg-[#76f2c0] px-4 py-2 text-xs font-bold text-[#07120f] hover:bg-[#9af6d0] transition-colors shadow-md shadow-[#76f2c0]/20"
            >
              <Play size={14} fill="currentColor" />
              <span>{status === 'stopped' ? 'Restart Simulation' : 'Start Simulation'}</span>
            </button>
          )}

          <button
            disabled={busy || status === 'running'}
            onClick={() => onTrigger('step')}
            className="flex items-center gap-1.5 rounded-xl border border-[#2b3e58] bg-[#101726] px-3 py-2 text-xs font-medium text-slate-200 hover:bg-[#1a2538] disabled:opacity-40 transition-colors"
            title="Advance exactly 1 turn"
          >
            <FastForward size={13} className="text-[#8aa8ff]" />
            <span>Step Turn</span>
          </button>

          <button
            disabled={busy || status === 'running'}
            onClick={() => onTrigger('reset')}
            className="flex items-center gap-1.5 rounded-xl border border-[#2b3e58] bg-[#101726] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#1a2538] disabled:opacity-40 transition-colors"
            title="Reset city to initial state"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        {/* Speed Selector: 1x, 5x, 20x, 100x */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <FastForward size={13} className={speed > 1 ? 'text-[#76f2c0] animate-pulse' : 'text-slate-500'} />
            <span>Speed:</span>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-[#28394e] bg-[#070b12] p-1 shadow-inner">
            {[1, 5, 20, 100].map((s) => {
              const isActive = speed === s;
              return (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`relative flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#76f2c0] via-[#38bdf8] to-[#76f2c0] text-[#05110d] shadow-md shadow-[#76f2c0]/40 ring-2 ring-[#76f2c0] scale-105'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={`Run simulation at ${s}x speed`}
                >
                  {isActive && s > 1 && <span className="text-[10px]">⚡</span>}
                  <span>{s}x</span>
                </button>
              );
            })}
          </div>
          {speed > 1 && (
            <span className="rounded-full bg-[#76f2c0]/15 border border-[#76f2c0]/40 px-2 py-0.5 text-[10px] font-extrabold text-[#76f2c0] animate-pulse">
              {speed === 100 ? '🚀 Warp 100x' : speed === 20 ? '⚡ Turbo 20x' : '⚡ Fast 5x'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
