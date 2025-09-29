// Standardized response shapes for Netlify functions

export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  html?: string;
  pdfUrl?: string;
  docxUrl?: string;
  recommendedTool?: string;
  message?: string;
  usageCount?: number;
  quotaRemaining?: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  upgradeRequired?: boolean;
  authRequired?: boolean;
  quotaExceeded?: boolean;
  retryAfter?: number;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Helper functions for creating responses
export function createSuccessResponse<T>(data?: T, options?: {
  html?: string;
  pdfUrl?: string;
  docxUrl?: string;
  recommendedTool?: string;
  message?: string;
  usageCount?: number;
  quotaRemaining?: number;
}): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...options
  };
}

export function createErrorResponse(
  error: string,
  options?: {
    code?: string;
    details?: any;
    upgradeRequired?: boolean;
    authRequired?: boolean;
    quotaExceeded?: boolean;
    retryAfter?: number;
  }
): ErrorResponse {
  return {
    success: false,
    error,
    ...options
  };
}

// Common error responses
export const CommonErrors = {
  AUTH_REQUIRED: (message = 'Authentication required') => 
    createErrorResponse(message, { authRequired: true }),
  
  UPGRADE_REQUIRED: (message = 'Upgrade required for unlimited use') => 
    createErrorResponse(message, { upgradeRequired: true }),
  
  QUOTA_EXCEEDED: (message = 'Monthly limit reached. Please upgrade.') => 
    createErrorResponse(message, { quotaExceeded: true, upgradeRequired: true }),
  
  RATE_LIMITED: (retryAfter = 60) => 
    createErrorResponse('Rate limit exceeded. Please try again later.', { 
      retryAfter,
      code: 'RATE_LIMITED'
    }),
  
  VALIDATION_ERROR: (message = 'Validation error') => 
    createErrorResponse(message, { code: 'VALIDATION_ERROR' }),
  
  INTERNAL_ERROR: (message = 'Internal server error') => 
    createErrorResponse(message, { code: 'INTERNAL_ERROR' }),
  
  NOT_FOUND: (message = 'Resource not found') => 
    createErrorResponse(message, { code: 'NOT_FOUND' }),
  
  FORBIDDEN: (message = 'Access denied') => 
    createErrorResponse(message, { code: 'FORBIDDEN' }),
  
  BAD_REQUEST: (message = 'Bad request') => 
    createErrorResponse(message, { code: 'BAD_REQUEST' })
};

// Response builders for specific features
export const DocumentGeneratorResponses = {
  success: (data: any, pdfUrl: string, docxUrl: string) => 
    createSuccessResponse(data, { pdfUrl, docxUrl }),
  
  generationFailed: () => 
    createErrorResponse('Document generation failed. Please try again.', { 
      code: 'GENERATION_FAILED' 
    }),
  
  invalidInput: () => 
    createErrorResponse('Invalid input provided. Please check your data.', { 
      code: 'INVALID_INPUT' 
    })
};

export const AdvisoryResponses = {
  success: (data: any, html?: string) => 
    createSuccessResponse(data, { html }),
  
  analysisFailed: () => 
    createErrorResponse('Advisory analysis failed. Please try again.', { 
      code: 'ANALYSIS_FAILED' 
    })
};

export const MaximizeClaimResponses = {
  success: (data: any) => 
    createSuccessResponse(data),
  
  stepNotFound: () => 
    createErrorResponse('Step not found.', { code: 'STEP_NOT_FOUND' }),
  
  progressUpdateFailed: () => 
    createErrorResponse('Failed to update progress.', { code: 'PROGRESS_UPDATE_FAILED' })
};

export const TacticsResponses = {
  success: (data: any) => 
    createSuccessResponse(data),
  
  tacticNotFound: () => 
    createErrorResponse('Tactic not found.', { code: 'TACTIC_NOT_FOUND' }),
  
  loggingFailed: () => 
    createErrorResponse('Failed to log tactic usage.', { code: 'LOGGING_FAILED' })
};

export const AdvancedToolsResponses = {
  success: (data: any, recommendedTool?: string) => 
    createSuccessResponse(data, { recommendedTool }),
  
  analysisFailed: (tool: string) => 
    createErrorResponse(`${tool} analysis failed. Please try again.`, { 
      code: 'ANALYSIS_FAILED' 
    }),
  
  calculationFailed: () => 
    createErrorResponse('Calculation failed. Please check your inputs.', { 
      code: 'CALCULATION_FAILED' 
    }),
  
  comparisonFailed: () => 
    createErrorResponse('Comparison failed. Please try again.', { 
      code: 'COMPARISON_FAILED' 
    }),
  
  negotiationFailed: () => 
    createErrorResponse('Negotiation strategy generation failed. Please try again.', { 
      code: 'NEGOTIATION_FAILED' 
    }),
  
  escalationFailed: () => 
    createErrorResponse('Escalation guide generation failed. Please try again.', { 
      code: 'ESCALATION_FAILED' 
    }),
  
  stateRightsFailed: () => 
    createErrorResponse('State rights lookup failed. Please try again.', { 
      code: 'STATE_RIGHTS_FAILED' 
    }),
  
  policyAnalysisFailed: () => 
    createErrorResponse('Policy analysis failed. Please try again.', { 
      code: 'POLICY_ANALYSIS_FAILED' 
    })
};

// HTTP status code helpers
export function getStatusCode(response: ApiResponse): number {
  if (response.success) return 200;
  
  if (response.authRequired) return 401;
  if (response.upgradeRequired) return 402;
  if (response.quotaExceeded) return 402;
  if (response.retryAfter) return 429;
  
  switch (response.code) {
    case 'VALIDATION_ERROR':
    case 'BAD_REQUEST':
      return 400;
    case 'NOT_FOUND':
      return 404;
    case 'FORBIDDEN':
      return 403;
    case 'RATE_LIMITED':
      return 429;
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}

// Response validation
export function isValidResponse(response: any): response is ApiResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.success === 'boolean' &&
    (response.success === true || response.success === false)
  );
}

// Response transformation for different content types
export function transformResponse<T>(response: ApiResponse<T>, contentType?: string) {
  if (contentType === 'text/html' && response.success && response.html) {
    return new Response(response.html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  if (contentType === 'application/pdf' && response.success && response.pdfUrl) {
    return Response.redirect(response.pdfUrl, 302);
  }
  
  if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && 
      response.success && response.docxUrl) {
    return Response.redirect(response.docxUrl, 302);
  }
  
  // Default JSON response
  return new Response(JSON.stringify(response), {
    status: getStatusCode(response),
    headers: { 'Content-Type': 'application/json' }
  });
}
