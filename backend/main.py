import datetime
import hashlib
import json
import secrets
import uuid

import duckdb
from backend.ai_agent import get_diagnostics
from backend.database import get_db_conn, init_db
from backend.query_builder import render_query
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

init_db()

app = FastAPI(title="Support Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BuildEvent(BaseModel):
    run_id: str
    project_name: str
    build_stage: str
    status: str

class ClientOnboard(BaseModel):
    client_name: str
    contract_status: str | None = "Active"
    account_manager: str | None = None
    lead_developer: str | None = None
    token_lifespan_days: int | None = 365 # None for never expires
    key_contacts: list[dict] | None = []

class ClientUpdate(BaseModel):
    contract_status: str | None = None
    account_manager: str | None = None
    lead_developer: str | None = None
    key_contacts: list[dict] | None = None

class TokenRegenerateRequest(BaseModel):
    token_lifespan_days: int | None = 365

class ChatQuery(BaseModel):
    query: str

def verify_token(authorization: str | None = Header(None), conn: duckdb.DuckDBPyConnection = Depends(get_db_conn)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ")[1]
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    result = conn.execute("SELECT client_id, api_token_expires FROM clients WHERE api_token = ?", (token_hash,)).fetchone()
    
    if not result:
        raise HTTPException(status_code=401, detail="Invalid API token")
        
    client_id, expires = result
    if expires and expires < datetime.datetime.now():
        raise HTTPException(status_code=401, detail="API token has expired")
        
    return client_id


@app.post("/api/ingest")
def ingest_event(event: BuildEvent, client_id: str = Depends(verify_token), conn: duckdb.DuckDBPyConnection = Depends(get_db_conn)):
    try:
        now = datetime.datetime.now()
        existing = conn.execute(
            "SELECT event_id, start_timestamp FROM build_events WHERE client_id = ? AND run_id = ?",
            (client_id, event.run_id)
        ).fetchone()
        
        if event.status == "running":
            if existing:
                return {"status": "success", "event_id": existing[0], "message": "Already running"}
            
            event_id = str(uuid.uuid4())
            conn.execute(
                """
                INSERT INTO build_events (event_id, client_id, run_id, project_name, build_stage, status, start_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (event_id, client_id, event.run_id, event.project_name, event.build_stage, event.status, now)
            )
            conn.commit()
            return {"status": "success", "event_id": event_id}
            
        else:
            if existing:
                event_id = existing[0]
                start_time = existing[1]
                duration = int((now - start_time).total_seconds())
                
                conn.execute(
                    """
                    UPDATE build_events 
                    SET status = ?, end_timestamp = ?, duration_seconds = ?
                    WHERE event_id = ?
                    """,
                    (event.status, now, duration, event_id)
                )
                conn.commit()
                return {"status": "success", "event_id": event_id, "duration": duration}
            else:
                event_id = str(uuid.uuid4())
                conn.execute(
                    """
                    INSERT INTO build_events (event_id, client_id, run_id, project_name, build_stage, status, start_timestamp, end_timestamp, duration_seconds)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (event_id, client_id, event.run_id, event.project_name, event.build_stage, event.status, now, now, 0)
                )
                conn.commit()
                return {"status": "success", "event_id": event_id, "message": "No start event found, inserted as completed"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/clients")
def get_clients(conn: duckdb.DuckDBPyConnection = Depends(get_db_conn)):
    clients = conn.execute("""
        SELECT client_id, client_name, date_joined, contract_status, key_contacts, account_manager, lead_developer, api_token_expires 
        FROM clients ORDER BY client_name
    """).fetchall()
    
    result = []
    for row in clients:
        contacts = []
        if row[4]:
            try:
                contacts = json.loads(row[4])
            except:
                pass
                
        result.append({
            "client_id": row[0], 
            "client_name": row[1],
            "date_joined": str(row[2]) if row[2] else None,
            "contract_status": row[3],
            "key_contacts": contacts,
            "account_manager": row[5],
            "lead_developer": row[6],
            "api_token_expires": str(row[7]) if row[7] else None
        })
    return result

@app.get("/api/clients/{client_id}")
def get_client(client_id: str, conn: duckdb.DuckDBPyConnection = Depends(get_db_conn)):
    row = conn.execute("""
        SELECT client_id, client_name, date_joined, contract_status, key_contacts, account_manager, lead_developer, api_token_expires 
        FROM clients WHERE client_id = ?
    """, (client_id,)).fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Client not found")
        
    contacts = []
    if row[4]:
        try:
            contacts = json.loads(row[4])
        except:
            pass
            
    return {
        "client_id": row[0], 
        "client_name": row[1],
        "date_joined": str(row[2]) if row[2] else None,
        "contract_status": row[3],
        "key_contacts": contacts,
        "account_manager": row[5],
        "lead_developer": row[6],
        "api_token_expires": str(row[7]) if row[7] else None
    }

@app.put("/api/clients/{client_id}")
def update_client(client_id: str, client: ClientUpdate, conn: duckdb.DuckDBPyConnection = Depends(get_db_conn)):
    try:
        updates = []
        params = []
        if client.contract_status is not None:
            updates.append("contract_status = ?")
            params.append(client.contract_status)
        if client.account_manager is not None:
            updates.append("account_manager = ?")
            params.append(client.account_manager)
        if client.lead_developer is not None:
            updates.append("lead_developer = ?")
            params.append(client.lead_developer)
        if client.key_contacts is not None:
            updates.append("key_contacts = ?")
            params.append(json.dumps(client.key_contacts))
            
        if not updates:
            return {"status": "success", "message": "No fields to update"}
            
        params.append(client_id)
        
        conn.execute(
            f"UPDATE clients SET {', '.join(updates)} WHERE client_id = ?",
            params
        )
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/clients/{client_id}/token")
def regenerate_token(client_id: str, req: TokenRegenerateRequest, conn: duckdb.DuckDBPyConnection = Depends(get_db_conn)):
    try:
        raw_token = f"sk_{secrets.token_urlsafe(16)}"
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        expires = None
        if req.token_lifespan_days:
            expires = datetime.datetime.now() + datetime.timedelta(days=req.token_lifespan_days)
            
        conn.execute(
            "UPDATE clients SET api_token = ?, api_token_expires = ? WHERE client_id = ?",
            (token_hash, expires, client_id)
        )
        conn.commit()
        return {"status": "success", "api_token": raw_token, "api_token_expires": str(expires) if expires else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/clients")
def create_client(client: ClientOnboard, conn: duckdb.DuckDBPyConnection = Depends(get_db_conn)):
    client_id = str(uuid.uuid4())
    raw_token = f"sk_{secrets.token_urlsafe(16)}"
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    
    expires = None
    if client.token_lifespan_days:
        expires = datetime.datetime.now() + datetime.timedelta(days=client.token_lifespan_days)
        
    date_joined = datetime.datetime.now().date()
    
    try:
        conn.execute(
            """INSERT INTO clients (client_id, client_name, api_token, api_token_expires, date_joined, contract_status, account_manager, lead_developer) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (client_id, client.client_name, token_hash, expires, date_joined, client.contract_status, client.account_manager, client.lead_developer)
        )
        conn.commit()
        return {
            "client_id": client_id, 
            "client_name": client.client_name, 
            "api_token": raw_token,
            "api_token_expires": str(expires) if expires else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics")
def get_metrics(
    client_name: str | None = None, 
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    conn: duckdb.DuckDBPyConnection = Depends(get_db_conn)
):
    query, params = render_query(
        "metrics_events.sql", 
        client_name=client_name, 
        status=status, 
        date_from=date_from, 
        date_to=date_to
    )
    events = conn.execute(query, params).fetchall()
    
    formatted_events = [
        {
            "event_id": row[0],
            "client_name": row[1],
            "project_name": row[2],
            "build_stage": row[3],
            "status": row[4],
            "timestamp": row[5].isoformat(),
            "duration_seconds": row[6],
            "run_id": row[7]
        }
        for row in events
    ]
    
    stats_query, stats_params = render_query(
        "metrics_stats.sql",
        client_name=client_name, 
        status=status, 
        date_from=date_from, 
        date_to=date_to
    )
    stats = conn.execute(stats_query, stats_params).fetchone()
    
    return {
        "events": formatted_events,
        "stats": {
            "total_events": stats[0] or 0,
            "total_failures": int(stats[1] or 0)
        }
    }

@app.get("/api/trends")
def get_trends(
    client_name: str | None = None, 
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    conn: duckdb.DuckDBPyConnection = Depends(get_db_conn)
):
    kw = {
        "client_name": client_name,
        "status": status,
        "date_from": date_from,
        "date_to": date_to
    }
    
    dur_query, dur_params = render_query("trends_duration.sql", **kw)
    duration_rows = conn.execute(dur_query, dur_params).fetchall()
    
    duration_dict = {}
    projects_set = set()
    
    for row in duration_rows:
        day = row[0]
        project = row[1]
        avg_dur = round(row[2] or 0, 2)
        
        if day not in duration_dict:
            duration_dict[day] = {"date": day}
        
        duration_dict[day][project] = avg_dur
        projects_set.add(project)
        
    duration_trends = list(duration_dict.values())
    duration_trends.sort(key=lambda x: x["date"])
    
    stat_query, stat_params = render_query("trends_status.sql", **kw)
    status_distribution = conn.execute(stat_query, stat_params).fetchall()
    
    csf_query, csf_params = render_query("trends_client_sf.sql", **kw)
    client_sf_rows = conn.execute(csf_query, csf_params).fetchall()
    client_success_failure = [{"client": row[0], "success": row[1], "failed": row[2]} for row in client_sf_rows]

    dsf_query, dsf_params = render_query("trends_daily_sf.sql", **kw)
    daily_sf_rows = conn.execute(dsf_query, dsf_params).fetchall()
    daily_success_failure = [{"date": row[0], "success": row[1], "failed": row[2]} for row in daily_sf_rows]
    
    return {
        "build_duration": duration_trends,
        "projects": sorted(projects_set),
        "status_distribution": [{"name": row[0], "value": row[1]} for row in status_distribution],
        "client_success_failure": client_success_failure,
        "daily_success_failure": daily_success_failure
    }

@app.get("/api/events/{event_id}")
def get_event(event_id: str, conn: duckdb.DuckDBPyConnection = Depends(get_db_conn)):
    row = conn.execute("""
        SELECT e.event_id, c.client_name, e.run_id, e.project_name, e.build_stage, e.status, 
               e.start_timestamp, e.end_timestamp, e.duration_seconds
        FROM build_events e
        JOIN clients c ON e.client_id = c.client_id
        WHERE e.event_id = ?
    """, (event_id,)).fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
        
    return {
        "event_id": row[0],
        "client_name": row[1],
        "run_id": row[2],
        "project_name": row[3],
        "build_stage": row[4],
        "status": row[5],
        "start_timestamp": str(row[6]) if row[6] else None,
        "end_timestamp": str(row[7]) if row[7] else None,
        "duration_seconds": row[8]
    }

@app.post("/api/chat")
def chat_with_agent(query: ChatQuery, conn: duckdb.DuckDBPyConnection = Depends(get_db_conn)):
    recent_events = conn.execute(
        """
        SELECT c.client_name, b.project_name, b.build_stage, b.status, b.start_timestamp
        FROM build_events b
        JOIN clients c ON b.client_id = c.client_id
        ORDER BY b.start_timestamp DESC
        LIMIT 20
        """
    ).fetchall()
    
    context_str = "Recent Events:\n"
    for row in recent_events:
        context_str += f"[{row[4]}] Client: {row[0]}, Project: {row[1]}, Stage: {row[2]}, Status: {row[3]}\n"
    
    response = get_diagnostics(query.query, context_str)
    return {"response": response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
