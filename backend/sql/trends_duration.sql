SELECT 
    strftime(b.start_timestamp, '%Y-%m-%d') as day,
    b.project_name,
    AVG(b.duration_seconds) as avg_duration
FROM build_events b
JOIN clients c ON b.client_id = c.client_id
WHERE b.duration_seconds IS NOT NULL
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
GROUP BY day, b.project_name
ORDER BY day ASC
