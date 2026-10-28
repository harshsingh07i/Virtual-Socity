'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  Check,
  Copy,
  FolderArchive,
  Plus,
  Send,
  Sparkles,
  Terminal,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Agent, Event, SocietyState, SessionSummary } from '@/lib/society';
import CityScene from '@/components/city/CityScene';
import SimulationHUD from '@/components/city/SimulationHUD';
import AgentInspector from '@/components/city/AgentInspector';
import CivicDashboardModal from '@/components/city/CivicDashboardModal';
import GodModeModal from '@/components/city/GodModeModal';
import AIObservatoryModal from '@/components/city/AIObservatoryModal';

const initial: SocietyState = {
  sessionId: 'default',
  sessionTitle: 'Miniature AI City',
  status: 'idle',
  hour: 0,
  day: 1,
  totalDays: 1,
  year: 1,
  season: 'Spring',
  phase: 'day',
  agents: [],
  events: [],
  rounds: 0,
  speed: 1,
};

export default function Home() {
  const [data, setData] = useState<SocietyState>(initial);
  const [busy, setBusy] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [speed, setSimulationSpeed] = useState(1);
  const [showConsole, setShowConsole] = useState(false);
  const [showCivicModal, setShowCivicModal] = useState(false);
  const [showGodModeModal, setShowGodModeModal] = useState(false);
  const [showObservatoryModal, setShowObservatoryModal] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'timeline' | 'census' | 'none'>('none');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'work' | 'trade' | 'social' | 'eat'>('all');

  // Sessions Management
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);

  // Gemini Console Playground State
  const [promptInput, setPromptInput] = useState('Explain how AI works in a few words');
  const [promptModel, setPromptModel] = useState('gemini-2.5-flash');
  const [promptResponse, setPromptResponse] = useState<string | null>(null);
  const [promptBusy, setPromptBusy] = useState(false);
  const [promptLatency, setPromptLatency] = useState<number | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

