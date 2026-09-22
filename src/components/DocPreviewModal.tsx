import { Request } from '../data/mockData';
import { useEffect } from 'react';
import { useSession } from '../session/SessionState';

interface DocPreviewModalProps {
  request: Request;
  onClose: () => void;
}

export default function DocPreviewModal({ request, onClose }: DocPreviewModalProps) {
  const { state } = useSession();
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  const date = new Date(request.submittedAt);
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const refNo = `INST/OJT/2024/${request.id.replace(/[^a-zA-Z0-9]/g, '')}`;

  // Check signature states from session or request
  const sigState = state.signaturesRecord[request.id];
  const ctSigned = sigState?.classTeacher || !!request.signatures?.classTeacher;
  const ctTime = sigState?.classTeacherTime || request.signatures?.classTeacher?.signedAt;

  const hodSigned = sigState?.hod || !!request.signatures?.hod || state.adminActions[request.id] === 'APPROVED';
  const hodTime = sigState?.hodTime || request.signatures?.hod?.signedAt;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Official document preview"
      style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto glass rounded-2xl"
        style={{ border: '1px solid rgba(34,211,238,0.3)', boxShadow: '0 0 40px rgba(34,211,238,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-cyan-400">OFFICIAL DOCUMENT PREVIEW</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {request.id}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
              Rule: {request.ruleCode || 'OJT-RULE-SEC4'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="text-xs font-mono text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-500/40 bg-slate-900/50"
              onClick={() => window.print()}
            >
              Print / Export PDF
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* The document */}
        <div className="p-6">
          <div className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl font-serif">
            {/* Letterhead */}
            <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center text-white text-2xl font-bold font-sans shadow-md border border-slate-700">
                  🏛️
                </div>
              </div>
              <h1 className="font-bold text-slate-900 text-xl tracking-wider font-sans uppercase">
                Apex Institute of Technology & Research
              </h1>
              <p className="text-xs text-slate-600 mt-1 font-sans">
                Autonomous Institution · Approved by AICTE · Recognized by University Grants Commission
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
                Academic Affairs & Industry Liaison Office · University Campus Road
              </p>
              <div className="mt-3 inline-block px-3 py-1 bg-slate-900 text-white text-xs font-sans font-semibold rounded tracking-wide">
                DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
              </div>
            </div>

            {/* Ref and Date */}
            <div className="flex justify-between text-xs text-slate-700 mb-6 font-mono">
              <div>
                <span className="font-bold text-slate-900">Ref:</span> {refNo}
              </div>
              <div>
                <span className="font-bold text-slate-900">Date:</span> {dateStr}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-5 bg-slate-50 p-3 rounded border-l-4 border-indigo-900 font-sans">
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wide">Institutional Sanction Document</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                SUBJECT: {request.title.toUpperCase()}
              </p>
            </div>

            {/* Body */}
            <div className="text-sm text-slate-800 space-y-4 leading-relaxed font-sans">
              <p>To Whom It May Concern,</p>

              <p>
                This is to certify that <strong>{request.studentName}</strong> (USN: <strong className="font-mono">{request.usn}</strong>),
                a student in good academic standing in the Department of <strong>{request.department}</strong>,
                has formally applied for institutional authorization pursuant to Rule Code <strong className="font-mono">{request.ruleCode || 'OJT-RULE-SEC4'}</strong>.
              </p>

              {/* Request Parameters Card */}
              <div className="border border-slate-200 rounded-lg overflow-hidden my-3">
                <div className="bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 border-b border-slate-200">
                  Verified Request Parameters
                </div>
                <table className="w-full text-xs text-slate-700">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="px-3 py-2 font-semibold bg-slate-50 w-1/3">Request Description</td>
                      <td className="px-3 py-2">{request.rawRequest}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-3 py-2 font-semibold bg-slate-50">Approval Protocol</td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-indigo-900 font-semibold">
                          Reverse Hierarchy Enforcement: [1. Class Teacher] ➔ [2. Head of Department]
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-3 py-2 font-semibold bg-slate-50">Compliance Evaluation</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          ✓ Verified Compliant (Risk Score: {request.riskScore}/100)
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-semibold bg-slate-50">Rules & Policies Applied</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                        {request.complianceTags.join(' | ')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-600">
                In compliance with academic regulations, On-Job Training clearance requires mandatory prerequisite
                verification from the student's designated Class Teacher regarding attendance and academic integrity,
                followed by executive sanction and No Objection Certificate (NOC) issuance by the Head of Department.
              </p>

              {/* DUAL SIGNATURE BLOCKS (REVERSE HIERARCHY) */}
              <div className="mt-8 pt-4 border-t-2 border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                    Dual Signature Approval Chain (Reverse Hierarchy Order)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Mandatory: Stage 1 must precede Stage 2
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SIGNATURE BLOCK 1: CLASS TEACHER */}
                  <div className={`p-4 rounded-xl border-2 transition-all ${
                    ctSigned
                      ? 'border-emerald-500/40 bg-emerald-50/50'
                      : 'border-amber-400/50 border-dashed bg-amber-50/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                        STAGE 1 · PREREQUISITE
                      </span>
                      {ctSigned ? (
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          ✓ ENDORSED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                          ⏳ PENDING SIGN
                        </span>
                      )}
                    </div>

                    <p className="font-bold text-xs text-slate-900">Class Teacher Verification</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Verified Attendance & Academic Conduct
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-200">
                      {ctSigned ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-900">Prof. Rajesh Sharma</p>
                          <p className="text-[10px] font-mono text-slate-500">
                            Signed: {ctTime ? new Date(ctTime).toLocaleString() : 'Recent'}
                          </p>
                          <p className="text-[9px] font-mono text-emerald-700 truncate">
                            HASH: SHA256:SIG-CT-892fbc1a0e
                          </p>
                          <div className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] rounded font-mono font-semibold">
                            ✓ LEGALLY VALIDATED
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 text-center text-xs text-amber-700 italic">
                          Awaiting Class Teacher Endorsement...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SIGNATURE BLOCK 2: HOD */}
                  <div className={`p-4 rounded-xl border-2 transition-all ${
                    hodSigned
                      ? 'border-indigo-600/40 bg-indigo-50/50'
                      : !ctSigned
                      ? 'border-slate-300 bg-slate-100/60 opacity-80'
                      : 'border-blue-400/50 border-dashed bg-blue-50/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                        STAGE 2 · FINAL SANCTION
                      </span>
                      {hodSigned ? (
                        <span className="text-[10px] font-bold text-indigo-800 flex items-center gap-1">
                          ✓ APPROVED & ISSUED
                        </span>
                      ) : !ctSigned ? (
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          🔒 LOCKED (Needs Stage 1)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
                          ⏳ READY FOR SIGN
                        </span>
                      )}
                    </div>

                    <p className="font-bold text-xs text-slate-900">Head of Department (HOD)</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Departmental Clearance & Institutional Sanction
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-200">
                      {hodSigned ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-indigo-950">Dr. K. S. Venkatesh</p>
                          <p className="text-[10px] font-mono text-slate-500">
                            Signed: {hodTime ? new Date(hodTime).toLocaleString() : 'Recent'}
                          </p>
                          <p className="text-[9px] font-mono text-indigo-800 truncate">
                            HASH: SHA256:SIG-HOD-ff71092e4b
                          </p>
                          <div className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 border border-indigo-300 text-indigo-900 text-[10px] rounded font-mono font-semibold">
                            ✓ OFFICIAL INSTITUTIONAL SEAL
                          </div>
                        </div>
                      ) : !ctSigned ? (
                        <div className="py-2 text-center text-xs text-slate-500 italic">
                          🔒 Locked until Stage 1 (Class Teacher) is signed.
                        </div>
                      ) : (
                        <div className="py-2 text-center text-xs text-blue-700 italic">
                          Prerequisite complete. Ready for HOD signature.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer metadata */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between flex-wrap gap-2 font-mono">
              <span>Autonomous Multi-Agent Orchestration Engine · v2.4</span>
              <span>Ref: {refNo} · Cryptographic QR Integrity Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
