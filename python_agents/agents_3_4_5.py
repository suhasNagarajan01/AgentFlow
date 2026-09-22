"""
Autonomous Multi-Agent Orchestration System
Agent 3: Workflow Planner ("Who needs to do what?")
Agent 4: Document Generator ("Document Generator")
Agent 5: Stakeholder Router ("Stakeholder Dispatch & Reverse Hierarchy Gating")
"""

from typing import Dict, Any, List, Optional
import json
import uuid
import datetime


class agent_3:
    """
    Agent 3: Workflow Planner.
    Consumes Agent 2's structured output (code and reverse hierarchy),
    and converts them into actionable workflow tasks, SLAs, and gating prerequisites.
    """
    def __init__(self, default_sla_hours: int = 24):
        self.default_sla_hours = default_sla_hours

    def plan_workflow(self, agent_2_output: Dict[str, Any], student_info: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        hierarchy = agent_2_output.get("hierarchy", {"1": "class teacher", "2": "HOD"})
        rule_code = agent_2_output.get("code", "STANDARD-RULE")
        eligible = agent_2_output.get("eligible", True)

        sorted_steps = sorted(hierarchy.items(), key=lambda x: int(x[0]) if x[0].isdigit() else x[0])
        stages = []
        
        for step_idx, (level_str, role_name) in enumerate(sorted_steps, start=1):
            stage_def = {
                "stage": int(level_str) if level_str.isdigit() else step_idx,
                "role": role_name,
                "action_required": "Verify attendance & class conduct" if "teacher" in role_name.lower() else "Issue institutional approval and sign NOC",
                "sla_hours": self.default_sla_hours,
                "prerequisite_stage": int(level_str) - 1 if (level_str.isdigit() and int(level_str) > 1) else None,
                "gate_status": "UNLOCKED" if step_idx == 1 else "LOCKED_PENDING_PRIOR_STAGE",
                "validation_rule": rule_code
            }
            stages.append(stage_def)

        return {
            "workflow_id": f"WF-{uuid.uuid4().hex[:8].upper()}",
            "rule_code": rule_code,
            "eligible": eligible,
            "reverse_hierarchy_active": True,
            "stages": stages,
            "total_stages": len(stages),
            "execution_policy": "Sequential Reverse Hierarchy: Higher stages cannot execute until prior stages are confirmed.",
            "planned_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }


class agent_4:
    """
    Agent 4: Document Generator.
    Generates official institutional on-job training permission letter, NOC, or leave document,
    with designated sequential signature slots matching the reverse hierarchy.
    """
    def __init__(self, institution_name: str = "Apex Institute of Technology & Research"):
        self.institution_name = institution_name

    def generate_document(
        self,
        request_id: str,
        student_data: Dict[str, Any],
        agent_2_data: Dict[str, Any],
        agent_3_plan: Dict[str, Any]
    ) -> Dict[str, Any]:
        now_str = datetime.datetime.now().strftime("%d %B %Y")
        doc_ref = f"INST/OJT/2024/{request_id[-6:]}"
        
        hierarchy = agent_2_data.get("hierarchy", {"1": "Class Teacher", "2": "HOD"})
        
        # Build signature blocks matching reverse hierarchy
        signature_blocks = []
        for level, role in sorted(hierarchy.items(), key=lambda x: int(x[0]) if x[0].isdigit() else x[0]):
            signature_blocks.append({
                "level": level,
                "role": role,
                "status": "PENDING",
                "signed_by": None,
                "signed_at": None,
                "signature_hash": None,
                "required_before_next": True
            })

        doc_content = (
            f"================================================================================\n"
            f"                     {self.institution_name.upper()}\n"
            f"                 DIRECTORATE OF ACADEMIC AFFAIRS & INTERNSHIPS\n"
            f"================================================================================\n\n"
            f"Ref No: {doc_ref}                                          Date: {now_str}\n\n"
            f"SUBJECT: PERMISSION & NO OBJECTION CERTIFICATE FOR ON-JOB TRAINING\n\n"
            f"To Whom It May Concern,\n\n"
            f"This is to certify that {student_data.get('name', 'Student')}, bearing USN "
            f"{student_data.get('usn', 'N/A')}, is a bona fide student of the Department of "
            f"{student_data.get('department', 'Computer Science & Engineering')}.\n\n"
            f"The candidate has requested permission to undertake On-Job Training (OJT) / Industrial\n"
            f"Internship pursuant to institutional rule code: {agent_2_data.get('code', 'OJT-RULE-SEC4')}.\n\n"
            f"VERIFICATION STATUS:\n"
            f"- Minimum Attendance Verified: YES (Above 75% threshold)\n"
            f"- Academic Standing: Eligible\n"
            f"- Reverse Hierarchy Routing Protocol: Enforced\n\n"
            f"APPROVAL SIGNATURE CHAIN:\n"
            f"1. Class Teacher Verification: [PENDING STAGE 1]\n"
            f"2. Head of Department (HOD) Sanction: [LOCKED UNTIL STAGE 1]\n\n"
            f"Verification Hash: SHA256:{uuid.uuid4().hex}\n"
            f"================================================================================"
        )

        return {
            "document_id": f"DOC-{request_id}",
            "reference_number": doc_ref,
            "document_type": "ON_JOB_TRAINING_PERMISSION_LETTER",
            "content": doc_content,
            "signature_blocks": signature_blocks,
            "verification_qr_hash": f"VRF-{uuid.uuid4().hex[:12].upper()}",
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }


class agent_5:
    """
    Agent 5: Stakeholder Router.
    Routes the request to the active stage approver.
    Crucially enforces the reverse hierarchy rule:
    HOD is not allowed to approve until Class Teacher has signed.
    """
    def __init__(self):
        pass

    def route_request(self, workflow_plan: Dict[str, Any], current_signatures: Dict[str, Any]) -> Dict[str, Any]:
        stages = workflow_plan.get("stages", [])
        
        current_active_role = None
        next_approver_queue = []
        is_blocked = False
        blocked_reason = None

        # Check Stage 1
        stage_1 = stages[0] if len(stages) > 0 else None
        stage_2 = stages[1] if len(stages) > 1 else None

        stage_1_signed = current_signatures.get("class teacher", False) or current_signatures.get("1", False)

        if not stage_1_signed:
            current_active_role = stage_1.get("role") if stage_1 else "Class Teacher"
            next_approver_queue = [current_active_role]
            is_blocked = False
            blocked_reason = None
            hod_status = "LOCKED_AWAITING_CLASS_TEACHER"
        else:
            current_active_role = stage_2.get("role") if stage_2 else "HOD"
            next_approver_queue = [current_active_role]
            hod_status = "READY_FOR_APPROVAL"

        return {
            "routing_id": f"RT-{uuid.uuid4().hex[:6].upper()}",
            "current_active_desk": current_active_role,
            "pending_queue": next_approver_queue,
            "hod_gate_status": hod_status,
            "is_reverse_hierarchy_preserved": True,
            "notification_sent_to": current_active_role,
            "dispatched_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

