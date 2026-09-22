export interface SignatureInfo {
  role: string;
  signerName: string;
  signedAt: string;
  hash: string;
}

export interface Request {
  id: string;
  type: string;
  title: string;
  studentName: string;
  usn: string;
  department: string;
  submittedAt: string;
  status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' | 'PENDING';
  currentStage: string;
  riskScore: number;
  aiSummary: string;
  complianceTags: string[];
  routingPath: string[];
  currentApprover: string;
  rawRequest: string;
  ruleCode?: string;
  reverseHierarchy?: Record<string, string>;
  signatures?: {
    classTeacher?: SignatureInfo | null;
    hod?: SignatureInfo | null;
    [key: string]: SignatureInfo | null | undefined;
  };
}

export interface StudentProfile {
  name: string;
  usn: string;
  department: string;
  semester: number;
  cgpa: number;
  attendance: number;
  activeBacklogs: number;
  mentor: string;
}

export const STUDENT_PROFILE: StudentProfile = {
  name: 'Alex Chen',
  usn: '1AT21CS042',
  department: 'Computer Science & Engineering',
  semester: 7,
  cgpa: 8.7,
  attendance: 84,
  activeBacklogs: 0,
  mentor: 'Prof. Rajesh Sharma (Class Teacher)',
};

export interface AdminRole {
  value: string;
  label: string;
  icon: string;
  rank: number;
  description: string;
}

export const ADMIN_ROLES: AdminRole[] = [
  {
    value: 'class_teacher',
    label: 'Class Teacher (Level 1)',
    icon: '🧑‍🏫',
    rank: 1,
    description: 'First-line gatekeeper: Verifies attendance, student conduct, and prerequisite criteria before forwarding.',
  },
  {
    value: 'hod',
    label: 'Head of Department (Level 2)',
    icon: '🏛️',
    rank: 2,
    description: 'Departmental executive sanction: Valid ONLY after prerequisite Class Teacher endorsement is obtained.',
  },
  {
    value: 'placement',
    label: 'Placement & Training Head',
    icon: '💼',
    rank: 3,
    description: 'Corporate liaison: Verifies company MoU, stipend credentials, and internship compliance.',
  },
  {
    value: 'principal',
    label: 'Dean / Principal',
    icon: '🎓',
    rank: 4,
    description: 'Final institutional authority for international internships, policy waivers, or special leaves.',
  },
  {
    value: 'finance',
    label: 'Finance Officer',
    icon: '💳',
    rank: 5,
    description: 'Handles event budgets, fee concessions, and scholarship allocations.',
  },
];

