/**
 * MCP Client for Orca Network Dashboard
 * Provides a simple interface to interact with the MCP server
 */

export interface MCPToolCall {
  tool: string;
  parameters?: Record<string, any>;
}

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class MCPClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/mcp') {
    this.baseUrl = baseUrl;
  }

  /**
   * Execute an MCP tool
   */
  async executeTool<T = any>(tool: string, parameters?: Record<string, any>): Promise<MCPResponse<T>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tool, parameters }),
      });

      const result: MCPResponse<T> = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Get available MCP tools
   */
  async getAvailableTools(): Promise<MCPResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
      });

      const result: MCPResponse = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Convenience methods for common operations

  /**
   * Get agent registry
   */
  async getAgentRegistry(status?: string, category?: string) {
    return this.executeTool('get_registry', { status, category });
  }

  /**
   * Create a new execution
   */
  async createExecution(agentId: string, userId: string, goal: string, parameters?: Record<string, any>) {
    return this.executeTool('create_execution', {
      agent_id: agentId,
      user_id: userId,
      goal,
      parameters,
    });
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string) {
    return this.executeTool('get_execution_status', { execution_id: executionId });
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(userId: string, limit?: number, status?: string) {
    return this.executeTool('get_execution_history', {
      user_id: userId,
      limit,
      status,
    });
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId: string) {
    return this.executeTool('get_wallet_balance', { user_id: userId });
  }

  /**
   * Ping the server
   */
  async ping(message?: string) {
    return this.executeTool('ping', { message });
  }
}

// Export a default instance
export const mcpClient = new MCPClient();