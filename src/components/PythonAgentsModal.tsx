import { useEffect, useState } from 'react';

const AGENT_1_CODE = `"""
Autonomous Multi-Agent Orchestration System
Agent 1: Request Understanding ("What does student need?")
"""

from typing import Optional, Dict, Any
from google import genai
from google.genai import types


class agent_1:
    """
    Agent 1: Request Understanding.
    Analyzes student requests (free-form text, letters, or attached PDF documents)
    to understand user requirements, intent, dates, company details, and justification.
    """

    DEFAULT_SYSTEM_INSTRUCTION = (
        "You are Agent 1 (Request Understanding Agent) in an Autonomous Multi-Agent Bureaucratic Engine.\\n"
        "Your role: Analyze incoming student requests (e.g., On-Job Training, Internship NOC, Leave, Duty Leave).\\n"
        "Carefully extract:\\n"
        "1. Student Intent & Core Need (What does the student need?)\\n"
        "2. Request Category (e.g., ON_JOB_TRAINING, INTERNSHIP_NOC, MEDICAL_LEAVE, EVENT_DUTY)\\n"
        "3. Host Organization / Company Name (if applicable)\\n"
        "4. Duration / Dates / Timelines\\n"
        "5. Key Justification / Reason provided by student\\n"
        "6. Attached / Mentioned credentials (e.g., offer letter, attendance, CGPA)\\n"
        "Provide a clear, structured analytical summary of the student's request so Agent 2 can perform policy & rule verification."
    )

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        """
        Initialize Agent 1 with the user's Gemini API key.
        """
        if not api_key:
            raise ValueError("An API key is required to initialize agent_1.")
        self.api_key = api_key
        self.model = model
        self.client = genai.Client(api_key=self.api_key)

    def analyze_request(
        self,
        request_input: str,
        document_bytes: Optional[bytes] = None,
        mime_type: str = "application/pdf"
    ) -> str:
        """
        Analyzes the student's input text and optional attached document.
        Returns response.text as per module definitions.
        """
        import { useEffect } from 'react';
        contents = []

          useEffect(() => {
            const handleKeyDown = (event: KeyboardEvent) => {
              if (event.key === 'Escape') onClose();
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
          }, [onClose]);
        if document_bytes:
            contents.append(
                types.Part.from_bytes(
                    data=document_bytes,
                    mime_type=mime_type,
                )
            )

        prompt_text = (
            f"Analyze the following student request and extract all key requirements:\\n\\n"
            f"--- STUDENT REQUEST ---\\n"
            f"{request_input.strip()}\\n"
            f"------------------------\\n\\n"
            f"Provide a structured extraction with sections:\\n"
            f"- REQUEST_TYPE\\n"
            f"- STUDENT_NEED\\n"
            f"- TARGET_ORGANIZATION\\n"
            f"- TIMELINE\\n"
            f"- REASONS_AND_JUSTIFICATIONS\\n"
            f"- KEY_VARIABLES_FOR_RULE_CHECK"
        )
        contents.append(prompt_text)

        response = self.client.models.generate_content(
            model=self.model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=self.DEFAULT_SYSTEM_INSTRUCTION,
                temperature=0.2,
            ),
        )

        return response.text


# Usage Example:
# agent1 = agent_1(api_key="YOUR_GEMINI_API_KEY")
# extracted_text = agent1.analyze_request("I need an on-job training NOC for TCS Bangalore")
`;

