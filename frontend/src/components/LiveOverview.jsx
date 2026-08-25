import { Fragment, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LiveOverview({
  metrics,
  trends,
  handleClientDrilldown,
  expandedEventId,
  setExpandedEventId
}) {
  const [rawLogEvent, setRawLogEvent] = useState(null);
  const [rawLogData, setRawLogData] = useState(null);
  const [isLogLoading, setIsLogLoading] = useState(false);

  const openRawLogs = async (e, eventId) => {
    e.stopPropagation();
    setRawLogEvent(eventId);
    setIsLogLoading(true);
    setRawLogData(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setRawLogData(data);
      } else {
        setRawLogData({ error: 'Failed to fetch logs' });
      }
    } catch (err) {
      setRawLogData({ error: 'Network error occurred.' });
    } finally {
      setIsLogLoading(false);
    }
  };

  const closeRawLogs = () => {
    setRawLogEvent(null);
    setRawLogData(null);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
        <h2 style={{margin: 0}}>Status Distribution</h2>
      </div>
      <div style={{ height: '300px', width: '100%', marginBottom: '32px' }}>
        {trends.status_distribution && trends.status_distribution.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={trends.status_distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {trends.status_distribution.map((entry, index) => {
                  let color = '#8884d8';
                  if (entry.name === 'success') color = 'var(--success)';
                  else if (entry.name === 'failed') color = 'var(--error)';
                  else if (entry.name === 'running') color = 'var(--accent-primary)';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Pie>
              <RechartsTooltip />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                formatter={(value, entry, index) => <span style={{ color: 'var(--text-primary)' }}>{value} ({trends.status_distribution[index]?.value || 0})</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            No events in this period.
          </div>
        )}
      </div>

      <h2>Live Build Stream</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Project</th>
              <th>Stage</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {metrics.events.map(event => (
              <Fragment key={event.event_id}>
                <tr className="clickable" onClick={() => setExpandedEventId(expandedEventId === event.event_id ? null : event.event_id)}>
                  <td>
                    <a href="#" onClick={(e) => handleClientDrilldown(e, event.client_name)} style={{color: 'var(--accent-primary)', textDecoration: 'none'}}>
                      {event.client_name}
                    </a>
                  </td>
                  <td>{event.project_name}</td>
                  <td>{event.build_stage}</td>
                  <td>
                    <span className={`status ${event.status}`}>
                      {event.status}
                    </span>
                  </td>
                  <td>{event.duration_seconds !== null ? `${event.duration_seconds}s` : '---'}</td>
                  <td>{new Date(event.timestamp).toLocaleTimeString()}</td>
                </tr>
                {expandedEventId === event.event_id && (
                  <tr>
                    <td colSpan="6" style={{ padding: 0 }}>
                      <div className="expanded-detail">
                        <h3>Build Event Details</h3>
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">Run ID</span>
                            <span className="detail-value">{event.run_id}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Start Timestamp</span>
                            <span className="detail-value">{new Date(event.timestamp).toISOString()}</span>
                          </div>
                        </div>
                        <div style={{ marginTop: '24px' }}>
                          <button onClick={(e) => openRawLogs(e, event.event_id)}>
                            View Raw Logs
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {metrics.events.length === 0 && (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', opacity: 0.5}}>No telemetry data found for these filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Raw Logs Modal */}
      {rawLogEvent && (
        <div className="modal-overlay" onClick={closeRawLogs} style={{ zIndex: 200 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <h2>Raw JSON Log Event</h2>
            
            <div style={{
              background: 'rgba(0,0,0,0.5)', 
              padding: '16px', 
              borderRadius: '8px', 
              overflow: 'auto',
              maxHeight: '400px',
              border: '1px solid var(--glass-border)'
            }}>
              {isLogLoading ? (
                <div style={{ color: 'var(--text-secondary)' }}>Loading logs from database...</div>
              ) : rawLogData ? (
                <pre style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(rawLogData, null, 2)}
                </pre>
              ) : (
                <div style={{ color: 'var(--error)' }}>Could not load logs.</div>
              )}
            </div>
            
            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button onClick={closeRawLogs}>Close Logs</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
