SELECT b.event_id, c.client_name, b.project_name, b.build_stage, b.status, b.start_timestamp, b.duration_seconds, b.run_id
FROM build_events b
JOIN clients c ON b.client_id = c.client_id
WHERE 1=1
{% if client_name and client_name != 'all' %}
    AND c.client_name = {{ bind(client_name) }}
{% endif %}
{% if status and status != 'all' %}
    AND b.status = {{ bind(status) }}
{% endif %}
{% if date_from %}
    AND b.start_timestamp >= {{ bind(date_from) }}
{% endif %}
{% if date_to %}
    AND b.start_timestamp <= {{ bind(date_to) }}
{% endif %}
ORDER BY b.start_timestamp DESC
LIMIT 50
