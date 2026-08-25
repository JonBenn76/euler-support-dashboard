SELECT 
    COUNT(*) as total_events,
    SUM(CASE WHEN b.status = 'failed' THEN 1 ELSE 0 END) as total_failures
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
