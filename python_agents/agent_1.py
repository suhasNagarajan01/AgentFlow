"""
Autonomous Multi-Agent Orchestration System
Agent 1: Request Understanding ("What does student need?")
"""

from typing import Optional, Union, Dict, Any
import json
from google import genai
from google.genai import types


class agent_1:
    """
    Agent 1: Request Understanding.
    Analyzes student requests (free-form text, letters, or attached PDF documents)
    to understand user requirements, intent, dates, company details, and justification.
    """

    DEFAULT_SYSTEM_INSTRUCTION = (
        "You are Agent 1 (Request Understanding Agent) in an Autonomous Multi-Agent Bureaucratic Engine.\n"
        "Your role: Analyze incoming student requests (e.g., On-Job Training, Internship NOC, Leave, Duty Leave).\n"
        "Carefully extract:\n"
        "1. Student Intent & Core Need (What does the student need?)\n"
        "2. Request Category (e.g., ON_JOB_TRAINING, INTERNSHIP_NOC, MEDICAL_LEAVE, EVENT_DUTY)\n"
        "3. Host Organization / Company Name (if applicable)\n"
        "4. Duration / Dates / Timelines\n"
        "5. Key Justification / Reason provided by student\n"
        "6. Attached / Mentioned credentials (e.g., offer letter, attendance, CGPA)\n"
        "Provide a clear, structured analytical summary of the student's request so Agent 2 can perform policy & rule verification."
    )

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        """
        Initialize Agent 1 with the user's Gemini API key.
        
        Args:
            api_key: Google Gemini API key.
            model: Model identifier (default: gemini-2.5-flash).
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
        
        Args:
            request_input: The text submitted by the student.
            document_bytes: Optional raw bytes of an uploaded file (e.g. offer letter PDF).
            mime_type: MIME type of the document (default: application/pdf).
            
        Returns:
            Structured text output containing the parsed request requirements.
        """
        contents = []

        if document_bytes:
            contents.append(
                types.Part.from_bytes(
                    data=document_bytes,
                    mime_type=mime_type,
                )
            )

        prompt_text = (
            f"Analyze the following student request and extract all key requirements:\n\n"
            f"--- STUDENT REQUEST ---\n"
            f"{request_input.strip()}\n"
            f"------------------------\n\n"
            f"Provide a structured extraction with sections:\n"
            f"- REQUEST_TYPE\n"
            f"- STUDENT_NEED\n"
            f"- TARGET_ORGANIZATION\n"
            f"- TIMELINE\n"
            f"- REASONS_AND_JUSTIFICATIONS\n"
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

    @staticmethod
    def extract_summary_fields(analysis_text: str) -> Dict[str, str]:
        """
        Utility helper to extract labeled sections from Agent 1's text output.
        """
        fields = {}
        current_key = "GENERAL"
        lines = analysis_text.splitlines()
        for line in lines:
            line_str = line.strip()
            if line_str.startswith("- ") and ":" in line_str:
                parts = line_str[2:].split(":", 1)
                current_key = parts[0].strip()
                fields[current_key] = parts[1].strip()
            elif ":" in line_str and line_str.isupper():
                parts = line_str.split(":", 1)
                current_key = parts[0].strip()
                fields[current_key] = parts[1].strip()
        return fields


if __name__ == "__main__":
    import sys
    print("Agent 1 (Request Understanding) initialized successfully.")
    print("Usage: agent = agent_1(api_key='YOUR_API_KEY')")
    print("       analysis = agent.analyze_request('I need on-job training permission for TCS from July to Dec')")

