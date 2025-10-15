const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const XLSX = require('xlsx');

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { docKey, inputs } = JSON.parse(event.body);
        
        if (!docKey || !inputs) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing docKey or inputs' })
            };
        }

        // Route to appropriate generator based on document type
        let result;
        switch (docKey) {
            case 'proof-of-loss':
                result = await generateProofOfLoss(inputs);
                break;
            case 'payment-demand':
                result = await generatePaymentDemand(inputs);
                break;
            case 'damage-assessment':
                result = await generateDamageAssessment(inputs);
                break;
            case 'depreciation-schedule':
                result = await generateDepreciationSchedule(inputs);
                break;
            case 'evidence-log':
                result = await generateEvidenceLog(inputs);
                break;
            case 'appeal-letter':
                result = await generateAppealLetter(inputs);
                break;
            case 'business-interruption':
                result = await generateBusinessInterruption(inputs);
                break;
            case 'expense-reimbursement':
                result = await generateExpenseReimbursement(inputs);
                break;
            case 'appraisal-request':
                result = await generateAppraisalRequest(inputs);
                break;
            case 'regulatory-complaint':
                result = await generateRegulatoryComplaint(inputs);
                break;
            case 'settlement-offer':
                result = await generateSettlementOffer(inputs);
                break;
            case 'notice-of-claim':
                result = await generateNoticeOfClaim(inputs);
                break;
            case 'coverage-clarification':
                result = await generateCoverageClarification(inputs);
                break;
            case 'delay-complaint':
                result = await generateDelayComplaint(inputs);
                break;
            case 'photograph-log':
                result = await generatePhotographLog(inputs);
                break;
            case 'repair-replace-analysis':
                result = await generateRepairReplaceAnalysis(inputs);
                break;
            case 'out-of-pocket-log':
                result = await generateOutOfPocketLog(inputs);
                break;
            case 'rom-estimate':
                result = await generateROMEstimate(inputs);
                break;
            case 'comparative-estimates':
                result = await generateComparativeEstimates(inputs);
                break;
            case 'document-index':
                result = await generateDocumentIndex(inputs);
                break;
            case 'sworn-statement':
                result = await generateSwornStatement(inputs);
                break;
            case 'supplemental-claim':
                result = await generateSupplementalClaim(inputs);
                break;
            case 'policy-review-request':
                result = await generatePolicyReviewRequest(inputs);
                break;
            case 'bad-faith-complaint':
                result = await generateBadFaithComplaint(inputs);
                break;
            case 'mediation-request':
                result = await generateMediationRequest(inputs);
                break;
            case 'arbitration-demand':
                result = await generateArbitrationDemand(inputs);
                break;
            case 'expert-witness-request':
                result = await generateExpertWitnessRequest(inputs);
                break;
            case 'subrogation-notice':
                result = await generateSubrogationNotice(inputs);
                break;
            case 'coverage-denial-appeal':
                result = await generateCoverageDenialAppeal(inputs);
                break;
            case 'settlement-agreement':
                result = await generateSettlementAgreement(inputs);
                break;
            case 'replacement-cost-analysis':
                result = await generateReplacementCostAnalysis(inputs);
                break;
            case 'actual-cash-value':
                result = await generateActualCashValue(inputs);
                break;
            case 'loss-of-use-calculation':
                result = await generateLossOfUseCalculation(inputs);
                break;
            case 'inflation-adjustment':
                result = await generateInflationAdjustment(inputs);
                break;
            case 'consequential-damages':
                result = await generateConsequentialDamages(inputs);
                break;
            case 'mitigation-expenses':
                result = await generateMitigationExpenses(inputs);
                break;
            case 'emergency-response-log':
                result = await generateEmergencyResponseLog(inputs);
                break;
            case 'chain-of-custody':
                result = await generateChainOfCustody(inputs);
                break;
            case 'witness-statements':
                result = await generateWitnessStatements(inputs);
                break;
            case 'surveillance-log':
                result = await generateSurveillanceLog(inputs);
                break;
            case 'weather-data':
                result = await generateWeatherData(inputs);
                break;
            case 'fire-investigation':
                result = await generateFireInvestigation(inputs);
                break;
            case 'water-damage-assessment':
                result = await generateWaterDamageAssessment(inputs);
                break;
            case 'mold-assessment':
                result = await generateMoldAssessment(inputs);
                break;
            case 'structural-assessment':
                result = await generateStructuralAssessment(inputs);
                break;
            case 'electrical-assessment':
                result = await generateElectricalAssessment(inputs);
                break;
            case 'hvac-assessment':
                result = await generateHVACAssessment(inputs);
                break;
            case 'roof-assessment':
                result = await generateRoofAssessment(inputs);
                break;
            case 'flooring-assessment':
                result = await generateFlooringAssessment(inputs);
                break;
            case 'appliance-assessment':
                result = await generateApplianceAssessment(inputs);
                break;
            case 'personal-property-inventory':
                result = await generatePersonalPropertyInventory(inputs);
                break;
            case 'contents-valuation':
                result = await generateContentsValuation(inputs);
                break;
            case 'specialty-items':
                result = await generateSpecialtyItems(inputs);
                break;
            case 'temporary-housing':
                result = await generateTemporaryHousing(inputs);
                break;
            case 'storage-expenses':
                result = await generateStorageExpenses(inputs);
                break;
            case 'moving-expenses':
                result = await generateMovingExpenses(inputs);
                break;
            case 'pet-care-expenses':
                result = await generatePetCareExpenses(inputs);
                break;
            case 'childcare-expenses':
                result = await generateChildcareExpenses(inputs);
                break;
            case 'meal-expenses':
                result = await generateMealExpenses(inputs);
                break;
            case 'transportation-expenses':
                result = await generateTransportationExpenses(inputs);
                break;
            case 'communication-expenses':
                result = await generateCommunicationExpenses(inputs);
                break;
            case 'catastrophic-event-log':
                result = await generateCatastrophicEventLog(inputs);
                break;
            case 'disaster-declaration':
                result = await generateDisasterDeclaration(inputs);
                break;
            case 'fema-assistance':
                result = await generateFEMAAssistance(inputs);
                break;
            case 'sba-loan-documentation':
                result = await generateSBALoanDocumentation(inputs);
                break;
            case 'community-resources':
                result = await generateCommunityResources(inputs);
                break;
            case 'volunteer-assistance':
                result = await generateVolunteerAssistance(inputs);
                break;
            case 'donation-documentation':
                result = await generateDonationDocumentation(inputs);
                break;
            case 'recovery-timeline':
                result = await generateRecoveryTimeline(inputs);
                break;
            case 'reconstruction-schedule':
                result = await generateReconstructionSchedule(inputs);
                break;
            case 'permit-documentation':
                result = await generatePermitDocumentation(inputs);
                break;
            case 'inspection-reports':
                result = await generateInspectionReports(inputs);
                break;
            case 'contractor-documentation':
                result = await generateContractorDocumentation(inputs);
                break;
            case 'warranty-documentation':
                result = await generateWarrantyDocumentation(inputs);
                break;
            case 'final-inspection':
                result = await generateFinalInspection(inputs);
                break;
            default:
                result = await generateGenericDocument(docKey, inputs);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('Error generating document:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to generate document',
                details: error.message 
            })
        };
    }
};

