/**
 * Client-side utility for handling protected document downloads
 */

/**
 * Download a protected document from Supabase storage
 * @param {string} documentSlug - The document slug/identifier
 * @param {string} userId - The current user's ID
 * @param {string} documentName - Display name for the download
 */
async function downloadProtectedDocument(documentSlug, userId, documentName = 'document') {
  try {
    const response = await fetch(`/.netlify/functions/protected-document-download?document_slug=${documentSlug}&user_id=${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`);
    }
    
    // Get the document ID from headers
    const documentId = response.headers.get('X-Document-ID');
    
    // Convert response to blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentName}_protected.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log(`Document downloaded with ID: ${documentId}`);
    return { success: true, documentId };
    
  } catch (error) {
    console.error('Error downloading protected document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a protected AI document
 * @param {string} documentType - Type of document being generated
 * @param {string} content - Document content
 * @param {Object} claimantInfo - Claimant information
 * @param {string} userId - Current user's ID
 */
async function generateProtectedDocument(documentType, content, claimantInfo, userId) {
  try {
    const response = await fetch('/.netlify/functions/generate-protected-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentType,
        content,
        claimantInfo,
        user_id: userId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate document: ${response.statusText}`);
    }
    
    // Get the document ID from headers
    const documentId = response.headers.get('X-Document-ID');
    
    // Convert response to blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentType}_protected.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log(`Document generated with ID: ${documentId}`);
    return { success: true, documentId };
    
  } catch (error) {
    console.error('Error generating protected document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get claimant information from the current user's claim
 * @param {string} userId - Current user's ID
 * @returns {Promise<Object>} Claimant information object
 */
async function getClaimantInfo(userId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      '{{ SUPABASE_URL }}',
      '{{ SUPABASE_ANON_KEY }}'
    );
    
    const { data: claimData, error } = await supabase
      .from('claims')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !claimData) {
      throw new Error('Claim information not found');
    }
    
    return {
      insured_name: claimData.insured_name,
      policy_number: claimData.policy_number,
      insurer: claimData.insurer,
      date_of_loss: claimData.date_of_loss,
      loss_location: claimData.loss_location,
      property_type: claimData.property_type,
      status: claimData.status
    };
    
  } catch (error) {
    console.error('Error getting claimant info:', error);
    throw error;
  }
}

/**
 * Replace all document download links with protected versions
 * This function should be called after the page loads to update existing links
 */
function enableProtectedDownloads() {
  // Find all document download links
  const documentLinks = document.querySelectorAll('a[href*="documents"], a[data-document-slug]');
  
  documentLinks.forEach(link => {
    const originalHref = link.href;
    const documentSlug = link.dataset.documentSlug || extractSlugFromUrl(originalHref);
    
    if (documentSlug) {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Get current user ID (you'll need to implement this based on your auth system)
        const userId = getCurrentUserId();
        
        if (!userId) {
          alert('Please log in to download documents');
          return;
        }
        
        // Show loading state
        const originalText = link.textContent;
        link.textContent = 'Downloading...';
        link.disabled = true;
        
        try {
          const result = await downloadProtectedDocument(documentSlug, userId, link.textContent);
          
          if (result.success) {
            console.log('Document downloaded successfully');
          } else {
            alert('Failed to download document: ' + result.error);
          }
        } catch (error) {
          console.error('Download error:', error);
          alert('Failed to download document');
        } finally {
          // Restore original state
          link.textContent = originalText;
          link.disabled = false;
        }
      });
    }
  });
}

/**
 * Extract document slug from URL
 * @param {string} url - Document URL
 * @returns {string} Document slug
 */
function extractSlugFromUrl(url) {
  const match = url.match(/\/documents\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Get current user ID (implement based on your auth system)
 * @returns {string} Current user ID
 */
function getCurrentUserId() {
  // This should be implemented based on your authentication system
  // For now, return null - you'll need to integrate with your auth
  return localStorage.getItem('user_id') || null;
}

// Export functions for use in other scripts
window.DocumentProtection = {
  downloadProtectedDocument,
  generateProtectedDocument,
  getClaimantInfo,
  enableProtectedDownloads,
  getCurrentUserId
};

// Auto-enable protected downloads when the script loads
document.addEventListener('DOMContentLoaded', () => {
  enableProtectedDownloads();
});
