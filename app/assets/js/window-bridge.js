// Import ESM utilities and page module
import * as ValidationUtils from '/app/assets/js/validation-utils.js';
import * as errorHandler from '/app/assets/js/error-handler.js';
import * as apiClient from '/app/assets/js/api-client.js';
import {
  toggleTimelinePhase,
  togglePhase,
  toggleQuickStart,
  toggleHowToUse,
  generateResponse,
  saveDraft,
  exportDoc,
  copyResponse,
  downloadResponse,
  addToSessionHistory,
  showTool,
  getToolContent,
  setLang
} from '/app/assets/js/response-center.js';

// Expose ESM utils to legacy inline HTML expectations
window.ValidationUtils = ValidationUtils;
window.errorHandler = errorHandler;
window.apiClient = apiClient;

// Expose page functions used by onclick/data-attributes
Object.assign(window, {
  toggleTimelinePhase,
  togglePhase,
  toggleQuickStart,
  toggleHowToUse,
  generateResponse,
  saveDraft,
  exportDoc,
  copyResponse,
  downloadResponse,
  addToSessionHistory,
  showTool,
  getToolContent,
  setLang
});
