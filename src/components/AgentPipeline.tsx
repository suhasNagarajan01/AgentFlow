import { useState, useEffect, useCallback, useRef } from 'react';
import { AGENT_STEPS } from '../data/mockData';
import type { PipelineRun } from '../session/SessionState';
import { callPythonAgent, checkBackendHealth } from '../services/agentApi';

interface AgentPipelineProps {
  requestText: string;
  cached: PipelineRun | null;
  studentProfile: Record<string, unknown>;
  attachmentName: string | null;
  onComplete: (run: PipelineRun) => void;
}

type StepStatus = 'idle' | 'running' | 'done' | 'error';

interface StepState {
  status: StepStatus;
  output: Record<string, unknown> | null;
  log: string[];
  duration?: number;
  isLiveBackend?: boolean;
}

function JsonViewer({ data }: { data: Record<string, unknown> }) {
  const stringify = (val: unknown, depth = 0): string => {
    if (typeof val === 'string') return `"${val}"`;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      const items = val.map(v => '  '.repeat(depth + 1) + stringify(v, depth + 1));
      return `[\n${items.join(',\n')}\n${'  '.repeat(depth)}]`;
    }
    if (val && typeof val === 'object') {
      const entries = Object.entries(val as Record<string, unknown>).map(
        ([k, v]) => `${'  '.repeat(depth + 1)}"${k}": ${stringify(v, depth + 1)}`
      );
      return `{\n${entries.join(',\n')}\n${'  '.repeat(depth)}}`;
    }
    return String(val);
  };

  return (
    <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
      {stringify(data).split('\n').map((line, i) => {
        const keyMatch = line.match(/^(\s*)"([^"]+)":/);
        if (keyMatch) {
          const indent = keyMatch[1];
          const key = keyMatch[2];
          const rest = line.slice(keyMatch[0].length);
          return (
            <span key={i}>
              {indent}
              <span className="text-violet-400">"{key}"</span>
              <span className="text-slate-500">:</span>
              <span className="text-cyan-300">{rest}</span>
              {'\n'}
            </span>
          );
        }
        return <span key={i} className="text-cyan-300">{line}{'\n'}</span>;
      })}
    </pre>
  );
}

function LogLine({ text }: { text: string }) {
  return (
    <div className="flex gap-2 text-xs font-mono text-slate-400">
      <span className="text-cyan-500 shrink-0">›</span>
      <span>{text}</span>
    </div>
  );
}

function AnimatedLogLine({ text, delay }: { text: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!visible) return null;
  return <LogLine text={text} />;
}

const STEP_LOGS: Record<number, string[]> = {
  1: [
    'Agent 1: Request Understanding — "What does student need?"',
    'Calling Python Agent 1 (google.genai / NLP Parser)…',
    'Extracting student intent, organization, timeline & academic prerequisites…',
    'Formatting structured extraction summary for Rule Engine.',
  ],
  2: [
    'Agent 2: Rule & Policy Verification — "What rules apply?"',
    'Calling Python Agent 2 (Strict JSON Policy Validator)…',
    'Querying institutional rulebook (Code: OJT-RULE-SEC4)…',
    'Verifying attendance threshold (84% > 75% prerequisite)…',
    'Enforcing Reverse Hierarchy DAG: 1: Class Teacher ➔ 2: HOD…',
    'Strict JSON schema validated and emitted.',
  ],
  3: [
    'Agent 3: Workflow Planner — "Who needs to do what?"',
    'Building sequential reverse-hierarchy task DAG…',
    'Assigning Stage 1 to Class Teacher (Attendance & Conduct Gate)…',
    'Assigning Stage 2 to HOD (Locked until Stage 1 completion)…',
    'SLA countdown timers and escalation parameters configured.',
  ],
  4: [
    'Agent 4: Document Generator — "Official Document Generator"',
    'Generating formal institutional Letterhead & Training Permit…',
    'Injecting student profile credentials & rulebook citations…',
    'Creating dual digital signature placeholders (Class Teacher + HOD)…',
    'Computing SHA256 cryptographic verification token.',
  ],
  5: [
    'Agent 5: Stakeholder Router — "Reverse Hierarchy Dispatch"',
    'Evaluating prerequisite gate condition (Stage 1 pending)…',
    'Routing active application to Class Teacher desk…',
    'Locking HOD approval capability until predecessor signs…',
    'Application dispatched to reverse hierarchy queue.',
  ],
};