export const MOCK_REQUESTS: Request[] = [
  {
    id: 'REQ-2024-8841',
    type: 'on_job_training',
    title: 'On-Job Training Permission at TCS Research Labs (6 Months)',
    studentName: 'Alex Chen',
    usn: '1AT21CS042',
    department: 'Computer Science & Engineering',
    submittedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: 'UNDER_REVIEW',
    currentStage: 'Stage 1: Class Teacher Verification',
    riskScore: 12,
    aiSummary:
      'Student has secured an 8-month On-Job Training offer at TCS Research. 84% attendance verified, 0 backlogs. Requires reverse hierarchy approval: Class Teacher sign is mandatory before HOD signature becomes valid.',
    complianceTags: ['OJT-RULE-SEC4', 'ATTENDANCE_OK (84%)', 'REVERSE_HIERARCHY_ENFORCED'],
    routingPath: ['Class Teacher', 'HOD'],
    currentApprover: 'Class Teacher',
    rawRequest:
      'I am applying for on-job training permission for a 6-month industrial internship at TCS Research & Innovation Labs Bangalore starting July 1, 2024. My CGPA is 8.7 with 84% attendance. Please approve.',
    ruleCode: 'OJT-RULE-SEC4',
    reverseHierarchy: { '1': 'class teacher', '2': 'HOD' },
    signatures: {
      classTeacher: null,
      hod: null,
    },
  },
  {
    id: 'REQ-2024-7629',
    type: 'on_job_training',
    title: 'Industrial Internship at Infosys Springboard (Fall Term)',
    studentName: 'Priya Nair',
    usn: '1AT21CS088',
    department: 'Computer Science & Engineering',
    submittedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    status: 'UNDER_REVIEW',
    currentStage: 'Stage 1: Class Teacher Verification',
    riskScore: 18,
    aiSummary:
      'Request for 4-month on-job training with Infosys Springboard. Prerequisite check: requires Class Teacher attendance endorsement before HOD sanction is unlocked.',
    complianceTags: ['OJT-RULE-SEC4', 'ATTENDANCE_OK (81%)', 'STAGE_1_PENDING'],
    routingPath: ['Class Teacher', 'HOD'],
    currentApprover: 'Class Teacher',
    rawRequest:
      'Applying for NOC to pursue 4-month on-job training with Infosys Springboard team in Hyderabad. Full coursework credits transferred.',
    ruleCode: 'OJT-RULE-SEC4',
    reverseHierarchy: { '1': 'class teacher', '2': 'HOD' },
    signatures: {
      classTeacher: null,
      hod: null,
    },
  },
  {
    id: 'REQ-2024-6512',
    type: 'on_job_training',
    title: 'Full Semester On-Job Placement at Microsoft IDC',
    studentName: 'Rohan Varma',
    usn: '1AT21CS104',
    department: 'Computer Science & Engineering',
    submittedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    status: 'UNDER_REVIEW',
    currentStage: 'Stage 1: Class Teacher Verification',
    riskScore: 8,
    aiSummary:
      'Semester on-job training placement at Microsoft India Development Center. Pre-placement offer attached. Enforcing reverse hierarchy sequence: Class Teacher -> HOD.',
    complianceTags: ['OJT-RULE-SEC4', 'CGPA_9.1', 'AWAITING_STAGE_1'],
    routingPath: ['Class Teacher', 'HOD'],
    currentApprover: 'Class Teacher',
    rawRequest:
      'Requesting final semester on-job training permission for Microsoft India Development Center. Pre-placement offer attached.',
    ruleCode: 'OJT-RULE-SEC4',
    reverseHierarchy: { '1': 'class teacher', '2': 'HOD' },
    signatures: {
      classTeacher: null,
      hod: null,
    },
  },
  {
    id: 'REQ-2024-5401',
    type: 'duty_leave',
    title: 'Duty Leave for Smart India Hackathon Grand Finale',
    studentName: 'Alex Chen',
    usn: '1AT21CS042',
    department: 'Computer Science & Engineering',
    submittedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    status: 'UNDER_REVIEW',
    currentStage: 'Stage 1: Class Teacher Verification',
    riskScore: 22,
    aiSummary:
      'Student team shortlisted for national finale in New Delhi. Requires 5 days duty leave endorsement from Class Teacher before HOD sanctions lab attendance waiver.',
    complianceTags: ['DUTY-EVENT-05', 'NATIONAL_REPRESENTATION', 'STAGE_1_PENDING'],
    routingPath: ['Class Teacher', 'HOD'],
    currentApprover: 'Class Teacher',
    rawRequest:
      'I have been selected for the Grand Finale of Smart India Hackathon 2024 in New Delhi from October 12 to 16. Requesting 5 days duty leave.',
    ruleCode: 'DUTY-EVENT-05',
    reverseHierarchy: { '1': 'class teacher', '2': 'HOD' },
    signatures: {
      classTeacher: null,
      hod: null,
    },
  },
];

export interface AgentStep {
  id: number;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  badge: string;
}

export const AGENT_STEPS: AgentStep[] = [
  {
    id: 1,
    name: 'Agent 1: Request Understanding',
    tagline: 'What does student need?',
    description: 'Parses natural language text or PDF to extract intent, dates, company details, and prerequisites.',
    icon: '⬡',
    badge: 'NLP Extraction',
  },
  {
    id: 2,
    name: 'Agent 2: Rule & Policy Verification',
    tagline: 'What rules apply?',
    description: 'Evaluates institutional rulebooks, checks eligibility, and outputs strict reverse hierarchy JSON.',
    icon: '◈',
    badge: 'Policy Engine',
  },
  {
    id: 3,
    name: 'Agent 3: Workflow Planner',
    tagline: 'Who needs to do what?',
    description: 'Builds sequential approval stages, SLA timers, and prerequisite gating conditions.',
    icon: '⬡',
    badge: 'Workflow DAG',
  },
  {
    id: 4,
    name: 'Agent 4: Document Generator',
    tagline: 'Document Generator',
    description: 'Renders formal institutional permission letter / NOC with sequential signature blocks.',
    icon: '◈',
    badge: 'Doc Engine',
  },
  {
    id: 5,
    name: 'Agent 5: Stakeholder Router',
    tagline: 'Reverse Hierarchy Dispatch',
    description: 'Routes to Class Teacher desk first and locks HOD sign-off until prerequisite endorsement is recorded.',
    icon: '⬡',
    badge: 'Desk Dispatcher',
  },
];

