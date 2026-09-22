"""
AgentFlow Multi-Agent Flask API Server
Bridges Python Multi-Agent Orchestration Engine with React Frontend.
"""

import os
import sys
import json
import logging
import traceback
from typing import Dict, Any, Optional
from flask import Flask, request, jsonify
from flask_cors import CORS

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from python_agents.agent_1 import agent_1
from python_agents.agent_2 import agent_2
from python_agents.agents_3_4_5 import agent_3, agent_4, agent_5
from python_agents.orchestrator import MultiAgentPipeline

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("AgentFlowAPI")

app = Flask(__name__)
# Enable CORS for all routes (Vite dev server and preview)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Global reusable agent instances
pipeline_instance = MultiAgentPipeline()


def get_api_key(req) -> Optional[str]:
    """Helper to extract API key from header or JSON body or env."""
    return (
        req.headers.get("X-Gemini-API-Key")
        or (req.json.get("api_key") if req.is_json else None)
        or os.environ.get("GEMINI_API_KEY")
    )


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "online",
        "service": "AgentFlow Python Multi-Agent Engine",
        "version": "1.0.0",
        "has_gemini_key": bool(os.environ.get("GEMINI_API_KEY")),
        "agents": [
            "Agent 1: Request Understanding",
            "Agent 2: Rule & Policy Verification (Strict JSON)",
            "Agent 3: Workflow Planner",
            "Agent 4: Document Generator",
            "Agent 5: Stakeholder Router (Reverse Hierarchy)"
        ]
    })


@app.route("/api/agent/1", methods=["POST"])
def run_agent_1():
    """Execute Agent 1: Request Understanding."""
    try:
        data = request.get_json(force=True) or {}
        request_text = data.get("request_text", "").strip()
        if not request_text:
            return jsonify({"error": "request_text is required"}), 400

        api_key = get_api_key(request)

        # If live API key is available, run live Gemini
        if api_key:
            try:
                agent = agent_1(api_key=api_key)
                analysis_text = agent.analyze_request(request_text)
                fields = agent_1.extract_summary_fields(analysis_text)
                return jsonify({
                    "agent": "Agent 1 (Request Understanding)",
                    "mode": "live_gemini",
                    "analysis": analysis_text,
                    "extracted": fields,
                    "request_text": request_text
                })
            except Exception as e:
                logger.warning(f"Live Agent 1 failed ({e}), falling back to dynamic simulated engine.")

        # Dynamic intelligent parsing fallback
        is_ojt = any(kw in request_text.lower() for kw in ["job", "intern", "tcs", "offer", "company", "placement", "industry"])
        is_medical = any(kw in request_text.lower() for kw in ["medical", "fever", "hospital", "sick", "doctor", "health"])
        is_event = any(kw in request_text.lower() for kw in ["hackathon", "competition", "conference", "sih", "event", "paper"])

        category = "ON_JOB_TRAINING" if is_ojt else "MEDICAL_LEAVE" if is_medical else "DUTY_LEAVE" if is_event else "GENERAL_PERMISSION"

        output = {
            "agent": "Agent 1 (Request Understanding)",
            "mode": "python_engine",
            "intent": f"{category}_PERMISSION",
            "category": category,
            "extractedNeeds": [
                "Formal Institutional Permission Letter",
                "No Objection Certificate (NOC)" if is_ojt else "Attendance Waiver",
                "Departmental Sanction Record"
            ],
            "extractedDetails": {
                "organization": "TCS Research & Innovation Labs" if "tcs" in request_text.lower() else "Industry Partner" if is_ojt else "Academic/Event Host",
                "timeline": "6 Months (July - Dec 2024)" if is_ojt else "Short Term Duration",
                "justification": "Curriculum capstone & industry career development" if is_ojt else "Official event representation / medical compliance"
            },
            "confidenceScore": 0.98,
            "status": "COMPLETED"
        }
        return jsonify(output)

    except Exception as e:
        logger.error(f"Error in /api/agent/1: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/agent/2", methods=["POST"])
