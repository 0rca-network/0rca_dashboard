# Orca Network Orchestrator MCP Server (Python)

A Model Context Protocol (MCP) server for the Orca Network Dashboard, providing AI agent orchestration capabilities.

## Features

- **Agent Registry**: Browse and filter available AI agents
- **Execution Management**: Create and monitor agent executions
- **Wallet Integration**: Check user balances and spending
- **Job Preparation**: Prepare jobs for agent execution
- **History Tracking**: View execution history and results

## Installation

1. **Install dependencies**:
   ```bash
   cd mcp-python
   pip install -e .
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Usage

### Running the Server

```bash
# Run directly
python -m orca_server.server

# Or use the installed script
orca-mcp-server
```

### Available Tools

1. **get_registry**: Get list of available agents
   - Parameters: `status` (optional), `category` (optional)

2. **create_execution**: Create a new execution job
   - Parameters: `agent_id`, `user_id`, `goal`, `parameters` (optional)

3. **get_execution_status**: Get execution status and results
   - Parameters: `execution_id`

4. **get_execution_history**: Get user's execution history
   - Parameters: `user_id`, `limit` (optional), `status` (optional)

5. **get_wallet_balance**: Get user wallet balance
   - Parameters: `user_id`

6. **prepare_job**: Prepare a job for execution
   - Parameters: `execution_id`

7. **ping**: Test server connectivity
   - Parameters: `message` (optional)

## Integration with MCP Clients

This server can be used with any MCP-compatible client, such as:
- Claude Desktop
- VS Code with MCP extension
- Custom MCP clients

### Example MCP Client Configuration

```json
{
  "mcpServers": {
    "orca-orchestrator": {
      "command": "orca-mcp-server",
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "your_supabase_url",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "your_supabase_key"
      }
    }
  }
}
```

## Development

The server is built using:
- **FastMCP**: High-performance MCP server framework
- **Supabase**: Database and authentication
- **Pydantic**: Data validation and serialization
- **HTTPX**: HTTP client for agent communication

## Error Handling

All tools return JSON responses with consistent error handling:
- Success responses include `"status": "success"`
- Error responses include `"status": "error"` and `"error"` message