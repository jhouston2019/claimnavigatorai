/**
 * Autofill System
 * Loads intake profile and auto-populates forms across tools
 */

import { getIntakeProfile } from './intake.js';

/**
 * Load intake profile and return data
 */
export async function loadIntakeProfile() {
  try {
    const profile = await getIntakeProfile();
    return profile;
  } catch (error) {
    console.error('Error loading intake profile:', error);
    return null;
  }
}

/**
 * Autofill form fields based on intake profile
 * @param {Object} fieldMap - Map of intake fields to form field IDs
 * Example: { insured_name: 'insuredName', insurer_name: 'insurerName' }
 */
export async function autofillForm(fieldMap) {
  try {
    const profile = await loadIntakeProfile();
    if (!profile) {
      console.log('No intake profile found');
      return;
    }

    // Map intake fields to form fields
    const mappings = {
      insured_name: 'insuredName',
      insurer_name: 'insurerName',
      claim_number: 'claimNumber',
      policy_number: 'policyNumber',
      date_of_loss: 'dateOfLoss',
      property_address: 'propertyAddress',
      property_city: 'propertyCity',
      property_state: 'propertyState',
      property_zip: 'propertyZip',
      claim_type: 'claimType',
      carrier_contact_name: 'carrierContactName',
      carrier_contact_email: 'carrierContactEmail',
      carrier_contact_phone: 'carrierContactPhone',
      ...fieldMap // Allow custom mappings
    };

    // Fill form fields
    for (const [intakeField, formFieldId] of Object.entries(mappings)) {
      const formField = document.getElementById(formFieldId);
      if (formField && profile[intakeField]) {
        if (formField.tagName === 'SELECT') {
          formField.value = profile[intakeField];
        } else {
          formField.value = profile[intakeField];
        }
        
        // Trigger input event for any listeners
        formField.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    console.log('Form autofilled from intake profile');
  } catch (error) {
    console.error('Autofill error:', error);
  }
}

/**
 * Get intake data as object (for programmatic use)
 */
export async function getIntakeData() {
  const profile = await loadIntakeProfile();
  return profile;
}

/**
 * Autofill specific field by ID
 */
export async function autofillField(fieldId, intakeFieldName) {
  try {
    const profile = await loadIntakeProfile();
    if (!profile) return;

    const field = document.getElementById(fieldId);
    if (field && profile[intakeFieldName]) {
      field.value = profile[intakeFieldName];
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } catch (error) {
    console.error('Autofill field error:', error);
  }
}