export function simulateAgentOutput(stepId: number, requestText: string): Record<string, unknown> {
  const isOJT = requestText.toLowerCase().includes('job') ||
    requestText.toLowerCase().includes('intern') ||
    requestText.toLowerCase().includes('tcs') ||
    requestText.toLowerCase().includes('offer') ||
    requestText.toLowerCase().includes('microsoft');

  const ruleCode = isOJT ? 'OJT-RULE-SEC4' : 'LEAVE-POLICY-GEN';

  if (stepId === 1) {
    return {
      agent: 'Agent 1 (Request Understanding)',
      intent: isOJT ? 'ON_JOB_TRAINING_PERMISSION' : 'INSTITUTIONAL_REQUEST',
      studentName: 'Alex Chen',
      usn: '1AT21CS042',
      department: 'Computer Science & Engineering',
      targetOrganization: isOJT ? 'TCS Research & Innovation Labs' : 'Academic Department',
      timeline: 'July 1 - December 31, 2024 (6 Months)',
      justification: 'Industrial capstone project with verified industry offer letter',
      extractedNeeds: [
        'Formal Institutional Permission Letter',
        'No Objection Certificate (NOC)',
        'Attendance & Lab Work Waiver during training period',
      ],
      confidenceScore: 0.98,
    };
  }

  if (stepId === 2) {
    return {
      agent: 'Agent 2 (Rule & Policy Verification)',
      code: ruleCode,
      eligible: true,
      category: isOJT ? 'ON_JOB_TRAINING' : 'LEAVE_PERMISSION',
      hierarchy: {
        '1': 'class teacher',
        '2': 'HOD',
      },
      rules_applied: [
        'Rule 4.1: Mandatory Class Teacher endorsement for attendance (>75%) & conduct',
        'Rule 4.2: HOD final institutional sanction and NOC issuance (unlocked only after Level 1 signature)',
      ],
      prerequisites: [
        { stage: 1, role: 'class teacher', requirement: 'Attendance verified at 84%, conduct satisfactory' },
        { stage: 2, role: 'HOD', requirement: 'Departmental curriculum alignment and institutional sanction' },
      ],
      remarks: 'Student satisfies all prerequisite criteria. Reverse hierarchy enforced: HOD signature locked until Class Teacher signs.',
    };
  }

  if (stepId === 3) {
    return {
      agent: 'Agent 3 (Workflow Planner)',
      workflowId: `WF-${Math.floor(Math.random() * 89999 + 10000)}`,
      ruleCode: ruleCode,
      reverse_hierarchy_active: true,
      stages: [
        {
          stage: 1,
          role: 'Class Teacher',
          action: 'Verify attendance (>75%) and student conduct',
          gateStatus: 'UNLOCKED (ACTIVE)',
          slaHours: 24,
        },
        {
          stage: 2,
          role: 'HOD',
          action: 'Departmental clearance & official digital sign-off',
          gateStatus: 'LOCKED (Awaiting Stage 1 endorsement)',
          slaHours: 48,
          prerequisite: 'Class Teacher signature required',
        },
      ],
      executionPolicy: 'Strict Reverse Hierarchy: Higher authority cannot sign until predecessor endorses.',
    };
  }

  if (stepId === 4) {
    return {
      agent: 'Agent 4 (Document Generator)',
      documentId: `DOC-OJT-${Math.floor(Math.random() * 8999 + 1000)}`,
      documentType: 'INSTITUTIONAL_ON_JOB_TRAINING_NOC',
      referenceNumber: `INST/OJT/2024/${Math.floor(Math.random() * 8999 + 1000)}`,
      signatureSlots: [
        { slot: 1, role: 'Class Teacher', status: 'PENDING_STAGE_1' },
        { slot: 2, role: 'Head of Department (HOD)', status: 'LOCKED_PENDING_STAGE_1' },
      ],
      securityHash: 'SHA256:d82e81bc34f9a01c4e782b',
      qrVerificationReady: true,
    };
  }

  // Step 5
  return {
    agent: 'Agent 5 (Stakeholder Router)',
    routingId: `RT-${Math.floor(Math.random() * 8999 + 1000)}`,
    dispatchedToDesk: 'Class Teacher Desk (Level 1)',
    hodDeskState: 'LOCKED_PENDING_CLASS_TEACHER',
    reverseHierarchyPreserved: true,
    notificationsSent: ['class.teacher@institute.edu'],
    auditLog: 'Request queued at Level 1 desk with prerequisite dependency tracking.',
  };
}

/**
 * Generator helper for creating dynamic placeholder requests.
 */
