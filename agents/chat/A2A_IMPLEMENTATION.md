# Weather Chat Agent - A2A Implementation

## Overview

The Weather Chat Orchestrator now supports **Agent-to-Agent (A2A) protocol** communication with deployed weather agents using Google ADK's `RemoteA2aAgent` wrapper. This enables seamless communication with remote agents without complex protocol handling code.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Chat Orchestrator (chat_orchestrator)           │
│                                                              │
│  Environment Variable: USE_REMOTE_AGENTS=true/false         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌─────────────────┐          ┌─────────────────┐
│  REMOTE AGENTS  │          │  LOCAL AGENTS   │
│  (A2A Protocol) │          │  (Sub-agents)   │
│                 │          │                 │
│  Cloud Run      │          │  Local Process  │
│  Deployed       │          │  Development    │
└─────────────────┘          └─────────────────┘
```

## Simple Implementation

### 1. Remote Agent Wrappers (`remote_weather_agents.py`)

Using `RemoteA2aAgent` from Google ADK:

```python
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent

# Weather Alerts Snapshot Agent
alerts_agent_remote = RemoteA2aAgent(
    name="weather_alerts_snapshot_agent",
    description="Retrieves and analyzes the top 5 most severe active weather alerts",
    agent_card="../../agent-cards/weather-alerts-snapshot-agent-card.json",
)

# Weather Forecast Agent
forecast_agent_remote = RemoteA2aAgent(
    name="weather_forecast_agent",
    description="Provides detailed 7-day weather forecasts and 48-hour hourly predictions",
    agent_card="../../agent-cards/weather-forecast-agent-card.json",
)

# ... and 3 more agents
```

### 2. Agent Cards

Each remote agent has a JSON agent card in `/agent-cards/` directory:

```json
{
    "name": "weather_forecast_agent",
    "description": "An agent that provides detailed 7-day weather forecasts...",
    "defaultInputModes": ["text/plain"],
    "defaultOutputModes": ["application/json"],
    "skills": [...],
    "url": "https://weather-forecast-agent-juqzb7sbxa-uc.a.run.app",
    "version": "1.0.0"
}
```

### 3. Chat Orchestrator (`agent.py`)

The orchestrator automatically switches between remote and local agents:

```python
USE_REMOTE_AGENTS = os.getenv("USE_REMOTE_AGENTS", "true").lower() == "true"

if USE_REMOTE_AGENTS:
    # Use remote A2A agents
    chat_orchestrator = LlmAgent(
        name="chat_orchestrator",
        sub_agents=[
            alerts_agent_remote,
            forecast_agent_remote,
            risk_analysis_agent_remote,
            emergency_resources_agent_remote,
            hurricane_agent_remote,
        ],
        ...
    )
else:
    # Use local sub-agents
    chat_orchestrator = LlmAgent(
        name="chat_orchestrator",
        tools=[
            AgentTool(alerts_snapshot_workflow),
            AgentTool(forecast_workflow),
            ...
        ],
        ...
    )
```

## Deployed Agents

| Agent | URL |
|-------|-----|
| **Alerts Snapshot** | https://weather-alerts-snapshot-agent-juqzb7sbxa-uc.a.run.app |
| **Forecast** | https://weather-forecast-agent-juqzb7sbxa-uc.a.run.app |
| **Risk Analysis** | https://weather-risk-analysis-agent-juqzb7sbxa-uc.a.run.app |
| **Emergency Resources** | https://weather-emergency-resources-agent-juqzb7sbxa-uc.a.run.app |
| **Hurricane Simulation** | https://weather-hurricane-simulation-agent-juqzb7sbxa-uc.a.run.app |

## Configuration

### Environment Variables

**`.env` file:**
```bash
# Use remote A2A agents (default: true)
USE_REMOTE_AGENTS=true