function StepCardDone({
  agentStep,
  stepState,
}: {
  agentStep: typeof AGENT_STEPS[0];
  stepState: StepState;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass rounded-xl overflow-hidden border border-slate-700">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono text-sm font-bold bg-cyan-500/20 text-cyan-400">
            ✓
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-semibold text-sm text-slate-100">
                {agentStep.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                DONE
              </span>
              {stepState.isLiveBackend && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  🐍 Python Agent
                </span>
              )}
              {stepState.duration !== undefined && (
                <span className="text-[10px] font-mono text-slate-500">
                  {(stepState.duration / 1000).toFixed(1)}s
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{agentStep.description}</p>

            {stepState.output && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="mt-2 text-[10px] font-mono text-slate-400 hover:text-cyan-400 transition-colors"
              >
                {expanded ? '▲ Hide output JSON' : '▼ Show output JSON'}
              </button>
            )}
            {expanded && stepState.output && (
              <div className="mt-2 bg-slate-900/80 rounded-lg p-3 border border-slate-800 animate-slide-in">
                <JsonViewer data={stepState.output} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCardLive({
  agentStep,
  stepState,
}: {
  agentStep: typeof AGENT_STEPS[0];
  stepState: StepState;
}) {
  const isActive = stepState.status === 'running';
  const isDone = stepState.status === 'done';
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`glass rounded-xl overflow-hidden transition-all duration-300 ${
        isActive ? 'neon-border-cyan' :
        isDone ? 'border border-slate-700' :
        'border border-slate-800 opacity-40'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono text-sm font-bold ${
            isDone ? 'bg-cyan-500/20 text-cyan-400' :
            isActive ? 'bg-cyan-500/10 text-cyan-400 animate-pulse-glow' :
            'bg-slate-800 text-slate-600'
          }`}>
            {isDone ? '✓' : isActive ? agentStep.icon : agentStep.id}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-display font-semibold text-sm ${isDone || isActive ? 'text-slate-100' : 'text-slate-500'}`}>
                {agentStep.name}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isDone ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                isActive ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-slate-800 text-slate-600'
              }`}>
                {isDone ? 'DONE' : isActive ? 'RUNNING' : 'IDLE'}
              </span>
              {isDone && stepState.isLiveBackend && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  🐍 Python Agent
                </span>
              )}
              {isDone && stepState.duration !== undefined && (
                <span className="text-[10px] font-mono text-slate-500">
                  {(stepState.duration / 1000).toFixed(1)}s
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{agentStep.description}</p>

            {(isActive || isDone) && stepState.log.length > 0 && (
              <div className="mt-3 space-y-1 bg-slate-900/60 rounded-lg p-3">
                {stepState.log.map((line, li) => (
                  <AnimatedLogLine key={li} text={line} delay={li * 100} />
                ))}
                {isActive && (
                  <div className="flex gap-2 text-xs font-mono text-cyan-400">
                    <span>›</span>
                    <span>Connecting Python agent & executing<span className="cursor-blink">_</span></span>
                  </div>
                )}
              </div>
            )}

            {isDone && stepState.output && (
              <>
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="mt-2 text-[10px] font-mono text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  {expanded ? '▲ Hide output JSON' : '▼ Show output JSON'}
                </button>
                {expanded && (
                  <div className="mt-2 bg-slate-900/80 rounded-lg p-3 border border-slate-800 animate-slide-in">
                    <JsonViewer data={stepState.output} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentPipeline({ requestText, cached, studentProfile, attachmentName, onComplete }: AgentPipelineProps) {
  if (cached) {
    return <CachedView cached={cached} />;
  }
  return <LivePipeline requestText={requestText} studentProfile={studentProfile} attachmentName={attachmentName} onComplete={onComplete} />;
}

function CachedView({ cached }: { cached: PipelineRun }) {
  const steps: StepState[] = cached.steps.map(s => ({
    status: 'done',
    output: s.output,
    log: s.log,
    duration: s.duration,
  }));

  return (
    <div className="space-y-5">
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400">PIPELINE EXECUTION (CACHED)</span>
          <span className="text-xs font-mono neon-text-cyan">100%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full progress-bar-fill rounded-full" style={{ width: '100%' }} />
        </div>
        <div className="flex justify-between mt-2">
          {AGENT_STEPS.map(step => (
            <div key={step.id} className="flex flex-col items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-cyan-400 step-dot" />
              <span className="text-[9px] font-mono text-slate-500 hidden sm:block">A{step.id}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {AGENT_STEPS.map((agentStep, i) => (
          <StepCardDone key={agentStep.id} agentStep={agentStep} stepState={steps[i]} />
        ))}
      </div>

      <div className="glass rounded-xl p-5 neon-border-cyan">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-lg text-cyan-400 font-bold">✓</div>
          <div>
            <p className="font-display font-semibold text-cyan-400">Multi-Agent Processing Complete</p>
            <p className="text-sm text-slate-400">
              Request <span className="font-mono text-cyan-300">{cached.requestId}</span> dispatched to Class Teacher desk
              <span className="text-slate-500"> · completed {new Date(cached.completedAt).toLocaleTimeString()}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LivePipeline({
  requestText,
  studentProfile,
  attachmentName,
  onComplete,
}: {
  requestText: string;
  studentProfile: Record<string, unknown>;
  attachmentName: string | null;
  onComplete: (run: PipelineRun) => void;
}) {
  const [steps, setSteps] = useState<StepState[]>(
    AGENT_STEPS.map(() => ({ status: 'idle', output: null, log: [] }))
  );
  const [, setActiveStep] = useState(0);
  const [finalRun, setFinalRun] = useState<PipelineRun | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const mountedRef = useRef(true);
  const startedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Check Python backend connectivity on mount
  useEffect(() => {
    checkBackendHealth().then(h => setBackendOnline(h.online));
  }, []);

  const accumulatedContext = useRef<Record<string, unknown>>({
    student_profile: studentProfile,
    ...(attachmentName ? { attachment_name: attachmentName } : {}),
  });

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timersRef.current = timersRef.current.filter(activeTimer => activeTimer !== timer);
      if (mountedRef.current) callback();
    }, delay);
    timersRef.current.push(timer);
  }, []);

  const runStep = useCallback(async (stepIndex: number, collectedSteps: StepState[]) => {
    if (!mountedRef.current) return;
    const step = AGENT_STEPS[stepIndex];
    const logs = STEP_LOGS[step.id] || [];
    const startedAt = Date.now();

    setSteps(prev => prev.map((s, i) =>
      i === stepIndex ? { ...s, status: 'running', log: [] } : s
    ));

    // Reveal logs sequentially
    logs.forEach((_, li) => {
      schedule(() => {
        setSteps(prev => prev.map((s, i) =>
          i === stepIndex ? { ...s, log: logs.slice(0, li + 1) } : s
        ));
      }, li * 150 + 100);
    });

    // Call Python agent endpoint
    const { output, isLiveBackend } = await callPythonAgent(
      step.id,
      requestText,
      accumulatedContext.current
    );
    if (!mountedRef.current) return;

    // Save outputs in accumulated context for downstream agents
    if (step.id === 1) accumulatedContext.current.agent_1_output = output;
    if (step.id === 2) accumulatedContext.current.agent_2_output = output;
    if (step.id === 3) accumulatedContext.current.agent_3_output = output;
    if (step.id === 4) accumulatedContext.current.agent_4_output = output;

    const elapsed = Date.now() - startedAt;
    const minWait = Math.max(logs.length * 150 + 200, 600);
    const remainingWait = Math.max(0, minWait - elapsed);

    schedule(() => {
      const duration = Date.now() - startedAt;
      const doneStep: StepState = { status: 'done', output, log: logs, duration, isLiveBackend };

      setSteps(prev => prev.map((s, i) => i === stepIndex ? doneStep : s));

      const nextCollected = [...collectedSteps];
      nextCollected[stepIndex] = doneStep;

      if (stepIndex < AGENT_STEPS.length - 1) {
        schedule(() => {
          setActiveStep(stepIndex + 1);
          runStep(stepIndex + 1, nextCollected);
        }, 300);
      } else {
        // All agents finished — generate unique Request ID
        const reqId = (output.requestId as string) || (output.request_id as string) || `REQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 8999 + 1000)}`;
        const run: PipelineRun = {
          requestText,
          requestId: reqId,
          completedAt: new Date().toISOString(),
          steps: nextCollected.map(s => ({
            status: 'done',
            output: s.output ?? {},
            log: s.log,
            duration: s.duration ?? 0,
          })),
        };
        setFinalRun(run);
        schedule(() => onComplete(run), 600);
      }
    }, remainingWait);
  }, [requestText, onComplete, schedule]);

  useEffect(() => {
    mountedRef.current = true;
    if (startedRef.current) return;
    startedRef.current = true;
    runStep(0, AGENT_STEPS.map(() => ({ status: 'idle', output: null, log: [] })));
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [runStep]);

  const doneCount = steps.filter(s => s.status === 'done').length;
  const totalProgress = doneCount / AGENT_STEPS.length;

  return (
    <div className="space-y-5">
      {/* Engine Status Banner */}
      <div className="glass rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-mono border border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse-glow' : 'bg-cyan-400'}`} />
          <span className="text-slate-300">
            {backendOnline ? 'Python Multi-Agent Flask Server Connected (Port 5001)' : 'Multi-Agent Orchestration Engine Active'}
          </span>
        </div>
        <span className="text-cyan-400 text-[10px] hidden sm:inline">
          Reverse Hierarchy Protocol Enforced
        </span>
      </div>

      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400">PIPELINE EXECUTION PROGRESS</span>
          <span className="text-xs font-mono neon-text-cyan">{Math.round(totalProgress * 100)}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full progress-bar-fill rounded-full" style={{ width: `${totalProgress * 100}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          {AGENT_STEPS.map((step, i) => (
            <div key={step.id} className={`flex flex-col items-center gap-1 ${steps[i].status === 'idle' ? 'opacity-30' : ''}`}>
              <div className={`w-2 h-2 rounded-full step-dot transition-all duration-300 ${
                steps[i].status === 'done' ? 'bg-cyan-400' :
                steps[i].status === 'running' ? 'bg-cyan-400 animate-pulse-glow' :
                'bg-slate-600'
              }`} />
              <span className="text-[9px] font-mono text-slate-500 hidden sm:block">A{step.id}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {AGENT_STEPS.map((agentStep, i) => (
          <StepCardLive key={agentStep.id} agentStep={agentStep} stepState={steps[i]} />
        ))}
      </div>

      {finalRun && (
        <div className="glass rounded-xl p-5 neon-border-cyan animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg font-bold">✓</div>
            <div>
              <p className="font-display font-semibold text-cyan-400">Multi-Agent Processing Complete</p>
              <p className="text-sm text-slate-400">
                Request <span className="font-mono text-cyan-300">{finalRun.requestId}</span> queued at Stage 1 (Class Teacher Desk)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
