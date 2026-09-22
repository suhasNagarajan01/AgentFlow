/**
 * AgentFlow Multi-Agent API Client
 * Connects React frontend to the Python Multi-Agent Flask backend (http://127.0.0.1:5001).
 * Falls back dynamically to local client-side processing if backend is unavailable.
 */

import { simulateAgentOutput } from '../data/mockData';

const API_BASE_URL = 'http://127.0.0.1:5001/api';

export interface BackendHealth {
  online: boolean;
  service?: string;
  has_gemini_key?: boolean;
  version?: string;
  agents?: string[];
}

/**
 * Checks if the Python Flask backend is running.
 */
export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { online: true, ...data };
    }
    return { online: false };
  } catch {
    return { online: false };
  }
}

/**
 * Calls a specific Python agent (1-5) via HTTP endpoint, with graceful local fallback.
 */
export async function callPythonAgent(
  stepId: number,
  requestText: string,
  context?: Record<string, unknown>,
  apiKey?: string
): Promise<{ output: Record<string, unknown>; isLiveBackend: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let endpoint = `${API_BASE_URL}/agent/${stepId}`;
    let body: Record<string, unknown> = {
      request_text: requestText,
      api_key: apiKey,
      ...context,
    };

    if (stepId === 2) {
      body.agent_1_summary = context?.agent_1_output || requestText;
    } else if (stepId === 3) {
      body.agent_2_policy = context?.agent_2_output || {};
      body.student_profile = context?.student_profile;
    } else if (stepId === 4) {
      body.request_id = context?.request_id || `REQ-2024-${Math.floor(Math.random() * 8999 + 1000)}`;
      body.agent_2_policy = context?.agent_2_output || {};
      body.agent_3_plan = context?.agent_3_output || {};
      body.student_profile = context?.student_profile;
    } else if (stepId === 5) {
      body.agent_3_plan = context?.agent_3_output || {};
      body.current_signatures = context?.current_signatures || { 'class teacher': false, HOD: false };
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['X-Gemini-API-Key'] = apiKey;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { output: data, isLiveBackend: true };
    }
  } catch {
    // Backend offline or timeout -> use local simulation
  }

  // Fallback to local simulated output
  const output = simulateAgentOutput(stepId, requestText);
  return { output, isLiveBackend: false };
}

/**
 * Executes full 5-agent pipeline on the Python backend.
 */
export async function executeFullPythonPipeline(
  requestText: string,
  studentProfile?: Record<string, unknown>,
  apiKey?: string
): Promise<{ result: Record<string, unknown>; isLiveBackend: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['X-Gemini-API-Key'] = apiKey;

    const res = await fetch(`${API_BASE_URL}/pipeline`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        request_text: requestText,
        student_profile: studentProfile,
        api_key: apiKey,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { result: data, isLiveBackend: true };
    }
  } catch {
    // Backend offline
  }

  return {
    result: {
      agent_1_understanding: simulateAgentOutput(1, requestText),
      agent_2_policy: simulateAgentOutput(2, requestText),
      agent_3_plan: simulateAgentOutput(3, requestText),
      agent_4_doc: simulateAgentOutput(4, requestText),
      agent_5_routing: simulateAgentOutput(5, requestText),
    },
    isLiveBackend: false,
  };
}

