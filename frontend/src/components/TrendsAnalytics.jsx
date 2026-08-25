import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p style={{marginBottom: '4px', color: 'var(--text-secondary)'}}>{label}</p>
        {payload.map((entry, index) => (
           <p key={index} style={{color: entry.color, fontWeight: 'bold', margin: '2px 0'}}>
             {entry.name}: {entry.value} {entry.name !== 'value' && entry.name !== 'name' && !['success', 'failed', 'running'].includes(entry.name) ? 'sec' : ''}
           </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrendsAnalytics({
  clientFilter,
  trends,
  hiddenProjects,
  setHiddenProjects,
  COLORS
}) {
  return (
    <>
      {clientFilter === 'all' ? (
        <>
          <h2>Client Performance Distribution</h2>
          <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px'}}>
            Success vs Failure breakdown across all clients.
          </p>
          <div className="chart-container" style={{height: '400px', marginBottom: '64px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends.client_success_failure} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="client" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="success" stackId="a" fill="var(--success)" name="Success" />
                <Bar dataKey="failed" stackId="a" fill="var(--error)" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: '32px' }}>
          
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <h2>Daily Performance Distribution</h2>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px'}}>
              Success vs Failure breakdown over time for {clientFilter}.
            </p>
            <div className="chart-container" style={{height: '400px'}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.daily_success_failure} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                  <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{paddingTop: '20px'}} />
                  <Bar dataKey="success" stackId="a" fill="var(--success)" name="Success" />
                  <Bar dataKey="failed" stackId="a" fill="var(--error)" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <h2>Build Duration Trends (by Project)</h2>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px'}}>
              Monitoring if individual processes are growing in time to complete over days.
            </p>
        
            {trends.projects && trends.projects.length > 0 && (
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px'}}>
                <span style={{fontSize: '0.875rem', color: 'var(--text-secondary)', marginRight: '8px', alignSelf: 'center'}}>Toggle Projects:</span>
                {trends.projects.map((proj, idx) => {
                  const isActive = !hiddenProjects.includes(proj);
                  return (
                    <button
                      key={proj}
                      type="button"
                      onClick={() => {
                        if (isActive) setHiddenProjects([...hiddenProjects, proj]);
                        else setHiddenProjects(hiddenProjects.filter(p => p !== proj));
                      }}
                      style={{
                        padding: '4px 12px',
                        fontSize: '0.8rem',
                        borderRadius: '16px',
                        background: isActive ? COLORS[idx % COLORS.length] : 'rgba(255,255,255,0.05)',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        border: `1px solid ${isActive ? 'transparent' : 'var(--glass-border)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {proj}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="chart-container" style={{height: '400px'}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.build_duration} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                  <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{paddingTop: '20px'}} />
                  {trends.projects && trends.projects.filter(proj => !hiddenProjects.includes(proj)).map((proj) => {
                    const idx = trends.projects.indexOf(proj);
                    return (
                      <Line 
                        key={proj} 
                        type="monotone" 
                        dataKey={proj} 
                        stroke={COLORS[idx % COLORS.length]} 
                        strokeWidth={3} 
                        dot={{r: 4, fill: COLORS[idx % COLORS.length]}} 
                        activeDot={{ r: 8 }} 
                        connectNulls
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      <h2 style={{marginTop: '64px'}}>Status Distribution</h2>
      <div className="chart-container" style={{height: '350px'}}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={trends.status_distribution}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={110}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {trends.status_distribution && trends.status_distribution.map((entry, index) => {
                let color = COLORS[2]; // blue
                if (entry.name === 'success') color = COLORS[0]; // green
                if (entry.name === 'failed') color = COLORS[1]; // red
                if (entry.name === 'running') color = COLORS[3]; // yellow/amber
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
