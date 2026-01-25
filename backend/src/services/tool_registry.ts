/**
 * Dynamic Tool Registry System
 * 
 * Provides a flexible, extensible way to register, discover, and execute tools
 * with metadata, validation, and composition support.
 */

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  agent: string;
  action: string;
  category: 'research' | 'booking' | 'itinerary' | 'communication' | 'utility';
  parameters: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    required: boolean;
    description: string;
    example?: any;
  }[];
  examples: Array<{
    input: Record<string, any>;
    output: any;
  }>;
  dependencies?: string[]; // Other tool IDs this tool depends on
  retryable?: boolean;
  timeout?: number;
}

export interface ToolResult {
  status: 'success' | 'error' | 'partial' | 'not_implemented';
  data?: any;
  message?: string;
  error?: string;
  metadata?: {
    provider?: string;
    timestamp: string;
    cached?: boolean;
    execution_time_ms?: number;
  };
}

export type ToolFunction = (
  parameters: Record<string, any>,
  context: Record<string, any>
) => Promise<ToolResult>;

export interface RegisteredTool {
  metadata: ToolMetadata;
  execute: ToolFunction;
}

class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();
  private toolIndex: Map<string, string[]> = new Map(); // category -> tool IDs

  /**
   * Register a tool with metadata
   */
  register(metadata: ToolMetadata, execute: ToolFunction): void {
    const key = `${metadata.agent}:${metadata.action}`;
    
    if (this.tools.has(key)) {
      console.warn(`[TOOL_REGISTRY] Tool ${key} already registered, overwriting...`);
    }

    this.tools.set(key, { metadata, execute });

    // Index by category
    if (!this.toolIndex.has(metadata.category)) {
      this.toolIndex.set(metadata.category, []);
    }
    this.toolIndex.get(metadata.category)!.push(key);

    console.log(`[TOOL_REGISTRY] Registered tool: ${key} (${metadata.name})`);
  }

  /**
   * Get a tool by agent and action
   */
  get(agent: string, action: string): RegisteredTool | null {
    const key = `${agent}:${action}`;
    return this.tools.get(key) || null;
  }

  /**
   * Get all tools in a category
   */
  getByCategory(category: ToolMetadata['category']): RegisteredTool[] {
    const toolIds = this.toolIndex.get(category) || [];
    return toolIds.map(id => this.tools.get(id)!).filter(Boolean);
  }

  /**
   * Get all available tools
   */
  getAll(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool metadata for LLM function calling
   */
  getToolSchemas(): Array<{
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: `${tool.metadata.agent}:${tool.metadata.action}`,
      description: tool.metadata.description,
      parameters: {
        type: 'object',
        properties: tool.metadata.parameters.reduce((props, param) => {
          props[param.name] = {
            type: param.type,
            description: param.description,
            ...(param.example !== undefined && { example: param.example }),
          };
          return props;
        }, {} as Record<string, any>),
        required: tool.metadata.parameters
          .filter(p => p.required)
          .map(p => p.name),
      },
    }));
  }

  /**
   * Find tools that can handle a given task description
   */
  findToolsByDescription(query: string): RegisteredTool[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.tools.values()).filter(tool => {
      const searchText = `${tool.metadata.name} ${tool.metadata.description} ${tool.metadata.action}`.toLowerCase();
      return searchText.includes(queryLower);
    });
  }

  /**
   * Execute a tool with validation and error handling
   */
  async execute(
    agent: string,
    action: string,
    parameters: Record<string, any>,
    context: Record<string, any> = {}
  ): Promise<ToolResult> {
    const tool = this.get(agent, action);
    
    if (!tool) {
      return {
        status: 'not_implemented',
        message: `Tool not found: ${agent}:${action}`,
        error: `Available tools: ${Array.from(this.tools.keys()).join(', ')}`,
      };
    }

    // Validate required parameters
    const missingParams = tool.metadata.parameters
      .filter(p => p.required && !(p.name in parameters))
      .map(p => p.name);

    if (missingParams.length > 0) {
      return {
        status: 'error',
        message: `Missing required parameters: ${missingParams.join(', ')}`,
        error: `Required: ${tool.metadata.parameters.filter(p => p.required).map(p => p.name).join(', ')}`,
      };
    }

    // Execute with timeout if specified
    const startTime = Date.now();
    try {
      let result: ToolResult;
      
      if (tool.metadata.timeout) {
        result = await Promise.race([
          tool.execute(parameters, context),
          new Promise<ToolResult>((_, reject) =>
            setTimeout(() => reject(new Error('Tool execution timeout')), tool.metadata.timeout)
          ),
        ]);
      } else {
        result = await tool.execute(parameters, context);
      }

      const executionTime = Date.now() - startTime;
      
      // Add execution metadata
      if (!result.metadata) {
        result.metadata = {
          timestamp: new Date().toISOString(),
          execution_time_ms: executionTime,
        };
      } else {
        result.metadata.execution_time_ms = executionTime;
      }

      return result;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      return {
        status: 'error',
        message: error.message || 'Tool execution failed',
        error: error.toString(),
        metadata: {
          timestamp: new Date().toISOString(),
          execution_time_ms: executionTime,
        },
      };
    }
  }

  /**
   * Execute tool with retry logic
   */
  async executeWithRetry(
    agent: string,
    action: string,
    parameters: Record<string, any>,
    context: Record<string, any> = {},
    maxRetries: number = 3
  ): Promise<ToolResult> {
    const tool = this.get(agent, action);
    
    if (!tool || !tool.metadata.retryable) {
      return this.execute(agent, action, parameters, context);
    }

    let lastError: ToolResult | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        console.log(`[TOOL_REGISTRY] Retry attempt ${attempt}/${maxRetries} for ${agent}:${action}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }

      const result = await this.execute(agent, action, parameters, context);
      
      if (result.status === 'success' || result.status === 'partial') {
        return result;
      }
      
      lastError = result;
    }

    return lastError || {
      status: 'error',
      message: 'Tool execution failed after retries',
    };
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();

/**
 * Decorator function to register tools easily
 */
export function registerTool(metadata: ToolMetadata) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    toolRegistry.register(metadata, originalMethod);
    return descriptor;
  };
}
