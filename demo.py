"""
Autonomous Multi-Agent Orchestration System for Bureaucratic Bottlenecks
Demonstration & Test Script

Usage:
    # 1. Run simulated multi-agent test:
    python demo.py

    # 2. Run live Gemini API test (requires API key):
    python demo.py YOUR_GEMINI_API_KEY
"""

import sys
import json
from python_agents import agent_1, agent_2, agent_3, agent_4, agent_5, MultiAgentPipeline


def run_demo(api_key: str = ""):
    print("=" * 75)
    print("  AUTONOMOUS MULTI-AGENT ORCHESTRATION ENGINE (REVERSE HIERARCHY)")
    print("=" * 75)

    sample_request = (
        "I am Alex Chen (USN: 1AT21CS042), a 7th semester student in Computer Science & "
        "Engineering. I have received an offer for a 6-month On-Job Training (OJT) / "
        "industrial internship at TCS Research & Innovation Labs, Bangalore starting "
        "July 1, 2024. My current attendance is 84% with 0 backlogs. "
        "I request permission and an institutional No Objection Certificate (NOC)."
    )

    print("\n[INPUT: Student Application Text]:")
    print(f'"{sample_request}"\n')

    if api_key:
        print(f"Running in LIVE GEMINI MODE with API Key ({api_key[:6]}...)...")
        pipeline = MultiAgentPipeline(api_key=api_key)
        result = pipeline.run_live_pipeline(sample_request)
    else:
        print("Running in STANDALONE ORCHESTRATION MODE...")
        pipeline = MultiAgentPipeline()
        result = pipeline.run_simulated_pipeline(sample_request)

    print("-" * 75)
    print("STAGE 1: AGENT 1 (Request Understanding) - 'What does student need?'")
    print("-" * 75)
    print(result["agent_1_understanding"])

    print("\n" + "-" * 75)
    print("STAGE 2: AGENT 2 (Rule & Policy Verification) - 'What rules apply?'")
    print("-" * 75)
    print("Strict JSON Output conforming to schema:")
    print(json.dumps(result["agent_2_policy"], indent=2))
    print(f"\nRule Reference Code: {result['agent_2_policy']['code']}")
    print(f"Reverse Hierarchy DAG: {result['agent_2_policy']['hierarchy']}")

    print("\n" + "-" * 75)
    print("STAGE 3: AGENT 3 (Workflow Planner) - 'Who needs to do what?'")
    print("-" * 75)
    for stage in result["agent_3_plan"]["stages"]:
        print(f"  Stage {stage['stage']}: {stage['role']} -> Status: {stage['gate_status']} (SLA: {stage['sla_hours']}h)")

    print("\n" + "-" * 75)
    print("STAGE 4: AGENT 4 (Document Generator) - Official Letter Generation")
    print("-" * 75)
    print(f"Document Type: {result['agent_4_doc']['document_type']}")
    print(f"Reference No: {result['agent_4_doc']['reference_number']}")
    print("Signature Slots Generated:")
    for slot in result["agent_4_doc"]["signature_blocks"]:
        print(f"  Slot {slot['level']}: {slot['role']} -> {slot['status']}")

    print("\n" + "-" * 75)
    print("STAGE 5: AGENT 5 (Stakeholder Router) - Reverse Hierarchy Gate Enforcement")
    print("-" * 75)
    print(f"Current Active Desk: {result['agent_5_routing']['current_active_desk']}")
    print(f"HOD Approval Gate: {result['agent_5_routing']['hod_gate_status']}")
    print("Notice: HOD cannot sign before Class Teacher endorsement is recorded.")
    print("=" * 75)


if __name__ == "__main__":
    key = sys.argv[1] if len(sys.argv) > 1 else ""
    run_demo(key)

