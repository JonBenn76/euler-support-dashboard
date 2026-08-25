export default function ClientAdmin({
  clientsList,
  openModal
}) {
  return (
    <>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <h2>Client Administration</h2>
        <button onClick={() => openModal('add')}>+ Onboard New Client</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Contract Status</th>
              <th>Acc. Manager</th>
              <th>Token Expiration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clientsList.map(client => {
              const isExpired = client.api_token_expires && new Date(client.api_token_expires) < new Date();
              return (
                <tr key={client.client_id}>
                  <td style={{fontWeight: 'bold'}}>{client.client_name}</td>
                  <td>
                    <span className={`status ${client.contract_status.includes('Active') ? 'success' : 'failed'}`}>
                      {client.contract_status}
                    </span>
                  </td>
                  <td>{client.account_manager || 'None'}</td>
                  <td>
                    {!client.api_token_expires ? (
                      <span style={{color: 'var(--success)'}}>Never</span>
                    ) : (
                      <span style={{color: isExpired ? 'var(--error)' : 'white'}}>
                        {new Date(client.api_token_expires).toLocaleDateString()} {isExpired && '(Expired)'}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button className="btn-secondary" style={{padding: '6px 12px', fontSize: '0.75rem'}} onClick={() => openModal('edit', client)}>Edit</button>
                      <button className="btn-secondary" style={{padding: '6px 12px', fontSize: '0.75rem'}} onClick={() => openModal('token', client)}>Regen Token</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
