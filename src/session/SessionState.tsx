import { createContext, useContext, useSyncExternalStore } from 'react';
import type { Request } from '../data/mockData';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineRun {
  requestText: string;
  requestId: string;
  completedAt: string;
  steps: Array<{
    status: 'done';
    output: Record<string, unknown>;
    log: string[];
    duration: number;
  }>;
}

export interface SessionData {
  portal: 'landing' | 'student' | 'admin';
  adminRole: string;
  studentTab: 'apply' | 'requests';
  applyState: 'input' | 'running' | 'done';
  lastRequestText: string;
  droppedFile: string | null;
  submittedRequests: Request[];
  // keyed by a stable hash of the request text
  pipelineCache: Record<string, PipelineRun>;
  expandedAdminCard: string | null;
  adminActions: Record<string, 'APPROVED' | 'REJECTED' | 'REVISION'>;
  adminRevisionNotes: Record<string, string>;
  signaturesRecord: Record<string, { classTeacher?: boolean; hod?: boolean; classTeacherTime?: string; hodTime?: string }>;
}

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

const DEFAULT: SessionData = {
  portal: 'landing',
  adminRole: 'class_teacher',
  studentTab: 'apply',
  applyState: 'input' as 'input' | 'running' | 'done',
  lastRequestText: '',
  droppedFile: null,
  submittedRequests: [],
  pipelineCache: {},
  expandedAdminCard: null,
  adminActions: {},
  adminRevisionNotes: {},
  signaturesRecord: {},
};

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const KEY = 'agentflow_session';

function load(): SessionData {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

function save(data: SessionData) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // quota exceeded — silent
  }
}

// Simple stable hash for request text
export function hashText(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return 'r' + Math.abs(h).toString(36);
}

// ---------------------------------------------------------------------------
// Store (singleton outside React tree)
// ---------------------------------------------------------------------------

type Listener = () => void;

function createStore() {
  let state = load();
  const listeners = new Set<Listener>();

  function getSnapshot() {
    return state;
  }

  function subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function set<K extends keyof SessionData>(key: K, value: SessionData[K]) {
    state = { ...state, [key]: value };
    save(state);
    listeners.forEach(l => l());
  }

  function patch(partial: Partial<SessionData>) {
    state = { ...state, ...partial };
    save(state);
    listeners.forEach(l => l());
  }

  function reset() {
    state = { ...DEFAULT };
    sessionStorage.removeItem(KEY);
    listeners.forEach(l => l());
  }

  return { getSnapshot, subscribe, set, patch, reset };
}

const store = createStore();

// ---------------------------------------------------------------------------
// Context + hook
// ---------------------------------------------------------------------------

const Ctx = createContext<typeof store>(store);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useSession() {
  const s = useContext(Ctx);
  const state = useSyncExternalStore(s.subscribe, s.getSnapshot);
  return { state, set: s.set, patch: s.patch, reset: s.reset };
}
