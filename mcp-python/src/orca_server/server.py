#!/usr/bin/env python3
"""Orca Network Orchestrator MCP Server"""

import asyncio
import json
import os
import hashlib
from uuid import uuid4
from typing import Any, Dict, List, Optional
from datetime import datetime

from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field
from supabase import create_client, Client
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL and key must be provided in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pydantic models for request validation
class AgentFilter(BaseModel):
    status: Optional[str] = Field(default="active", description="Filter agents by status")
    category: Optional[str] = Field(default=None, description="Filter agents by category")

class ExecutionRequest(BaseModel):
    agent_id: str = Field(description="The ID of the agent to execute")
    user_id: str = Field(description="The ID of the user creating the execution")
    goal: str = Field(description="The goal or task description for the execution")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional parameters")

class ExecutionStatusRequest(BaseModel):
    execution_id: str = Field(description="The ID of the execution to check")

class ExecutionHistoryRequest(BaseModel):
    user_id: str = Field(description="The ID of the user")
    limit: Optional[int] = Field(default=10, description="Maximum number of executions to return")
    status: Optional[str] = Field(default="all", description="Filter by execution status")

class WalletRequest(BaseModel):
    user_id: str = Field(description="The ID of the user")

def create_server():
    """Create and configure the MCP server"""
    server = FastMCP("Orca Orchestrator")

    @server.tool()
    def get_registry(status: str = "active", category: Optional[str] = None) -> str:
        """Get the list of available agents from the registry."""
        try:
            query = supabase.table("agents").select("*")
            
            if status != "all":
                query = query.eq("status", status)
            
            if category:
                query = query.eq("category", category)
            
            response = query.execute()
            
            return json.dumps({
                "agents": response.data,
                "count": len(response.data),
                "status": "success"
            }, indent=2)
            
        except Exception as e:
            return json.dumps({
                "error": str(e),
                "status": "error"
            }, indent=2)

    @server.tool()
    def create_execution(agent_id: str, user_id: str, goal: str, parameters: Optional[Dict[str, Any]] = None) -> str:
        """Create a new execution job for an agent."""
        try:
            if parameters is None:
                parameters = {}
            
            # Get agent details
            agent_response = supabase.table("agents").select("*").eq("id", agent_id).single().execute()
            
            if not agent_response.data:
                raise ValueError(f"Agent not found: {agent_id}")
            
            agent = agent_response.data
            
            # Calculate estimated cost (simulated)
            token_cost = hash(goal) % 1000 + 100  # Deterministic but varied cost
            total_cost = round(token_cost * 0.001, 2)
            
            # Create execution record
            execution_data = {
                "id": str(uuid4()),
                "user_id": user_id,
                "agent_id": agent_id,
                "goal": goal,
                "status": "pending",
                "token_cost": token_cost,
                "total_cost": total_cost,
                "time_taken_ms": 0,
                "results": parameters,
                "decision_hashes": {},
                "created_at": datetime.utcnow().isoformat(),
            }
            
            execution_response = supabase.table("executions").insert(execution_data).execute()
            
            return json.dumps({
                "execution_id": execution_data["id"],
                "status": "created",
                "estimated_cost": total_cost,
                "agent_name": agent["name"],
                "message": "Execution created successfully"
            }, indent=2)
            
        except Exception as e:
            return json.dumps({
                "error": str(e),
                "status": "error"
            }, indent=2)

    @server.tool()
    def get_execution_status(execution_id: str) -> str:
        """Get execution status and results."""
        try:
            response = supabase.table("executions").select("""
                *,
                agents (
                    name,
                    description,
                    category
                )
            """).eq("id", execution_id).single().execute()
            
            if not response.data:
                raise ValueError(f"Execution not found: {execution_id}")
            
            return json.dumps({
                "execution": response.data,
                "status": "success"
            }, indent=2)
            
        except Exception as e:
            return json.dumps({
                "error": str(e),
                "status": "error"
            }, indent=2)

    @server.tool()
    def get_execution_history(user_id: str, limit: int = 10, status: str = "all") -> str:
        """Get user's execution history."""
        try:
            query = supabase.table("executions").select("""
                *,
                agents (
                    name,
                    description,
                    category
                )
            """).eq("user_id", user_id).order("created_at", desc=True).limit(limit)
            
            if status != "all":
                query = query.eq("status", status)
            
            response = query.execute()
            
            return json.dumps({
                "executions": response.data,
                "count": len(response.data),
                "status": "success"
            }, indent=2)
            
        except Exception as e:
            return json.dumps({
                "error": str(e),
                "status": "error"
            }, indent=2)

    @server.tool()
    def get_wallet_balance(user_id: str) -> str:
        """Get user wallet balance and budget information."""
        try:
            response = supabase.table("profiles").select(
                "wallet_balance, monthly_budget"
            ).eq("id", user_id).single().execute()
            
            if not response.data:
                raise ValueError(f"User profile not found: {user_id}")
            
            profile = response.data
            
            return json.dumps({
                "wallet_balance": profile["wallet_balance"],
                "monthly_budget": profile["monthly_budget"],
                "status": "success"
            }, indent=2)
            
        except Exception as e:
            return json.dumps({
                "error": str(e),
                "status": "error"
            }, indent=2)

    @server.tool()
    def prepare_job(execution_id: str) -> str:
        """Prepare a job by calling agent's prepare endpoint."""
        try:
            # Get execution and agent details
            response = supabase.table("executions").select("""
                *,
                agents (
                    api_endpoint,
                    name
                )
            """).eq("id", execution_id).single().execute()
            
            if not response.data:
                raise ValueError(f"Execution not found: {execution_id}")
            
            execution = response.data
            agent_endpoint = execution["agents"]["api_endpoint"]
            
            # Prepare job payload
            job_input_str = json.dumps(execution["results"], sort_keys=True)
            job_input_hash = hashlib.sha256(job_input_str.encode()).hexdigest()
            
            payload = {
                "execution_id": execution_id,
                "goal": execution["goal"],
                "job_input": execution["results"],
                "job_input_hash": job_input_hash
            }
            
            # Call agent's prepare endpoint
            with httpx.Client() as client:
                prepare_url = f"{agent_endpoint}/prepare"
                response = client.post(prepare_url, json=payload, timeout=30.0)
                
                if response.status_code == 200:
                    result = response.json()
                    # Update execution status
                    supabase.table("executions").update({
                        "status": "prepared",
                        "decision_hashes": {"job_input_hash": job_input_hash}
                    }).eq("id", execution_id).execute()
                    
                    return json.dumps(result, indent=2)
                else:
                    return json.dumps({
                        "error": f"Agent preparation failed with status {response.status_code}",
                        "body": response.text,
                        "status": "error"
                    }, indent=2)
                    
        except Exception as e:
            return json.dumps({
                "error": str(e),
                "status": "error"
            }, indent=2)

    @server.tool()
    def ping(message: Optional[str] = None) -> str:
        """Ping the server to check if it's running."""
        return f"Pong from Orca Orchestrator Python MCP Server! {message or ''}"

    return server

def main():
    """Main entry point for the MCP server"""
    server = create_server()
    
    # Run the server
    server.run()

if __name__ == "__main__":
    main()