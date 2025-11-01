from typing import Dict, Any
from google.adk.agents import LlmAgent
from pydantic import BaseModel, Field
from ...tools.tools import get_zone_coordinates, get_coordinates_from_urls, generate_map
from ...tools.logging_utils import log_agent_entry, log_agent_exit

class MapData(BaseModel):
    """Structured output for map data"""
    map_data: Dict[str, Any] = Field(description="Data for generating a map of alert locations")

# Weather Map Agent - Creates map visualization
weather_map_agent = LlmAgent(
    model="gemini-2.5-flash-lite",
    name="weather_map_agent",
    description="Generates map data for a given list of NWS weather zones.",
    instruction="""
    You are a geographic data specialist. Your task is to generate map data from a list of NWS weather zones.

    **CONTEXT:**
    The user wants to see a map of affected weather zones. The input will be a list of NWS zone identifiers, which can be either full URLs (e.g., 'https://api.weather.gov/zones/county/FLC069') or zone IDs (e.g., 'FLZ127').

    **PROCESS:**
    1.  **Analyze Input**: Check if the input items are full URLs (they will contain 'https://').

    2.  **Get Zone Coordinates**:
        - If the input is a list of **URLs**, call the `get_coordinates_from_urls` tool.
        - If the input is a list of **zone IDs**, call the `get_zone_coordinates` tool.
        - This will return geographic coordinates (lat/lng) for each zone.

    3.  **Generate Map**: Once you have the zone coordinates, call the `generate_map` tool.
        - Use the coordinates from step 2 as the `markers`.
        - Calculate a central latitude and longitude from all markers for `center_lat` and `center_lng`.
        - Set an appropriate `zoom` level to see all markers (typically 5-7 for multi-state, 8-10 for single state).

    **IMPORTANT:**
    - The `get_zone_coordinates` tool handles all NWS API calls.
    - If some zones fail to geocode, continue with the ones that succeed.

    **ERROR HANDLING:**
    - If any tool call fails or you cannot generate valid map data, you **MUST** return a JSON object with an "error" key.
    - Example error response: `{"error": "The provided zone ID could not be found or is invalid."}`

    **OUTPUT FORMAT:**
    - Your final response **MUST** be only the JSON object defined in the `MapData` schema.
    - Do **NOT** include any conversational text, explanations, or markdown formatting. The response must start with `{` and end with `}`.

    The final map data should be returned in the `MapData` schema.
    """,
    tools=[get_coordinates_from_urls, get_zone_coordinates, generate_map],
    output_schema=MapData,
    before_model_callback=log_agent_entry,
    after_model_callback=log_agent_exit,
)