// Proof of Loss Generator (T1 - PDF Form)
async function generateProofOfLoss(inputs) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = height - 50;

    // Header
    page.drawText('SWORN STATEMENT IN PROOF OF LOSS', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0)
    });
    yPosition -= 30;

    // Form fields
    const formFields = [
        { label: 'Insurer Claim Number:', value: inputs.insurerClaimNumber || '' },
        { label: 'Insurance Carrier:', value: inputs.insuranceCarrier || '' },
        { label: 'Amount of Policy at Time of Loss:', value: inputs.policyAmount ? `$${inputs.policyAmount}` : '' },
        { label: 'Date Policy Issued:', value: inputs.policyIssuedDate || '' },
        { label: 'Date Policy Expires:', value: inputs.policyExpiresDate || '' },
        { label: 'Insurance Agency:', value: inputs.insuranceAgency || '' },
        { label: 'Insurance Agent:', value: inputs.insuranceAgent || '' },
        { label: 'To (Recipient):', value: inputs.recipientName || '' },
        { label: 'Cause of Loss:', value: inputs.causeOfLoss || '' },
        { label: 'Time of Loss:', value: inputs.timeOfLoss || '' },
        { label: 'Date of Loss:', value: inputs.dateOfLoss || '' },
        { label: 'Occupancy Description:', value: inputs.occupancyDescription || '' },
        { label: 'Title & Interest:', value: inputs.titleInterest || '' },
        { label: 'Other Interests:', value: inputs.otherInterests || '' },
        { label: 'Policy Changes Since Issuance:', value: inputs.policyChanges || '' },
        { label: 'Total Insurance Amount:', value: inputs.totalInsurance ? `$${inputs.totalInsurance}` : '' },
        { label: 'Actual Cash Value:', value: inputs.actualCashValue ? `$${inputs.actualCashValue}` : '' },
        { label: 'Whole Loss and Damage:', value: inputs.totalLoss ? `$${inputs.totalLoss}` : '' },
        { label: 'Amount Claimed:', value: inputs.amountClaimed ? `$${inputs.amountClaimed}` : '' }
    ];

    formFields.forEach(field => {
        page.drawText(field.label, {
            x: 50,
            y: yPosition,
            size: 10,
            font: boldFont,
            color: rgb(0, 0, 0)
        });
        
        page.drawText(field.value, {
            x: 250,
            y: yPosition,
            size: 10,
            font: font,
            color: rgb(0, 0, 0)
        });
        
        yPosition -= 20;
    });

    // Signature section
    yPosition -= 20;
    page.drawText('Signature:', {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
    });
    yPosition -= 30;
    
    page.drawText(`Name: ${inputs.signatureName || ''}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
    });
    yPosition -= 20;
    
    page.drawText(`Date: ${inputs.signatureDate || ''}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
    });

    const pdfBytes = await pdfDoc.save();
    return {
        output: 'Proof of Loss document generated successfully.',
        downloadUrl: `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`
    };
}

