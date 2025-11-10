#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
// Create an MCP server
const server = new mcp_js_1.McpServer({
    name: "0rcanetwork-mcp-server",
    version: "0.1.0",
});
// Add a tool for pinging the server
server.tool("ping", {
    message: zod_1.z.string().optional().describe("An optional message to include in the ping response"),
}, async ({ message }) => {
    return {
        content: [
            {
                type: "text",
                text: `Pong! ${message || ""}`,
            },
        ],
    };
});
// Start receiving messages on stdin and sending messages on stdout
async function run() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("0rcanetwork MCP server running on stdio");
}
run();
