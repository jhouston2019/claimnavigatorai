/**
 * SHARED CONTROLLERS INDEX
 * 
 * Central export point for all functional contract controllers.
 * 
 * Usage:
 *   import { DocumentGeneratorController, AIToolController } from './controllers/index.js';
 *   
 *   // Initialize a document generator tool
 *   DocumentGeneratorController.initTool({
 *     toolId: 'my-tool',
 *     toolName: 'My Tool',
 *     templateType: 'my_template'
 *   });
 */

export * as DocumentGeneratorController from './document-generator-controller.js';
export * as AIToolController from './ai-tool-controller.js';
export * as WorkflowViewController from './workflow-view-controller.js';
export * as ReferenceLibraryController from './reference-library-controller.js';