// Payment Demand Letter Generator (T2 - PDF Letter)
async function generatePaymentDemand(inputs) {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'PAYMENT DEMAND LETTER',
                            bold: true,
                            size: 24
                        })
                    ],
                    alignment: AlignmentType.CENTER
                }),
                new Paragraph({ text: '' }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Date: ${new Date().toLocaleDateString()}`,
                            size: 20
                        })
                    ]
                }),
                new Paragraph({ text: '' }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `To: ${inputs.insurerName || 'Insurance Company'}`,
                            size: 20
                        })
                    ]
                }),
                new Paragraph({ text: '' }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Re: Claim Number ${inputs.claimNumber || 'N/A'} - Payment Demand`,
                            size: 20
                        })
                    ]
                }),
                new Paragraph({ text: '' }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Dear ${inputs.insurerName || 'Sir/Madam'},`,
                            size: 20
                        })
                    ]
                }),
                new Paragraph({ text: '' }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `I am writing to demand payment of $${inputs.amountOwed || '0'} for the claim arising from the loss that occurred on ${inputs.dateOfLoss || 'the date of loss'}.`,
                            size: 20
                        })
                    ]
                }),
                new Paragraph({ text: '' }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Reason for Demand: ${inputs.reason || 'Please provide reason for demand'}`,
                            size: 20
                        })
                    ]
                }),
                new Paragraph({ text: '' }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Please remit payment by ${inputs.deadline || 'the deadline specified'}. Failure to respond may result in further legal action.`,
                            size: 20
                        })
                    ]
                }),
                new Paragraph({ text: '' }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Sincerely,',
                            size: 20
                        })
                    ]
                }),
                new Paragraph({ text: '' }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: inputs.signatureName || 'Your Name',
                            size: 20
                        })
                    ]
                })
            ]
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    return {
        output: 'Payment Demand Letter generated successfully.',
        downloadUrl: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${buffer.toString('base64')}`
    };
}

