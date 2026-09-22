import { useState, useMemo } from 'react';
import { ADMIN_ROLES, MOCK_REQUESTS, Request, createPlaceholderRequest } from '../data/mockData';
import { useSession } from '../session/SessionState';
import DocPreviewModal from './DocPreviewModal';

function RiskGauge({ score }: { score: number }) {
  const color = score < 30 ? '#34d399' : score < 60 ? '#fbbf24' : '#fb7185';
  const label = score < 30 ? 'LOW' : score < 60 ? 'MED' : 'HIGH';
  const circumference = 2 * Math.PI * 18;
  const dashOffset = circumference * (1 - Math.min(Math.max(score, 0), 100) / 100);
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(30,41,59,0.8)" strokeWidth="3" />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>{label} RISK</span>
    </div>
  );
}

function ComplianceBadge({ tag }: { tag: string }) {
  const isViolation = tag.includes('VIOLATION') || tag.includes('RISK') || tag.includes('BELOW') || tag.includes('EXCEEDS');
  return (
    <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
      isViolation
        ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
        : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
    }`}>
      {tag}
    </span>
  );
}

function StatusBadge({ status }: { status: Request['status'] }) {
  const cfg = {
    APPROVED: { cls: 'status-approved', label: 'APPROVED' },
    REJECTED: { cls: 'status-rejected', label: 'REJECTED' },
    UNDER_REVIEW: { cls: 'status-review', label: 'UNDER REVIEW' },
    PENDING: { cls: 'status-pending', label: 'PENDING' },
  }[status] || { cls: 'status-review', label: status };
  return <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${cfg.cls}`}>{cfg.label}</span>;
}

