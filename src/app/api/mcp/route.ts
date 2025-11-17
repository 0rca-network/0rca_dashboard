import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MCPRequest {
  tool: string;
  parameters: Record<string, any>;
}

interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Helper function to execute MCP tools via the TypeScript server
async function executeMCPTool(tool: string, parameters: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('node', ['dist/mcp/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });

    let output = '';
    let errorOutput = '';

    mcpProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    mcpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    mcpProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          resolve({ output, error: 'Failed to parse JSON response' });
        }
      } else {
        reject(new Error(`MCP process exited with code ${code}: ${errorOutput}`));
      }
    });

    // Send the tool request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: tool,
        arguments: parameters
      }
    };

    mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    mcpProcess.stdin.end();
  });
}

export async function POST(request: NextRequest): Promise<NextResponse<MCPResponse>> {
  try {
    const body: MCPRequest = await request.json();
    const { tool, parameters } = body;

    // Validate required fields
    if (!tool) {
      return NextResponse.json({
        success: false,
        error: 'Tool name is required'
      }, { status: 400 });
    }

    // Execute the MCP tool
    const result = await executeMCPTool(tool, parameters || {});

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('MCP API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Return available MCP tools and their descriptions
    const tools = [
      {
        name: 'get_registry',
        description: 'Get the list of available agents from the registry',
        parameters: {
          status: { type: 'string', optional: true, description: 'Filter agents by status' },
          category: { type: 'string', optional: true, description: 'Filter agents by category' }
        }
      },
      {
        name: 'create_execution',
        description: 'Create a new execution job for an agent',
        parameters: {
          agent_id: { type: 'string', required: true, description: 'The ID of the agent to execute' },
          user_id: { type: 'string', required: true, description: 'The ID of the user creating the execution' },
          goal: { type: 'string', required: true, description: 'The goal or task description for the execution' },
          parameters: { type: 'object', optional: true, description: 'Additional parameters for the execution' }
        }
      },
      {
        name: 'get_execution_status',
        description: 'Get execution status and results',
        parameters: {
          execution_id: { type: 'string', required: true, description: 'The ID of the execution to check' }
        }
      },
      {
        name: 'get_execution_history',
        description: 'Get user\'s execution history',
        parameters: {
          user_id: { type: 'string', required: true, description: 'The ID of the user' },
          limit: { type: 'number', optional: true, description: 'Maximum number of executions to return' },
          status: { type: 'string', optional: true, description: 'Filter by execution status' }
        }
      },
      {
        name: 'get_wallet_balance',
        description: 'Get user wallet balance and budget information',
        parameters: {
          user_id: { type: 'string', required: true, description: 'The ID of the user' }
        }
      },
      {
        name: 'ping',
        description: 'Test server connectivity',
        parameters: {
          message: { type: 'string', optional: true, description: 'Optional message to include in response' }
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        server: 'Orca Orchestrator MCP Server',
        version: '0.1.0',
        tools
      }
    });

  } catch (error) {
    console.error('MCP API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}