import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from typing import Dict, Any
from google.adk.agents import LlmAgent
from pydantic import BaseModel, Field
from .tools.tools import get_zone_coordinates, generate_map
from .tools.logging_utils import log_agent_entry, log_agent_exit

class MapData(BaseModel):
    """Structured output for map data"""
    map_data: Dict[str, Any] = Field(description="Data for generating a map of alert locations")

# Weather Map Agent - Creates map visualization
weather_map_agent = LlmAgent(
    model="gemini-2.5-flash-lite",
    name="weather_map_agent",
    description="Generates map data for a given list of NWS weather zones.",
    instruction="""
    You are a geographic data specialist. Your task is to convert a list of NWS zone IDs into geographic coordinates and generate map data.

    **CONTEXT:**
    The user wants to see a map of affected weather zones. The input will be a list of NWS zone IDs (e.g., ['FLZ069', 'FLZ127']).

    **PROCESS:**
    1.  **Get Zone Coordinates**: Call the `get_zone_coordinates` tool with the list of zone IDs provided in the user's query.
        - This will return geographic coordinates (lat/lng) for each zone.
    
    2.  **Generate Map**: Once you have the zone coordinates, call the `generate_map` tool.
        - Use the coordinates from step 2 as the `markers`.
        - Calculate a central latitude and longitude from all markers for `center_lat` and `center_lng`.
        - Set an appropriate `zoom` level to see all markers (typically 5-7 for multi-state, 8-10 for single state).

    **IMPORTANT:**
    - The `get_zone_coordinates` tool handles all NWS API calls.
    - If some zones fail to geocode, continue with the ones that succeed.

    The final map data should be returned in the `MapData` schema.
    """,
    tools=[get_zone_coordinates, generate_map],
    output_schema=MapData,
    before_model_callback=log_agent_entry,
    after_model_callback=log_agent_exit,
)

# ADK export pattern
root_agent = weather_map_agent
