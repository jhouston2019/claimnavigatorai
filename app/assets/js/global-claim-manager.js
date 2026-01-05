// Global Claim Information Storage and Watermarking System
class GlobalClaimInfoManager {
    constructor() {
        this.storageKey = 'claimnavigator_global_claim_info';
        this.claimInfo = {};
        this.init();
    }

    async init() {
        await this.loadClaimInfoFromDatabase();
        this.setupEventListeners();
    }

    async loadClaimInfoFromDatabase() {
        try {
            // Try to get user's claim information from Supabase
            const response = await fetch('/netlify/functions/list-claims', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.claims && data.claims.length > 0) {
                    // Use the most recent claim
                    const latestClaim = data.claims[0];
                    this.claimInfo = this.mapClaimToInfo(latestClaim);
                    this.populateForm(this.claimInfo);
                    this.showFormWithStatus('✅ Claim information loaded from your account');
                    return;
                }
            }
            
            // No claims found
            this.showFormWithStatus('⚠️ No claim information found. Please enter your details below.');
        } catch (error) {
            console.log('Could not load claim from database, using localStorage fallback');
            this.loadClaimInfoFromStorage();
        }
    }

    showFormWithStatus(message) {
        const statusDiv = document.getElementById('claimInfoStatus');
        const form = document.getElementById('globalClaimInfoForm');
        
        if (statusDiv) {
            statusDiv.innerHTML = `<div class="status-message">${message}</div>`;
        }
        
        if (form) {
            form.style.display = 'block';
        }
    }

    mapClaimToInfo(claim) {
        return {
            name: claim.insured_name || '',
            policyNumber: claim.policy_number || '',
            claimNumber: claim.id || '', // Using claim ID as claim number
            dateOfLoss: claim.date_of_loss || '',
            insuranceCompany: claim.insurer || '',
            email: claim.email || '', // This might need to be retrieved from user profile
            address: this.formatAddress(claim.loss_location),
            phone: claim.phone_number || ''
        };
    }

    formatAddress(lossLocation) {
        if (!lossLocation) return '';
        const { address, city, state, zip } = lossLocation;
        return `${address || ''}, ${city || ''}, ${state || ''} ${zip || ''}`.trim();
    }

    async getAuthToken() {
        // Try to get auth token from Supabase client
        if (window.supabase) {
            const { data: { session } } = await window.supabase.auth.getSession();
            return session?.access_token;
        }
        return null;
    }

    loadClaimInfoFromStorage() {
        const savedInfo = localStorage.getItem(this.storageKey);
        if (savedInfo) {
            this.claimInfo = JSON.parse(savedInfo);
            this.populateForm(this.claimInfo);
            this.showFormWithStatus('📝 Using previously saved information');
        } else {
            this.showFormWithStatus('⚠️ No claim information found. Please enter your details below.');
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
        
        this.claimInfo = claimInfo;
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
        return this.claimInfo;
    }

    applyWatermark(content, claimInfo) {
        if (!claimInfo || Object.keys(claimInfo).length === 0) {
            return content;
        }

        const watermarkHeader = this.createWatermarkHeader(claimInfo);
        const watermarkFooter = this.createWatermarkFooter(claimInfo);
        return watermarkHeader + content + watermarkFooter;
    }

    createWatermarkHeader(claimInfo) {
        const today = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        let watermark = `
<div style="border: 2px solid #1e3a8a; background: #f0f4ff; padding: 15px; margin-bottom: 20px; border-radius: 8px; font-family: Arial, sans-serif;">
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
</div>
`;

        return watermark;
    }

    createWatermarkFooter(claimInfo) {
        const today = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        return `
<div style="border-top: 2px solid #1e3a8a; background: #f0f4ff; padding: 10px; margin-top: 30px; border-radius: 8px; font-family: Arial, sans-serif;">
    <div style="text-align: center; font-size: 9px; color: #6b7280;">
        <strong style="color: #1e3a8a; font-size: 10px;">Claim Navigator - GENERATED DOCUMENT</strong><br>
        Generated on ${today} | ${claimInfo.address || ''}
    </div>
</div>
`;
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