export function createPlaceholderRequest(scenario: 'ojt_tcs' | 'ojt_google' | 'medical' | 'hackathon' | 'custom', customText?: string): Request {
  const randId = `REQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 8999 + 1000)}`;

  if (scenario === 'ojt_google') {
    return {
      id: randId,
      type: 'on_job_training',
      title: 'Google Summer Software Engineering Internship (Bangalore)',
      studentName: 'Aarav Patel',
      usn: '1AT21CS015',
      department: 'Computer Science & Engineering',
      submittedAt: new Date().toISOString(),
      status: 'UNDER_REVIEW',
      currentStage: 'Stage 1: Class Teacher Verification',
      riskScore: 6,
      aiSummary: 'Selected for 6-month SWE Internship at Google India. 91% attendance and 9.4 CGPA. Level 1 Class Teacher endorsement pending.',
      complianceTags: ['OJT-RULE-SEC4', 'TIER_1_ORGANIZATION', 'ATTENDANCE_EXEMPLARY (91%)'],
      routingPath: ['Class Teacher', 'HOD'],
      currentApprover: 'Class Teacher',
      rawRequest: 'I have received an offer for Google Summer Internship 2024 at Google Bangalore. Requesting NOC and coursework credit transfer.',
      ruleCode: 'OJT-RULE-SEC4',
      reverseHierarchy: { '1': 'class teacher', '2': 'HOD' },
      signatures: { classTeacher: null, hod: null },
    };
  }

  if (scenario === 'medical') {
    return {
      id: randId,
      type: 'medical_leave',
      title: 'Medical Leave Application (7 Days Hospitalization & Recovery)',
      studentName: 'Sneha Reddy',
      usn: '1AT21CS092',
      department: 'Computer Science & Engineering',
      submittedAt: new Date().toISOString(),
      status: 'UNDER_REVIEW',
      currentStage: 'Stage 1: Class Teacher Verification',
      riskScore: 28,
      aiSummary: 'Hospitalization record and medical doctor certificate submitted for 7-day absence. Requires mentor/class teacher validation.',
      complianceTags: ['MED-LEAVE-02', 'DOCTOR_CERT_ATTACHED', 'ATTENDANCE_WAIVER'],
      routingPath: ['Class Teacher', 'HOD'],
      currentApprover: 'Class Teacher',
      rawRequest: 'Requesting 7 days medical leave due to acute typhoid fever from Oct 1 to Oct 7. Medical certificate attached.',
      ruleCode: 'MED-LEAVE-02',
      reverseHierarchy: { '1': 'class teacher', '2': 'HOD' },
      signatures: { classTeacher: null, hod: null },
    };
  }

  if (scenario === 'hackathon') {
    return {
      id: randId,
      type: 'duty_leave',
      title: 'Duty Leave for ACM-ICPC Regional Onsite Finals (Amritapuri)',
      studentName: 'Kavya Krishnan',
      usn: '1AT21CS054',
      department: 'Computer Science & Engineering',
      submittedAt: new Date().toISOString(),
      status: 'UNDER_REVIEW',
      currentStage: 'Stage 1: Class Teacher Verification',
      riskScore: 10,
      aiSummary: 'Team qualified for ACM-ICPC Asia-Amritapuri Regional Finals. Duty leave request with contest invitation letter.',
      complianceTags: ['DUTY-EVENT-05', 'PRESTIGIOUS_COMPETITION', 'FACULTY_SPONSORED'],
      routingPath: ['Class Teacher', 'HOD'],
      currentApprover: 'Class Teacher',
      rawRequest: 'Our 3-member team qualified for ACM ICPC Regional Finals at Amrita University. Requesting 4 days on-duty leave.',
      ruleCode: 'DUTY-EVENT-05',
      reverseHierarchy: { '1': 'class teacher', '2': 'HOD' },
      signatures: { classTeacher: null, hod: null },
    };
  }

  // Default / Custom OJT
  return {
    id: randId,
    type: 'on_job_training',
    title: customText ? customText.slice(0, 60) + '…' : 'On-Job Training Permission at Amazon Development Center',
    studentName: STUDENT_PROFILE.name,
    usn: STUDENT_PROFILE.usn,
    department: STUDENT_PROFILE.department,
    submittedAt: new Date().toISOString(),
    status: 'UNDER_REVIEW',
    currentStage: 'Stage 1: Class Teacher Verification',
    riskScore: 14,
    aiSummary: 'Student request evaluated by Multi-Agent Engine. Requires reverse hierarchy approval: Class Teacher -> HOD.',
    complianceTags: ['OJT-RULE-SEC4', 'REVERSE_HIERARCHY_ENFORCED'],
    routingPath: ['Class Teacher', 'HOD'],
    currentApprover: 'Class Teacher',
    rawRequest: customText || 'Applying for on-job training permission for 6 months at Amazon AWS team Bangalore starting July 2024.',
    ruleCode: 'OJT-RULE-SEC4',
    reverseHierarchy: { '1': 'class teacher', '2': 'HOD' },
    signatures: { classTeacher: null, hod: null },
  };
}
