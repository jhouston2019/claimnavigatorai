/**
 * Intake System
 * Saves user claim intake information for auto-filling tools
 */

import { requireAuth, getSupabaseClient, getCurrentUser } from './auth.js';

// Initialize intake form
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Require authentication
    await requireAuth();

    // Load existing intake if available
    await loadIntakeProfile();

    // Setup form submission
    const form = document.getElementById('intakeForm');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
  } catch (error) {
    console.error('Intake initialization error:', error);
  }
});

/**
 * Load existing intake profile
 */
async function loadIntakeProfile() {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('intake_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error loading intake:', error);
      return;
    }

    if (data) {
      // Populate form fields
      document.getElementById('insuredName').value = data.insured_name || '';
      document.getElementById('insurerName').value = data.insurer_name || '';
      document.getElementById('claimNumber').value = data.claim_number || '';
      document.getElementById('policyNumber').value = data.policy_number || '';
      document.getElementById('dateOfLoss').value = data.date_of_loss || '';
      document.getElementById('propertyAddress').value = data.property_address || '';
      document.getElementById('propertyCity').value = data.property_city || '';
      document.getElementById('propertyState').value = data.property_state || '';
      document.getElementById('propertyZip').value = data.property_zip || '';
      document.getElementById('claimType').value = data.claim_type || '';
      document.getElementById('carrierContactName').value = data.carrier_contact_name || '';
      document.getElementById('carrierContactEmail').value = data.carrier_contact_email || '';
      document.getElementById('carrierContactPhone').value = data.carrier_contact_phone || '';
    }
  } catch (error) {
    console.error('Error loading intake profile:', error);
  }
}

/**
 * Handle form submission
 */
async function handleSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submitBtn');
  const messageDiv = document.getElementById('message');

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const client = await getSupabaseClient();

    // Prepare intake data
    const intakeData = {
      user_id: user.id,
      insured_name: document.getElementById('insuredName').value.trim(),
      insurer_name: document.getElementById('insurerName').value.trim(),
      claim_number: document.getElementById('claimNumber').value.trim(),
      policy_number: document.getElementById('policyNumber').value.trim(),
      date_of_loss: document.getElementById('dateOfLoss').value,
      property_address: document.getElementById('propertyAddress').value.trim(),
      property_city: document.getElementById('propertyCity').value.trim(),
      property_state: document.getElementById('propertyState').value.trim().toUpperCase(),
      property_zip: document.getElementById('propertyZip').value.trim(),
      claim_type: document.getElementById('claimType').value,
      carrier_contact_name: document.getElementById('carrierContactName').value.trim(),
      carrier_contact_email: document.getElementById('carrierContactEmail').value.trim(),
      carrier_contact_phone: document.getElementById('carrierContactPhone').value.trim(),
      email: user.email
    };

    // Check if profile exists
    const { data: existing } = await client
      .from('intake_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await client
        .from('intake_profile')
        .update(intakeData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await client
        .from('intake_profile')
        .insert(intakeData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Show success message
    messageDiv.className = 'message success';
    messageDiv.textContent = 'Intake information saved successfully! This will auto-fill across all tools.';
    messageDiv.style.display = 'block';

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      window.location.href = '/app/dashboard.html';
    }, 2000);

  } catch (error) {
    console.error('Error saving intake:', error);
    messageDiv.className = 'message error';
    messageDiv.textContent = `Error: ${error.message}`;
    messageDiv.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Intake Information';
  }
}

/**
 * Get intake profile (exported for use in other tools)
 */
export async function getIntakeProfile() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('intake_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting intake profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting intake profile:', error);
    return null;
  }
}



