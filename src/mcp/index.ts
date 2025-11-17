#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create an MCP server
const server = new McpServer({
  name: "orca-orchestrator-mcp-server",
  version: "0.1.0",
});

// Tool: Get available agents from registry
server.tool(
  "get_registry",
  {
    status: z.enum(["active", "inactive", "all"]).optional().describe("Filter agents by status"),
    category: z.string().optional().describe("Filter agents by category"),
  },
  async ({ status = "active", category }) => {
    try {
      let query = supabase.from("agents").select("*");
      
      if (status !== "all") {
        query = query.eq("status", status);
      }
      
      if (category) {
        query = query.eq("category", category);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              agents: data,
              count: data?.length || 0,
              status: "success"
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
              status: "error"
            }, null, 2),
          },
        ],
      };
    }
  }
);

// Tool: Create a new execution job
server.tool(
  "create_execution",
  {
    agent_id: z.string().describe("The ID of the agent to execute"),
    user_id: z.string().describe("The ID of the user creating the execution"),
    goal: z.string().describe("The goal or task description for the execution"),
    parameters: z.record(z.any()).optional().describe("Additional parameters for the execution"),
  },
  async ({ agent_id, user_id, goal, parameters = {} }) => {
    try {
      // Get agent details
      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agent_id)
        .single();
      
      if (agentError || !agent) {
        throw new Error(`Agent not found: ${agentError?.message}`);
      }
      
      // Calculate estimated cost
      const tokenCost = Math.floor(Math.random() * 1000) + 100; // Simulated
      const totalCost = parseFloat((tokenCost * 0.001).toFixed(2));
      
      // Create execution record
      const executionData = {
        id: uuidv4(),
        user_id,
        agent_id,
        goal,
        status: "pending",
        token_cost: tokenCost,
        total_cost: totalCost,
        time_taken_ms: 0,
        results: parameters,
        decision_hashes: {},
        created_at: new Date().toISOString(),
      };
      
      const { data: execution, error: executionError } = await supabase
        .from("executions")
        .insert(executionData)
        .select()
        .single();
      
      if (executionError) {
        throw new Error(`Failed to create execution: ${executionError.message}`);
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              execution_id: execution.id,
              status: "created",
              estimated_cost: totalCost,
              agent_name: agent.name,
              message: "Execution created successfully"
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
              status: "error"
            }, null, 2),
          },
        ],
      };
    }
  }
);

// Tool: Get execution status and results
server.tool(
  "get_execution_status",
  {
    execution_id: z.string().describe("The ID of the execution to check"),
  },
  async ({ execution_id }) => {
    try {
      const { data: execution, error } = await supabase
        .from("executions")
        .select(`
          *,
          agents (
            name,
            description,
            category
          )
        `)
        .eq("id", execution_id)
        .single();
      
      if (error || !execution) {
        throw new Error(`Execution not found: ${error?.message}`);
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              execution,
              status: "success"
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
              status: "error"
            }, null, 2),
          },
        ],
      };
    }
  }
);

// Tool: Get user's execution history
server.tool(
  "get_execution_history",
  {
    user_id: z.string().describe("The ID of the user"),
    limit: z.number().optional().describe("Maximum number of executions to return"),
    status: z.enum(["pending", "running", "completed", "failed", "all"]).optional().describe("Filter by execution status"),
  },
  async ({ user_id, limit = 10, status = "all" }) => {
    try {
      let query = supabase
        .from("executions")
        .select(`
          *,
          agents (
            name,
            description,
            category
          )
        `)
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (status !== "all") {
        query = query.eq("status", status);
      }
      
      const { data: executions, error } = await query;
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              executions,
              count: executions?.length || 0,
              status: "success"
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
              status: "error"
            }, null, 2),
          },
        ],
      };
    }
  }
);

// Tool: Get user wallet balance
server.tool(
  "get_wallet_balance",
  {
    user_id: z.string().describe("The ID of the user"),
  },
  async ({ user_id }) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("wallet_balance, monthly_budget")
        .eq("id", user_id)
        .single();
      
      if (error || !profile) {
        throw new Error(`User profile not found: ${error?.message}`);
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              wallet_balance: profile.wallet_balance,
              monthly_budget: profile.monthly_budget,
              status: "success"
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
              status: "error"
            }, null, 2),
          },
        ],
      };
    }
  }
);

// Tool: Ping server
server.tool(
  "ping",
  {
    message: z.string().optional().describe("An optional message to include in the ping response"),
  },
  async ({ message }) => {
    return {
      content: [
        {
          type: "text",
          text: `Pong from Orca Orchestrator! ${message || ""}`,
        },
      ],
    };
  }
);

// Start receiving messages on stdin and sending messages on stdout
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Orca Orchestrator MCP server running on stdio");
}

run().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});