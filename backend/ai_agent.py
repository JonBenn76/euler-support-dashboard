import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# We will initialize the client. Make sure GEMINI_API_KEY is in the environment or .env file.
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

def get_diagnostics(query: str, db_context: str) -> str:
    """
    Sends the user query along with the database context (recent events) to the Gemini model.
    """
    if not client:
        return "Error: GEMINI_API_KEY is not set. Cannot provide AI diagnostics."
    
    system_instruction = (
        "You are an expert AI support diagnostics agent for a real-time build monitoring dashboard. "
        "You have access to the latest database context containing recent build events for clients. "
        "Your job is to answer user queries accurately based on this context. Be concise and professional."
    )
    
    prompt = f"Database Context:\n{db_context}\n\nUser Query: {query}"
    
    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
            )
        )
        return response.text
    except Exception as e:
        return f"AI Agent encountered an error: {e!s}"