export default function AdminPortal({ onLogout }: { onLogout: () => void }) {
  const { state, set, patch } = useSession();
  const [previewRequest, setPreviewRequest] = useState<Request | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(state.expandedAdminCard);
  const [showRevisionInput, setShowRevisionInput] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'STAGE_1_DONE' | 'APPROVED' | 'REJECTED'>('ALL');

  const role = ADMIN_ROLES.find(r => r.value === state.adminRole) ?? ADMIN_ROLES[0];

  // Merge mock requests with dynamically submitted ones
  const allRequests: Request[] = useMemo(() => {
    return [
      ...state.submittedRequests,
      ...MOCK_REQUESTS.filter(mr => !state.submittedRequests.some(sr => sr.id === mr.id)),
    ];
  }, [state.submittedRequests]);

  // Filter requests by role routing path
  const roleFilteredRequests = useMemo(() => {
    if (role.value !== 'class_teacher' && role.value !== 'hod') return allRequests;
    return allRequests.filter(r =>
      r.routingPath.some(p =>
        (role.value === 'class_teacher' && (p === 'Class Teacher' || p.toLowerCase().includes('teacher'))) ||
        (role.value === 'hod' && (p === 'HOD' || p.toLowerCase().includes('head'))) ||
        (role.value === 'finance' && p === 'Finance Officer') ||
        (role.value === 'principal' && (p === 'Principal' || p === 'Dean')) ||
        (role.value === 'placement' && p === 'Placement Head')
      )
    );
  }, [allRequests, role.value]);

  // Apply search query and status filter
  const requests = useMemo(() => {
    return roleFilteredRequests.filter(req => {
      const isCTSigned = Boolean(state.signaturesRecord[req.id]?.classTeacher);
      const isHODSigned = Boolean(state.signaturesRecord[req.id]?.hod);
      const localAction = state.adminActions[req.id];

      // Status filter
      if (statusFilter === 'APPROVED' && !isHODSigned && localAction !== 'APPROVED') return false;
      if (statusFilter === 'REJECTED' && localAction !== 'REJECTED') return false;
      if (statusFilter === 'STAGE_1_DONE' && (!isCTSigned || isHODSigned)) return false;
      if (statusFilter === 'PENDING') {
        if (role.value === 'class_teacher' && isCTSigned) return false;
        if (role.value === 'hod' && isHODSigned) return false;
        if (localAction === 'REJECTED') return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        req.title.toLowerCase().includes(q) ||
        req.studentName.toLowerCase().includes(q) ||
        req.usn.toLowerCase().includes(q) ||
        req.id.toLowerCase().includes(q) ||
        (req.ruleCode && req.ruleCode.toLowerCase().includes(q))
      );
    });
  }, [roleFilteredRequests, state.signaturesRecord, state.adminActions, statusFilter, searchQuery, role.value]);

  const pendingCount = useMemo(() => {
    return roleFilteredRequests.filter(r => {
      const isCTSigned = Boolean(state.signaturesRecord[r.id]?.classTeacher);
      const isHODSigned = Boolean(state.signaturesRecord[r.id]?.hod);
      const localAction = state.adminActions[r.id];

      if (localAction === 'REJECTED') return false;

      if (role.value === 'class_teacher') {
        return !isCTSigned;
      }
      if (role.value === 'hod') {
        return isCTSigned && !isHODSigned;
      }
      return !localAction && r.status !== 'APPROVED';
    }).length;
  }, [roleFilteredRequests, state.signaturesRecord, state.adminActions, role.value]);

  const handleClassTeacherEndorse = (reqId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (state.adminActions[reqId] === 'REJECTED' || state.adminActions[reqId] === 'REVISION') return;
    const currentSig = state.signaturesRecord[reqId] || {};
    const updated = {
      ...state.signaturesRecord,
      [reqId]: {
        ...currentSig,
        classTeacher: true,
        classTeacherTime: new Date().toISOString(),
      },
    };
    patch({ signaturesRecord: updated });
    showAlert(`✓ Stage 1 Endorsement recorded for [${reqId}]! Forwarded to HOD desk.`);
  };

  const handleHodApprove = (req: Request, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (state.adminActions[req.id] === 'REJECTED' || state.adminActions[req.id] === 'REVISION') return;
    const isCTSigned = Boolean(state.signaturesRecord[req.id]?.classTeacher);
    const requiresCT = req.routingPath.includes('Class Teacher');

    if (requiresCT && !isCTSigned) {
      showAlert(`⚠️ Reverse Hierarchy Violation: Class Teacher endorsement (Stage 1) is mandatory before HOD can sign.`);
      return;
    }

    const currentSig = state.signaturesRecord[req.id] || {};
    const updatedSig = {
      ...state.signaturesRecord,
      [req.id]: {
        ...currentSig,
        hod: true,
        hodTime: new Date().toISOString(),
      },
    };
    patch({
      signaturesRecord: updatedSig,
      adminActions: { ...state.adminActions, [req.id]: 'APPROVED' },
    });
    showAlert(`✓ Institutional Sanction granted for [${req.id}] & official NOC issued!`);
  };

  const handleAction = (reqId: string, action: 'APPROVED' | 'REJECTED' | 'REVISION', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (action === 'REVISION') {
      setShowRevisionInput(prev => prev === reqId ? null : reqId);
      return;
    }
    patch({ adminActions: { ...state.adminActions, [reqId]: action } });
    if (action === 'REJECTED') {
      showAlert(`Application [${reqId}] rejected.`);
    }
  };

  const handleRevisionSubmit = (reqId: string) => {
    patch({ adminActions: { ...state.adminActions, [reqId]: 'REVISION' } });
    setShowRevisionInput(null);
    showAlert(`↩ Revision request sent to student for [${reqId}].`);
  };

  const undoAction = (reqId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextActions = { ...state.adminActions };
    delete nextActions[reqId];
    const nextSigs = { ...state.signaturesRecord };
    delete nextSigs[reqId];
    patch({ adminActions: nextActions, signaturesRecord: nextSigs });
    showAlert(`Reset status for [${reqId}].`);
  };

  const deleteRequest = (reqId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const filteredSubmitted = state.submittedRequests.filter(r => r.id !== reqId);
    undoAction(reqId);
    patch({ submittedRequests: filteredSubmitted });
    showAlert(`Removed request [${reqId}].`);
  };

  const addQuickDemo = (scenario: 'ojt_google' | 'medical' | 'hackathon') => {
    const newReq = createPlaceholderRequest(scenario);
    patch({
      submittedRequests: [newReq, ...state.submittedRequests],
    });
    showAlert(`Added demo request: ${newReq.title}`);
  };

  const showAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 4500);
  };

  const toggleExpand = (reqId: string) => {
    const next = expandedCard === reqId ? null : reqId;
    setExpandedCard(next);
    set('expandedAdminCard', next);
  };

  return (
    <div className="min-h-screen grid-bg">
      {/* Toast Alert */}
      {alertMessage && (
        <div className="fixed top-5 right-5 z-50 glass px-4 py-3 rounded-xl border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center gap-2 shadow-2xl animate-slide-in">
          <span>{alertMessage}</span>
          <button onClick={() => setAlertMessage(null)} className="ml-2 text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="glass border-b border-slate-800 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-cyan-500/40"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))' }}
          >
            <span className="font-mono font-bold text-cyan-400 text-lg">⬡</span>
          </div>
          <div>
            <span className="font-display font-semibold text-slate-100">AgentFlow</span>
            <span className="text-slate-600 mx-2">·</span>
            <span className="text-xs text-slate-400 font-mono">ADMIN & APPROVAL PORTAL</span>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 hidden sm:block">Acting Role:</span>
          <select
            className="text-xs font-mono py-2 px-3 rounded-xl border border-cyan-500/30 bg-slate-900/90 text-cyan-300 cursor-pointer focus:outline-none focus:border-cyan-400"
            value={role.value}
            onChange={e => {
              set('adminRole', e.target.value);
              setExpandedCard(null);
            }}
          >
            {ADMIN_ROLES.map(r => (
              <option key={r.value} value={r.value} className="bg-slate-900 text-slate-200">
                {r.icon} {r.label}
              </option>
            ))}
          </select>
          <button
            onClick={onLogout}
            className="text-xs font-mono text-slate-400 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-700"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Role Banner / Context */}
        <div className="glass rounded-2xl p-5 mb-6 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl">
              {role.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-slate-100 text-lg">{role.label}</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  RANK #{role.rank} IN REVERSE DAG
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{role.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => addQuickDemo('ojt_google')}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
            >
              + Quick Demo OJT
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Pending for You', value: pendingCount, color: 'text-amber-400' },
            { label: 'Total In Queue', value: roleFilteredRequests.length, color: 'neon-text-violet' },
            { label: 'Actioned by You', value: Object.keys(state.signaturesRecord).filter(k => role.value === 'class_teacher' ? state.signaturesRecord[k]?.classTeacher : state.signaturesRecord[k]?.hod).length, color: 'neon-text-cyan' },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-xl p-4 text-center border border-slate-800">
              <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">{stat.label.toUpperCase()}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="glass rounded-xl p-3 mb-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
            <input
              type="text"
              placeholder="Search by student, USN, ID, rule…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            {(['ALL', 'PENDING', 'STAGE_1_DONE', 'APPROVED', 'REJECTED'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === f
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-semibold text-slate-200">Active Applications Desk</h2>
            {pendingCount > 0 && (
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse-glow">
                {pendingCount} Pending Action
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-cyan-400/80">
            Reverse Hierarchy Protocol Active
          </span>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-slate-800">
            <p className="text-slate-400 text-sm">No applications found matching your criteria.</p>
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => addQuickDemo('ojt_google')}
                className="text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              >
                + Inject Sample Request
              </button>
              {statusFilter !== 'ALL' && (
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req, i) => {
              // Independent per-ID signature state
              const isCTSigned = Boolean(state.signaturesRecord[req.id]?.classTeacher);
              const isHODSigned = Boolean(state.signaturesRecord[req.id]?.hod);
              const localAction = state.adminActions[req.id];

              const effectiveStatus: Request['status'] = localAction === 'REJECTED' ? 'REJECTED'
                : isHODSigned || localAction === 'APPROVED' ? 'APPROVED'
                : isCTSigned ? 'UNDER_REVIEW'
                : req.status;

              const isExpanded = expandedCard === req.id;
              const requiresCT = req.routingPath.includes('Class Teacher');
              const isHodLocked = role.value === 'hod' && requiresCT && !isCTSigned;
              const isBlocked = localAction === 'REJECTED' || localAction === 'REVISION';

              return (
                <div
                  key={req.id}
                  className={`glass rounded-2xl overflow-hidden hover-lift transition-all ${
                    effectiveStatus === 'APPROVED' ? 'border border-emerald-500/40 bg-emerald-950/5' :
                    localAction === 'REJECTED' ? 'border border-rose-500/30' :
                    isHodLocked ? 'border border-amber-500/30 bg-amber-950/5' :
                    'border border-slate-800'
                  }`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <RiskGauge score={req.riskScore} />

                      <div className="flex-1 min-w-0">
                        {/* Header badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {req.id}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            Rule: {req.ruleCode || 'OJT-RULE-SEC4'}
                          </span>
                          <StatusBadge status={effectiveStatus} />
                          {isCTSigned && !isHODSigned && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              ✓ Stage 1 Class Teacher Endorsed
                            </span>
                          )}
                          {isHODSigned && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              ✓ Stage 2 HOD Sanctioned
                            </span>
                          )}
                        </div>

                        {/* Title and Student Info */}
                        <h3 className="font-display font-semibold text-slate-100 text-base leading-snug">{req.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          Student: <span className="text-slate-200">{req.studentName}</span> ({req.usn}) · {req.department}
                        </p>

                        {/* Reverse Hierarchy Stage Bar */}
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                              Reverse Hierarchy Approval Chain:
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400">
                              {isHODSigned ? 'All Stages Complete' : isCTSigned ? 'Stage 1 Complete ➔ At HOD Desk' : 'Awaiting Stage 1 (Class Teacher)'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Stage 1 box */}
                            <div className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between ${
                              isCTSigned
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            }`}>
                              <span className="flex items-center gap-1.5">
                                <span>{isCTSigned ? '✓' : '1.'}</span>
                                <span>Class Teacher (Attendance & Conduct)</span>
                              </span>
                              <span className="text-[10px] font-bold">
                                {isCTSigned ? 'ENDORSED' : 'PENDING'}
                              </span>
                            </div>

                            {/* Stage 2 box */}
                            <div className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between ${
                              isHODSigned
                                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                                : !isCTSigned
                                ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                                : 'bg-blue-500/10 border-blue-500/30 text-blue-300 animate-pulse-glow'
                            }`}>
                              <span className="flex items-center gap-1.5">
                                <span>{isHODSigned ? '✓' : !isCTSigned ? '🔒' : '2.'}</span>
                                <span>HOD (Final Institutional Sanction)</span>
                              </span>
                              <span className="text-[10px] font-bold">
                                {isHODSigned ? 'APPROVED' : !isCTSigned ? 'LOCKED' : 'READY TO SIGN'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* AI Summary */}
                        <div className="mt-3 bg-slate-900/60 rounded-lg p-3 border border-slate-800/80">
                          <p className="text-[10px] font-mono text-violet-400 mb-1 uppercase tracking-wider">
                            ◈ Multi-Agent AI Verification Summary
                          </p>
                          <p className="text-xs text-slate-300 leading-relaxed">{req.aiSummary}</p>
                        </div>

                        {/* Compliance Tags */}
                        <div className="flex gap-1.5 flex-wrap mt-3">
                          {req.complianceTags.map(tag => <ComplianceBadge key={tag} tag={tag} />)}
                        </div>
                      </div>
                    </div>

                    {/* Expand details toggle */}
                    <button
                      onClick={() => toggleExpand(req.id)}
                      className="w-full mt-4 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors flex items-center justify-center gap-1"
                    >
                      {isExpanded ? '▲ Hide application particulars & audit trail' : '▼ View student statement, rulebook mapping & signatures'}
                    </button>
                  </div>

                  {/* Expanded view */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-slate-800 pt-4 bg-slate-900/40 animate-slide-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-2">Student's Statement & Parameters</p>
                          <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 leading-relaxed font-sans mb-3">
                            "{req.rawRequest}"
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-400">
                              <span>Department:</span>
                              <span className="font-mono text-slate-200">{req.department}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Prerequisite Rule:</span>
                              <span className="font-mono text-cyan-300">{req.ruleCode || 'OJT-RULE-SEC4'}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Hierarchy Order:</span>
                              <span className="font-mono text-violet-300">1: Class Teacher ➔ 2: HOD</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-mono text-violet-400 uppercase tracking-wider mb-2">Digital Signature Cryptographic Log</p>
                          <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                            <div>
                              <p className="text-xs font-semibold text-slate-200">1. Class Teacher Verification</p>
                              {isCTSigned ? (
                                <p className="text-[11px] font-mono text-emerald-400">
                                  ✓ Signed & Endorsed {state.signaturesRecord[req.id]?.classTeacherTime ? `(${new Date(state.signaturesRecord[req.id]!.classTeacherTime!).toLocaleTimeString()})` : ''} · Hash: SHA256:SIG-CT-{req.id.slice(-4)}
                                </p>
                              ) : (
                                <p className="text-[11px] font-mono text-amber-400">
                                  ⏳ Pending Class Teacher sign-off
                                </p>
                              )}
                            </div>
                            <div className="pt-2 border-t border-slate-800">
                              <p className="text-xs font-semibold text-slate-200">2. Head of Department (HOD) Sanction</p>
                              {isHODSigned ? (
                                <p className="text-[11px] font-mono text-indigo-400">
                                  ✓ Approved & Formally Issued {state.signaturesRecord[req.id]?.hodTime ? `(${new Date(state.signaturesRecord[req.id]!.hodTime!).toLocaleTimeString()})` : ''} · Hash: SHA256:SIG-HOD-{req.id.slice(-4)}
                                </p>
                              ) : !isCTSigned ? (
                                <p className="text-[11px] font-mono text-slate-500">
                                  🔒 Locked until Level 1 Class Teacher signs
                                </p>
                              ) : (
                                <p className="text-[11px] font-mono text-blue-400">
                                  ⏳ Stage 1 complete; awaiting HOD sign
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Revision input drawer */}
                  {showRevisionInput === req.id && (
                    <div className="px-5 pb-4 border-t border-slate-800 pt-4 bg-slate-900/50 animate-slide-in">
                      <p className="text-xs font-mono text-amber-400 mb-2">Request Revision / Documentation Notes:</p>
                      <textarea
                        className="w-full h-20 text-xs p-3 resize-none bg-slate-950 border border-amber-500/30 rounded-lg text-slate-200 focus:outline-none"
                        placeholder="State requirements (e.g. Please provide updated offer letter with exact start date or attendance clarification)…"
                        value={state.adminRevisionNotes[req.id] ?? ''}
                        onChange={e => patch({ adminRevisionNotes: { ...state.adminRevisionNotes, [req.id]: e.target.value } })}
                      />
                      <button
                        onClick={() => handleRevisionSubmit(req.id)}
                        className="mt-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
                      >
                        Submit Revision Request to Student
                      </button>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-800 bg-slate-900/40 flex-wrap">
                    {/* Document preview button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewRequest(req);
                      }}
                      className="text-xs font-mono px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400 transition-all bg-slate-900/60 flex items-center gap-1.5"
                    >
                      <span>📄 Preview Formal Letter</span>
                    </button>

                    <button
                      onClick={(e) => deleteRequest(req.id, e)}
                      title="Remove this application from queue"
                      className="text-xs font-mono px-2.5 py-2 rounded-xl border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                    >
                      🗑️
                    </button>

                    <div className="flex-1" />

                    {/* ROLE-SPECIFIC ACTION CONTROLS */}
                    {role.value === 'class_teacher' && (
                      <>
                        {isBlocked ? (
                          <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
                            <span>{localAction === 'REJECTED' ? 'Application rejected' : 'Revision requested from student'}</span>
                            <button onClick={(e) => undoAction(req.id, e)} className="ml-2 text-slate-400 hover:text-white underline">Reset</button>
                          </div>
                        ) : !isCTSigned ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={(e) => handleAction(req.id, 'REVISION', e)}
                              className="text-xs font-mono font-semibold px-3 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
                            >
                              Request Revision
                            </button>
                            <button
                              onClick={(e) => handleAction(req.id, 'REJECTED', e)}
                              className="text-xs font-mono font-semibold px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
                            >
                              Reject
                            </button>
                            <button
                              onClick={(e) => handleClassTeacherEndorse(req.id, e)}
                              className="text-xs font-mono font-semibold px-4 py-2 rounded-xl text-white transition-all flex items-center gap-2"
                              style={{
                                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                                boxShadow: '0 0 16px rgba(16,185,129,0.3)',
                              }}
                            >
                              <span>✓ Endorse & Forward to HOD (Stage 1)</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                            <span>✓ Stage 1 Endorsed by you</span>
                            <span className="text-slate-500">· Active at HOD Desk</span>
                            <button onClick={(e) => undoAction(req.id, e)} className="ml-2 text-slate-400 hover:text-white underline">
                              Reset
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {role.value === 'hod' && (
                      <>
                        {isBlocked ? (
                          <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
                            <span>{localAction === 'REJECTED' ? 'Application rejected' : 'Revision requested from student'}</span>
                            <button onClick={(e) => undoAction(req.id, e)} className="ml-2 text-slate-400 hover:text-white underline">Reset</button>
                          </div>
                        ) : !isHODSigned ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={(e) => handleAction(req.id, 'REVISION', e)}
                              className="text-xs font-mono font-semibold px-3 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
                            >
                              Request Revision
                            </button>
                            <button
                              onClick={(e) => handleAction(req.id, 'REJECTED', e)}
                              className="text-xs font-mono font-semibold px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
                            >
                              Reject
                            </button>

                            {isHodLocked ? (
                              <div
                                title="Class Teacher endorsement is mandatory first before HOD signature becomes valid"
                                className="text-xs font-mono font-semibold px-4 py-2 rounded-xl bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed flex items-center gap-2"
                              >
                                <span>🔒 Locked: Needs Class Teacher Sign</span>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => handleHodApprove(req, e)}
                                className="text-xs font-mono font-semibold px-4 py-2 rounded-xl text-white transition-all flex items-center gap-2"
                                style={{
                                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                                  boxShadow: '0 0 16px rgba(34,211,238,0.3)',
                                }}
                              >
                                <span>✓ Approve & Issue Sanction (HOD)</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-mono text-indigo-300 bg-indigo-500/15 px-3 py-1.5 rounded-lg border border-indigo-500/30">
                            <span>✓ Fully Approved & NOC Issued by HOD</span>
                            <button onClick={(e) => undoAction(req.id, e)} className="ml-2 text-slate-400 hover:text-white underline">
                              Reset
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Generic role actions if not CT or HOD */}
                    {role.value !== 'class_teacher' && role.value !== 'hod' && !localAction && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleAction(req.id, 'REJECTED', e)}
                          className="text-xs font-mono font-semibold px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        >
                          Reject
                        </button>
                        <button
                          onClick={(e) => handleAction(req.id, 'APPROVED', e)}
                          className="text-xs font-mono font-semibold px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold"
                        >
                          Endorse Record
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewRequest && (
        <DocPreviewModal request={previewRequest} onClose={() => setPreviewRequest(null)} />
      )}
    </div>
  );
}
