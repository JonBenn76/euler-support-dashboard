export default function ClientProfiles({
  clientsList,
  selectedProfile,
  setSelectedProfile,
  handleProfileClick,
  openModal,
  setClientFilter,
  setActiveTab
}) {
  return (
    <>
      {selectedProfile ? (
        <div>
          <button className="btn-secondary" onClick={() => setSelectedProfile(null)} style={{marginBottom: '24px'}}>
            &larr; Back to Directory
          </button>
          
          <div className="glass-panel" style={{position: 'relative'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px'}}>
              <div>
                <h2 style={{margin: 0, color: 'var(--accent-primary)'}}>{selectedProfile.client_name}</h2>
                <span style={{color: 'var(--text-secondary)', fontSize: '0.875rem'}}>ID: {selectedProfile.client_id}</span>
              </div>
              <button onClick={() => openModal('edit', selectedProfile)}>
                Edit Profile
              </button>
            </div>
            
            <div className="detail-grid" style={{background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '8px', border: '1px solid var(--glass-border)'}}>
              <div className="detail-item">
                <span className="detail-label">Date Joined</span>
                <span className="detail-value">{selectedProfile.date_joined || 'Unknown'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Contract Status</span>
                <span className="detail-value">
                  <span className={`status ${selectedProfile.contract_status.includes('Active') ? 'success' : 'failed'}`} style={{display: 'inline-block'}}>
                    {selectedProfile.contract_status}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Account Manager</span>
                <span className="detail-value">{selectedProfile.account_manager || 'Unassigned'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Lead Developer</span>
                <span className="detail-value">{selectedProfile.lead_developer || 'Unassigned'}</span>
              </div>
            </div>

            <h3 style={{marginTop: '32px', marginBottom: '16px'}}>Key Contacts</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProfile.key_contacts && selectedProfile.key_contacts.map((contact, i) => (
                    <tr key={i}>
                      <td>{contact.name}</td>
                      <td>{contact.role}</td>
                      <td>{contact.email}</td>
                    </tr>
                  ))}
                  {(!selectedProfile.key_contacts || selectedProfile.key_contacts.length === 0) && (
                    <tr><td colSpan="3">No contacts listed.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{marginTop: '32px'}}>
              <button className="btn-secondary" onClick={() => {
                setClientFilter(selectedProfile.client_name);
                setActiveTab('analytics');
              }}>
                &rarr; View Analytics for {selectedProfile.client_name}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <h2>Client Directory</h2>
          <div className="client-grid" style={{marginTop: '24px'}}>
            {clientsList.map(client => (
              <div className="client-card" key={client.client_id} onClick={() => handleProfileClick(client.client_id)}>
                <h3>{client.client_name}</h3>
                <div className="client-meta">
                  <div className="meta-row">
                    <span className="meta-label">Joined</span>
                    <span className="meta-value">{client.date_joined}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Status</span>
                    <span className="meta-value" style={{color: 'var(--success)'}}>{client.contract_status}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Acc. Manager</span>
                    <span className="meta-value">{client.account_manager}</span>
                  </div>
                </div>
              </div>
            ))}
            {clientsList.length === 0 && (
              <p style={{color: 'var(--text-secondary)'}}>No clients found in directory.</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
