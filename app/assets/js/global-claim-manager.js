// Global Claim Information Storage and Watermarking System
class GlobalClaimInfoManager {
    constructor() {
        this.storageKey = 'claimnavigator_global_claim_info';
        this.init();
    }

    init() {
        this.loadClaimInfo();
        this.setupEventListeners();
    }

    loadClaimInfo() {
        const savedInfo = localStorage.getItem(this.storageKey);
        if (savedInfo) {
            const claimInfo = JSON.parse(savedInfo);
            this.populateForm(claimInfo);
        }
    }

    populateForm(claimInfo) {
        const fields = [
            'globalName', 'globalPolicyNumber', 'globalClaimNumber', 
            'globalDateOfLoss', 'globalInsuranceCompany', 'globalEmail', 
            'globalAddress', 'globalPhone'
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && claimInfo[field.replace('global', '').toLowerCase()]) {
                element.value = claimInfo[field.replace('global', '').toLowerCase()];
            }
        });
    }

    saveClaimInfo() {
        const formData = new FormData(document.getElementById('globalClaimInfoForm'));
        const claimInfo = {};
        
        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                claimInfo[key] = value.trim();
            }
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(claimInfo));
        
        // Show success message
        const saveBtn = document.getElementById('saveClaimInfoBtn');
        if (saveBtn) {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '✅ Saved!';
            saveBtn.style.background = '#10b981';
            
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.background = '';
            }, 2000);
        }
    }

    getClaimInfo() {
        const savedInfo = localStorage.getItem(this.storageKey);
        return savedInfo ? JSON.parse(savedInfo) : {};
    }

    applyWatermark(content, claimInfo) {
        if (!claimInfo || Object.keys(claimInfo).length === 0) {
            return content;
        }

        const watermarkHeader = this.createWatermarkHeader(claimInfo);
        return watermarkHeader + content;
    }

    createWatermarkHeader(claimInfo) {
        const today = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        let watermark = `
<div style="border: 2px solid #1e3a8a; background: #f0f4ff; padding: 15px; margin-bottom: 20px; border-radius: 8px; font-family: Arial, sans-serif;">
    <div style="text-align: center; margin-bottom: 10px;">
        <strong style="color: #1e3a8a; font-size: 14px;">CLAIM NAVIGATOR AI - GENERATED DOCUMENT</strong>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; color: #374151;">
`;

        if (claimInfo.name) {
            watermark += `<div><strong>Policyholder:</strong> ${claimInfo.name}</div>`;
        }
        if (claimInfo.policyNumber) {
            watermark += `<div><strong>Policy #:</strong> ${claimInfo.policyNumber}</div>`;
        }
        if (claimInfo.claimNumber) {
            watermark += `<div><strong>Claim #:</strong> ${claimInfo.claimNumber}</div>`;
        }
        if (claimInfo.dateOfLoss) {
            watermark += `<div><strong>Date of Loss:</strong> ${claimInfo.dateOfLoss}</div>`;
        }
        if (claimInfo.insuranceCompany) {
            watermark += `<div><strong>Insurance Co:</strong> ${claimInfo.insuranceCompany}</div>`;
        }
        if (claimInfo.email) {
            watermark += `<div><strong>Email:</strong> ${claimInfo.email}</div>`;
        }
        if (claimInfo.phone) {
            watermark += `<div><strong>Phone:</strong> ${claimInfo.phone}</div>`;
        }

        watermark += `
    </div>
    <div style="text-align: center; margin-top: 10px; font-size: 11px; color: #6b7280;">
        Generated on ${today} by ClaimNavigatorAI | ${claimInfo.address || ''}
    </div>
</div>
`;

        return watermark;
    }

    setupEventListeners() {
        const saveBtn = document.getElementById('saveClaimInfoBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveClaimInfo());
        }
    }
}

// Global instance
window.globalClaimManager = new GlobalClaimInfoManager();
