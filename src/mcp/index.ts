#!/usr/bin/env node
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "0rcanetwork-mcp-server",
  version: "0.1.0",
});

// Add a tool for pinging the server
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
          text: `Pong! ${message || ""}`,
        },
      ],
    };
  }
);

// Start receiving messages on stdin and sending messages on stdout
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("0rcanetwork MCP server running on stdio");
}

run();