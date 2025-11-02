import os

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

import json
import logging
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from google.adk.agents import LlmAgent, SequentialAgent
from .tools.logging_utils import log_agent_entry, log_agent_exit
from google.adk.tools import google_search

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RiskAnalysisSummary(BaseModel):
    """Provides a comprehensive, real-time search-grounded risk analysis for a weather alert."""
    alert_summary: str = Field(description="A one-sentence summary of the weather alert.")
    real_time_impacts: List[str] = Field(description="Real-time impacts currently occurring from this event (e.g., 'Highway 101 closed due to flooding', 'Power outages affecting 50,000 homes').")
    infrastructure_damage: List[str] = Field(description="Reported infrastructure damage from this event (e.g., 'Bridge collapse on Route 5', 'Downed power lines on Main Street', 'Flooded subway stations').")
    hazards_and_dangers: List[str] = Field(description="Active hazards and dangers from this event (e.g., 'Downed power lines creating electrocution risk', 'Flash flooding in low-lying areas', 'Debris on roadways').")
    injuries_and_casualties: List[str] = Field(description="Reported injuries, casualties, or evacuations from this event (e.g., '3 injuries reported', '500 residents evacuated', 'No casualties reported').")
    safety_recommendations: List[str] = Field(description="Real-time, actionable safety recommendations from official sources (e.g., 'Avoid travel on I-95', 'Shelter in place until 6 PM', 'Boil water advisory in effect').")
    emergency_response: List[str] = Field(description="Active emergency response efforts and resources deployed (e.g., 'National Guard deployed', 'Emergency shelters opened at City Hall', 'Search and rescue operations underway').")
    affected_areas: List[str] = Field(description="Specific locations and communities currently affected (e.g., 'Downtown Miami', 'Coastal areas of Orange County', 'Interstate 10 between exits 45-52').")
    supporting_links: List[str] = Field(description="A list of 3-5 highly relevant URLs from real-time news and official sources.")

# --- Agent Definitions ---

# Phase 1: Alert Parser
# This agent ensures the input is clean and structured for the next phases.
# Phase 1: Alert Parser
alert_parser = LlmAgent(
    model="gemini-2.5-flash-lite",
    name="alert_parser",
    description="Parses a single weather alert to extract key information for risk analysis",
    instruction="""
    You are a data extraction specialist.
    Your input is a single weather alert object.

    **Your Task:**
    1.  **Parse the Input**: The user's input is a JSON object or text representing a single weather alert.
    2.  **Extract Key Fields**: From the input, extract the following critical pieces of information:
        *   The type of alert (e.g., "Tornado Warning").
        *   The severity level (e.g., "Severe").
        *   Affected Zones and areas.
        *   The full alert text for context.
    3.  **Store for Next Agent**: Store these extracted fields in a structured way for the `census_data_retriever`.
    """,
    output_key="parsed_alert",
    before_model_callback=log_agent_entry,
    after_model_callback=log_agent_exit,
)

