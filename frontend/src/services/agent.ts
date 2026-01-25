import { apiClient } from '../lib/api';

export interface AgentRequest {
  message: string;
  trip_id?: string;
  trip_context?: Record<string, unknown>;
  trip_memory?: Record<string, unknown>;
}

export interface AgentResponse {
  clarification?: string;
  response?: string;
  plan_version_id?: string | null;
  intent?: Record<string, unknown>;
  task_plan?: Record<string, unknown>;
  completed_tasks: Record<string, unknown>;
}

export const agentService = {
  async runAgent(request: AgentRequest): Promise<AgentResponse> {
    return apiClient.post<AgentResponse>('/api/agents/plan', request);
  },
};
