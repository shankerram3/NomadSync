# Dynamic Tooling System

## Overview

The NomadSync agent system now uses a **flexible, dynamic tooling architecture** that allows tools to be registered, discovered, and executed automatically without hardcoding.

## Key Features

### 1. **Dynamic Tool Registry**
- Tools self-register with metadata
- Automatic discovery and loading
- Tool metadata includes descriptions, parameters, examples
- Support for tool dependencies and retries

### 2. **Flexible Task Planning**
- Tasks are created dynamically based on available tools
- LLM can see available tools and their capabilities
- Automatic parameter extraction from intent
- Fallback to static planning if needed

### 3. **Smart Tool Discovery**
- Tools can be found by description/keywords
- Category-based tool lookup
- Tool schemas for LLM function calling

### 4. **Robust Execution**
- Parameter validation
- Timeout support
- Retry logic for retryable tools
- Comprehensive error handling

## Architecture

```
┌─────────────────────────────────────┐
│      Tool Registry (Singleton)     │
│  - Register/Discover Tools          │
│  - Metadata Management               │
│  - Tool Execution                   │
└─────────────────────────────────────┘
              │
              ├─── Tool Loader
              │    - Auto-loads tools
              │    - Provides schemas
              │
              ├─── Dynamic Task Planner
              │    - Creates tasks from tools
              │    - Validates parameters
              │
              └─── Agent Workflow
                   - Uses registry
                   - Executes tasks
```

## Creating a New Tool

### Step 1: Define Tool Metadata

```typescript
// backend/src/services/tools/my_tool.ts
import { toolRegistry, ToolMetadata, ToolResult } from '../tool_registry.js';

const myToolMetadata: ToolMetadata = {
  id: 'my_tool',
  name: 'My Tool',
  description: 'What this tool does',
  agent: 'research',
  action: 'my_action',
  category: 'research',
  parameters: [
    {
      name: 'param1',
      type: 'string',
      required: true,
      description: 'Parameter description',
      example: 'example value',
    },
  ],
  examples: [
    {
      input: { param1: 'value' },
      output: { status: 'success', data: {} },
    },
  ],
  retryable: true,
  timeout: 30000,
};
```

### Step 2: Implement Tool Function

```typescript
async function myTool(
  parameters: Record<string, any>,
  context: Record<string, any>
): Promise<ToolResult> {
  try {
    // Your tool logic here
    return {
      status: 'success',
      data: { /* results */ },
      message: 'Tool executed successfully',
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message,
      error: error.toString(),
    };
  }
}
```

### Step 3: Register the Tool

```typescript
// Register the tool (self-registers on import)
toolRegistry.register(myToolMetadata, myTool);

export { myTool, myToolMetadata };
```

### Step 4: Add to Tool Loader

```typescript
// backend/src/services/tool_loader.ts
export async function loadAllTools(): Promise<void> {
  await import('./tools/flight_tool.js');
  await import('./tools/my_tool.js'); // Add here
  // ...
}
```

## Tool Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique tool identifier |
| `name` | string | Human-readable name |
| `description` | string | What the tool does (used by LLM) |
| `agent` | string | Agent category (e.g., 'research') |
| `action` | string | Action name (e.g., 'search_flights') |
| `category` | enum | Tool category for organization |
| `parameters` | array | Parameter definitions with types |
| `examples` | array | Example inputs/outputs |
| `dependencies` | array | Other tool IDs this depends on |
| `retryable` | boolean | Whether tool can be retried |
| `timeout` | number | Execution timeout in ms |

## Dynamic Task Planning

The system automatically creates tasks based on:

1. **User Intent**: What the user requested
2. **Available Tools**: What tools are registered
3. **Tool Matching**: Finds tools that match the request
4. **Parameter Extraction**: Maps intent to tool parameters

### Example Flow

```
User: "Find flights from NYC to Tokyo"
  ↓
Intent: { requested_tasks: ['flights'], origin: 'NYC', destination: 'Tokyo' }
  ↓
Tool Discovery: Finds 'research:search_flights' tool
  ↓
Task Creation: {
  agent: 'research',
  action: 'search_flights',
  parameters: { origin: 'NYC', destination: 'Tokyo', ... }
}
  ↓
Execution: Tool registry executes with validation
```

## Tool Execution Features

### Automatic Validation
- Checks required parameters
- Validates parameter types
- Provides clear error messages

### Timeout Support
```typescript
{
  timeout: 30000, // 30 seconds
}
```

### Retry Logic
```typescript
{
  retryable: true,
}
// Automatically retries up to 3 times on failure
```

### Execution Metadata
All tool results include:
- Execution time
- Timestamp
- Provider information
- Cached status (if applicable)

## Benefits

### 1. **Extensibility**
- Add new tools without modifying core code
- Tools are self-contained modules
- Easy to test in isolation

### 2. **Flexibility**
- LLM can see available tools
- Dynamic task creation
- Tool discovery by description

### 3. **Maintainability**
- Clear separation of concerns
- Tool metadata is self-documenting
- Centralized tool management

### 4. **Robustness**
- Parameter validation
- Error handling
- Retry logic
- Timeout protection

## Migration from Old System

The old hardcoded tool system is still supported as a fallback. The new system:

1. **Tries dynamic tool creation first**
2. **Falls back to static tasks** if needed
3. **Maintains backward compatibility**

## Future Enhancements

- [ ] Tool composition (tools calling other tools)
- [ ] Tool versioning
- [ ] Tool caching strategies
- [ ] Tool performance metrics
- [ ] Tool usage analytics
- [ ] Dynamic tool creation from LLM
- [ ] Tool marketplace/plugins

## Example: Flight Tool

See `backend/src/services/tools/flight_tool.ts` for a complete example of:
- Tool metadata definition
- Tool implementation
- Parameter handling
- Error handling
- Result formatting
