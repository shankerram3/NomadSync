/**
 * Dynamic Tool Loader
 * Automatically discovers and loads tools from the tools directory
 */

import { toolRegistry } from './tool_registry.js';

/**
 * Load all tools from the tools directory
 * This allows tools to self-register when imported
 */
export async function loadAllTools(): Promise<void> {
  try {
    // Import all tool modules - they will self-register
    await import('./tools/flight_tool.js');
    await import('./tools/flight_booking_tool.js');
    
    // Add more tool imports as they're created:
    // await import('./tools/hotel_tool.js');
    // await import('./tools/weather_tool.js');
    // await import('./tools/attraction_tool.js');
    
    const toolCount = toolRegistry.getAll().length;
    console.log(`[TOOL_LOADER] Loaded ${toolCount} tools`);
    
    // Log all registered tools
    toolRegistry.getAll().forEach(tool => {
      console.log(`[TOOL_LOADER]   - ${tool.metadata.agent}:${tool.metadata.action} (${tool.metadata.name})`);
    });
  } catch (error: any) {
    console.error('[TOOL_LOADER] Error loading tools:', error);
    throw error;
  }
}

/**
 * Get available tools for LLM function calling
 */
export function getAvailableToolsForLLM() {
  return toolRegistry.getToolSchemas();
}

/**
 * Find tools that can handle a task description
 */
export function findToolsForTask(description: string) {
  return toolRegistry.findToolsByDescription(description);
}