# For local development, set to false
# USE_REMOTE_AGENTS=false
```

### Switching Modes

**Production (Remote A2A Agents):**
```bash
export USE_REMOTE_AGENTS=true
adk web
```

**Development (Local Sub-agents):**
```bash
export USE_REMOTE_AGENTS=false
adk web
```

## Benefits

### Remote A2A Mode (Production)
- ✅ **Scalable**: Agents run independently on Cloud Run
- ✅ **Distributed**: Load balanced across multiple instances
- ✅ **Fast**: Parallel execution on separate services
- ✅ **Simple**: No complex protocol code needed
- ✅ **Maintainable**: Each agent can be updated independently

### Local Mode (Development)
- ✅ **Fast iteration**: No deployment needed for testing
- ✅ **Debugging**: Full access to agent internals
- ✅ **Offline**: Works without network connectivity
- ✅ **Cost-effective**: No Cloud Run charges during development

## How It Works

1. **Agent Card Discovery**: `RemoteA2aAgent` reads the JSON agent card
2. **A2A Protocol**: ADK handles all A2A protocol communication automatically
3. **HTTP Communication**: Sends requests to the agent's URL from the card
4. **Response Handling**: ADK parses and returns the agent's response
5. **Seamless Integration**: Works exactly like local sub-agents

## Example Usage

### User Query Flow

```
User: "What's the weather forecast for San Francisco?"
  ↓
Chat Orchestrator (analyzes query)
  ↓
Delegates to: weather_forecast_agent (remote)
  ↓
RemoteA2aAgent (A2A protocol)
  ↓
HTTP POST → https://weather-forecast-agent-juqzb7sbxa-uc.a.run.app
  ↓
Forecast Agent (processes query)
  ↓
Returns: 7-day forecast + hourly predictions
  ↓
Chat Orchestrator (formats response)
  ↓
User: Receives formatted weather forecast
```

## Files Structure

```
agents/chat/
├── agent.py                      # Main orchestrator (switches modes)
├── remote_weather_agents.py      # Remote A2A agent wrappers
├── sub_agents/                   # Local sub-agents (fallback)
│   ├── alerts_snapshot_agent/
│   ├── forecast_agent/
│   ├── risk_analysis_agent/
│   ├── emergency_resources_agent/
│   └── hurricane_simulation_agent/
└── A2A_IMPLEMENTATION.md         # This file

agent-cards/                      # Agent card JSON files
├── weather-alerts-snapshot-agent-card.json
├── weather-forecast-agent-card.json
├── weather-risk-analysis-agent-card.json
├── weather-emergency-resources-agent-card.json
└── weather-hurricane-simulation-agent-card.json
```

## Testing

### Test Remote A2A Mode
```bash
# Set environment variable
export USE_REMOTE_AGENTS=true

# Start chat agent
cd agents/chat
adk web

# Query the agent
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What alerts are active in California?"}'
```

### Test Local Mode
```bash
# Set environment variable
export USE_REMOTE_AGENTS=false

# Start chat agent
cd agents/chat
adk web

# Query the agent (uses local sub-agents)
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What alerts are active in California?"}'
```

## Comparison with Previous Approach

### ❌ Old Approach (Complex)
- Manual A2A protocol implementation
- Custom `RemoteAgentConnection` class
- HTTP client management
- Request/response parsing
- Connection pooling
- Error handling
- ~300 lines of boilerplate code

### ✅ New Approach (Simple)
- Use `RemoteA2aAgent` from ADK
- Point to agent card JSON
- ADK handles all protocol details
- ~50 lines of clean code
- Same functionality, much simpler

## Deployment

The chat agent can be deployed with remote A2A support:

```bash
# Deploy chat agent with A2A support
cd agents/chat
adk deploy --env USE_REMOTE_AGENTS=true

# The deployed chat agent will communicate with other deployed agents via A2A
```

## Summary

This implementation follows the **Google ADK best practices** for A2A communication:
1. ✅ Use `RemoteA2aAgent` wrapper (not custom protocol code)
2. ✅ Define agent cards in JSON files
3. ✅ Let ADK handle all A2A protocol details
4. ✅ Keep local sub-agents for development/fallback
5. ✅ Use environment variables to switch modes

**Result**: Clean, maintainable, production-ready A2A implementation! 🎉
