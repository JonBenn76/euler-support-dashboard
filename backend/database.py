import datetime
import hashlib
import json
import random
import uuid

import duckdb
import os

DB_PATH = os.environ.get("DB_PATH", "support_dashboard.duckdb")

def get_connection():
    return duckdb.connect(DB_PATH)

def get_db_conn():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = get_connection()
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS clients (
            client_id VARCHAR PRIMARY KEY,
            client_name VARCHAR NOT NULL,
            api_token VARCHAR NOT NULL UNIQUE,
            api_token_expires TIMESTAMP,
            date_joined DATE,
            contract_status VARCHAR,
            key_contacts VARCHAR,
            account_manager VARCHAR,
            lead_developer VARCHAR
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS build_events (
            event_id VARCHAR PRIMARY KEY,
            client_id VARCHAR REFERENCES clients(client_id),
            run_id VARCHAR NOT NULL,
            project_name VARCHAR NOT NULL,
            build_stage VARCHAR NOT NULL,
            status VARCHAR NOT NULL,
            start_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            end_timestamp TIMESTAMP,
            duration_seconds INTEGER
        )
    """)
    
    count = conn.execute("SELECT COUNT(*) FROM clients").fetchone()[0]
    if count == 0:
        print("Database is empty. Pre-seeding historical dummy clients and data...")
        seed_dummy_data(conn)
        
    conn.close()

def seed_dummy_data(conn):
    now = datetime.datetime.now()
    expires_in_30 = now + datetime.timedelta(days=30)
    
    client1_id = str(uuid.uuid4())
    client1_token = "sk_test_acme123"
    client1_token_hash = hashlib.sha256(client1_token.encode()).hexdigest()
    contacts1 = json.dumps([{"name": "Alice Smith", "role": "CTO", "email": "alice@acme.com"}])
    conn.execute(
        """INSERT INTO clients (client_id, client_name, api_token, api_token_expires, date_joined, contract_status, key_contacts, account_manager, lead_developer) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (client1_id, "Acme Corp", client1_token_hash, expires_in_30, "2024-01-15", "Premium Active", contacts1, "Sarah Jenkins", "Mike Ross")
    )
    
    client2_id = str(uuid.uuid4())
    client2_token = "sk_test_globex456"
    client2_token_hash = hashlib.sha256(client2_token.encode()).hexdigest()
    contacts2 = json.dumps([{"name": "Bob Jones", "role": "VP Eng", "email": "bob@globex.com"}])
    conn.execute(
        """INSERT INTO clients (client_id, client_name, api_token, api_token_expires, date_joined, contract_status, key_contacts, account_manager, lead_developer) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (client2_id, "Globex Inc", client2_token_hash, None, "2025-05-20", "Standard Active", contacts2, "David Kim", "Elena Ford")
    )
    
    projects = [
        (client1_id, "Frontend-App", "build"),
        (client1_id, "Mobile-App", "compile"),
        (client2_id, "Backend-API", "test"),
        (client2_id, "Data-Pipeline", "deploy")
    ]
    
    for days_ago in range(14, -1, -1):
        target_date = now - datetime.timedelta(days=days_ago)
        
        num_events = random.randint(5, 15)
        for _ in range(num_events):
            client_id, project_name, build_stage = random.choice(projects)
            
            base_duration = 30 if "Frontend" in project_name else 120
            growth_factor = 1.0 + ((14 - days_ago) * 0.05)
            duration = int(base_duration * growth_factor * random.uniform(0.8, 1.2))
            
            status = "success" if random.random() < 0.85 else "failed"
            
            event_time = target_date.replace(
                hour=random.randint(8, 18),
                minute=random.randint(0, 59),
                second=random.randint(0, 59)
            )
            
            end_time = event_time + datetime.timedelta(seconds=duration)
            run_id = f"run_{uuid.uuid4().hex[:8]}"
            
            conn.execute(
                """INSERT INTO build_events (event_id, client_id, run_id, project_name, build_stage, status, start_timestamp, end_timestamp, duration_seconds) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (str(uuid.uuid4()), client_id, run_id, project_name, build_stage, status, event_time, end_time, duration)
            )
            
    for client_id, project_name, build_stage in [projects[0], projects[2]]:
        run_id = f"run_{uuid.uuid4().hex[:8]}"
        conn.execute(
            """INSERT INTO build_events (event_id, client_id, run_id, project_name, build_stage, status, start_timestamp) 
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (str(uuid.uuid4()), client_id, run_id, project_name, build_stage, "running", now)
        )

if __name__ == "__main__":
    init_db()
    print("Database initialized.")
