//
// CargoTrack AI Service — Compliance Agent Contracts
//
// Defines the tool interfaces the Document Compliance Agent uses.
// Implementations are in tools.ts. The runner (runner.ts) only
// depends on these interfaces — never on implementations directly.
// This enables easy mocking in tests and future provider swaps.
//

import { DocumentType, ComplianceSeverity, FindingType } from '@prisma/client';

// ─── Input types (what the agent reads) ──────────────────────────────────────

export interface ShipmentRecord {
  id: string;
  trackingNumber: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  shipmentType: string;
  carrierName: string | null;
  weight: number;
  status: string;
}

export interface DocumentRecord {
  id: string;
  originalName: string;
  fileName: string;
  documentType: DocumentType;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface ExtractedDocumentFields {
  documentId: string;
  documentType: DocumentType;
  // Raw key-value pairs extracted by Textract (or mock in Phase 2)
  fields: Record<string, string>;
  // Confidence score 0.0–1.0 for the overall extraction quality
  confidence: number;
}

// ─── Output types (what the agent writes) ────────────────────────────────────

export interface CreateFindingInput {
  reportId: string;
  documentId?: string;
  findingType: FindingType;
  severity: ComplianceSeverity;
  description: string;
  detail?: {
    field?: string;
    expected?: string;
    found?: string;
    [key: string]: unknown;
  };
}

export interface CreateReportInput {
  shipmentId: string;
  agentRunId: string;
}

export interface AuditEventInput {
  shipmentId: string;
  eventType: string;
  summary: string;
  agentRunId: string;
  timestamp: string;
}

// ─── Tool interfaces — the agent's tool-use surface ──────────────────────────
// Each method maps 1:1 to a Bedrock Converse tool definition.
// Amazon Nova and Claude both support the same Converse API tool format.

export interface AgentDataAccess {
  /** Tool: get_shipment_record */
  getShipment(shipmentId: string): Promise<ShipmentRecord | null>;

  /** Tool: get_uploaded_documents */
  getDocuments(shipmentId: string): Promise<DocumentRecord[]>;

  /**
   * Tool: determine_required_documents
   * Pure business logic — no DB call.
   * Returns the DocumentType list required for a given shipment profile.
   */
  getRequiredDocumentTypes(
    shipmentType: string,
    origin: string,
    destination: string
  ): DocumentType[];

  /**
   * Tool: extract_document_fields
   * Phase 2: returns mock fields.
   * Phase 3: calls AWS Textract AnalyzeDocument.
   */
  extractDocumentFields(doc: DocumentRecord): Promise<ExtractedDocumentFields>;

  /** Tool: create_compliance_finding */
  createFinding(input: CreateFindingInput): Promise<{ id: string }>;

  /** Tool: create_compliance_report */
  createReport(input: CreateReportInput): Promise<{ id: string }>;

  /** Tool: finalize_report */
  finalizeReport(
    reportId: string,
    status: 'PASSED' | 'FAILED' | 'PARTIAL',
    summary: string
  ): Promise<void>;

  /** Tool: generate_audit_event */
  publishAuditEvent(input: AuditEventInput): Promise<void>;
}

// ─── SQS trigger message shape ────────────────────────────────────────────────
// This is the payload shape the ai-service SQS handler receives
// after EventBridge transforms the shipment.status_updated event.

export interface ComplianceTriggerMessage {
  shipmentId: string;
  trackingNumber: string;
  newStatus: string;
  triggeredAt: string;
}

// ─── Bedrock tool definitions ─────────────────────────────────────────────────
// Used when constructing the Converse API request.
// These are model-agnostic (Nova, Claude, Titan all use the same format).

export interface BedrockToolSpec {
  name: string;
  description: string;
  inputSchema: {
    json: {
      type: 'object';
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

// The full tool list the agent sends to Bedrock on each Converse call.
export const COMPLIANCE_AGENT_TOOLS: BedrockToolSpec[] = [
  {
    name: 'get_shipment_record',
    description: 'Retrieve the shipment record including sender, receiver, route, weight, and carrier.',
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          shipment_id: { type: 'string', description: 'The unique shipment ID (UUID).' },
        },
        required: ['shipment_id'],
      },
    },
  },
  {
    name: 'get_uploaded_documents',
    description: 'Retrieve all documents uploaded for a shipment with their types and metadata.',
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          shipment_id: { type: 'string', description: 'The shipment ID.' },
        },
        required: ['shipment_id'],
      },
    },
  },
  {
    name: 'determine_required_documents',
    description: 'Returns the list of document types required for a given shipment type and route.',
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          shipment_type: { type: 'string' },
          origin: { type: 'string' },
          destination: { type: 'string' },
        },
        required: ['shipment_type', 'origin', 'destination'],
      },
    },
  },
  {
    name: 'extract_document_fields',
    description: 'Extract structured fields from a document (invoice number, carrier name, weight, etc.).',
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          document_id: { type: 'string', description: 'The document ID to extract fields from.' },
        },
        required: ['document_id'],
      },
    },
  },
  {
    name: 'create_compliance_finding',
    description: 'Record a compliance finding (missing document, data mismatch, etc.) against the report.',
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          report_id: { type: 'string' },
          document_id: { type: 'string', description: 'Optional: the document that caused the finding.' },
          finding_type: { type: 'string', enum: ['MISSING_DOCUMENT', 'DATA_MISMATCH', 'COMPLIANCE_RISK', 'VALIDATION_ERROR'] },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          description: { type: 'string' },
          detail: { type: 'object', description: 'Optional structured detail (field, expected, found).' },
        },
        required: ['report_id', 'finding_type', 'severity', 'description'],
      },
    },
  },
  {
    name: 'create_compliance_report',
    description: 'Create a new compliance report record for a shipment before running checks.',
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          shipment_id: { type: 'string' },
          agent_run_id: { type: 'string' },
        },
        required: ['shipment_id', 'agent_run_id'],
      },
    },
  },
  {
    name: 'finalize_report',
    description: 'Mark the compliance report as PASSED, FAILED, or PARTIAL with a human-readable summary.',
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          report_id: { type: 'string' },
          status: { type: 'string', enum: ['PASSED', 'FAILED', 'PARTIAL'] },
          summary: { type: 'string', description: 'Human-readable compliance summary for the admin UI.' },
        },
        required: ['report_id', 'status', 'summary'],
      },
    },
  },
];
