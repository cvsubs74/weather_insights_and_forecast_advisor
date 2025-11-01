from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from .tools.logging_utils import log_agent_entry, log_agent_exit

# Import remote A2A agent wrappers (deployed agents)
from .remote_weather_agents import (
    alerts_agent_remote,
    forecast_agent_remote,
    risk_analysis_agent_remote,
    emergency_resources_agent_remote,
    hurricane_agent_remote,
)

# Import the local workflow agents (fallback/development)
from .sub_agents.alerts_snapshot_agent.agent import alerts_snapshot_workflow
from .sub_agents.forecast_agent.agent import forecast_workflow
from .sub_agents.risk_analysis_agent.agent import risk_analysis_workflow
from .sub_agents.emergency_resources_agent.agent import emergency_resources_workflow
from .sub_agents.hurricane_simulation_agent.agent import hurricane_analysis_workflow
from .sub_agents.google_search_agent.agent import GoogleSearchAgent
from .sub_agents.weather_map_agent.agent import weather_map_agent

import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger(__name__)

# Callback functions for agent lifecycle logging
def log_agent_entry(callback_context, llm_request):
    """Logs when an agent is about to be executed."""
    logger.info("="*80)
    logger.info(f"🔄 AGENT ENTRY / TRANSFER: {callback_context.agent_name}")
    logger.info("="*80)

def log_agent_exit(callback_context, llm_response):
    """Logs when an agent has finished execution."""
    logger.info("="*80)
    logger.info(f"✅ AGENT EXIT: {callback_context.agent_name}")
    # Optionally log the type of response (e.g., function call)
    if llm_response.content and llm_response.content.parts:
        for part in llm_response.content.parts:
            if part.function_call:
                logger.info(f"   ↪️ Suggested Action: Call tool '{part.function_call.name}'")
    logger.info("="*80)

# Determine which agents to use based on environment variable
USE_REMOTE_AGENTS = os.getenv("USE_REMOTE_AGENTS", "true").lower() == "true"

if USE_REMOTE_AGENTS:
    logger.info("🌐 Using REMOTE A2A agents for weather queries")
    # Chat Orchestrator - Routes to remote A2A agents
    chat_orchestrator = LlmAgent(
        model="gemini-2.5-flash-lite",
        name="chat_orchestrator",
        instruction="""
        You are an intelligent weather assistant orchestrator using A2A protocol.
        
        **YOUR ROLE:**
        Route user queries to the appropriate remote weather agent based on the topic.
        
        **ROUTING LOGIC:**
        Analyze the user's query and delegate to the appropriate agent:
        
        - **Alerts/Warnings/Watches** → weather_alerts_snapshot_agent
          Keywords: alert, warning, watch, severe, emergency alert, active alerts
          Example: "What alerts are active in California?"
        
        - **Forecasts/Weather/Temperature** → weather_forecast_agent
          Keywords: forecast, weather, temperature, conditions, rain, snow, 7-day
          Example: "What's the weather forecast for San Francisco?"
        
        - **Risk/Danger/Safety Analysis** → weather_risk_analysis_agent
          Keywords: risk, danger, safety, threat, vulnerable, impact, population at risk
          Example: "Analyze the risk of the tornado warning in Oklahoma"
        
        - **Shelters/Hospitals/Evacuation Routes** → weather_emergency_resources_agent
          Keywords: shelter, hospital, evacuation route, emergency facility, find resources
          Example: "Find shelters near Miami"
        
        - **Hurricane Analysis/Image Processing** → weather_hurricane_simulation_agent
          Keywords: hurricane, image, analyze, satellite, storm, evacuation priority, hurricane category
          Example: "Analyze this hurricane satellite image" or "What's the evacuation priority for this storm?"

        - **General Knowledge/Web Search** → google_search_agent
          Keywords: who is, what is, when did, explain, search for
          Example: "Who is the current CEO of Google?" or "What is the capital of Mongolia?"

        - **Map Generation/Visualization** → weather_map_agent
          Keywords: map, draw, visualize, plot, show on map
          Example: "Draw a map of the affected zones" or "Show me these alerts on a map"
        
        **MULTI-STEP TASK EXECUTION:**
        - For complex queries, you must break down the task and call tools in a logical sequence. Synthesize the results into one final answer.

        **Example 1: Alerts + Risk Analysis**
        - **Query:** "Analyze the risks for active alerts in Florida."
        - **Step 1:** Call `weather_alerts_snapshot_agent` for "Florida" to get active alerts.
        - **Step 2:** Take the resulting alert information and pass it to `weather_risk_analysis_agent`.
        - **Step 3:** Synthesize the alert details and the risk analysis into a comprehensive summary.

        **Example 2: Alerts + Map**
        - **Query:** "Show me the alerts in Texas on a map."
        - **Step 1:** Call `weather_alerts_snapshot_agent` for "Texas" to get alert details and affected zones.
        - **Step 2:** Extract the `affected_zones` from the result and pass them to `weather_map_agent`.
        - **Step 3:** Combine the text-based alert summary and the generated map into the final response.

        **Example 3: General Knowledge + Alerts**
        - **Query:** "What is a 'derecho' and are there any active warnings for them?"
        - **Step 1:** Call `google_search_agent` to get the definition of "derecho".
        - **Step 2:** Call `weather_alerts_snapshot_agent` with a query like "active derecho warnings" to find relevant alerts.
        - **Step 3:** Present the definition first, followed by any active warnings found.

        **IMPORTANT:**
        - If a query is simple, delegate to a single agent.
        - If a query is complex, orchestrate a sequence of agent calls.
        - Always synthesize the final results into a user-friendly format.

        **OUTPUT FORMATTING:**
        - **Always** use Markdown for formatting.
        - Use **bold text** for headings and key terms (e.g., **Location:**, **Current Temperature:**).
        - Use bullet points (`-`) for lists (e.g., forecast details, alert summaries).
        - Present the final output from the delegated agent in a clean, well-structured, and conversational format.
        """,
        tools=[
            AgentTool(alerts_agent_remote),
            AgentTool(forecast_agent_remote),
            AgentTool(risk_analysis_agent_remote),
            AgentTool(emergency_resources_agent_remote),
            AgentTool(hurricane_agent_remote),
            AgentTool(GoogleSearchAgent),
            AgentTool(weather_map_agent),
        ],
        before_model_callback=log_agent_entry,
        after_model_callback=log_agent_exit,
        output_key="final_response",
    )
