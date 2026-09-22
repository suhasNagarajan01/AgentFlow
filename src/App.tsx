import { useState } from 'react';
import { SessionProvider, useSession } from './session/SessionState';
import StudentPortal from './components/StudentPortal';
import AdminPortal from './components/AdminPortal';
import PythonAgentsModal from './components/PythonAgentsModal';
import QuickDataSeeder from './components/QuickDataSeeder';

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            background: i % 2 === 0 ? '#22d3ee' : '#a78bfa',
            boxShadow: i % 2 === 0 ? '0 0 6px #22d3ee' : '0 0 6px #a78bfa',
            animation: `pulse-glow ${2 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.3) % 2}s`,
          }}
        />
      ))}
    </div>
  );
}

function LandingPage() {
  const { state, set } = useSession();
  const [showPythonModal, setShowPythonModal] = useState(false);

  return (
    <div className="min-h-screen grid-bg flex flex-col relative">
      <ParticleField />
      <div
        className="absolute top-20 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-32 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)' }}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative z-10">
        {/* Header Branding */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center border border-cyan-500/40 shadow-xl"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(139,92,246,0.25))' }}
          >
            <span className="font-mono font-bold text-cyan-400 text-xl">⬡</span>
          </div>
          <div>
            <span className="font-display font-bold text-xl text-slate-100 tracking-wide">AgentFlow</span>
            <span className="text-[10px] font-mono text-cyan-400/80 block -mt-0.5 tracking-wider">
              AUTONOMOUS MULTI-AGENT ORCHESTRATION ENGINE
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-glow" />
            <span className="text-xs font-mono text-cyan-300">
              Reverse Hierarchy Approval: Class Teacher Endorsement ➔ HOD Sanction
            </span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-slate-100 leading-tight mb-4">
            Bureaucratic bottlenecks, <span className="neon-text-cyan">automated</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Solve institutional deadlocks for student On-Job Training, Leave, and NOCs.
            A 5-agent AI pipeline parses requests, matches institutional rulebooks, generates legal letters,
            and strictly enforces reverse-hierarchy sequential signatures.
          </p>
        </div>

        {/* Agent pipeline visual */}
        <div className="flex items-center gap-2 my-6 flex-wrap justify-center max-w-3xl">
          {[
            { id: 1, name: 'Agent 1: Extractor', desc: 'Needs & Intent', icon: '⬡', color: 'cyan' },
            { id: 2, name: 'Agent 2: Rule Engine', desc: 'Code & Reverse DAG', icon: '◈', color: 'violet' },
            { id: 3, name: 'Agent 3: Planner', desc: 'Task DAG & SLAs', icon: '⬡', color: 'cyan' },
            { id: 4, name: 'Agent 4: Doc Gen', desc: 'Formal Letters & Seals', icon: '◈', color: 'violet' },
            { id: 5, name: 'Agent 5: Router', desc: 'Desk Dispatch & Gates', icon: '⬡', color: 'cyan' },
          ].map((agent, i) => (
            <div key={agent.name} className="flex items-center gap-2">
              <div
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl glass border transition-all hover:border-cyan-500/50 ${
                  agent.color === 'cyan' ? 'border-cyan-500/20' : 'border-violet-500/20'
                }`}
              >
                <span className={agent.color === 'cyan' ? 'neon-text-cyan text-base' : 'neon-text-violet text-base'}>
                  {agent.icon}
                </span>
                <span className="text-[11px] font-display font-semibold text-slate-200">{agent.name}</span>
                <span className="text-[9px] font-mono text-slate-500">{agent.desc}</span>
              </div>
              {i < 4 && (
                <div className="flex items-center gap-0.5">
                  <div className="w-2.5 h-px bg-slate-700" />
                  <div className="w-1 h-1 rounded-full bg-cyan-500" />
                  <div className="w-2.5 h-px bg-slate-700" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl mb-6">
          {[
            {
              key: 'student' as const,
              icon: '🎓',
              title: 'Student Portal',
              sub: 'Submit On-Job Training, Leave, or NOC requests',
              features: [
                'Natural language application input',
                'Live 5-agent execution pipeline view',
                'Real-time reverse hierarchy approval tracker',
              ],
              accentColor: 'cyan',
            },
            {
              key: 'admin' as const,
              icon: '🏛️',
              title: 'Approver Portal',
              sub: 'Review & sign as Class Teacher or HOD',
              features: [
                'Class Teacher (Level 1) endorsement gate',
                'HOD (Level 2) sanction locked until Level 1 signs',
                'One-click digital signature stamping & NOC issue',
              ],
              accentColor: 'violet',
            },
          ].map(portal => (
            <button
              key={portal.key}
              onClick={() => set('portal', portal.key)}
              className="text-left glass rounded-2xl p-6 hover-lift transition-all border border-slate-800 hover:border-cyan-500/30 group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-md"
                  style={{
                    background: portal.accentColor === 'cyan' ? 'rgba(34,211,238,0.15)' : 'rgba(167,139,250,0.15)',
                    border: `1px solid ${portal.accentColor === 'cyan' ? 'rgba(34,211,238,0.3)' : 'rgba(167,139,250,0.3)'}`,
                  }}
                >
                  {portal.icon}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-slate-100 text-base group-hover:text-cyan-300 transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-slate-400">{portal.sub}</p>
                </div>
              </div>
              <ul className="space-y-1.5 mb-5">
                {portal.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className={portal.accentColor === 'cyan' ? 'text-cyan-400' : 'text-violet-400'}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-display font-semibold transition-all"
                style={{
                  background:
                    portal.accentColor === 'cyan'
                      ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))'
                      : 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))',
                  color: portal.accentColor === 'cyan' ? '#22d3ee' : '#a78bfa',
                  border: `1px solid ${
                    portal.accentColor === 'cyan' ? 'rgba(34,211,238,0.3)' : 'rgba(167,139,250,0.3)'
                  }`,
                }}
              >
                Enter {portal.title} →
              </div>
            </button>
          ))}
        </div>

        {/* Python Architecture Quick Link */}
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setShowPythonModal(true)}
            className="w-full glass rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs">
                Py
              </div>
              <div>
                <p className="text-xs font-display font-semibold text-slate-200">
                  Inspect Python Multi-Agent Engine (Agent 1 & Agent 2)
                </p>
                <p className="text-[11px] font-mono text-slate-400">
                  Uses google.genai SDK · Strict JSON Schema · Reverse Hierarchy Reference Code
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-400 px-3 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
              View Code & Schema →
            </span>
          </button>
        </div>

        {/* Session Indicator */}
        {(Object.keys(state.pipelineCache).length > 0 || state.submittedRequests.length > 0) && (
          <div className="mt-6 flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
            Session active · {state.submittedRequests.length} custom request{state.submittedRequests.length !== 1 ? 's' : ''} · {Object.keys(state.pipelineCache).length} cached run
            {Object.keys(state.pipelineCache).length !== 1 ? 's' : ''}
          </div>
        )}

        <p className="mt-5 text-[11px] font-mono text-slate-500 text-center">
          Autonomous Multi-Agent Orchestration Engine · Reverse Hierarchy Protocol · 2024
        </p>
      </div>

      {showPythonModal && <PythonAgentsModal onClose={() => setShowPythonModal(false)} />}
    </div>
  );
}

function Router() {
  const { state, set } = useSession();

  if (state.portal === 'student') return <StudentPortal onLogout={() => set('portal', 'landing')} />;
  if (state.portal === 'admin') return <AdminPortal onLogout={() => set('portal', 'landing')} />;
  return <LandingPage />;
}

export default function App() {
  return (
    <SessionProvider>
      <Router />
      <QuickDataSeeder />
    </SessionProvider>
  );
}
