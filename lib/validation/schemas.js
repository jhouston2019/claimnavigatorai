const { z } = require('zod');

// Common base fields for all document types
const baseFields = {
  policyholderName: z.string().min(2, "Policyholder name must be at least 2 characters"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  email: z.string().email("Valid email address required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  policyNumber: z.string().min(2, "Policy number required"),
  claimNumber: z.string().min(1, "Claim number required"),
  dateOfLoss: z.string().min(1, "Date of loss required"),
  lossType: z.enum(['fire','water','wind','hurricane','theft','auto','health','other'], {
    errorMap: () => ({ message: "Please select a valid loss type" })
  }),
  insurerName: z.string().min(2, "Insurer name required"),
  adjusterName: z.string().optional(),
};

// Proof of Loss Schema
const proofOfLossSchema = z.object({
  ...baseFields,
  damageDescription: z.string().min(10, "Damage description must be at least 10 characters"),
  estimatedValueStructure: z.number().nonnegative("Structure value must be non-negative"),
  estimatedValueContents: z.number().nonnegative().optional().default(0),
  deductible: z.number().nonnegative().default(0),
  attachmentsSummary: z.string().optional()
});

// Appeal Letter Schema
const appealLetterSchema = z.object({
  ...baseFields,
  denialDate: z.string().min(1, "Denial date required"),
  denialReason: z.string().min(10, "Denial reason must be at least 10 characters"),
  facts: z.string().min(20, "Supporting facts must be at least 20 characters"),
  evidenceList: z.string().min(10, "Evidence list must be at least 10 characters"),
  requestedAction: z.string().min(10, "Requested action must be at least 10 characters")
});

// Demand Letter Schema
const demandLetterSchema = z.object({
  ...baseFields,
  offerAmount: z.number().nonnegative("Offer amount must be non-negative"),
  independentEstimateAmount: z.number().nonnegative("Independent estimate amount must be non-negative"),
  supportingDocs: z.string().min(10, "Supporting documents description must be at least 10 characters"),
  deadlineDays: z.number().int().min(1).max(90, "Deadline must be between 1 and 90 days")
});

// Damage Inventory Sheet Schema
const damageInventorySchema = z.object({
  ...baseFields,
  items: z.array(z.object({
    item: z.string().min(1, "Item name required"),
    description: z.string().min(5, "Item description must be at least 5 characters"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    condition: z.enum(['new','like-new','good','fair','poor'], {
      errorMap: () => ({ message: "Please select item condition" })
    }),
    unitCost: z.number().nonnegative("Unit cost must be non-negative"),
    total: z.number().nonnegative("Total cost must be non-negative")
  })).min(1, "At least one item required")
});

// Claim Timeline/Diary Schema
const claimTimelineSchema = z.object({
  ...baseFields,
  entries: z.array(z.object({
    date: z.string().min(1, "Entry date required"),
    actor: z.enum(['insurer','policyholder','contractor','adjuster','other'], {
      errorMap: () => ({ message: "Please select actor type" })
    }),
    event: z.string().min(5, "Event description must be at least 5 characters"),
    notes: z.string().min(5, "Notes must be at least 5 characters"),
    attachmentRef: z.string().optional()
  })).min(1, "At least one timeline entry required")
});

// Repair/Replacement Cost Worksheet Schema
const repairCostSchema = z.object({
  ...baseFields,
  rooms: z.array(z.object({
    area: z.string().min(1, "Area/room name required"),
    scope: z.string().min(5, "Scope of work must be at least 5 characters"),
    laborRate: z.number().nonnegative("Labor rate must be non-negative"),
    hours: z.number().nonnegative("Hours must be non-negative"),
    materials: z.number().nonnegative("Materials cost must be non-negative"),
    subtotal: z.number().nonnegative("Subtotal must be non-negative")
  })).min(1, "At least one room/area required")
});

// Out-of-Pocket Expense Log Schema
const outOfPocketSchema = z.object({
  ...baseFields,
  expenses: z.array(z.object({
    date: z.string().min(1, "Expense date required"),
    category: z.enum(['ale','medical','travel','storage','other'], {
      errorMap: () => ({ message: "Please select expense category" })
    }),
    vendor: z.string().min(1, "Vendor name required"),
    amount: z.number().nonnegative("Amount must be non-negative"),
    receiptRef: z.string().optional(),
    notes: z.string().min(5, "Notes must be at least 5 characters")
  })).min(1, "At least one expense required")
});

// Appraisal Demand Letter Schema
const appraisalDemandSchema = z.object({
  ...baseFields,
  policyAppraisalClauseRef: z.string().optional(),
  nominatedUmpire: z.string().optional(),
  basisOfDispute: z.string().min(20, "Basis of dispute must be at least 20 characters")
});

// Notice of Delay Complaint Schema
const delayComplaintSchema = z.object({
  ...baseFields,
  submittedDate: z.string().min(1, "Submission date required"),
  statutoryDeadlineDays: z.number().int().min(1, "Statutory deadline must be at least 1 day"),
  missedByDays: z.number().int().min(0, "Days missed cannot be negative"),
  priorFollowUps: z.string().min(10, "Prior follow-ups description must be at least 10 characters")
});

// Coverage Clarification Request Schema
const coverageClarificationSchema = z.object({
  ...baseFields,
  provisionInQuestion: z.string().min(10, "Provision in question must be at least 10 characters"),
  factualContext: z.string().min(20, "Factual context must be at least 20 characters"),
  specificQuestions: z.array(z.string().min(10, "Each question must be at least 10 characters")).min(1, "At least one specific question required")
});

// Document type to schema mapping
const documentSchemas = {
  'proof-of-loss': proofOfLossSchema,
  'appeal-letter': appealLetterSchema,
  'demand-letter': demandLetterSchema,
  'damage-inventory': damageInventorySchema,
  'claim-timeline': claimTimelineSchema,
  'repair-cost-worksheet': repairCostSchema,
  'out-of-pocket-expenses': outOfPocketSchema,
  'appraisal-demand': appraisalDemandSchema,
  'delay-complaint': delayComplaintSchema,
  'coverage-clarification': coverageClarificationSchema
};

// Validation function
function validateDocumentInput(docType, input) {
  const schema = documentSchemas[docType];
  if (!schema) {
    throw new Error(`Unknown document type: ${docType}`);
  }
  return schema.parse(input);
}

// Get document type display names
const documentTypeNames = {
  'proof-of-loss': 'Proof of Loss',
  'appeal-letter': 'Appeal Letter',
  'demand-letter': 'Demand Letter',
  'damage-inventory': 'Damage Inventory Sheet',
  'claim-timeline': 'Claim Timeline / Diary',
  'repair-cost-worksheet': 'Repair or Replacement Cost Worksheet',
  'out-of-pocket-expenses': 'Out-of-Pocket Expense Log',
  'appraisal-demand': 'Appraisal Demand Letter',
  'delay-complaint': 'Notice of Delay Complaint',
  'coverage-clarification': 'Coverage Clarification Request'
};

module.exports = {
  documentSchemas,
  validateDocumentInput,
  documentTypeNames,
  baseFields
};
