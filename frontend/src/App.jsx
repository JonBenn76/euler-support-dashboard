import { useState, useEffect, Fragment } from 'react';
import Navigation from './components/Navigation';
import LiveOverview from './components/LiveOverview';
import TrendsAnalytics from './components/TrendsAnalytics';
import ClientProfiles from './components/ClientProfiles';
import ClientAdmin from './components/ClientAdmin';

const API_URL = import.meta.env.VITE_API_URL;
const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function App() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, analytics, profiles, admin
  const [metrics, setMetrics] = useState({ events: [], stats: { total_events: 0, total_failures: 0 } });
  const [trends, setTrends] = useState({ build_duration: [], projects: [], status_distribution: [], client_success_failure: [], daily_success_failure: [] });
  const [clientsList, setClientsList] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  // Filters
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const getPastDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const [dateFrom, setDateFrom] = useState(getPastDate(7));
  const [dateTo, setDateTo] = useState('');
  
  // Drill-down
  const [expandedEventId, setExpandedEventId] = useState(null);

  // Analytics Filters
  const [hiddenProjects, setHiddenProjects] = useState([]);

  // Admin Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'add', 'edit', 'token'
  const [activeClient, setActiveClient] = useState(null);
  const [formData, setFormData] = useState({
    client_name: '',
    account_manager: '',
    lead_developer: '',
    contract_status: 'Active',
    token_lifespan_days: 365,
    never_expire: false,
    key_contacts: []
  });
  const [newTokenResult, setNewTokenResult] = useState(null);

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_URL}/clients`);
      if (response.ok) {
        const data = await response.json();
        setClientsList(data);
      }
    } catch (error) {
      console.error("Failed to fetch clients", error);
    }
  };

  const fetchMetricsAndTrends = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (clientFilter !== 'all') queryParams.append('client_name', clientFilter);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (dateFrom) queryParams.append('date_from', `${dateFrom}T00:00:00`);
      if (dateTo) queryParams.append('date_to', `${dateTo}T23:59:59`);
      
      const queryStr = queryParams.toString();

      if (activeTab === 'overview' || activeTab === 'analytics') {
        const mRes = await fetch(`${API_URL}/metrics?${queryStr}`);
        if (mRes.ok) setMetrics(await mRes.json());
      }
      
      if (activeTab === 'overview' || activeTab === 'analytics') {
        const tRes = await fetch(`${API_URL}/trends?${queryStr}`);
        if (tRes.ok) setTrends(await tRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [activeTab]);

  useEffect(() => {
    setHiddenProjects([]);
  }, [clientFilter]);

  useEffect(() => {
    fetchMetricsAndTrends();
    const interval = setInterval(fetchMetricsAndTrends, 5000);
    return () => clearInterval(interval);
  }, [clientFilter, statusFilter, dateFrom, dateTo, activeTab]);

  const handleClientDrilldown = (e, clientName) => {
    e.stopPropagation();
    setClientFilter(clientName);
    setActiveTab('analytics');
  };
  
  const handleProfileClick = async (clientId) => {
    try {
      const response = await fetch(`${API_URL}/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedProfile(data);
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    }
  };

  // --- Admin Functions ---
  const openModal = (type, client = null) => {
    setModalType(type);
    setActiveClient(client);
    setNewTokenResult(null);
    
    if (type === 'edit' && client) {
      setFormData({
        client_name: client.client_name,
        account_manager: client.account_manager || '',
        lead_developer: client.lead_developer || '',
        contract_status: client.contract_status || 'Active',
        token_lifespan_days: 365,
        never_expire: false,
        key_contacts: client.key_contacts ? JSON.parse(JSON.stringify(client.key_contacts)) : []
      });
    } else if (type === 'add') {
      setFormData({
        client_name: '',
        account_manager: '',
        lead_developer: '',
        contract_status: 'Active',
        token_lifespan_days: 365,
        never_expire: false,
        key_contacts: []
      });
    } else if (type === 'token') {
      setFormData({ ...formData, token_lifespan_days: 365, never_expire: false });
    }
    
    setIsModalOpen(true);
  };

  const closeAdminModal = () => {
    setIsModalOpen(false);
    if (newTokenResult) fetchClients(); // refresh table if a token changed
  };

  const submitAdminForm = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        const payload = {
          client_name: formData.client_name,
          account_manager: formData.account_manager,
          lead_developer: formData.lead_developer,
          contract_status: formData.contract_status,
          token_lifespan_days: formData.never_expire ? null : Number(formData.token_lifespan_days),
          key_contacts: formData.key_contacts
        };
        const res = await fetch(`${API_URL}/clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        setNewTokenResult(data.api_token);
        fetchClients();
      } 
      else if (modalType === 'edit') {
        const payload = {
          account_manager: formData.account_manager,
          lead_developer: formData.lead_developer,
          contract_status: formData.contract_status,
          key_contacts: formData.key_contacts
        };
        await fetch(`${API_URL}/clients/${activeClient.client_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        fetchClients();
        if (selectedProfile && selectedProfile.client_id === activeClient.client_id) {
          handleProfileClick(activeClient.client_id);
        }
        closeAdminModal();
      }
      else if (modalType === 'token') {
        const payload = {
          token_lifespan_days: formData.never_expire ? null : Number(formData.token_lifespan_days)
        };
        const res = await fetch(`${API_URL}/clients/${activeClient.client_id}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        setNewTokenResult(data.api_token);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please check console.");
    }
  };

  return (
    <div className="dashboard-container">
      <header className="header" style={{ marginBottom: '24px' }}>
        <h1>Support Command Centre</h1>
      </header>

      <Navigation 
        activeTab={activeTab} setActiveTab={setActiveTab}
        clientsList={clientsList}
        clientFilter={clientFilter} setClientFilter={setClientFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
      />

      {/* Global Stats - hide on non-metrics tabs */}
      {(activeTab === 'overview' || activeTab === 'analytics') && (
        <section className="stats-grid">
          <div className="glass-panel">
            <div className="metric-value">{metrics.stats.total_events}</div>
            <div className="metric-label">Filtered Events</div>
          </div>
          <div className="glass-panel">
            <div className="metric-value" style={{color: 'var(--error)'}}>{metrics.stats.total_failures}</div>
            <div className="metric-label">Filtered Failures</div>
          </div>
          <div className="glass-panel">
            <div className="metric-value" style={{color: 'var(--success)'}}>
              {metrics.stats.total_events > 0 
                ? Math.round(((metrics.stats.total_events - metrics.stats.total_failures) / metrics.stats.total_events) * 100) 
                : 100}%
            </div>
            <div className="metric-label">Success Rate</div>
          </div>
        </section>
      )}

      <div className="grid">
        <div className="glass-panel" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
          
          {activeTab === 'overview' && (
            <LiveOverview 
              metrics={metrics}
              trends={trends}
              handleClientDrilldown={handleClientDrilldown}
              expandedEventId={expandedEventId}
              setExpandedEventId={setExpandedEventId}
            />
          )}

          {activeTab === 'analytics' && (
            <TrendsAnalytics 
              clientFilter={clientFilter}
              trends={trends}
              hiddenProjects={hiddenProjects}
              setHiddenProjects={setHiddenProjects}
              COLORS={COLORS}
            />
          )}

          {activeTab === 'profiles' && (
            <ClientProfiles 
              clientsList={clientsList}
              selectedProfile={selectedProfile}
              setSelectedProfile={setSelectedProfile}
              handleProfileClick={handleProfileClick}
              openModal={openModal}
              setClientFilter={setClientFilter}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'admin' && (
            <ClientAdmin 
              clientsList={clientsList}
              openModal={openModal}
            />
          )}

        </div>
      </div>

      {/* Admin Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeAdminModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>
              {modalType === 'add' && 'Onboard New Client'}
              {modalType === 'edit' && `Edit Profile: ${activeClient?.client_name}`}
              {modalType === 'token' && `Regenerate Token: ${activeClient?.client_name}`}
            </h2>
            
            {newTokenResult ? (
              <div>
                <p style={{marginBottom: '16px', color: 'var(--success)'}}>
                  Success! Here is the new API Token. <br/><br/>
                  <strong>IMPORTANT: Copy this now. You will not be able to see it again!</strong>
                </p>
                <div className="token-box">
                  {newTokenResult}
                </div>
                <div className="modal-actions">
                  <button onClick={closeAdminModal}>Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitAdminForm}>
                {modalType === 'add' && (
                  <div className="form-group">
                    <label>Client Name</label>
                    <input required type="text" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} />
                  </div>
                )}
                
                {(modalType === 'add' || modalType === 'edit') && (
                  <>
                    <div className="form-group">
                      <label>Contract Status</label>
                      <select value={formData.contract_status} onChange={e => setFormData({...formData, contract_status: e.target.value})}>
                        <option value="Active">Active</option>
                        <option value="Premium Active">Premium Active</option>
                        <option value="Expired">Expired</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Account Manager</label>
                      <input type="text" value={formData.account_manager} onChange={e => setFormData({...formData, account_manager: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Lead Developer</label>
                      <input type="text" value={formData.lead_developer} onChange={e => setFormData({...formData, lead_developer: e.target.value})} />
                    </div>

                    <div className="form-group" style={{marginTop: '16px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <label>Key Contacts</label>
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          style={{padding: '4px 8px', fontSize: '0.75rem'}}
                          onClick={() => setFormData({...formData, key_contacts: [...formData.key_contacts, {name: '', role: '', email: ''}]})}
                        >
                          + Add Contact
                        </button>
                      </div>
                      
                      {formData.key_contacts && formData.key_contacts.map((contact, idx) => (
                        <div key={idx} style={{display: 'flex', gap: '8px', marginBottom: '8px', background: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '4px', border: '1px solid var(--glass-border)'}}>
                           <input type="text" placeholder="Name" value={contact.name} onChange={e => {
                             const newContacts = [...formData.key_contacts];
                             newContacts[idx].name = e.target.value;
                             setFormData({...formData, key_contacts: newContacts});
                           }} style={{flex: 1}}/>
                           <input type="text" placeholder="Role" value={contact.role} onChange={e => {
                             const newContacts = [...formData.key_contacts];
                             newContacts[idx].role = e.target.value;
                             setFormData({...formData, key_contacts: newContacts});
                           }} style={{flex: 1}}/>
                           <input type="email" placeholder="Email" value={contact.email} onChange={e => {
                             const newContacts = [...formData.key_contacts];
                             newContacts[idx].email = e.target.value;
                             setFormData({...formData, key_contacts: newContacts});
                           }} style={{flex: 1.5}}/>
                           <button type="button" className="btn-secondary" style={{padding: '4px 8px'}} onClick={() => {
                             const newContacts = [...formData.key_contacts];
                             newContacts.splice(idx, 1);
                             setFormData({...formData, key_contacts: newContacts});
                           }}>X</button>
                        </div>
                      ))}
                      {(!formData.key_contacts || formData.key_contacts.length === 0) && (
                        <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>No contacts added.</span>
                      )}
                    </div>
                  </>
                )}

                {(modalType === 'add' || modalType === 'token') && (
                  <div className="form-group">
                    <label>Token Lifespan</label>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <select 
                        disabled={formData.never_expire} 
                        value={formData.token_lifespan_days} 
                        onChange={e => setFormData({...formData, token_lifespan_days: e.target.value})}
                        style={{flex: 1}}
                      >
                        <option value={30}>30 Days</option>
                        <option value={60}>60 Days</option>
                        <option value={90}>90 Days</option>
                        <option value={120}>120 Days</option>
                        <option value={365}>365 Days (1 Year)</option>
                      </select>
                      
                      <label style={{display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0}}>
                        <input 
                          type="checkbox" 
                          style={{width: 'auto'}}
                          checked={formData.never_expire}
                          onChange={e => setFormData({...formData, never_expire: e.target.checked})}
                        />
                        Never Expire
                      </label>
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeAdminModal}>Cancel</button>
                  <button type="submit">
                    {modalType === 'add' ? 'Create Client & Generate Token' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App;
