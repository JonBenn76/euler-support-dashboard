import secrets
import sys
import uuid

from backend.database import get_connection


def onboard_client(client_name: str):
    conn = get_connection()
    client_id = str(uuid.uuid4())
    # Generate a secure random token
    api_token = f"sk_{secrets.token_urlsafe(16)}"
    
    try:
        conn.execute(
            "INSERT INTO clients (client_id, client_name, api_token) VALUES (?, ?, ?)",
            (client_id, client_name, api_token)
        )
        print(f"Successfully onboarded client: {client_name}")
        print(f"Client ID: {client_id}")
        print(f"API Token: {api_token}")
        print("Please provide this token to the client securely.")
    except Exception as e:
        print(f"Failed to onboard client: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python onboard_client.py \"Client Name\"")
        sys.exit(1)
        
    client_name = sys.argv[1]
    onboard_client(client_name)
