import { useRef, useState, useMemo } from 'react';
import { STUDENT_PROFILE, MOCK_REQUESTS, Request } from '../data/mockData';
import { useSession, hashText, type PipelineRun } from '../session/SessionState';
import AgentPipeline from './AgentPipeline';
import DocPreviewModal from './DocPreviewModal';

const SAMPLE_REQUESTS = [
  'I would like to request permission and an institutional NOC for a 6-month On-Job Training (OJT) at TCS Research & Innovation Labs Bangalore from July 1 to December 31, 2024. My 6th semester CGPA is 8.7 and attendance is 84%. Offer letter attached.',
  'Application for On-Job Industrial Internship at Infosys Springboard Hyderabad. 8th semester curriculum credits to be transferred as per institutional policy. Attendance verified above 80%.',
  'I am requesting 3 days medical leave from March 11-13 due to viral fever. Registered medical practitioner certificate attached. Requesting lab attendance waiver.',
  'Requesting duty leave and institutional endorsement for Smart India Hackathon Grand Finale in New Delhi from October 12 to 16, 2024. Team selection letter attached.',
];

function StatusBadge({ status }: { status: Request['status'] | 'REVISION' }) {
  const cfg = {
    APPROVED: { cls: 'status-approved', label: 'APPROVED' },
    REJECTED: { cls: 'status-rejected', label: 'REJECTED' },
    UNDER_REVIEW: { cls: 'status-review', label: 'UNDER REVIEW' },
    PENDING: { cls: 'status-pending', label: 'PENDING' },
    REVISION: { cls: 'status-review', label: 'REVISION REQUIRED' },
  }[status] || { cls: 'status-review', label: status };
  return (
    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function StageTracker({ path, current }: { path: string[]; current: string }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {path.map((node, i) => {
        const isDone = (current === 'Completed') || (current === 'HOD' && node === 'Class Teacher');
        const isActive = (current === 'Class Teacher' && node === 'Class Teacher') || (current === 'HOD' && node === 'HOD');

        return (
          <div key={node} className="flex items-center gap-1">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isDone
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse-glow'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {isDone ? '✓' : `${i + 1}.`} {node}
            </span>
            {i < path.length - 1 && (
              <span className={`text-xs ${isDone ? 'text-emerald-400' : 'text-slate-700'}`}>➔</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StudentPortal({ onLogout }: { onLogout: () => void }) {
  const { state, set, patch } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docModalReq, setDocModalReq] = useState<Request | null>(null);

  const tab = state.studentTab;
  const applyState = state.applyState;
  const requestText = state.lastRequestText;
  const droppedFile = state.droppedFile;

  // Merge mock requests with submitted ones
  const allRequests: Request[] = useMemo(() => {
    return [
      ...state.submittedRequests,
      ...MOCK_REQUESTS.filter(r => r.studentName === STUDENT_PROFILE.name && !state.submittedRequests.some(sr => sr.id === r.id)),
    ];
  }, [state.submittedRequests]);

  // Check if current text has a cached pipeline run
  const cacheKey = requestText ? hashText(requestText) : null;
  const cachedRun: PipelineRun | null = cacheKey ? (state.pipelineCache[cacheKey] ?? null) : null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) set('droppedFile', file.name);
  };

  const handleSubmit = () => {
    if (!requestText.trim()) return;
    set('applyState', cachedRun ? 'done' : 'running');
  };

  const handleAgentComplete = (run: PipelineRun) => {
    const key = hashText(run.requestText);
    const isOJT = run.requestText.toLowerCase().includes('job') ||
      run.requestText.toLowerCase().includes('intern') ||
      run.requestText.toLowerCase().includes('tcs') ||
      run.requestText.toLowerCase().includes('offer');

    const generatedReqId = run.requestId || `REQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 8999 + 1000)}`;

    const newRequest: Request = {
      id: generatedReqId,
      type: isOJT ? 'on_job_training' : 'institutional_request',
      title: run.requestText.slice(0, 65) + (run.requestText.length > 65 ? '…' : ''),
      studentName: STUDENT_PROFILE.name,
      usn: STUDENT_PROFILE.usn,
      department: STUDENT_PROFILE.department,
      submittedAt: run.completedAt || new Date().toISOString(),
      status: 'UNDER_REVIEW',
      currentStage: 'Stage 1: Class Teacher Verification',
      riskScore: 12,
      aiSummary:
        'Analyzed by 5-agent Python pipeline. Institutional rulebook verified. Reverse hierarchy initiated: Class Teacher endorsement required before HOD sign-off.',
      complianceTags: [isOJT ? 'OJT-RULE-SEC4' : 'LEAVE-POLICY', 'REVERSE_HIERARCHY_ACTIVE', 'STAGE_1_PENDING'],
      routingPath: ['Class Teacher', 'HOD'],
      currentApprover: 'Class Teacher',
      rawRequest: run.requestText,
      ruleCode: isOJT ? 'OJT-RULE-SEC4' : 'LEAVE-POLICY',
      reverseHierarchy: { '1': 'class teacher', '2': 'HOD' },
      signatures: {
        classTeacher: null,
        hod: null,
      },
    };

    patch({
      applyState: 'done',
      pipelineCache: { ...state.pipelineCache, [key]: run },
      submittedRequests: [newRequest, ...state.submittedRequests],
    });
  };

  const handleReset = () => {
    patch({
      applyState: 'input',
      lastRequestText: '',
      droppedFile: null,
    });
  };

  const showPipeline = applyState === 'running' || applyState === 'done';

  return (
    <div className="min-h-screen grid-bg">
      {/* Top nav */}
      <nav className="glass border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-cyan-500/40"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))' }}
          >
            <span className="text-cyan-400 text-lg font-bold font-mono">⬡</span>
          </div>
          <div>
            <span className="font-display font-semibold text-slate-100">AgentFlow</span>
            <span className="text-slate-600 mx-2">·</span>
            <span className="text-xs text-slate-400 font-mono">STUDENT PORTAL</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs text-violet-400 font-bold">
              {STUDENT_PROFILE.name[0]}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">{STUDENT_PROFILE.name}</p>
              <p className="text-[10px] font-mono text-slate-400">{STUDENT_PROFILE.usn}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-xs font-mono text-slate-400 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-700"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile bar */}
        <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-5 flex-wrap border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center text-xl font-bold text-cyan-400 border border-cyan-500/30">
            {STUDENT_PROFILE.name[0]}
          </div>
          <div>
            <p className="font-display font-semibold text-slate-100">{STUDENT_PROFILE.name}</p>
            <p className="text-xs text-slate-400 font-mono">
              {STUDENT_PROFILE.usn} · {STUDENT_PROFILE.department} · Semester {STUDENT_PROFILE.semester}
            </p>
            <p className="text-[11px] text-cyan-400/80 font-mono mt-0.5">
              Mentor: {STUDENT_PROFILE.mentor}
            </p>
          </div>
          <div className="flex gap-4 ml-auto flex-wrap">
            <div className="text-center px-2">
              <p className="text-lg font-display font-bold neon-text-cyan">{STUDENT_PROFILE.attendance}%</p>
              <p className="text-[10px] font-mono text-slate-500">ATTENDANCE</p>
            </div>
            <div className="text-center px-2">
              <p className="text-lg font-display font-bold neon-text-violet">{STUDENT_PROFILE.cgpa}</p>
              <p className="text-[10px] font-mono text-slate-500">CGPA</p>
            </div>
            <div className="text-center px-2">
              <p className="text-lg font-display font-bold text-emerald-400">{allRequests.length}</p>
              <p className="text-[10px] font-mono text-slate-500">APPLICATIONS</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-800 mb-6">
          {(['apply', 'requests'] as const).map(t => (
            <button
              key={t}
              onClick={() => set('studentTab', t)}
              className={`pb-3 text-sm font-display font-medium capitalize transition-all ${
                tab === t ? 'tab-active' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'apply' ? 'Submit New Application' : `Track Applications (${allRequests.length})`}
            </button>
          ))}
        </div>

        {/* ── APPLY TAB ── */}
        {tab === 'apply' && (
          <div className="space-y-5">
            {applyState === 'input' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block">
                      Application Statement (Natural Language)
                    </label>
                    <span className="text-[10px] font-mono text-cyan-400">
                      Multi-Agent Pipeline extracts details & enforces rule hierarchy
                    </span>
                  </div>
                  <textarea
                    className="w-full h-36 p-4 text-sm leading-relaxed resize-none rounded-xl border border-slate-700 bg-slate-900/60 text-slate-100 focus:outline-none focus:border-cyan-400"
                    placeholder="Describe your request — e.g. 'I would like to apply for On-Job Training at TCS Bangalore for 6 months starting July 1, 2024. My attendance is 84% with 0 backlogs…'"
                    value={requestText}
                    onChange={e => set('lastRequestText', e.target.value)}
                  />
                </div>

                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Quick Fill Templates</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SAMPLE_REQUESTS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => set('lastRequestText', s)}
                        className="text-left text-xs text-slate-400 hover:text-cyan-300 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/30 transition-all leading-snug"
                      >
                        <span className="font-mono text-cyan-500 block mb-1">
                          {i === 0 ? '🎯 TCS On-Job Training (6 Mo)' : i === 1 ? '💼 Infosys Internship' : i === 2 ? '🏥 Medical Leave' : '🏆 Hackathon Duty Leave'}
                        </span>
                        {s.slice(0, 95)}…
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Drop */}
                <div>
                  <label className="text-xs font-mono text-slate-300 uppercase tracking-wider mb-2 block">
                    Upload Supporting Credentials (Offer Letter, Medical Note, Certificate)
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      droppedFile
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-900/30'
                    }`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload supporting credentials"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) set('droppedFile', f.name);
                      }}
                    />
                    {droppedFile ? (
                      <div>
                        <p className="text-emerald-400 text-sm font-mono font-semibold">✓ {droppedFile}</p>
                        <p className="text-xs text-slate-500 mt-1">File attached · Click to replace</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-3xl mb-2 opacity-30">📄</p>
                        <p className="text-sm text-slate-300">Drop offer letter or document here, or click to browse</p>
                        <p className="text-xs text-slate-500 mt-1">PDF, DOC, PNG up to 15MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={!requestText.trim()}
                  className="w-full py-3.5 rounded-xl font-display font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-xl"
                  style={{
                    background: requestText.trim()
                      ? 'linear-gradient(135deg, #06b6d4, #8b5cf6)'
                      : '#1e293b',
                    boxShadow: requestText.trim() ? '0 0 24px rgba(34,211,238,0.3)' : undefined,
                  }}
                >
                  {cachedRun ? 'View Multi-Agent Processing Result →' : 'Launch 5-Agent Orchestration Pipeline →'}
                </button>
              </>
            )}

            {/* Pipeline Execution View */}
            {showPipeline && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span
                    className={`text-xs font-mono ${
                      applyState === 'done' ? 'text-emerald-400' : 'neon-text-cyan animate-pulse-glow'
                    }`}
                  >
                    {applyState === 'done'
                      ? '✓ PIPELINE COMPLETE · DISPATCHED TO LEVEL 1 DESK'
                      : '◈ 5-AGENT MULTI-AGENT ORCHESTRATION IN PROGRESS'}
                  </span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                <AgentPipeline
                  requestText={requestText}
                  cached={cachedRun}
                  studentProfile={{ ...STUDENT_PROFILE }}
                  attachmentName={droppedFile}
                  onComplete={handleAgentComplete}
                />

                {applyState === 'done' && (
                  <div className="glass rounded-2xl p-6 border border-emerald-500/30 animate-slide-in">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        ✓
                      </div>
                      <h3 className="font-display font-bold text-emerald-400 text-base">
                        Application Dispatched to Reverse Hierarchy Queue
                      </h3>
                    </div>
                    <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                      Your request has been validated against institutional rulebook <strong>OJT-RULE-SEC4</strong>.
                      As per reverse hierarchy protocol, the application is queued at <strong>Class Teacher Desk (Stage 1)</strong>.
                      Once your Class Teacher endorses, it will automatically unlock for the <strong>Head of Department (HOD)</strong> for final sanction.
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => {
                          handleReset();
                          set('studentTab', 'requests');
                        }}
                        className="text-sm font-display font-semibold px-4 py-2.5 rounded-xl text-white shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
                      >
                        Track Status in My Applications →
                      </button>
                      <button
                        onClick={handleReset}
                        className="text-sm font-display font-medium px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        Submit Another Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── REQUESTS TAB ── */}
        {tab === 'requests' && (
          <div className="space-y-4">
            {allRequests.map((req, i) => {
              const isCTSigned = Boolean(state.signaturesRecord[req.id]?.classTeacher);
              const isHODSigned = Boolean(state.signaturesRecord[req.id]?.hod);
              const localAction = state.adminActions[req.id];

              const effectiveStatus: Request['status'] | 'REVISION' = localAction === 'REJECTED' ? 'REJECTED'
                : isHODSigned || localAction === 'APPROVED' ? 'APPROVED'
                : localAction === 'REVISION' ? 'REVISION'
                : isCTSigned ? 'UNDER_REVIEW'
                : req.status;

              return (
                <div
                  key={req.id}
                  className="glass rounded-2xl p-5 hover-lift transition-all border border-slate-800"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {req.id}
                        </span>
                        <StatusBadge status={effectiveStatus} />
                        <span className="text-[10px] font-mono text-slate-400">
                          Rule: {req.ruleCode || 'OJT-RULE-SEC4'}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-slate-100 text-base">{req.title}</h3>
                      {localAction === 'REVISION' && state.adminRevisionNotes[req.id] && (
                        <p className="text-xs text-amber-300 mt-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                          Revision requested: {state.adminRevisionNotes[req.id]}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        Submitted on {new Date(req.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setDocModalReq(req)}
                        className="text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400 transition-colors bg-slate-900/60"
                      >
                        📄 Preview Document
                      </button>
                      <div className="text-right">
                        <p className="text-[10px] font-mono text-slate-500 mb-0.5">CURRENT STAGE</p>
                        <p className="text-xs font-semibold text-cyan-300">
                          {isHODSigned ? '✓ Fully Sanctioned (NOC Ready)' : isCTSigned ? 'Stage 2: At HOD Desk' : 'Stage 1: At Class Teacher Desk'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reverse Hierarchy Stage Tracker */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 mb-1.5">REVERSE HIERARCHY APPROVAL FLOW</p>
                      <StageTracker
                        path={req.routingPath}
                        current={isHODSigned ? 'Completed' : isCTSigned ? 'HOD' : 'Class Teacher'}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isCTSigned ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        Class Teacher: {isCTSigned ? '✓ Endorsed' : '⏳ Pending'}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isHODSigned ? 'bg-indigo-500/15 text-indigo-300' : !isCTSigned ? 'bg-slate-800 text-slate-500' : 'bg-blue-500/10 text-blue-300'
                      }`}>
                        HOD: {isHODSigned ? '✓ Approved' : !isCTSigned ? '🔒 Locked' : '⏳ Ready'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {docModalReq && (
        <DocPreviewModal request={docModalReq} onClose={() => setDocModalReq(null)} />
      )}
    </div>
  );
}