// Damage Assessment Report Generator (T6 - PDF Report)
async function generateDamageAssessment(inputs) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = height - 50;

    // Title
    page.drawText('DAMAGE ASSESSMENT REPORT', {
        x: 50,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0)
    });
    yPosition -= 40;

    // Report details
    const reportDetails = [
        { label: 'Property Address:', value: inputs.propertyAddress || '' },
        { label: 'Assessment Date:', value: inputs.assessmentDate || '' },
        { label: 'Assessor Name:', value: inputs.assessorName || '' },
        { label: 'Assessor License:', value: inputs.assessorLicense || '' },
        { label: 'Damage Description:', value: inputs.damageDescription || '' },
        { label: 'Cause of Damage:', value: inputs.causeOfDamage || '' },
        { label: 'Estimated Repair Cost:', value: inputs.repairCost ? `$${inputs.repairCost}` : '' },
        { label: 'Replacement Cost:', value: inputs.replacementCost ? `$${inputs.replacementCost}` : '' },
        { label: 'Depreciation:', value: inputs.depreciation ? `$${inputs.depreciation}` : '' },
        { label: 'Actual Cash Value:', value: inputs.actualCashValue ? `$${inputs.actualCashValue}` : '' }
    ];

    reportDetails.forEach(detail => {
        page.drawText(detail.label, {
            x: 50,
            y: yPosition,
            size: 10,
            font: boldFont,
            color: rgb(0, 0, 0)
        });
        
        page.drawText(detail.value, {
            x: 200,
            y: yPosition,
            size: 10,
            font: font,
            color: rgb(0, 0, 0)
        });
        
        yPosition -= 20;
    });

    // Recommendations
    yPosition -= 20;
    page.drawText('RECOMMENDATIONS:', {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
    });
    yPosition -= 20;
    
    page.drawText(inputs.recommendations || 'Recommendations will be provided by the assessor.', {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
    });

    const pdfBytes = await pdfDoc.save();
    return {
        output: 'Damage Assessment Report generated successfully.',
        downloadUrl: `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`
    };
}

