/**
 * PROXIMA Structured Error System
 * Every failure has a structured error code, operation context, and retryability.
 */

export type ProximaErrorCode =
  // Database errors
  | 'DATABASE_SCHEMA_MISMATCH'
  | 'DATABASE_CONNECTION_FAILED'
  | 'DATABASE_MIGRATION_FAILED'
  | 'DATABASE_QUERY_FAILED'
  // Discovery errors
  | 'DISCOVERY_PROVIDER_FAILED'
  | 'DISCOVERY_RATE_LIMITED'
  | 'DISCOVERY_EMPTY_RESULT'
  | 'DISCOVERY_MALFORMED_RESPONSE'
  // Pipeline errors
  | 'PIPELINE_STAGE_FAILED'
  | 'PIPELINE_TIMEOUT'
  // Prospect errors
  | 'PROSPECT_VALIDATION_FAILED'
  | 'PROSPECT_DUPLICATE'
  | 'PROSPECT_NOT_FOUND'
  // Verification errors
  | 'VERIFICATION_FAILED'
  | 'VERIFICATION_TIMEOUT'
  // Enrichment errors
  | 'ENRICHMENT_FAILED'
  | 'ENRICHMENT_PROVIDER_UNAVAILABLE'
  // AI errors
  | 'AI_PROVIDER_UNAVAILABLE'
  | 'AI_INFERENCE_FAILED'
  | 'AI_MALFORMED_RESPONSE'
  | 'AI_TIMEOUT'
  // Job errors
  | 'JOB_TIMEOUT'
  | 'JOB_MAX_RETRIES_EXCEEDED'
  | 'JOB_NOT_FOUND'
  // Outreach errors
  | 'OUTREACH_APPROVAL_REQUIRED'
  | 'OUTREACH_SEND_FAILED'
  // Campaign errors
  | 'CAMPAIGN_NOT_FOUND'
  | 'CAMPAIGN_INVALID_CONFIG'
  // General
  | 'INTERNAL_ERROR'
  | 'VALIDATION_ERROR';

export interface ProximaError {
  code: ProximaErrorCode;
  message: string;
  operation: string;
  entityType?: string;
  entityId?: string;
  retryable: boolean;
  details?: Record<string, unknown>;
  timestamp: string;
}

export class ProximaOperationError extends Error {
  public readonly code: ProximaErrorCode;
  public readonly operation: string;
  public readonly entityType?: string;
  public readonly entityId?: string;
  public readonly retryable: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(params: {
    code: ProximaErrorCode;
    message: string;
    operation: string;
    entityType?: string;
    entityId?: string;
    retryable?: boolean;
    details?: Record<string, unknown>;
    cause?: Error;
  }) {
    super(params.message);
    this.name = 'ProximaOperationError';
    this.code = params.code;
    this.operation = params.operation;
    this.entityType = params.entityType;
    this.entityId = params.entityId;
    this.retryable = params.retryable ?? false;
    this.details = params.details;
    this.timestamp = new Date().toISOString();
    if (params.cause) {
      this.cause = params.cause;
    }
  }

  toJSON(): ProximaError {
    return {
      code: this.code,
      message: this.message,
      operation: this.operation,
      entityType: this.entityType,
      entityId: this.entityId,
      retryable: this.retryable,
      details: this.details,
      timestamp: this.timestamp
    };
  }

  /**
   * Returns a user-safe version of the error (no internal details)
   */
  toUserError(): { code: string; message: string; retryable: boolean } {
    return {
      code: this.code,
      message: this.getUserMessage(),
      retryable: this.retryable
    };
  }

  private getUserMessage(): string {
    switch (this.code) {
      case 'DATABASE_SCHEMA_MISMATCH':
        return 'A database configuration issue was detected. Please contact support.';
      case 'DATABASE_CONNECTION_FAILED':
        return 'Unable to connect to the database. Please try again shortly.';
      case 'DISCOVERY_PROVIDER_FAILED':
        return 'The discovery service encountered an error. Results may be incomplete.';
      case 'DISCOVERY_RATE_LIMITED':
        return 'Discovery rate limit reached. The system will retry automatically.';
      case 'AI_PROVIDER_UNAVAILABLE':
        return 'AI analysis is temporarily unavailable. Core features remain operational.';
      case 'PROSPECT_VALIDATION_FAILED':
        return 'The prospect data did not pass validation checks.';
      case 'CAMPAIGN_NOT_FOUND':
        return 'The requested campaign was not found.';
      case 'CAMPAIGN_INVALID_CONFIG':
        return 'Campaign configuration is incomplete or invalid.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}