def run_agent_2():
    """Execute Agent 2: Rule & Policy Verification (Strict Reverse-Hierarchy JSON)."""
    try:
        data = request.get_json(force=True) or {}
        request_text = data.get("request_text", "")
        agent_1_summary = data.get("agent_1_summary", request_text)
        api_key = get_api_key(request)

        if api_key:
            try:
                agent = agent_2(api_key=api_key)
                policy_json = agent.verify_rules(agent_1_summary)
                return jsonify({
                    "agent": "Agent 2 (Rule & Policy Verification)",
                    "mode": "live_gemini",
                    **policy_json
                })
            except Exception as e:
                logger.warning(f"Live Agent 2 failed ({e}), falling back to dynamic policy engine.")

        is_ojt = any(kw in request_text.lower() for kw in ["job", "intern", "tcs", "offer", "company", "placement"])
        rule_code = "OJT-RULE-SEC4" if is_ojt else "DUTY-EVENT-05" if "hackathon" in request_text.lower() else "LEAVE-POLICY-GEN"

        output = {
            "agent": "Agent 2 (Rule & Policy Verification)",
            "mode": "python_engine",
            "code": rule_code,
            "eligible": True,
            "category": "ON_JOB_TRAINING" if is_ojt else "DUTY_LEAVE",
            "hierarchy": {
                "1": "class teacher",
                "2": "HOD"
            },
            "rules_applied": [
                f"Rule 4.1 ({rule_code}): Mandatory Class Teacher endorsement for attendance & conduct",
                f"Rule 4.2 ({rule_code}): HOD executive sanction & departmental NOC issuance (valid only after Level 1 signature)"
            ],
            "prerequisites": [
                {"stage": 1, "role": "class teacher", "requirement": "Attendance verified (>75%), conduct verified"},
                {"stage": 2, "role": "HOD", "requirement": "Departmental curriculum alignment and official seal"}
            ],
            "remarks": "Student qualifies for all prerequisite criteria. Reverse hierarchy enforced: HOD signature locked until Class Teacher signs."
        }
        return jsonify(output)

    except Exception as e:
        logger.error(f"Error in /api/agent/2: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/agent/3", methods=["POST"])
def run_agent_3():
    """Execute Agent 3: Workflow Planner."""
    try:
        data = request.get_json(force=True) or {}
        agent_2_policy = data.get("agent_2_policy", {})
        student_profile = data.get("student_profile", {
            "name": "Alex Chen",
            "usn": "1AT21CS042",
            "department": "Computer Science & Engineering"
        })

        planner = agent_3()
        plan = planner.plan_workflow(agent_2_policy, student_profile)
        return jsonify({
            "agent": "Agent 3 (Workflow Planner)",
            **plan
        })
    except Exception as e:
        logger.error(f"Error in /api/agent/3: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/agent/4", methods=["POST"])
def run_agent_4():
    """Execute Agent 4: Document Generator."""
    try:
        data = request.get_json(force=True) or {}
        req_id = data.get("request_id", "REQ-2024-8841")
        student_profile = data.get("student_profile", {
            "name": "Alex Chen",
            "usn": "1AT21CS042",
            "department": "Computer Science & Engineering"
        })
        agent_2_policy = data.get("agent_2_policy", {})
        agent_3_plan = data.get("agent_3_plan", {})

        doc_gen = agent_4()
        doc = doc_gen.generate_document(req_id, student_profile, agent_2_policy, agent_3_plan)
        return jsonify({
            "agent": "Agent 4 (Document Generator)",
            **doc
        })
    except Exception as e:
        logger.error(f"Error in /api/agent/4: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/agent/5", methods=["POST"])
def run_agent_5():
    """Execute Agent 5: Stakeholder Router."""
    try:
        data = request.get_json(force=True) or {}
        agent_3_plan = data.get("agent_3_plan", {})
        current_signatures = data.get("current_signatures", {"class teacher": False, "HOD": False})

        router = agent_5()
        route_info = router.route_request(agent_3_plan, current_signatures)
        return jsonify({
            "agent": "Agent 5 (Stakeholder Router)",
            **route_info
        })
    except Exception as e:
        logger.error(f"Error in /api/agent/5: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/pipeline", methods=["POST"])
def run_full_pipeline():
    """Execute the full 5-Agent Multi-Agent Pipeline."""
    try:
        data = request.get_json(force=True) or {}
        request_text = data.get("request_text", "").strip()
        if not request_text:
            return jsonify({"error": "request_text is required"}), 400

        student_profile = data.get("student_profile", {
            "name": "Alex Chen",
            "usn": "1AT21CS042",
            "department": "Computer Science & Engineering",
            "attendance": "84%"
        })

        api_key = get_api_key(request)

        # Initialize pipeline
        pipeline = MultiAgentPipeline(api_key=api_key)

        if api_key:
            try:
                res = pipeline.run_live_pipeline(request_text, student_profile)
                res["mode"] = "live_gemini"
                return jsonify(res)
            except Exception as e:
                logger.warning(f"Live pipeline failed ({e}), using dynamic pipeline.")

        res = pipeline.run_simulated_pipeline(request_text, student_profile)
        res["mode"] = "python_engine"
        return jsonify(res)

    except Exception as e:
        logger.error(f"Error in /api/pipeline: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print("========================================================")
    print(f"AgentFlow Multi-Agent Flask API Server Starting on port {port}")
    print(f"Listening on http://127.0.0.1:{port}")
    print(f"Health check: http://127.0.0.1:{port}/api/health")
    print("========================================================")
    app.run(host="0.0.0.0", port=port, debug=False)

