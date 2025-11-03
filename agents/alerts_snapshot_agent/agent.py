import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from typing import List, Dict, Any, Optional
from google.adk.agents import LlmAgent, SequentialAgent
from pydantic import BaseModel, Field
from .tools.tools import get_nws_alerts, geocode_address, generate_map, get_zone_coordinates
from .tools.logging_utils import log_agent_entry, log_agent_exit

class AlertDetail(BaseModel):
    """Individual weather alert details"""
    event: str = Field(description="Alert event type (e.g., Tornado Warning)")
    severity: str = Field(description="Alert severity level")
    headline: str = Field(description="Alert headline")
    description: str = Field(description="Full detailed alert description")
    description_short: str = Field(description="Shortened description for card display (max 150 chars)")
    affected_zones: List[str] = Field(description="List of affected zones")
    start_time: str = Field(description="Alert start time")
    end_time: str = Field(description="Alert end time")

class AlertsSummary(BaseModel):
    """Final structured output for weather alerts analysis"""
    alerts: List[AlertDetail] = Field(description="List of active weather alerts")
    total_count: int = Field(description="Total number of alerts")
    severe_count: int = Field(description="Number of severe/extreme alerts")
    locations: List[str] = Field(description="List of affected locations")
    insights: str = Field(description="Summary and safety recommendations")


# Phase 1: Retriever Agent - Fetches alert data
retriever_agent = LlmAgent(
    model="gemini-2.5-flash-lite",
    name="alerts_retriever",
    description="Retrieves active weather alerts for specified locations",
    instruction="""
    You are a weather alerts data retrieval specialist.
    
    **Your Task:**
    Retrieve active weather alerts for the requested location using the get_nws_alerts tool.
    
    **Tool Usage Guidelines:**
    
    1. **For NATIONAL/ALL alerts** (e.g., "United States", "nationwide", "all states"):
       - Call: get_nws_alerts() with NO parameters
       - This retrieves ALL active alerts across the entire United States
    
    2. **For SPECIFIC STATE** (e.g., "California", "FL", "Texas"):
       - Convert state name to 2-letter code if needed
       - Call: get_nws_alerts(state="CA")
       - Use standard postal codes: California→CA, Texas→TX, Florida→FL, etc.
    
    3. **For SPECIFIC COORDINATES** (if lat/lng provided):
       - Call: get_nws_alerts(latitude=37.7749, longitude=-122.4194)
    
    4. **For MULTIPLE STATES** (e.g., "CA,TX,FL"):
       - Make separate calls for each state
       - Combine results before passing to formatter
    
    **Important:**
    - DO NOT pass state parameter for national queries
    - DO NOT filter by severity - get ALL alerts
    - The tool automatically handles the NWS API endpoints
    
    **Examples:**
    - "Get alerts for United States" → get_nws_alerts()
    - "Get alerts for California" → get_nws_alerts(state="CA")  
    - "Get alerts for Miami coordinates" → get_nws_alerts(latitude=25.7617, longitude=-80.1918)
    
    Store the collected alert data in your response for the next agent.
    """,
    tools=[get_nws_alerts],
    output_key="alerts_data",
    before_model_callback=log_agent_entry,
    after_model_callback=log_agent_exit,
)


# Phase 2: Deduplication Agent - Removes similar/duplicate alerts
deduplication_agent = LlmAgent(
    model="gemini-2.5-flash-lite",
    name="alerts_deduplicator",
    description="Intelligently removes duplicate and similar alerts",
    instruction="""
    You are an expert at identifying and removing duplicate or highly similar weather alerts.
    
    **Your Task:**
    Analyze state["alerts_data"] and remove duplicates/similar alerts, keeping only the most informative unique alerts.
    
    **Deduplication Strategy:**
    
    1. **Exact Duplicates** - Remove if ALL match:
       - Same event type
       - Same severity
       - Same headline
       - Same start time
       
    2. **Similar Alerts** - Remove if these match:
       - Same event type (e.g., "Flood Warning")
       - Same severity level
       - Same general area (e.g., both for "St Johns River")
       - Start times within 5 minutes of each other
       - Keep the alert with MORE detailed description
       
    3. **Geographic Overlap** - For alerts in the same river/area:
       - "St Johns River near Astor" vs "St Johns River near Above Lake Harney"
       - These are SIMILAR - keep only ONE with the most comprehensive information
       - Combine affected zones if needed
    
    **Rules:**
    - When choosing between similar alerts, prefer:
      1. The one with more detailed description
      2. The one with more affected zones
      3. The earlier issued alert (if descriptions are similar)
    - Log how many duplicates you removed
    - Return the deduplicated alerts in the same format as input
    
    **Output:**
    Return the cleaned alert data with duplicates removed. Pass this to the next agent.
    """,
    output_key="deduplicated_alerts",
    before_model_callback=log_agent_entry,
    after_model_callback=log_agent_exit,
)

# Phase 3: Formatter Agent - Structures and analyzes alerts
alerts_formatter = LlmAgent(
    model="gemini-2.5-flash-lite",
    name="alerts_formatter",
    description="Formats alert data into structured summary",
    instruction="""
    You are a weather alert presentation specialist.
    
    **Your Task:**
    Format the alert data from state["deduplicated_alerts"] into a structured, user-friendly summary.
    
    **Process:**
    1. Extract alerts from state["deduplicated_alerts"] (already deduplicated)
    2. Count total alerts and severe alerts
    3. Identify affected locations
    4. For each alert, extract:
       - Event type (e.g., "Tornado Warning")
       - Severity level
       - Headline
       - Description - Full detailed alert description (preserve all important information)
       - Description_short - Concise summary for card display (max 150 characters, focus on key hazards and impacts)
       - Affected zones - **CRITICAL**: Preserve the EXACT zone URLs from the raw data (e.g., "https://api.weather.gov/zones/county/ORC011")
         DO NOT convert these to county names. The frontend needs the full URLs for map generation.
       - Start and end times
    5. Generate insights about the overall alert situation
    
    **CRITICAL CONSTRAINTS:**
    - You must return a structured JSON response that matches the AlertsSummary schema exactly
    
    **CRITICAL**: Return structured JSON matching AlertsSummary schema exactly.
    """,
    output_schema=AlertsSummary,
    before_model_callback=log_agent_entry,
    after_model_callback=log_agent_exit,
)

# Sequential Pipeline: Retriever → Deduplicator → Formatter
alerts_snapshot_workflow = SequentialAgent(
    name="alerts_snapshot_pipeline",
    description="Retrieves weather alerts, removes duplicates, and generates a structured analysis with safety insights.",
    sub_agents=[
        retriever_agent,
        deduplication_agent,
        alerts_formatter,
    ],
)

# ADK export pattern
# The root agent is the full workflow. The final output will be under the 'final_summary' key.
root_agent = alerts_snapshot_workflow
