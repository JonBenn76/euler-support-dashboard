import { List as ListIcon, BarChart3, Users, Settings } from 'lucide-react';

const getPastDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

export default function Navigation({
  activeTab,
  setActiveTab,
  clientsList,
  clientFilter,
  setClientFilter,
  statusFilter,
  setStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo
}) {
  return (
    <div style={{ position: 'sticky', top: '-1px', zIndex: 100, background: 'rgba(15, 17, 21, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', margin: '0 -24px 32px -24px', padding: '24px 24px 0 24px', borderBottom: '1px solid var(--glass-border)' }}>
      <nav className="tabs-nav" style={{ marginBottom: '24px' }}>
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <ListIcon size={18} /> Live Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} /> Trends & Analytics
        </button>
        <button 
          className={`tab-button ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          <Users size={18} /> Client Profiles
        </button>
        <button 
          className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          <Settings size={18} /> Client Admin
        </button>
      </nav>

      {/* Global Filter Bar - hide on non-metrics tabs */}
      {(activeTab === 'overview' || activeTab === 'analytics') && (
        <div className="glass-panel" style={{ marginBottom: '24px', padding: '16px 24px' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="filter-group">
              <label>Client:</label>
              <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                <option value="all">All Clients</option>
                {clientsList.map(c => (
                  <option key={c.client_id} value={c.client_name}>{c.client_name}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Status:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="running">Running</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Quick Filters:</label>
              <div style={{display: 'flex', gap: '8px'}}>
                <button type="button" className="btn-secondary" style={{padding: '6px 12px', fontSize: '0.8rem', ...(dateFrom === getPastDate(0) && dateTo === '' ? {background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)'} : {})}} onClick={() => { setDateFrom(getPastDate(0)); setDateTo(''); }}>Today</button>
                <button type="button" className="btn-secondary" style={{padding: '6px 12px', fontSize: '0.8rem', ...(dateFrom === getPastDate(7) && dateTo === '' ? {background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)'} : {})}} onClick={() => { setDateFrom(getPastDate(7)); setDateTo(''); }}>This Week</button>
                <button type="button" className="btn-secondary" style={{padding: '6px 12px', fontSize: '0.8rem', ...(dateFrom === getPastDate(30) && dateTo === '' ? {background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)'} : {})}} onClick={() => { setDateFrom(getPastDate(30)); setDateTo(''); }}>This Month</button>
                <button type="button" className="btn-secondary" style={{padding: '6px 12px', fontSize: '0.8rem', ...(dateFrom === getPastDate(365) && dateTo === '' ? {background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)'} : {})}} onClick={() => { setDateFrom(getPastDate(365)); setDateTo(''); }}>This Year</button>
                <button type="button" className="btn-secondary" style={{padding: '6px 12px', fontSize: '0.8rem', ...(dateFrom === '' && dateTo === '' ? {background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)'} : {})}} onClick={() => { setDateFrom(''); setDateTo(''); }}>All</button>
              </div>
            </div>

            <div className="filter-group">
              <label>From Date:</label>
              <input 
                type="date" 
                style={{ padding: '8px', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)} 
              />
            </div>

            <div className="filter-group">
              <label>To Date:</label>
              <input 
                type="date" 
                style={{ padding: '8px', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
