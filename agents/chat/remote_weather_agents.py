"""
Remote Weather Agent Wrappers using A2A Protocol

Simple wrappers for deployed weather agents using RemoteA2aAgent.
Agent cards are hosted on GitHub for easy access and version control.
"""

from google.adk.agents.remote_a2a_agent import RemoteA2aAgent

# Base URL for agent cards on GitHub
AGENT_CARDS_BASE_URL = "https://github.com/cvsubs74/weather_insights_and_forecast_advisor/tree/main/agent-cards"

# Weather Alerts Snapshot Agent
alerts_agent_remote = RemoteA2aAgent(
    name="weather_alerts_snapshot_agent",
    description="Retrieves and analyzes the top 5 most severe active weather alerts across the United States",
    agent_card=f"{AGENT_CARDS_BASE_URL}/weather-alerts-snapshot-agent-card.json",
)

# Weather Forecast Agent
forecast_agent_remote = RemoteA2aAgent(
    name="weather_forecast_agent",
    description="Provides detailed 7-day weather forecasts and 48-hour hourly predictions for any location",
    agent_card=f"{AGENT_CARDS_BASE_URL}/weather-forecast-agent-card.json",
)

# Weather Risk Analysis Agent
risk_analysis_agent_remote = RemoteA2aAgent(
    name="weather_risk_analysis_agent",
    description="Analyzes weather alerts to identify vulnerable populations and high-risk areas using census demographics and historical flood data",
    agent_card=f"{AGENT_CARDS_BASE_URL}/weather-risk-analysis-agent-card.json",
)

# Weather Emergency Resources Agent
emergency_resources_agent_remote = RemoteA2aAgent(
    name="weather_emergency_resources_agent",
    description="Helps users find nearby emergency resources including shelters, hospitals, and pharmacies with route planning",
    agent_card=f"{AGENT_CARDS_BASE_URL}/weather-emergency-resources-agent-card.json",
)

# Weather Hurricane Simulation Agent
hurricane_agent_remote = RemoteA2aAgent(
    name="weather_hurricane_simulation_agent",
    description="Analyzes hurricane satellite images and generates evacuation priorities for high-risk locations",
    agent_card=f"{AGENT_CARDS_BASE_URL}/weather-hurricane-simulation-agent-card.json",
)