async function safeJsonFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) {
      throw new Error(`Server error (${res.status} ${res.statusText || 'failed'})`);
    }
    throw new Error('Server returned invalid data format');
  }
  if (!res.ok) {
    throw new Error(json?.error || `Request failed with status ${res.status}`);
  }
  return json;
}

  // Poll backend for real-time simulation updates
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/simulation', { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          const json: SocietyState = JSON.parse(text);
          setData(json);
          if (typeof json.speed === 'number') {
            setSimulationSpeed(json.speed);
          }
        }
      }
    } catch {}
  }, []);

  const fetchSessionsList = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions', { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          const j = JSON.parse(text);
          setSessions(j.sessions || []);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    void refresh();
    void fetchSessionsList();
    // Dynamically scale client polling interval according to simulation speed
    const pollInterval =
      data.status === 'running'
        ? Math.max(60, Math.round(800 / Math.max(1, speed)))
        : 2500;
    const intervalId = setInterval(() => void refresh(), pollInterval);
    return () => clearInterval(intervalId);
  }, [refresh, fetchSessionsList, data.status, speed]);

  // Selected agent details
  const selectedAgent = useMemo(
    () => data.agents.find((a) => a.id === selectedAgentId) || null,
    [data.agents, selectedAgentId]
  );

  // Derived real metrics
  const aliveCount = data.agents.filter((a) => a.alive).length;
  const totalCredits = data.agents.reduce((s, a) => s + a.credits, 0);

  const completedActionsCount = useMemo(() => {
    return data.events.filter((e) =>
      ['work', 'eat', 'rest', 'trade', 'help', 'socialize'].includes(e.kind)
    ).length;
  }, [data.events]);

  const conversationsCount = useMemo(() => {
    return data.events.filter((e) => e.kind === 'socialize').length;
  }, [data.events]);

  const tradesCount = useMemo(() => {
    return data.events.filter((e) => e.kind === 'trade' || e.kind === 'help').length;
  }, [data.events]);

  // Handle simulation triggers: start, pause, resume, stop, step, reset
  async function handleTrigger(action: 'start' | 'pause' | 'resume' | 'stop' | 'step' | 'reset') {
    setBusy(true);
    setMessage('');
    try {
      const j = await safeJsonFetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setData(j);
      if (j.message) setMessage(j.message);
      if (action === 'reset') setSelectedAgentId(null);
      void fetchSessionsList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Error executing command');
    } finally {
      setBusy(false);
      void refresh();
    }
  }

  // Handle simulation speed: 1x, 5x, 20x, 100x
  async function handleSpeedChange(newSpeed: number) {
    setSimulationSpeed(newSpeed);
    setData((prev) => ({ ...prev, speed: newSpeed }));
    try {
      const j = await safeJsonFetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'speed', speed: newSpeed }),
      });
      setData(j);
    } catch {}
  }

  // Sessions Management
  async function handleLoadSession(id: string) {
    setBusy(true);
    try {
      const j = await safeJsonFetch(`/api/sessions/${id}/load`, { method: 'POST' });
      setData(j);
      setMessage(`Loaded session: ${j.sessionTitle}`);
      setShowSessionsModal(false);
      setSelectedAgentId(null);
      void fetchSessionsList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to switch session');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateNewSession() {
    setCreatingSession(true);
    try {
      const j = await safeJsonFetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSessionTitle.trim() || undefined }),
      });
      setData(j);
      setMessage(`Created and loaded session: ${j.sessionTitle}`);
      setNewSessionTitle('');
      setShowSessionsModal(false);
      setSelectedAgentId(null);
      void fetchSessionsList();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to create session');
    } finally {
      setCreatingSession(false);
    }
  }

  async function handleDeleteSession(id: string) {
    if (!confirm('Are you sure you want to delete this session from SQLite?')) return;
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete session');
      setMessage('Session deleted successfully.');
      void fetchSessionsList();
      void refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not delete session');
    }
  }

  // Gemini Console Runner
  async function runGeminiPrompt(overridePrompt?: string) {
    const query = overridePrompt ?? promptInput;
    if (!query.trim()) return;
    setPromptBusy(true);
    setPromptError(null);
    const start = performance.now();
    try {
      const json = await safeJsonFetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, model: promptModel }),
      });
      setPromptLatency(Math.round(performance.now() - start));
      setPromptResponse(json.text);
    } catch (err) {
      setPromptError(err instanceof Error ? err.message : 'Error executing request');
    } finally {
      setPromptBusy(false);
    }
  }

  function copyCurlCommand() {
    const curl = `curl http://localhost:3000/api/generate \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "${promptInput}"}'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  }

  // Filtered timeline
  const filteredEvents = useMemo(() => {
    if (timelineFilter === 'all') return data.events;
    return data.events.filter((e) => {
      if (timelineFilter === 'work') return e.kind === 'work';
      if (timelineFilter === 'trade') return e.kind === 'trade' || e.kind === 'help';
      if (timelineFilter === 'social') return e.kind === 'socialize';
      if (timelineFilter === 'eat') return e.kind === 'eat';
      return true;
    });
  }, [data.events, timelineFilter]);

  return (
    <main className="min-h-screen bg-[#070a12] p-3 sm:p-5 md:p-7 text-[#edf3fc] grid-bg select-none">
      <div className="mx-auto max-w-[1550px] space-y-4">
        {/* 1. Floating Simulation HUD & AI Model Banner */}
        <SimulationHUD
          year={data.year || 1}
          day={data.day || 1}
          totalDays={data.totalDays || data.day || 1}
          hour={data.hour || 0}
          season={data.season || 'Spring'}
          phase={data.phase || 'day'}
          status={data.status}
          speed={speed}
          aliveCount={aliveCount}
          totalCredits={totalCredits}
          completedActionsCount={completedActionsCount}
          conversationsCount={conversationsCount}
          tradesCount={tradesCount}
          busy={busy}
          onTrigger={handleTrigger}
          onSpeedChange={handleSpeedChange}
          onOpenSessions={() => {
            void fetchSessionsList();
            setShowSessionsModal(true);
          }}
          onOpenCivic={() => setShowCivicModal(true)}
          onOpenGodMode={() => setShowGodModeModal(true)}
          onOpenObservatory={() => setShowObservatoryModal(true)}
          onToggleConsole={() => setShowConsole(!showConsole)}
          showConsole={showConsole}
          treasury={data.treasury}
          mayorName={data.mayorName}
          activeCrises={data.activeCrises}
          foodSupplyActive={data.foodSupplyActive}
          powerGridActive={data.powerGridActive}
        />

        {/* Status Message Toast */}
        {message && (
          <div className="flex items-center justify-between rounded-xl border border-amber-800/60 bg-amber-950/40 px-4 py-2 text-xs text-amber-200 shadow-md">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-amber-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* 2. Standalone Gemini Console Drawer (Collapsible) */}
        {showConsole && (
          <section className="panel border-[#2c3d59] bg-gradient-to-br from-[#121c2d] to-[#0a1019] p-4 md:p-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#222c3d] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#76f2c0]" />
                <h3 className="text-sm font-bold text-white">Gemini Flash Query Console</h3>
                <span className="rounded bg-[#76f2c0]/15 px-2 py-0.5 text-[10px] font-bold text-[#76f2c0]">
                  Localhost API
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Select Gemini Model"
                  value={promptModel}
                  onChange={(e) => setPromptModel(e.target.value)}
                  className="rounded-lg border border-[#2b3a50] bg-[#101622] px-2.5 py-1 text-xs text-slate-200 outline-none"
                >
                  <option value="gemini-2.5-flash">Model: gemini-2.5-flash</option>
                  <option value="gemini-flash-latest">Model: gemini-flash-latest</option>
                  <option value="gemini-2.5-pro">Model: gemini-2.5-pro</option>
                </select>
                <button
                  onClick={copyCurlCommand}
                  className="flex items-center gap-1 rounded-lg border border-[#2b3a50] bg-[#101622] px-2.5 py-1 text-xs text-slate-300 hover:bg-[#192334]"
                >
                  {copiedCurl ? <Check size={13} className="text-[#76f2c0]" /> : <Copy size={13} />}
                  <span>{copiedCurl ? 'Copied' : 'cURL'}</span>
                </button>
                <button onClick={() => setShowConsole(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Enter a prompt to query Gemini directly..."
                  className="w-full rounded-xl border border-[#27384f] bg-[#0c121c] p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#76f2c0] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={promptBusy || !promptInput.trim()}
                  onClick={() => runGeminiPrompt()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#76f2c0] px-4 py-2 text-xs font-bold text-[#07120f] hover:bg-[#9af6d0] disabled:opacity-40 transition-all shadow-md shadow-[#76f2c0]/10"
                >
                  <Send size={13} />
                  <span>{promptBusy ? 'Generating with Gemini...' : 'Run Query'}</span>
                </button>
              </div>

              <div className="flex flex-col rounded-xl border border-[#27384f] bg-[#0b1019] p-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#1f2b3e] pb-1.5 font-bold text-slate-300">
                  <span className="flex items-center gap-1"><Terminal size={13} className="text-[#76f2c0]" /> Output</span>
                  {promptLatency !== null && <span className="font-mono text-[10px] text-[#76f2c0]">⚡ {promptLatency}ms</span>}
                </div>
                <div className="mt-2 flex-1 overflow-y-auto max-h-[85px] text-slate-300">
                  {promptBusy ? (
                    <div className="text-slate-500 italic">Querying Gemini model...</div>
                  ) : promptError ? (
                    <div className="text-red-400">{promptError}</div>
                  ) : promptResponse ? (
                    <div>{promptResponse}</div>
                  ) : (
                    <div className="text-slate-500">Run query to inspect model output.</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. Main City Interactive Arena & Floating Inspector */}
        <div className="relative grid gap-5 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          {/* Miniature AI City Scene */}
          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-[#213147] bg-[#070b14] p-2 shadow-2xl">
            <CityScene
              agents={data.agents}
              events={data.events}
              selectedAgentId={selectedAgentId}
              onSelectAgent={(id) => setSelectedAgentId(id)}
              speed={speed}
              hour={data.hour}
              isElectionActive={data.day === 360}
              isEmergencyActive={Boolean(data.activeEmergency)}
            />

            {/* Subtle City Controls Footnote */}
            <div className="mt-2 flex w-full flex-wrap items-center justify-between px-3 py-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#76f2c0]" /> 10 Houses connected to central circular plaza
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveBottomTab(activeBottomTab === 'timeline' ? 'none' : 'timeline')}
                  className={`rounded-md px-2 py-0.5 font-semibold transition-colors ${
                    activeBottomTab === 'timeline' ? 'bg-[#76f2c0] text-black' : 'hover:text-slate-300'
                  }`}
                >
                  Timeline ({data.events.length})
                </button>
                <span>·</span>
                <button
                  onClick={() => setActiveBottomTab(activeBottomTab === 'census' ? 'none' : 'census')}
                  className={`rounded-md px-2 py-0.5 font-semibold transition-colors ${
                    activeBottomTab === 'census' ? 'bg-[#76f2c0] text-black' : 'hover:text-slate-300'
                  }`}
                >
                  Census (10)
                </button>
              </div>
            </div>
          </div>

          {/* Right Inspector Drawer / Agent Card */}
          <div className="flex flex-col">
            {selectedAgent ? (
              <AgentInspector
                agent={selectedAgent}
                allAgents={data.agents}
                events={data.events}
                onClose={() => setSelectedAgentId(null)}
              />
            ) : (
              <div className="panel flex h-full flex-col items-center justify-center border-[#23354d] p-8 text-center text-xs text-slate-500">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111928] text-slate-400 mb-3 border border-[#1f2d42]">
                  <Users size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-300">No Citizen Selected</h4>
                <p className="mt-1 max-w-[220px] text-slate-500">
                  Click any tiny citizen or house on the island to open their live thoughts, needs, and memory stream.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 4. Optional Expandable Bottom Ledger / Census */}
        {activeBottomTab === 'timeline' && (
          <section className="panel border-[#25364d] p-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#213147] pb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#76f2c0]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">City Simulation Events</h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {(['all', 'work', 'trade', 'social', 'eat'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimelineFilter(filter)}
                    className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold capitalize transition-colors ${
                      timelineFilter === filter
                        ? 'bg-[#76f2c0] text-black'
                        : 'bg-[#101726] text-slate-400 hover:text-white border border-[#213147]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
                <button
                  onClick={() => setActiveBottomTab('none')}
                  className="ml-2 rounded p-1 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="scrollbar mt-3 max-h-48 space-y-1.5 overflow-y-auto pr-1 text-xs">
              {filteredEvents.slice(0, 30).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-[#1a283c] bg-[#090f1a] p-2 hover:border-[#2d4260] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{e.agent || e.kind}:</span>
                    <span className="text-slate-300">{e.text}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 shrink-0 ml-3">Hour {e.time}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeBottomTab === 'census' && (
          <section className="panel border-[#25364d] p-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#213147] pb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#76f2c0]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Citizen Registry</h3>
              </div>
              <button
                onClick={() => setActiveBottomTab('none')}
                className="rounded p-1 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="scrollbar mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1f2d42] text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2 px-2">Citizen</th>
                    <th className="py-2 px-2">Role</th>
                    <th className="py-2 px-2">Residence</th>
                    <th className="py-2 px-2">Current Location</th>
                    <th className="py-2 px-2">Credits</th>
                    <th className="py-2 px-2">Salary</th>
                    <th className="py-2 px-2">Energy</th>
                    <th className="py-2 px-2">Hunger</th>
                    <th className="py-2 px-2">Wellbeing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#172336]">
                  {data.agents.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedAgentId(a.id)}
                      className={`cursor-pointer hover:bg-white/[.03] ${
                        selectedAgentId === a.id ? 'bg-[#76f2c0]/15' : ''
                      }`}
                    >
                      <td className="py-2 px-2 font-bold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                        <span className="text-white">{a.name}</span>
                      </td>
                      <td className="py-2 px-2 text-slate-300">{a.role}</td>
                      <td className="py-2 px-2 text-sky-300 text-[11px]">{a.homeLocation || 'Residential Pod'}</td>
                      <td className="py-2 px-2 text-[#76f2c0]">{a.location}</td>
                      <td className="py-2 px-2 font-mono text-amber-300 font-bold">{a.credits}</td>
                      <td className="py-2 px-2 font-mono text-slate-400">{a.salary || 15} cr</td>
                      <td className="py-2 px-2 font-mono text-sky-300">{a.energy}%</td>
                      <td className="py-2 px-2 font-mono text-rose-300">{a.hunger}%</td>
                      <td className="py-2 px-2 font-mono text-[#76f2c0]">{a.happiness}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 5. Sessions Management Drawer Modal */}
        {showSessionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
            <div className="panel flex max-h-[85vh] w-full max-w-2xl flex-col border-[#2c3d59] bg-[#0c121e] p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#222c3d] pb-3">
                <div className="flex items-center gap-2">
                  <FolderArchive size={17} className="text-[#8aa8ff]" />
                  <h3 className="text-base font-bold text-white">Simulation Sessions</h3>
                </div>
                <button
                  onClick={() => setShowSessionsModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-[#1f2b3e] hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Create new session */}
              <div className="mt-3 flex gap-2 border-b border-[#222c3d] pb-3">
                <input
                  type="text"
                  placeholder="New session title..."
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="flex-1 rounded-xl border border-[#27384f] bg-[#080d16] px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#76f2c0] focus:outline-none"
                />
                <button
                  disabled={creatingSession}
                  onClick={handleCreateNewSession}
                  className="flex items-center gap-1.5 rounded-xl bg-[#76f2c0] px-3.5 py-1.5 text-xs font-bold text-black hover:bg-[#9af6d0] disabled:opacity-40 transition-colors"
                >
                  <Plus size={13} />
                  <span>{creatingSession ? 'Creating...' : 'Create'}</span>
                </button>
              </div>

              {/* List */}
              <div className="scrollbar mt-3 flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
                {sessions.map((s) => {
                  const isActive = s.id === data.sessionId;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between rounded-xl border p-3 ${
                        isActive
                          ? 'border-[#76f2c0]/60 bg-[#13282b]/50 ring-1 ring-[#76f2c0]/40'
                          : 'border-[#223348] bg-[#0f1726] hover:border-[#334b68]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{s.title}</span>
                          {isActive && (
                            <span className="rounded bg-[#76f2c0]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#76f2c0]">
                              ACTIVE
                            </span>
                          )}
                          <span className="rounded bg-slate-700/40 px-1.5 py-0.2 text-[9px] font-medium text-slate-400 capitalize">
                            {s.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                          <span>Hour: <strong className="text-white">{s.hour}:00</strong></span>
                          <span>Round: <strong className="text-white">{s.rounds}/10</strong></span>
                          <span>Alive: <strong className="text-[#76f2c0]">{s.aliveCount}/{s.agentCount}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isActive && (
                          <button
                            onClick={() => handleLoadSession(s.id)}
                            className="rounded-lg bg-[#1e2a3d] px-3 py-1 text-xs font-bold text-slate-200 hover:bg-[#76f2c0] hover:text-black transition-colors"
                          >
                            Load
                          </button>
                        )}
                        {sessions.length > 1 && (
                          <button
                            onClick={() => handleDeleteSession(s.id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete session"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Civic Government, Ledger & Scenarios Modal */}
        <CivicDashboardModal
          isOpen={showCivicModal}
          onClose={() => setShowCivicModal(false)}
          state={data}
          onRefresh={refresh}
        />

        {/* City God Mode Overseer Controls Modal */}
        {showGodModeModal && (
          <GodModeModal
            state={data}
            onClose={() => setShowGodModeModal(false)}
            onRefresh={refresh}
          />
        )}

        {/* AI Brain Observatory Modal */}
        {showObservatoryModal && (
          <AIObservatoryModal
            state={data}
            onClose={() => setShowObservatoryModal(false)}
            onSelectAgent={(agentId) => {
              setSelectedAgentId(agentId);
              setShowObservatoryModal(false);
            }}
          />
        )}

        {/* 6. Footer */}
        <footer className="flex flex-col gap-2 border-t border-[#1e2b3e] pt-3 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5">
            <Building2 size={13} className="text-[#76f2c0]" />
            <span>NEXUS-01 ANIMATED MINIATURE AI CITY · POWERED BY GOOGLE GEMINI</span>
          </div>
          <span className="flex items-center gap-1 text-slate-400">
            Realtime 2D Simulation backed by SQLite & Prisma ORM.
          </span>
        </footer>
      </div>
    </main>
  );
}