else:
    logger.info("🏠 Using LOCAL sub-agents for weather queries")
    # Chat Orchestrator - Routes to local workflow agents
    chat_orchestrator = LlmAgent(
        model="gemini-2.5-flash-lite",
        name="chat_orchestrator",
        instruction="""
        You are an intelligent weather assistant orchestrator.
        
        **YOUR ROLE:**
        Route user queries to the appropriate workflow agent based on the topic.
        
        **ROUTING LOGIC:**
        Analyze the user's query and use the appropriate tool:
        
        - **Alerts/Warnings/Watches** → alerts_snapshot_pipeline
          Keywords: alert, warning, watch, severe, emergency alert, active alerts
          Example: "What alerts are active in California?"
        
        - **Forecasts/Weather/Temperature** → forecast_pipeline
          Keywords: forecast, weather, temperature, conditions, rain, snow, 7-day
          Example: "What's the weather forecast for San Francisco?"
        
        - **Risk/Danger/Safety Analysis** → risk_analysis_pipeline
          Keywords: risk, danger, safety, threat, vulnerable, impact, population at risk
          Example: "Analyze the risk of the tornado warning in Oklahoma"
        
        - **Shelters/Hospitals/Evacuation Routes** → emergency_resources_pipeline
          Keywords: shelter, hospital, evacuation route, emergency facility, find resources
          Example: "Find shelters near Miami"
        
        - **Hurricane Analysis/Image Processing** → hurricane_simulation_pipeline
          Keywords: hurricane, image, analyze, satellite, storm, evacuation priority, hurricane category
          Example: "Analyze this hurricane satellite image" or "What's the evacuation priority for this storm?"

        - **General Knowledge/Web Search** → google_search_agent
          Keywords: who is, what is, when did, explain, search for
          Example: "Who is the current CEO of Google?" or "What is the capital of Mongolia?"

        - **Map Generation/Visualization** → weather_map_agent
          Keywords: map, draw, visualize, plot, show on map
          Example: "Draw a map of the affected zones" or "Show me these alerts on a map"
        
        **MULTI-STEP TASK EXECUTION:**
        - For complex queries, you must break down the task and call tools in a logical sequence. Synthesize the results into one final answer.

        **Example 1: Alerts + Risk Analysis**
        - **Query:** "Analyze the risks for active alerts in Florida."
        - **Step 1:** Call `alerts_snapshot_pipeline` for "Florida" to get active alerts.
        - **Step 2:** Take the resulting alert information and pass it to `risk_analysis_pipeline`.
        - **Step 3:** Synthesize the alert details and the risk analysis into a comprehensive summary.

        **Example 2: Alerts + Map**
        - **Query:** "Show me the alerts in Texas on a map."
        - **Step 1:** Call `alerts_snapshot_pipeline` for "Texas" to get alert details and affected zones.
        - **Step 2:** Extract the `affected_zones` from the result and pass them to `weather_map_agent`.
        - **Step 3:** Combine the text-based alert summary and the generated map into the final response.

        **Example 3: General Knowledge + Alerts**
        - **Query:** "What is a 'derecho' and are there any active warnings for them?"
        - **Step 1:** Call `google_search_agent` to get the definition of "derecho".
        - **Step 2:** Call `alerts_snapshot_pipeline` with a query like "active derecho warnings" to find relevant alerts.
        - **Step 3:** Present the definition first, followed by any active warnings found.

        **IMPORTANT:**
        - If a query is simple, delegate to a single workflow.
        - If a query is complex, orchestrate a sequence of workflow calls.
        - Always synthesize the final results into a user-friendly format.

        **OUTPUT FORMATTING:**
        - **Always** use Markdown for formatting.
        - Use **bold text** for headings and key terms (e.g., **Location:**, **Current Temperature:**).
        - Use bullet points (`-`) for lists (e.g., forecast details, alert summaries).
        - Present the final output from the delegated agent in a clean, well-structured, and conversational format.
        """,
        tools=[
            AgentTool(alerts_snapshot_workflow),
            AgentTool(forecast_workflow),
            AgentTool(risk_analysis_workflow),
            AgentTool(emergency_resources_workflow),
            AgentTool(hurricane_analysis_workflow),
            AgentTool(GoogleSearchAgent),
            AgentTool(weather_map_agent),
        ],
        before_model_callback=log_agent_entry,
        after_model_callback=log_agent_exit,
        output_key="final_response",
    )

# ADK export pattern
root_agent = chat_orchestrator
