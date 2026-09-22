import { useState, useEffect } from 'react';
import { useSession } from '../session/SessionState';
import { createPlaceholderRequest, MOCK_REQUESTS, STUDENT_PROFILE } from '../data/mockData';
import { checkBackendHealth, BackendHealth } from '../services/agentApi';

export default function QuickDataSeeder() {
  const { state, patch, reset } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendHealth | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    checkBackendHealth().then(setBackendStatus);
    const interval = setInterval(() => {
      checkBackendHealth().then(setBackendStatus);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const seedAllFourScenarios = () => {
    const r1 = {
      ...MOCK_REQUESTS[0],
      id: `REQ-${new Date().getFullYear()}-8841`,
      submittedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    };
    const r2 = {
      ...MOCK_REQUESTS[1],
      id: `REQ-${new Date().getFullYear()}-7629`,
      submittedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    };
    const r3 = {
      ...MOCK_REQUESTS[2],
      id: `REQ-${new Date().getFullYear()}-6512`,
      submittedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    };
    const r4 = {
      ...MOCK_REQUESTS[3],
      id: `REQ-${new Date().getFullYear()}-5401`,
      submittedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    };

    // Stage 1 endorsed for r2
    // Both endorsed for r3
    const sigs = {
      ...state.signaturesRecord,
      [r2.id]: {
        classTeacher: true,
        classTeacherTime: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      },
      [r3.id]: {
        classTeacher: true,
        hod: true,
        classTeacherTime: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        hodTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    };

    const actions = {
      ...state.adminActions,
      [r3.id]: 'APPROVED' as const,
    };

    patch({
      submittedRequests: [r1, r2, r3, r4],
      signaturesRecord: sigs,
      adminActions: actions,
    });

    notify('✓ Seeded 4 full demo scenarios across Stage 1, Stage 2 & Approved!');
  };

  const addScenario = (type: 'ojt_google' | 'medical' | 'hackathon') => {
    const req = createPlaceholderRequest(type);
    patch({
      submittedRequests: [req, ...state.submittedRequests],
    });
    notify(`✓ Added: ${req.title.slice(0, 45)}…`);
  };

  const addCustom = () => {
    if (!customPrompt.trim()) return;
    const req = createPlaceholderRequest('custom', customPrompt.trim());
    patch({
      submittedRequests: [req, ...state.submittedRequests],
    });
    setCustomPrompt('');
    notify(`✓ Added custom request: ${req.id}`);
  };

  const endorseAllStage1 = () => {
    const updatedSigs = { ...state.signaturesRecord };
    const all = [...state.submittedRequests, ...MOCK_REQUESTS];
    let count = 0;
    all.forEach(r => {
      if (!updatedSigs[r.id]?.classTeacher) {
        updatedSigs[r.id] = {
          ...updatedSigs[r.id],
          classTeacher: true,
          classTeacherTime: new Date().toISOString(),
        };
        count++;
      }
    });
    patch({ signaturesRecord: updatedSigs });
    notify(`✓ Class Teacher endorsed ${count} pending application(s)!`);
  };

  const approveAllReadyStage2 = () => {
    const updatedSigs = { ...state.signaturesRecord };
    const updatedActions = { ...state.adminActions };
    const all = [...state.submittedRequests, ...MOCK_REQUESTS];
    let count = 0;

    all.forEach(r => {
      if (updatedSigs[r.id]?.classTeacher && !updatedSigs[r.id]?.hod) {
        updatedSigs[r.id] = {
          ...updatedSigs[r.id],
          hod: true,
          hodTime: new Date().toISOString(),
        };
        updatedActions[r.id] = 'APPROVED';
        count++;
      }
    });

    patch({ signaturesRecord: updatedSigs, adminActions: updatedActions });
    notify(`✓ HOD granted sanction for ${count} verified application(s)!`);
  };

  const resetAllSignatures = () => {
    patch({
      signaturesRecord: {},
      adminActions: {},
      adminRevisionNotes: {},
    });
    notify('Reset all approvals to fresh initial state.');
  };

  const clearAllData = () => {
    reset();
    notify('Cleaned all session and custom data.');
  };

  return (
    <>
      {/* Floating corner button (bottom-right) */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
        {notification && (
          <div className="glass px-3.5 py-2 rounded-xl border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-2xl animate-slide-in">
            {notification}
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Quick Data Seeder & Demo Controls"
          className="group relative flex items-center gap-2 px-4 py-3 rounded-2xl glass border border-cyan-500/40 text-slate-100 shadow-2xl hover:scale-105 transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(139,92,246,0.25))',
            boxShadow: '0 0 20px rgba(34,211,238,0.3)',
          }}
        >
          <span className="text-base animate-pulse-glow">⚡</span>
          <span className="font-display font-semibold text-xs text-cyan-300">
            {isOpen ? 'Close Demo Panel' : 'Demo Tools & Placeholder Data'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>
      </div>

      {/* Popover drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-40 w-96 max-w-[calc(100vw-2.5rem)] glass rounded-2xl border border-cyan-500/30 p-5 shadow-2xl animate-slide-in max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <div>
                <h3 className="font-display font-bold text-sm text-slate-100">
                  Data Seeder & Multi-Agent Tools
                </h3>
                <p className="text-[10px] font-mono text-slate-400">
                  Quick inject requests & test reverse hierarchy
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-800"
            >
              ✕
            </button>
          </div>

          {/* Python Server Status */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-4 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${backendStatus?.online ? 'bg-emerald-400 animate-pulse-glow' : 'bg-amber-400'}`} />
              <span className="text-slate-200">
                {backendStatus?.online ? 'Python Backend: Online (Port 5001)' : 'Python Backend: Offline (Using Local Engine)'}
              </span>
            </div>
            <span className="text-[10px] text-cyan-400">v1.0</span>
          </div>

          {/* Quick Seed Buttons */}
          <div className="space-y-3 mb-4">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              1-Click Scenario Generators:
            </p>

            <button
              onClick={seedAllFourScenarios}
              className="w-full text-left p-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-semibold text-cyan-300">
                  🎯 Seed 4 Realistic Applications
                </span>
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400">Apply →</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                TCS OJT (Stage 1), Infosys (Stage 2 ready), Microsoft (Approved), SIH Duty Leave.
              </p>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => addScenario('ojt_google')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/30 text-center transition-all"
              >
                <span className="text-sm block mb-1">💼</span>
                <span className="text-[10px] font-mono text-slate-300 block leading-tight">Google OJT</span>
              </button>

              <button
                onClick={() => addScenario('medical')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/30 text-center transition-all"
              >
                <span className="text-sm block mb-1">🏥</span>
                <span className="text-[10px] font-mono text-slate-300 block leading-tight">Medical Leave</span>
              </button>

              <button
                onClick={() => addScenario('hackathon')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/30 text-center transition-all"
              >
                <span className="text-sm block mb-1">🏆</span>
                <span className="text-[10px] font-mono text-slate-300 block leading-tight">ACM Final</span>
              </button>
            </div>
          </div>

          {/* Quick Approval Workflow Actions */}
          <div className="space-y-2 mb-4 pt-3 border-t border-slate-800">
            <p className="text-[10px] font-mono text-violet-400 uppercase tracking-wider">
              Reverse Hierarchy Batch Approvals:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={endorseAllStage1}
                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono transition-all text-center"
              >
                ✓ Endorse All (Class Teacher)
              </button>
              <button
                onClick={approveAllReadyStage2}
                className="p-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-mono transition-all text-center"
              >
                ✓ Sanction All (HOD)
              </button>
            </div>
          </div>

          {/* Custom Text Injector */}
          <div className="space-y-2 mb-4 pt-3 border-t border-slate-800">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Custom Prompt Generator:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 6-month research internship at Intel Bangalore…"
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustom()}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={addCustom}
                disabled={!customPrompt.trim()}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Add
              </button>
            </div>
          </div>

          {/* Reset Actions */}
          <div className="flex gap-2 pt-3 border-t border-slate-800">
            <button
              onClick={resetAllSignatures}
              className="flex-1 py-1.5 text-[11px] font-mono rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Reset Signatures
            </button>
            <button
              onClick={clearAllData}
              className="flex-1 py-1.5 text-[11px] font-mono rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
            >
              Clear All Data
            </button>
          </div>
        </div>
      )}
    </>
  );
}

