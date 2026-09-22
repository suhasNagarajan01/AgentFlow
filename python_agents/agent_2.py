"""
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
        description="Institutional rule/policy reference code (e.g., 'OJT-RULE-SEC4', 'LEAVE-MED-02')"
    )
    eligible: bool = Field(
        description="True if student meets the minimum prerequisites, False otherwise"
    )
    category: str = Field(
        description="Classified request category, e.g., 'ON_JOB_TRAINING', 'INTERNSHIP_NOC', 'MEDICAL_LEAVE'"
    )
    hierarchy: Dict[str, str] = Field(
        description="Strict reverse hierarchy order of required approval authorities (e.g. {'1': 'class teacher', '2': 'HOD'})"
    )
    rules_applied: List[str] = Field(
        description="List of specific rule clauses evaluated from the policy document or rulebook"
    )
    remarks: str = Field(
        description="Summary of eligibility assessment and guidance for Agent 3 workflow planner"
    )


class agent_2:
    """
    Agent 2: Rule & Policy Verification.
    Reads institutional rulebooks, circulars, or policy resources (text/PDF)
    and evaluates the student's request (from Agent 1).
    Produces a strict JSON output with code-based referencing:
      - code: Institutional reference code (e.g., 'OJT-RULE-SEC4')
      - eligible: Boolean eligibility status
      - hierarchy: Ordered reverse hierarchy (e.g., {"1": "class teacher", "2": "HOD"})
    """

    DEFAULT_RULEBOOK = (
        "INSTITUTIONAL ACADEMIC POLICY & APPROVAL RULES (2024-2025)\n\n"
        "SECTION 1: ON-JOB TRAINING & INDUSTRIAL INTERNSHIPS (Code: OJT-RULE-SEC4)\n"
        "- Eligibility: Students in 6th/7th/8th semester with minimum 75% attendance and no more than 1 active backlog.\n"
        "- Approval Protocol (Reverse Hierarchy Requirement):\n"
        "  * Level 1: Class Teacher endorsement is MANDATORY first. The Class Teacher must verify student attendance and class conduct.\n"
        "  * Level 2: Head of Department (HOD) final institutional approval. The HOD approval becomes valid ONLY AFTER the Class Teacher has signed and forwarded.\n"
        "  * Higher authorities (Dean/Principal) are only notified for out-of-state or international internships.\n\n"
        "SECTION 2: MEDICAL LEAVE (Code: LEAVE-MED-02)\n"
        "- Eligibility: Requires valid registered medical practitioner certificate.\n"
        "- Approval Protocol:\n"
        "  * Level 1: Class Teacher (checks missed labs/classes).\n"
        "  * Level 2: HOD (grants attendance relaxation).\n\n"
        "SECTION 3: EVENT DUTY LEAVE (Code: DUTY-EVENT-05)\n"
        "- Eligibility: Prior authorization from faculty coordinator.\n"
        "- Approval Protocol:\n"
        "  * Level 1: Faculty Coordinator.\n"
        "  * Level 2: Class Teacher.\n"
        "  * Level 3: HOD.\n"
    )

    SYSTEM_INSTRUCTION = (
        "You are Agent 2 (Rule & Policy Verification Agent) in an Autonomous Multi-Agent Bureaucratic Engine.\n"
        "Your role: Evaluate the student's parsed request (from Agent 1) against the provided institutional rulebook.\n"
        "IMPORTANT REVERSE HIERARCHY RULE:\n"
        "Signatures must follow reverse hierarchy priority:\n"
        "Lower-level ground approvers MUST approve first before higher authorities sign.\n"
        "For example, for On-Job Training (OJT), the Class Teacher must endorse attendance first (Level 1),\n"
        "and only then can the Head of Department (HOD) grant final approval (Level 2).\n\n"
        "OUTPUT FORMAT REQUIREMENTS:\n"
        "You must return strict JSON conforming to the schema:\n"
        "{\n"
        '  "code": "<INSTITUTIONAL_RULE_CODE>",\n'
        '  "eligible": true | false,\n'
        '  "category": "<REQUEST_CATEGORY>",\n'
        '  "hierarchy": {\n'
        '    "1": "class teacher",\n'
        '    "2": "HOD"\n'
        "  },\n"
        '  "rules_applied": ["<rule 1>", "<rule 2>"],\n'
        '  "remarks": "<clear explanation>"\n'
        "}"
    )

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        """
        Initialize Agent 2 with the user's Gemini API key.
        
        Args:
            api_key: Google Gemini API key.
            model: Model identifier (default: gemini-2.5-flash).
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
        Evaluates the request against the rulebook and returns strict JSON.
        
        Args:
            extracted_request: Output text or prompt from Agent 1.
            rulebook_resource: Optional custom rulebook text or PDF bytes.
                              Defaults to institutional handbook if None.
            mime_type: MIME type if rulebook_resource is bytes (e.g. application/pdf).
            
        Returns:
            Dictionary containing code, eligible, hierarchy (reverse order), and rules_applied.
        """
        contents = []

        # Include rulebook
        if isinstance(rulebook_resource, bytes):
            contents.append(
                types.Part.from_bytes(
                    data=rulebook_resource,
                    mime_type=mime_type,
                )
            )
            rulebook_context = "Institutional rulebook document is attached above."
        elif isinstance(rulebook_resource, str) and rulebook_resource.strip():
            rulebook_context = f"--- RULEBOOK / POLICY RESOURCE ---\n{rulebook_resource.strip()}\n"
        else:
            rulebook_context = f"--- DEFAULT INSTITUTIONAL POLICY ---\n{self.DEFAULT_RULEBOOK.strip()}\n"

        prompt = (
            f"{rulebook_context}\n\n"
            f"--- STUDENT REQUEST DATA (FROM AGENT 1) ---\n"
            f"{extracted_request.strip()}\n\n"
            f"--- VERIFICATION TASK ---\n"
            f"1. Match against applicable rule in the rulebook.\n"
            f"2. Determine eligibility.\n"
            f"3. Build the reverse hierarchy chain where level 1 must endorse before level 2 can sign.\n"
            f"4. Provide the exact rule code in the 'code' field and reverse hierarchy in 'hierarchy' field.\n"
            f"Output strict JSON according to the schema."
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

        try:
            return json.loads(response.text)
        except Exception:
            # Fallback parsing in case of markdown fence wrapping
            clean_text = response.text.strip()
            if clean_text.startswith("```"):
                clean_text = clean_text.split("```")[1]
                if clean_text.startswith("json"):
                    clean_text = clean_text[4:]
            return json.loads(clean_text)

    @staticmethod
    def get_prerequisite_roles(hierarchy: Dict[str, str]) -> List[str]:
        """
        Returns the ordered list of roles in reverse hierarchy order (Stage 1 -> Stage 2 -> etc.).
        """
        sorted_keys = sorted(hierarchy.keys(), key=lambda k: int(k) if k.isdigit() else k)
        return [hierarchy[k] for k in sorted_keys]


if __name__ == "__main__":
    print("Agent 2 (Rule & Policy Verification) initialized successfully.")
    print("Usage: agent = agent_2(api_key='YOUR_API_KEY')")
    print("       result = agent.verify_rules('On-job training at TCS for 8th sem student')")