const AGENT_2_CODE = `"""
Autonomous Multi-Agent Orchestration System
Agent 2: Rule & Policy Verification ("What rules apply?")
"""

from typing import Optional, Union, Dict, Any, List
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field


class PolicyVerificationResult(BaseModel):
    code: str = Field(
        description="Institutional rule reference code (e.g. 'OJT-RULE-SEC4')"
    )
    eligible: bool = Field(
        description="True if student meets criteria, False otherwise"
    )
    category: str = Field(
        description="Request category, e.g., 'ON_JOB_TRAINING', 'INTERNSHIP_NOC'"
    )
    hierarchy: Dict[str, str] = Field(
        description="Strict reverse hierarchy approval order, e.g. {'1': 'class teacher', '2': 'HOD'}"
    )
    rules_applied: List[str] = Field(
        description="List of specific rule clauses evaluated from policy"
    )
    remarks: str = Field(
        description="Summary of eligibility assessment and guidance for Agent 3"
    )


class agent_2:
    """
    Agent 2: Rule & Policy Verification.
    Reads institutional rulebooks and evaluates the student's request (from Agent 1).
    Produces strict JSON output conforming to reverse hierarchy:
      - code: Institutional reference code (e.g., 'OJT-RULE-SEC4')
      - hierarchy: {"1": "class teacher", "2": "HOD"}
    """

    DEFAULT_RULEBOOK = (
        "INSTITUTIONAL ACADEMIC POLICY & APPROVAL RULES (2024-2025)\\n\\n"
        "SECTION 1: ON-JOB TRAINING & INDUSTRIAL INTERNSHIPS (Code: OJT-RULE-SEC4)\\n"
        "- Eligibility: Minimum 75% attendance and no more than 1 active backlog.\\n"
        "- Approval Protocol (Reverse Hierarchy Requirement):\\n"
        "  * Level 1: Class Teacher endorsement is MANDATORY first (verifies attendance & conduct).\\n"
        "  * Level 2: Head of Department (HOD) final institutional approval. Valid ONLY after Class Teacher signs.\\n"
    )

    SYSTEM_INSTRUCTION = (
        "You are Agent 2 (Rule & Policy Verification Agent).\\n"
        "Evaluate the student's request against the institutional rulebook.\\n"
        "REVERSE HIERARCHY MANDATE:\\n"
        "The ground approver (Class Teacher) MUST endorse first (Level 1)\\n"
        "before the Head of Department (HOD) can sign (Level 2).\\n"
        "Return strict JSON with 'code', 'eligible', and 'hierarchy'."
    )

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        """
        Initialize Agent 2 with user's Gemini API key.
        """
        if not api_key:
            raise ValueError("An API key is required to initialize agent_2.")
        self.api_key = api_key
        self.model = model
        self.client = genai.Client(api_key=self.api_key)

    def verify_rules(
        self,
        extracted_request: str,
        rulebook_resource: Optional[Union[str, bytes]] = None,
        mime_type: str = "application/pdf"
    ) -> Dict[str, Any]:
        """
        Takes Agent 1 output + rulebook resources and returns strict JSON.
        """
        contents = []

        if isinstance(rulebook_resource, bytes):
            contents.append(
                types.Part.from_bytes(
                    data=rulebook_resource,
                    mime_type=mime_type,
                )
            )
            rulebook_text = "Rulebook document attached above."
        elif isinstance(rulebook_resource, str) and rulebook_resource.strip():
            rulebook_text = rulebook_resource.strip()
        else:
            rulebook_text = self.DEFAULT_RULEBOOK

        prompt = (
            f"--- RULEBOOK ---\\n{rulebook_text}\\n\\n"
            f"--- STUDENT REQUEST (FROM AGENT 1) ---\\n{extracted_request.strip()}\\n\\n"
            f"Task: Verify rules, determine eligibility, and return strict JSON with code and reverse hierarchy."
        )
        contents.append(prompt)

        response = self.client.models.generate_content(
            model=self.model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=self.SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=PolicyVerificationResult,
                temperature=0.1,
            ),
        )

        return json.loads(response.text)


# Usage Example:
# agent2 = agent_2(api_key="YOUR_GEMINI_API_KEY")
# result_json = agent2.verify_rules(extracted_text)
# print(result_json["code"])        # "OJT-RULE-SEC4"
# print(result_json["hierarchy"])   # {"1": "class teacher", "2": "HOD"}
`;

export default function PythonAgentsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const [activeTab, setActiveTab] = useState<'agent1' | 'agent2' | 'schema'>('agent1');
  const [copied, setCopied] = useState(false);

  const currentCode = activeTab === 'agent1' ? AGENT_1_CODE : AGENT_2_CODE;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Python multi-agent engine"
      style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col glass rounded-2xl overflow-hidden border border-cyan-500/30"
        style={{ boxShadow: '0 0 50px rgba(34,211,238,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-bold">
              Py
            </div>
            <div>
              <h2 className="text-sm font-display font-bold text-slate-100">Python Multi-Agent Engine</h2>
              <p className="text-[11px] font-mono text-slate-400">
                google.genai module · Strict Reverse Hierarchy Output Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs font-mono px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 transition-colors flex items-center gap-1.5"
            >
              {copied ? '✓ Copied to Clipboard!' : '📋 Copy Python Code'}
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2">
          <button
            onClick={() => setActiveTab('agent1')}
            className={`px-4 py-2 text-xs font-mono border-b-2 transition-all ${
              activeTab === 'agent1'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            agent_1.py (Request Understanding)
          </button>
          <button
            onClick={() => setActiveTab('agent2')}
            className={`px-4 py-2 text-xs font-mono border-b-2 transition-all ${
              activeTab === 'agent2'
                ? 'border-violet-400 text-violet-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            agent_2.py (Rule & Reverse Hierarchy JSON)
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2 text-xs font-mono border-b-2 transition-all ${
              activeTab === 'schema'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Strict JSON Schema Specification
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-950/80 font-mono text-xs text-slate-300 leading-relaxed">
          {activeTab !== 'schema' ? (
            <pre className="whitespace-pre-wrap">{currentCode}</pre>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-cyan-400 font-bold mb-2">Agent 2 Strict Output Schema for Agent 3:</p>
                <pre className="text-emerald-400 bg-slate-950 p-4 rounded-lg overflow-x-auto">
{`{
  "code": "OJT-RULE-SEC4",
  "eligible": true,
  "category": "ON_JOB_TRAINING",
  "hierarchy": {
    "1": "class teacher",
    "2": "HOD"
  },
  "rules_applied": [
    "Rule 4.1: Mandatory Class Teacher endorsement for attendance (>75%) & conduct",
    "Rule 4.2: HOD final approval and departmental NOC issuance (unlocked only after Level 1)"
  ],
  "remarks": "Reverse hierarchy active: Class teacher signature must precede HOD approval."
}`}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 space-y-2">
                <p className="font-bold text-slate-100">Key Architectural Highlights:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>
                    <strong className="text-cyan-400">google.genai SDK</strong>: Uses modern official Google GenAI module with <code className="text-slate-200">genai.Client(api_key=...)</code>.
                  </li>
                  <li>
                    <strong className="text-violet-400">Pydantic Structured Outputs</strong>: Guaranteed valid JSON response conforming to <code className="text-slate-200">PolicyVerificationResult</code>.
                  </li>
                  <li>
                    <strong className="text-emerald-400">Reverse Hierarchy</strong>: Low-level approver (Class Teacher) is ordered at rank 1, higher authority (HOD) at rank 2. The pipeline guarantees HOD approval is locked until Class Teacher signs.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

