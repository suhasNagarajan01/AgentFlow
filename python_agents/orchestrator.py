"""
Autonomous Multi-Agent Orchestration Pipeline
Demonstrating the full 5-agent flow:
Student -> Agent 1 -> Agent 2 -> Agent 3 -> Agent 4 -> Agent 5 -> Stakeholder Queues (Reverse Hierarchy Enforced)
"""

import os
import sys
import json
from typing import Optional, Dict, Any

from python_agents.agent_1 import agent_1
from python_agents.agent_2 import agent_2
from python_agents.agents_3_4_5 import agent_3, agent_4, agent_5


class MultiAgentPipeline:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.agent1 = agent_1(api_key=self.api_key) if self.api_key else None
        self.agent2 = agent_2(api_key=self.api_key) if self.api_key else None
        self.agent3 = agent_3()
        self.agent4 = agent_4()
        self.agent5 = agent_5()

    def run_simulated_pipeline(self, request_text: str, student_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Runs the full 5-agent flow in standalone mode (useful for testing or fallback).
        """
        if not student_profile:
            student_profile = {
                "name": "Alex Chen",
                "usn": "1AT21CS042",
                "department": "Computer Science & Engineering",
                "attendance": "84%"
            }

        # Step 1: Agent 1 (Request Understanding)
        agent_1_output = (
            f"REQUEST_TYPE: ON_JOB_TRAINING\n"
            f"STUDENT_NEED: Permission and NOC to participate in a 6-month On-Job Training / Internship\n"
            f"TARGET_ORGANIZATION: TCS Research & Innovation Labs, Bangalore\n"
            f"TIMELINE: July 1 to December 31, 2024\n"
            f"REASONS_AND_JUSTIFICATIONS: Industry project capstone; offer letter provided; student has 84% attendance.\n"
            f"KEY_VARIABLES_FOR_RULE_CHECK: Semester 7, attendance > 75%, no active backlogs."
        )

        # Step 2: Agent 2 (Rule & Policy Verification with Reverse Hierarchy)
        agent_2_output = {
            "code": "OJT-RULE-SEC4",
            "eligible": True,
            "category": "ON_JOB_TRAINING",
            "hierarchy": {
                "1": "class teacher",
                "2": "HOD"
            },
            "rules_applied": [
                "Rule 4.1: Mandatory Class Teacher endorsement for attendance (>75%) & conduct",
                "Rule 4.2: HOD final approval and departmental NOC issuance (valid only after Level 1 signature)"
            ],
            "remarks": "Eligible for On-Job Training. Reverse hierarchy enforced: Level 1 must sign before Level 2 is unlocked."
        }

        # Step 3: Agent 3 (Workflow Planner)
        agent_3_output = self.agent3.plan_workflow(agent_2_output, student_profile)

        # Step 4: Agent 4 (Document Generator)
        req_id = "REQ-2024-9182"
        agent_4_output = self.agent4.generate_document(req_id, student_profile, agent_2_output, agent_3_output)

        # Step 5: Agent 5 (Stakeholder Router)
        current_signatures = {"class teacher": False, "HOD": False}
        agent_5_output = self.agent5.route_request(agent_3_output, current_signatures)

        return {
            "request_id": req_id,
            "request_text": request_text,
            "agent_1_understanding": agent_1_output,
            "agent_2_policy": agent_2_output,
            "agent_3_plan": agent_3_output,
            "agent_4_doc": agent_4_output,
            "agent_5_routing": agent_5_output,
        }

    def run_live_pipeline(self, request_text: str, student_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Runs the pipeline with live Gemini API calls through Agent 1 and Agent 2.
        """
        if not self.agent1 or not self.agent2:
            raise ValueError("Live pipeline requires a valid GEMINI_API_KEY.")

        if not student_profile:
            student_profile = {
                "name": "Alex Chen",
                "usn": "1AT21CS042",
                "department": "Computer Science & Engineering"
            }

        # Step 1: Agent 1 analyzes input
        agent_1_text = self.agent1.analyze_request(request_text)

        # Step 2: Agent 2 checks rulebook & produces strict reverse-hierarchy JSON
        agent_2_json = self.agent2.verify_rules(agent_1_text)

        # Step 3: Agent 3 plans workflow
        agent_3_plan = self.agent3.plan_workflow(agent_2_json, student_profile)

        # Step 4: Agent 4 generates official document
        req_id = f"REQ-{agent_3_plan['workflow_id'][-4:]}"
        agent_4_doc = self.agent4.generate_document(req_id, student_profile, agent_2_json, agent_3_plan)

        # Step 5: Agent 5 routes to first gate
        agent_5_route = self.agent5.route_request(agent_3_plan, {"class teacher": False})

        return {
            "request_id": req_id,
            "agent_1_understanding": agent_1_text,
            "agent_2_policy": agent_2_json,
            "agent_3_plan": agent_3_plan,
            "agent_4_doc": agent_4_doc,
            "agent_5_routing": agent_5_route,
        }


if __name__ == "__main__":
    print("=" * 70)
    print("AUTONOMOUS MULTI-AGENT ORCHESTRATION PIPELINE TEST")
    print("=" * 70)

    sample_prompt = (
        "I am applying for on-job training at TCS Research Bangalore from July 1 "
        "to Dec 31, 2024. My 6th semester CGPA is 8.7 and current attendance is 84%. "
        "Attached is my internship offer letter. Please approve."
    )

    pipeline = MultiAgentPipeline()
    result = pipeline.run_simulated_pipeline(sample_prompt)

    print("\n[AGENT 1: Request Understanding Output]:")
    print(result["agent_1_understanding"])

    print("\n[AGENT 2: Rule & Policy Verification Strict JSON]:")
    print(json.dumps(result["agent_2_policy"], indent=2))

    print("\n[AGENT 3: Workflow Plan]:")
    print(f"Workflow ID: {result['agent_3_plan']['workflow_id']}")
    print(f"Stages: {len(result['agent_3_plan']['stages'])}")
    for stage in result["agent_3_plan"]["stages"]:
        print(f"  Stage {stage['stage']}: {stage['role']} -> {stage['gate_status']}")

    print("\n[AGENT 5: Stakeholder Routing & Gate Enforcement]:")
    print(f"Active Desk: {result['agent_5_routing']['current_active_desk']}")
    print(f"HOD Gate Status: {result['agent_5_routing']['hod_gate_status']}")
    print("=" * 70)

