# Orca Network MCP Server Integration

This document describes the Model Context Protocol (MCP) server integration for the Orca Network Dashboard.

## Overview

The Orca Network Dashboard now includes two MCP server implementations:

1. **TypeScript MCP Server** (`src/mcp/index.ts`) - Native Node.js implementation
2. **Python MCP Server** (`mcp-python/`) - Python implementation using FastMCP

Both servers provide the same functionality and can be used interchangeably.

## Features

### Available Tools

1. **get_registry** - Get list of available agents
2. **create_execution** - Create new execution jobs
3. **get_execution_status** - Check execution status
4. **get_execution_history** - View user execution history
5. **get_wallet_balance** - Check user wallet balance
6. **ping** - Test server connectivity

### Integration Points

- **API Endpoint**: `/api/mcp` - REST API wrapper for MCP tools
- **Client Library**: `src/lib/mcp-client.ts` - TypeScript client for dashboard integration
- **Configuration**: `mcp-config.json` - MCP client configuration

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python MCP server (optional)
npm run install:mcp-python
```

### 2. Environment Configuration

Ensure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Build and Start MCP Servers

#### TypeScript Server
```bash
# Build the TypeScript MCP server
npm run build:mcp

# Start the server
npm run start:mcp

# Or run both commands
npm run dev:mcp
```

#### Python Server
```bash
# Start the Python MCP server
npm run start:mcp-python

# Or run directly
cd mcp-python
python -m orca_server.server
```

## Usage Examples

### Using the API Endpoint

```typescript
// Get agent registry
const response = await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'get_registry',
    parameters: { status: 'active' }
  })
});

const result = await response.json();
```

### Using the MCP Client

```typescript
import { mcpClient } from '@/lib/mcp-client';

// Get active agents
const agents = await mcpClient.getAgentRegistry('active');

// Create execution
const execution = await mcpClient.createExecution(
  'agent-id',
  'user-id',
  'Analyze market trends',
  { timeframe: '1d' }
);

// Check execution status
const status = await mcpClient.getExecutionStatus('execution-id');
```

### Integration with Dashboard Components

```typescript
// In a React component
import { mcpClient } from '@/lib/mcp-client';
import { useEffect, useState } from 'react';

export function AgentRegistry() {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    const loadAgents = async () => {
      const result = await mcpClient.getAgentRegistry('active');
      if (result.success) {
        const data = JSON.parse(result.data.content[0].text);
        setAgents(data.agents);
      }
    };
    loadAgents();
  }, []);

  return (
    <div>
      {agents.map(agent => (
        <div key={agent.id}>{agent.name}</div>
      ))}
    </div>
  );
}
```

## MCP Client Configuration

For external MCP clients (like Claude Desktop), use the configuration in `mcp-config.json`:

```json
{
  "mcpServers": {
    "orca-orchestrator": {
      "command": "node",
      "args": ["dist/mcp/index.js"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "your_supabase_url",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "your_supabase_key"
      }
    }
  }
}
```

## Error Handling

All MCP tools return consistent JSON responses:

```typescript
interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}
```

Success responses include parsed data, while error responses include descriptive error messages.

## Development

### Adding New Tools

1. **TypeScript Server**: Add new tools to `src/mcp/index.ts`
2. **Python Server**: Add new tools to `mcp-python/src/orca_server/server.py`
3. **API Integration**: Update `/api/mcp/route.ts` if needed
4. **Client Methods**: Add convenience methods to `src/lib/mcp-client.ts`

### Testing

```bash
# Test TypeScript server
npm run build:mcp
echo '{"tool": "ping", "parameters": {"message": "test"}}' | node dist/mcp/index.js

# Test Python server
cd mcp-python
echo '{"tool": "ping", "parameters": {"message": "test"}}' | python -m orca_server.server

# Test API endpoint
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"tool": "ping", "parameters": {"message": "test"}}'
```

## Deployment

### Vercel Deployment

The TypeScript MCP server will be built automatically during deployment. Ensure environment variables are set in Vercel dashboard.

### Standalone Deployment

For standalone MCP server deployment:

```bash
# Build and package
npm run build:mcp
tar -czf orca-mcp-server.tar.gz dist/mcp package.json

# Deploy to server
scp orca-mcp-server.tar.gz user@server:/path/to/deployment/
ssh user@server "cd /path/to/deployment && tar -xzf orca-mcp-server.tar.gz && npm install --production"
```

## Security Considerations

- MCP servers have access to Supabase with the anon key
- Row Level Security (RLS) policies protect data access
- All database operations respect user permissions
- Environment variables should be properly secured

## Troubleshooting

### Common Issues

1. **"Supabase URL not found"**: Check environment variables
2. **"Permission denied"**: Verify RLS policies in Supabase
3. **"Tool not found"**: Ensure MCP server is built and running
4. **"JSON parse error"**: Check tool response format

### Debug Mode

Enable debug logging:

```bash
# TypeScript server
DEBUG=mcp:* npm run start:mcp

# Python server
PYTHONPATH=src python -m orca_server.server --debug
```