# Phase 2: Risk Researcher 
# This agent uses the google_search tool to gather comprehensive real-time information.
risk_researcher = LlmAgent(
    name="risk_researcher",
    model="gemini-2.5-flash-lite",
    description="Conducts comprehensive real-time research on weather alert impacts, hazards, and emergency response.",
    tools=[google_search],
    instruction="""
    You are a comprehensive risk intelligence analyst. Your goal is to conduct thorough real-time research on a weather alert to understand its full impact and risks.
    
    **Your Mission:**
    Based on the alert information provided, perform MULTIPLE targeted Google searches to gather comprehensive, real-time information across these critical categories:

    **REQUIRED SEARCH CATEGORIES:**
    
    1.  **Real-Time Impacts** (Search: "[alert type] [location] impacts today" or "[alert type] [location] damage now")
        - Current road closures, traffic disruptions
        - Power outages and utility disruptions
        - Business/school closures
        - Transportation disruptions (airports, trains, buses)
        - Any other immediate impacts happening NOW
    
    2.  **Infrastructure Damage** (Search: "[alert type] [location] infrastructure damage" or "[alert type] [location] building damage")
        - Damaged or collapsed structures (bridges, buildings, roads)
        - Downed power lines or utility infrastructure
        - Flooded areas or water damage to infrastructure
        - Any structural failures or compromised infrastructure
    
    3.  **Hazards and Dangers** (Search: "[alert type] [location] hazards" or "[alert type] [location] dangers")
        - Active hazards (downed power lines, debris, flooding)
        - Environmental dangers (contaminated water, air quality)
        - Secondary risks (landslides, aftershocks, etc.)
        - Areas to avoid
    
    4.  **Injuries and Casualties** (Search: "[alert type] [location] injuries" or "[alert type] [location] casualties evacuations")
        - Reported injuries or fatalities
        - Number of people evacuated
        - Missing persons reports
        - Medical emergencies related to the event
    
    5.  **Safety Recommendations** (Search: "[alert type] [location] safety advisory" or "NWS [location] recommendations")
        - Official safety advisories from NWS, FEMA, local authorities
        - Shelter-in-place or evacuation orders
        - Travel advisories and restrictions
        - Protective actions to take
    
    6.  **Emergency Response** (Search: "[alert type] [location] emergency response" or "[alert type] [location] rescue operations")
        - Emergency services deployed (National Guard, FEMA, etc.)
        - Rescue and recovery operations
        - Emergency shelters opened
        - Resource distribution centers
    
    7.  **Affected Areas** (Search: "[alert type] [location] affected areas" or "[alert type] [location] map")
        - Specific neighborhoods, cities, or regions impacted
        - Geographic extent of the event
        - Most severely affected locations

    **SEARCH STRATEGY:**
    - Perform AT LEAST 5-7 targeted searches covering the categories above
    - Focus on RECENT results (today, last 24 hours) for real-time information
    - Prioritize official sources (NWS, FEMA, local government, news outlets)
    - Look for specific numbers, locations, and concrete details
    - If initial searches don't yield results, try alternative search terms
    
    **OUTPUT:**
    Document all findings with specific details, numbers, locations, and source URLs. Be thorough and comprehensive - this research will form the basis of the final risk analysis.
    """,
    output_key="research_findings",
    before_model_callback=log_agent_entry,
    after_model_callback=log_agent_exit,
)

# Phase 3: Risk Synthesizer
# This agent synthesizes the alert data and search findings into a comprehensive final summary.
risk_synthesizer = LlmAgent(
    model="gemini-2.5-flash-lite",
    name="risk_synthesizer",
    description="Synthesizes alert data and comprehensive search results into a detailed risk analysis summary.",
    instruction="""
    You are an expert risk analyst. Your task is to synthesize all the research findings into a comprehensive, structured risk analysis.
    
    **Your Task:**
    Based on the parsed alert information and the comprehensive research findings, create a detailed RiskAnalysisSummary that includes:
    
    1. **alert_summary**: A clear one-sentence summary of the weather alert
    2. **real_time_impacts**: List all current impacts happening NOW (road closures, power outages, disruptions)
    3. **infrastructure_damage**: List all reported infrastructure damage (buildings, bridges, utilities)
    4. **hazards_and_dangers**: List all active hazards and dangers people should be aware of
    5. **injuries_and_casualties**: List any reported injuries, casualties, or evacuations
    6. **safety_recommendations**: List all official safety recommendations and advisories
    7. **emergency_response**: List all emergency response efforts and resources deployed
    8. **affected_areas**: List specific locations and communities affected
    9. **supporting_links**: Include 3-5 URLs to official sources and real-time news
    
    **IMPORTANT:**
    - Use SPECIFIC details from the search results (numbers, locations, names)
    - If a category has no information found, include a note like "No reports found" or "Information not available"
    - Prioritize official sources and recent information
    - Be factual and avoid speculation
    - Include concrete, actionable information
    
    Synthesize all the research into a comprehensive risk analysis that gives a complete picture of the event's real-time impact.
    """,
    output_schema=RiskAnalysisSummary,
    output_key="risk_analysis_summary",
    before_model_callback=log_agent_entry,
    after_model_callback=log_agent_exit,
)

# --- Agent Workflow Definition ---

risk_analysis_workflow = SequentialAgent(
    name="search_based_risk_analysis_workflow",
    description="Analyzes weather alert risks using real-time Google Search results.",
    sub_agents=[
        alert_parser,
        risk_researcher,
        risk_synthesizer,
    ],
)

root_agent = risk_analysis_workflow