// Depreciation Schedule Generator (T4 - XLSX Spreadsheet)
async function generateDepreciationSchedule(inputs) {
    const worksheetData = [
        ['DEPRECIATION SCHEDULE'],
        [''],
        ['Item', 'Purchase Date', 'Original Cost', 'Age', 'Depreciation Rate', 'Depreciated Value'],
        // Add sample data or use inputs.propertyItems if available
        ['Sample Item 1', '2020-01-01', '$1000', '3 years', '20%', '$400'],
        ['Sample Item 2', '2019-06-15', '$2000', '4 years', '25%', '$1000'],
        [''],
        ['Total Depreciation:', inputs.totalDepreciation ? `$${inputs.totalDepreciation}` : '$0'],
        ['Net Value:', inputs.netValue ? `$${inputs.netValue}` : '$0']
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Depreciation Schedule');
    
    const buffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    return {
        output: 'Depreciation Schedule generated successfully.',
        downloadUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${buffer}`
    };
}

// Evidence Log Generator (T3 - XLSX Spreadsheet)
async function generateEvidenceLog(inputs) {
    const worksheetData = [
        ['EVIDENCE DOCUMENTATION LOG'],
        [''],
        ['Date', 'Item Type', 'Description', 'Location', 'Photographer', 'Notes'],
        // Add sample data
        ['2024-01-15', 'Photograph', 'Fire damage to kitchen', 'Kitchen', 'John Smith', 'High resolution'],
        ['2024-01-15', 'Receipt', 'Emergency repairs', 'Office', 'Jane Doe', 'Original copy'],
        [''],
        ['Total Items:', inputs.totalItems || '0']
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Evidence Log');
    
    const buffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    return {
        output: 'Evidence Log generated successfully.',
        downloadUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${buffer}`
    };
}

// Generic document generator for other document types
async function generateGenericDocument(docKey, inputs) {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: docKey.replace(/-/g, ' ').toUpperCase(),
                            bold: true,
                            size: 24
                        })
                    ],
                    alignment: AlignmentType.CENTER
                }),
                new Paragraph({ text: '' }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Generated on: ${new Date().toLocaleDateString()}`,
                            size: 20
                        })
                    ]
                }),
                new Paragraph({ text: '' }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Document Information:',
                            bold: true,
                            size: 20
                        })
                    ]
                }),
                new Paragraph({ text: '' }),
                ...Object.entries(inputs).map(([key, value]) => 
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${key}: ${value}`,
                                size: 20
                            })
                        ]
                    })
                )
            ]
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    return {
        output: `${docKey.replace(/-/g, ' ')} document generated successfully.`,
        downloadUrl: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${buffer.toString('base64')}`
    };
}

// Placeholder functions for other document types
async function generateAppealLetter(inputs) { return generateGenericDocument('appeal-letter', inputs); }
async function generateBusinessInterruption(inputs) { return generateGenericDocument('business-interruption', inputs); }
async function generateExpenseReimbursement(inputs) { return generateGenericDocument('expense-reimbursement', inputs); }
async function generateAppraisalRequest(inputs) { return generateGenericDocument('appraisal-request', inputs); }
async function generateRegulatoryComplaint(inputs) { return generateGenericDocument('regulatory-complaint', inputs); }
async function generateSettlementOffer(inputs) { return generateGenericDocument('settlement-offer', inputs); }
async function generateNoticeOfClaim(inputs) { return generateGenericDocument('notice-of-claim', inputs); }
async function generateCoverageClarification(inputs) { return generateGenericDocument('coverage-clarification', inputs); }
async function generateDelayComplaint(inputs) { return generateGenericDocument('delay-complaint', inputs); }
async function generatePhotographLog(inputs) { return generateGenericDocument('photograph-log', inputs); }
async function generateRepairReplaceAnalysis(inputs) { return generateGenericDocument('repair-replace-analysis', inputs); }
async function generateOutOfPocketLog(inputs) { return generateGenericDocument('out-of-pocket-log', inputs); }
async function generateROMEstimate(inputs) { return generateGenericDocument('rom-estimate', inputs); }
async function generateComparativeEstimates(inputs) { return generateGenericDocument('comparative-estimates', inputs); }
async function generateDocumentIndex(inputs) { return generateGenericDocument('document-index', inputs); }
async function generateSwornStatement(inputs) { return generateGenericDocument('sworn-statement', inputs); }
async function generateSupplementalClaim(inputs) { return generateGenericDocument('supplemental-claim', inputs); }
async function generatePolicyReviewRequest(inputs) { return generateGenericDocument('policy-review-request', inputs); }
async function generateBadFaithComplaint(inputs) { return generateGenericDocument('bad-faith-complaint', inputs); }
async function generateMediationRequest(inputs) { return generateGenericDocument('mediation-request', inputs); }
async function generateArbitrationDemand(inputs) { return generateGenericDocument('arbitration-demand', inputs); }
async function generateExpertWitnessRequest(inputs) { return generateGenericDocument('expert-witness-request', inputs); }
async function generateSubrogationNotice(inputs) { return generateGenericDocument('subrogation-notice', inputs); }
async function generateCoverageDenialAppeal(inputs) { return generateGenericDocument('coverage-denial-appeal', inputs); }
async function generateSettlementAgreement(inputs) { return generateGenericDocument('settlement-agreement', inputs); }
async function generateReplacementCostAnalysis(inputs) { return generateGenericDocument('replacement-cost-analysis', inputs); }
async function generateActualCashValue(inputs) { return generateGenericDocument('actual-cash-value', inputs); }
async function generateLossOfUseCalculation(inputs) { return generateGenericDocument('loss-of-use-calculation', inputs); }
async function generateInflationAdjustment(inputs) { return generateGenericDocument('inflation-adjustment', inputs); }
async function generateConsequentialDamages(inputs) { return generateGenericDocument('consequential-damages', inputs); }
async function generateMitigationExpenses(inputs) { return generateGenericDocument('mitigation-expenses', inputs); }
async function generateEmergencyResponseLog(inputs) { return generateGenericDocument('emergency-response-log', inputs); }
async function generateChainOfCustody(inputs) { return generateGenericDocument('chain-of-custody', inputs); }
async function generateWitnessStatements(inputs) { return generateGenericDocument('witness-statements', inputs); }
async function generateSurveillanceLog(inputs) { return generateGenericDocument('surveillance-log', inputs); }
async function generateWeatherData(inputs) { return generateGenericDocument('weather-data', inputs); }
async function generateFireInvestigation(inputs) { return generateGenericDocument('fire-investigation', inputs); }
async function generateWaterDamageAssessment(inputs) { return generateGenericDocument('water-damage-assessment', inputs); }
async function generateMoldAssessment(inputs) { return generateGenericDocument('mold-assessment', inputs); }
async function generateStructuralAssessment(inputs) { return generateGenericDocument('structural-assessment', inputs); }
async function generateElectricalAssessment(inputs) { return generateGenericDocument('electrical-assessment', inputs); }
async function generateHVACAssessment(inputs) { return generateGenericDocument('hvac-assessment', inputs); }
async function generateRoofAssessment(inputs) { return generateGenericDocument('roof-assessment', inputs); }
async function generateFlooringAssessment(inputs) { return generateGenericDocument('flooring-assessment', inputs); }
async function generateApplianceAssessment(inputs) { return generateGenericDocument('appliance-assessment', inputs); }
async function generatePersonalPropertyInventory(inputs) { return generateGenericDocument('personal-property-inventory', inputs); }
async function generateContentsValuation(inputs) { return generateGenericDocument('contents-valuation', inputs); }
async function generateSpecialtyItems(inputs) { return generateGenericDocument('specialty-items', inputs); }
async function generateTemporaryHousing(inputs) { return generateGenericDocument('temporary-housing', inputs); }
async function generateStorageExpenses(inputs) { return generateGenericDocument('storage-expenses', inputs); }
async function generateMovingExpenses(inputs) { return generateGenericDocument('moving-expenses', inputs); }
async function generatePetCareExpenses(inputs) { return generateGenericDocument('pet-care-expenses', inputs); }
async function generateChildcareExpenses(inputs) { return generateGenericDocument('childcare-expenses', inputs); }
async function generateMealExpenses(inputs) { return generateGenericDocument('meal-expenses', inputs); }
async function generateTransportationExpenses(inputs) { return generateGenericDocument('transportation-expenses', inputs); }
async function generateCommunicationExpenses(inputs) { return generateGenericDocument('communication-expenses', inputs); }
async function generateCatastrophicEventLog(inputs) { return generateGenericDocument('catastrophic-event-log', inputs); }
async function generateDisasterDeclaration(inputs) { return generateGenericDocument('disaster-declaration', inputs); }
async function generateFEMAAssistance(inputs) { return generateGenericDocument('fema-assistance', inputs); }
async function generateSBALoanDocumentation(inputs) { return generateGenericDocument('sba-loan-documentation', inputs); }
async function generateCommunityResources(inputs) { return generateGenericDocument('community-resources', inputs); }
async function generateVolunteerAssistance(inputs) { return generateGenericDocument('volunteer-assistance', inputs); }
async function generateDonationDocumentation(inputs) { return generateGenericDocument('donation-documentation', inputs); }
async function generateRecoveryTimeline(inputs) { return generateGenericDocument('recovery-timeline', inputs); }
async function generateReconstructionSchedule(inputs) { return generateGenericDocument('reconstruction-schedule', inputs); }
async function generatePermitDocumentation(inputs) { return generateGenericDocument('permit-documentation', inputs); }
async function generateInspectionReports(inputs) { return generateGenericDocument('inspection-reports', inputs); }
async function generateContractorDocumentation(inputs) { return generateGenericDocument('contractor-documentation', inputs); }
async function generateWarrantyDocumentation(inputs) { return generateGenericDocument('warranty-documentation', inputs); }
async function generateFinalInspection(inputs) { return generateGenericDocument('final-inspection', inputs); }