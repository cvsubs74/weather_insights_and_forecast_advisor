# Testing Chat Agent with Remote A2A Agents

## Quick Start

The chat agent is already configured to use remote agents via the `USE_REMOTE_AGENTS` environment variable.

### Step 1: Set Environment Variable

```bash
# Use remote A2A agents (deployed on Cloud Run)
export USE_REMOTE_AGENTS=true

# Or for local sub-agents (development)
# export USE_REMOTE_AGENTS=false
```

### Step 2: Set Google Cloud Credentials

```bash
# Set your Google Cloud project
export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_LOCATION=us-central1

# Ensure you're authenticated
gcloud auth application-default login
```

### Step 3: Start the Chat Agent

```bash
cd agents/chat
adk web
```

You should see:
```
🌐 Using REMOTE A2A agents for weather queries
```

### Step 4: Test the Agent

Open your browser to `http://localhost:8000` or use curl:

#### Test 1: Weather Alerts
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What weather alerts are active in California?"}'
```

**Expected:** Chat agent → alerts_agent_remote → Cloud Run Alerts Agent

#### Test 2: Weather Forecast
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the weather forecast for San Francisco?"}'
```

**Expected:** Chat agent → forecast_agent_remote → Cloud Run Forecast Agent

#### Test 3: Emergency Resources
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Find emergency shelters near Miami, Florida"}'
```

**Expected:** Chat agent → emergency_resources_agent_remote → Cloud Run Emergency Resources Agent

#### Test 4: Risk Analysis
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Analyze the risk of flooding in Houston"}'
```

**Expected:** Chat agent → risk_analysis_agent_remote → Cloud Run Risk Analysis Agent

#### Test 5: Hurricane Analysis
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the evacuation priorities for Hurricane Milton?"}'
```

**Expected:** Chat agent → hurricane_agent_remote → Cloud Run Hurricane Agent

## How It Works

### Configuration (agent.py)

```python
# Line 49: Environment variable check
USE_REMOTE_AGENTS = os.getenv("USE_REMOTE_AGENTS", "true").lower() == "true"

if USE_REMOTE_AGENTS:
    logger.info("🌐 Using REMOTE A2A agents for weather queries")
    chat_orchestrator = LlmAgent(
        sub_agents=[
            alerts_agent_remote,           # → Cloud Run
            forecast_agent_remote,         # → Cloud Run
            risk_analysis_agent_remote,    # → Cloud Run
            emergency_resources_agent_remote, # → Cloud Run
            hurricane_agent_remote,        # → Cloud Run
        ],
        ...
    )
else:
    logger.info("🏠 Using LOCAL sub-agents for weather queries")
    chat_orchestrator = LlmAgent(
        tools=[
            AgentTool(alerts_snapshot_workflow),
            AgentTool(forecast_workflow),
            ...
        ],
        ...
    )
```

### Remote Agent Wrappers (remote_weather_agents.py)

```python
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent

AGENT_CARDS_BASE_URL = "https://raw.githubusercontent.com/cvsubs74/weather_insights_and_forecast_advisor/main/agent-cards"

alerts_agent_remote = RemoteA2aAgent(
    name="weather_alerts_snapshot_agent",
    description="...",
    agent_card=f"{AGENT_CARDS_BASE_URL}/weather-alerts-snapshot-agent-card.json",
)
```

### Agent Cards (GitHub)

Each agent card contains:
- Agent name and description
- Skills and capabilities
- **Cloud Run URL** (e.g., `https://weather-alerts-snapshot-agent-juqzb7sbxa-uc.a.run.app`)
- Input/output modes

## Verification

### Check Logs

When you start the agent, you should see:

```
🌐 Using REMOTE A2A agents for weather queries
INFO - Starting agent: chat_orchestrator
```

When a query is processed:

```
🔄 AGENT ENTRY / TRANSFER: chat_orchestrator
🔄 AGENT ENTRY / TRANSFER: weather_alerts_snapshot_agent
✅ AGENT EXIT: weather_alerts_snapshot_agent
✅ AGENT EXIT: chat_orchestrator
```

### Check Network Requests

The agent will make HTTP requests to Cloud Run:
```
POST https://weather-alerts-snapshot-agent-juqzb7sbxa-uc.a.run.app/a2a/...
POST https://weather-forecast-agent-juqzb7sbxa-uc.a.run.app/a2a/...
```

## Troubleshooting

### Issue: "Using LOCAL sub-agents"

**Problem:** Environment variable not set correctly

**Solution:**
```bash
export USE_REMOTE_AGENTS=true
# Verify
echo $USE_REMOTE_AGENTS
```

### Issue: "Failed to connect to remote agent"

**Problem:** Network or authentication issue

**Solutions:**
1. Check internet connectivity
2. Verify Google Cloud authentication:
   ```bash
   gcloud auth application-default login
   ```
3. Verify agent URLs are accessible:
   ```bash
   curl https://weather-alerts-snapshot-agent-juqzb7sbxa-uc.a.run.app
   ```

### Issue: "Agent card not found"

**Problem:** GitHub URL not accessible

**Solution:**
1. Verify agent cards are pushed to GitHub:
   ```bash
   git push origin main
   ```
2. Check the URL in browser:
   ```
   https://raw.githubusercontent.com/cvsubs74/weather_insights_and_forecast_advisor/main/agent-cards/weather-alerts-snapshot-agent-card.json
   ```

## Switching Modes

### Use Remote Agents (Production)
```bash
export USE_REMOTE_AGENTS=true
cd agents/chat
adk web
```

### Use Local Agents (Development)
```bash
export USE_REMOTE_AGENTS=false
cd agents/chat
adk web
```

## Remote Agent URLs

| Agent | Cloud Run URL |
|-------|---------------|
| Alerts | https://weather-alerts-snapshot-agent-juqzb7sbxa-uc.a.run.app |
| Forecast | https://weather-forecast-agent-juqzb7sbxa-uc.a.run.app |
| Risk Analysis | https://weather-risk-analysis-agent-juqzb7sbxa-uc.a.run.app |
| Emergency Resources | https://weather-emergency-resources-agent-juqzb7sbxa-uc.a.run.app |
| Hurricane Simulation | https://weather-hurricane-simulation-agent-juqzb7sbxa-uc.a.run.app |

## Success Indicators

✅ **Logs show:** "🌐 Using REMOTE A2A agents"  
✅ **Network requests** to Cloud Run URLs  
✅ **Responses** from deployed agents  
✅ **No local sub-agent execution**  

## Next Steps

1. ✅ Test locally with remote agents
2. ✅ Verify all 5 agent types work
3. ✅ Check response times and quality
4. ✅ Deploy chat agent to Cloud Run
5. ✅ Test deployed chat agent → deployed weather agents (full A2A)
