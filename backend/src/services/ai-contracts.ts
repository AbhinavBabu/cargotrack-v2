//
// CargoTrack AI Service — Compliance Agent Contracts
//
// This file defines the TypeScript interfaces that the Document Compliance Agent
// uses to interact with the rest of the system. No Bedrock or Textract logic
// lives here — this is purely the I/O contract.
//
// How this fits the architecture:
//   - The ai-service calls these interfaces through concrete implementations.
//   - Implementations are injected at startup (dependency injection pattern).
//   - This makes the agent logic fully testable with mock implementations.
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
  fileName: string;         // S3 key or local path
  documentType: DocumentType;
  fileType: string;         // MIME type
  fileSize: number;
  uploadedAt: Date;
}

export interface ExtractedDocumentFields {
  documentId: string;
  documentType: DocumentType;
  // Raw key-value pairs extracted by Textract (or mock)
  fields: Record<string, string>;
  // Confidence score 0-1 for the overall extraction
  confidence: number;
}

// ─── Output types (what the agent writes) ────────────────────────────────────

export interface CreateFindingInput {
  reportId: string;
  documentId?: string;
  findingType: FindingType;
  severity: ComplianceSeverity;
  description: string;
  // Structured detail for diff display in the UI
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

// ─── Tool interfaces — what the agent's tools implement ──────────────────────
// The Bedrock tool-use loop will call these. Each maps 1:1 to an agent tool.

export interface AgentDataAccess {
  /** Tool: get_shipment_record */
  getShipment(shipmentId: string): Promise<ShipmentRecord | null>;

  /** Tool: get_uploaded_documents */
  getDocuments(shipmentId: string): Promise<DocumentRecord[]>;

  /** Tool: determine_required_documents — pure business rule, no DB call */
  getRequiredDocumentTypes(shipmentType: string, origin: string, destination: string): DocumentType[];

  /** Tool: extract_document_fields (Phase 2: calls Textract; Phase 1: stub) */
  extractDocumentFields(doc: DocumentRecord): Promise<ExtractedDocumentFields>;

  /** Tool: create_compliance_finding */
  createFinding(input: CreateFindingInput): Promise<{ id: string }>;

  /** Tool: create_or_update_report */
  createReport(input: CreateReportInput): Promise<{ id: string }>;

  /** Tool: finalize_report */
  finalizeReport(reportId: string, status: 'PASSED' | 'FAILED' | 'PARTIAL', summary: string): Promise<void>;

  /** Tool: generate_audit_event */
  publishAuditEvent(input: AuditEventInput): Promise<void>;
}

// ─── SQS trigger message shape ────────────────────────────────────────────────
// This is what the ai-service SQS handler receives from EventBridge.

export interface ComplianceTriggerMessage {
  shipmentId: string;
  trackingNumber: string;
  newStatus: string;
  triggeredAt: string;
}
