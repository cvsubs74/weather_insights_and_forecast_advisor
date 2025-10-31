from google.adk.agents import LlmAgent
from google.adk.tools import google_search

# Define the Google Search Agent
GoogleSearchAgent = LlmAgent(
    name="google_search_agent",
    model="gemini-2.5-flash-lite",
    description="Provides answers to general knowledge questions by searching the web. Use this for topics not covered by other specialized agents, such as current events, facts, or general information.",
    instruction="""You are a helpful research assistant. Your role is to answer the user's query by performing a Google search and summarizing the results. 

- Use the `google_search` tool to find the most relevant information.
- Synthesize the search results into a clear and concise answer.
- If you find a direct answer, provide it. 
- If the results are a list of items, summarize them.
- Do not make up information. If the search does not yield a clear answer, state that you couldn't find a definitive response.""",
    tools=[google_search],
)
