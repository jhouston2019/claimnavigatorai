/**
 * Advanced Tools AI Helper
 * Shared AI utilities for all 17 Advanced Tools
 * Loads configs, rules, and examples from Supabase or local files
 */

const { runOpenAI } = require('./ai-utils');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cache for configs and rules
let configCache = null;
let rulesCache = {};

/**
 * Get Supabase client (if configured)
 */
function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Load tool config from Supabase or local file
 * @param {string} toolSlug - Tool identifier (e.g., 'settlement-calculator-pro')
 * @returns {object|null} Tool config object
 */
async function loadToolConfig(toolSlug) {
  // Try Supabase first
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ai_tool_configs')
        .select('config_json')
        .eq('tool_slug', toolSlug)
        .single();

      if (!error && data) {
        return data.config_json;
      }
    } catch (err) {
      console.warn(`Supabase config load failed for ${toolSlug}, falling back to local file:`, err.message);
    }
  }

  // Fallback to local file
  try {
    const configPath = path.join(__dirname, '../../app/assets/ai/config/advanced-tools-config.json');
    if (fs.existsSync(configPath)) {
      const configFile = fs.readFileSync(configPath, 'utf8');
      const allConfigs = JSON.parse(configFile);
      return allConfigs[toolSlug] || null;
    }
  } catch (err) {
    console.error(`Failed to load local config for ${toolSlug}:`, err.message);
  }

  return null;
}

/**
 * Load ruleset from Supabase or local file
 * @param {string} rulesetName - Ruleset name (e.g., 'bad-faith-rules')
 * @returns {object|null} Ruleset object
 */
async function loadRuleset(rulesetName) {
  // Check cache first
  if (rulesCache[rulesetName]) {
    return rulesCache[rulesetName];
  }

  // Try Supabase first
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ai_rulesets')
        .select('ruleset_json')
        .eq('ruleset_name', rulesetName)
        .single();

      if (!error && data) {
        rulesCache[rulesetName] = data.ruleset_json;
        return data.ruleset_json;
      }
    } catch (err) {
      console.warn(`Supabase ruleset load failed for ${rulesetName}, falling back to local file:`, err.message);
    }
  }

  // Fallback to local file
  try {
    const rulesPath = path.join(__dirname, '../../app/assets/ai/rules', `${rulesetName}.json`);
    if (fs.existsSync(rulesPath)) {
      const rulesFile = fs.readFileSync(rulesPath, 'utf8');
      const rules = JSON.parse(rulesFile);
      rulesCache[rulesetName] = rules;
      return rules;
    }
  } catch (err) {
    console.error(`Failed to load local ruleset ${rulesetName}:`, err.message);
  }

  return null;
}

/**
 * Load examples for a tool from Supabase
 * @param {string} toolSlug - Tool identifier
 * @param {string} exampleType - Optional example type filter
 * @returns {array} Array of example objects
 */
async function loadExamples(toolSlug, exampleType = null) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return [];
  }

  try {
    let query = supabase
      .from('ai_examples')
      .select('*')
      .eq('tool_slug', toolSlug);

    if (exampleType) {
      query = query.eq('example_type', exampleType);
    }

    const { data, error } = await query;

    if (error) {
      console.warn(`Failed to load examples for ${toolSlug}:`, error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn(`Error loading examples for ${toolSlug}:`, err.message);
    return [];
  }
}

/**
 * Run AI with tool config and optional ruleset
 * @param {string} toolSlug - Tool identifier
 * @param {string} userPrompt - User prompt
 * @param {object} options - Additional options
 * @param {string} rulesetName - Optional ruleset name to include
 * @returns {string} AI response
 */
async function runToolAI(toolSlug, userPrompt, options = {}, rulesetName = null) {
  // Load tool config
  const config = await loadToolConfig(toolSlug);
  if (!config) {
    console.warn(`No config found for ${toolSlug}, using default system prompt`);
    // Fallback to basic prompt
    return await runOpenAI(
      'You are a helpful assistant for insurance claim analysis.',
      userPrompt,
      options
    );
  }

  // Build system prompt from config
  let systemPrompt = config.systemPrompt || 'You are a helpful assistant.';

  // Add ruleset if specified
  if (rulesetName) {
    const ruleset = await loadRuleset(rulesetName);
    if (ruleset) {
      systemPrompt += `\n\nAdditional Guidelines:\n${JSON.stringify(ruleset, null, 2)}`;
    }
  }

  // Add input guidance if available
  if (config.inputGuidance && config.inputGuidance.length > 0) {
    systemPrompt += `\n\nInput Guidance:\n${config.inputGuidance.join('\n')}`;
  }

  // Merge options with defaults
  const aiOptions = {
    model: options.model || 'gpt-4o-mini',
    temperature: options.temperature !== undefined ? options.temperature : 0.7,
    max_tokens: options.max_tokens || 2000,
    ...options
  };

  // Run AI
  return await runOpenAI(systemPrompt, userPrompt, aiOptions);
}

/**
 * Run AI and parse JSON response according to tool's output format
 * @param {string} toolSlug - Tool identifier
 * @param {string} userPrompt - User prompt
 * @param {object} options - Additional options
 * @param {string} rulesetName - Optional ruleset name
 * @returns {object} Parsed JSON response
 */
async function runToolAIJSON(toolSlug, userPrompt, options = {}, rulesetName = null) {
  const config = await loadToolConfig(toolSlug);
  
  // Request JSON format if config specifies it
  const aiOptions = {
    ...options,
    response_format: config?.outputFormat?.type === 'object' ? { type: 'json_object' } : null
  };

  const response = await runToolAI(toolSlug, userPrompt, aiOptions, rulesetName);

  // Try to parse as JSON
  try {
    return JSON.parse(response);
  } catch (err) {
    // If not JSON, return as string
    console.warn(`AI response for ${toolSlug} is not valid JSON, returning as string`);
    return { response };
  }
}

module.exports = {
  loadToolConfig,
  loadRuleset,
  loadExamples,
  runToolAI,
  runToolAIJSON
};

