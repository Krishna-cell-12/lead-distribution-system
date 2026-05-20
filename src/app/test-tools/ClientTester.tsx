'use client';

import { useState } from 'react';

interface Provider {
  id: string;
  name: string;
  quota: number;
  currentMonthLeads: number;
}

interface Service {
  id: string;
  name: string;
}

interface Props {
  providers: Provider[];
  services: Service[];
}

export default function ClientTester({ providers, services }: Props) {
  // --- Feature 1 States ---
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || '');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(typeof window !== 'undefined' ? window.crypto.randomUUID() : 'f93d395d-2b47-497f-8bfb-c5b9679f2834');
  const [webhookStatus, setWebhookStatus] = useState<string>('');
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);

  // --- Feature 2 States ---
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [concurrencyStatus, setConcurrencyStatus] = useState<string>('');
  const [concurrencyResults, setConcurrencyResults] = useState<any[]>([]);

  // --- Helpers ---
  const regenerateUUID = () => {
    setIdempotencyKey(window.crypto.randomUUID());
  };

  const handleWebhookSubmit = async () => {
    setWebhookStatus('Submitting...');
    try {
      const res = await fetch('/api/webhooks/reset-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProviderId,
          idempotencyKey,
        }),
      });
      const data = await res.json();
      setWebhookStatus(res.ok ? 'Completed!' : `Error: ${data.error || 'Failed'}`);
      
      const providerName = providers.find(p => p.id === selectedProviderId)?.name || 'Unknown';
      setWebhookLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          providerName,
          key: idempotencyKey,
          status: res.status,
          response: data,
        },
        ...prev,
      ]);
    } catch (e: any) {
      console.error(e);
      setWebhookStatus(`Failed: ${e.message}`);
    }
  };

  const handleConcurrencyTest = async () => {
    setConcurrencyStatus('Firing 10 simultaneous requests...');
    setConcurrencyResults([]);

    const requests = Array.from({ length: 10 }).map((_, index) => {
      const customerName = `TestUser_${Date.now()}_${index}`;
      const phoneNumber = `555-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      return fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phoneNumber,
          serviceId: selectedServiceId,
        }),
      }).then(async (res) => {
        const body = await res.json();
        return {
          index: index + 1,
          customerName,
          status: res.status,
          body,
        };
      }).catch(err => ({
        index: index + 1,
        customerName,
        status: 500,
        body: { error: err.message },
      }));
    });

    try {
      const results = await Promise.all(requests);
      setConcurrencyResults(results);
      setConcurrencyStatus('Complete! Examine results below.');
    } catch (e: any) {
      console.error(e);
      setConcurrencyStatus(`Test crashed: ${e.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* FEATURE 1: IDEMPOTENT WEBHOOK TESTER */}
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
        <h2 style={{ marginTop: '0' }}>Feature 1: Idempotent Quota Reset Webhook</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Sends a quota reset request. Submitting multiple times with the same UUID key will execute the update on the first click and return the cached processed result without modifying the database on subsequent clicks.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Provider:</label>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #aaa', width: '200px' }}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Leads: {p.currentMonthLeads})
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '300px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Idempotency Key (UUID):</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #aaa', flex: '1', fontFamily: 'monospace' }}
              />
              <button
                onClick={regenerateUUID}
                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #777', backgroundColor: '#f0f0f0', cursor: 'pointer' }}
              >
                🔄 Gen Key
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleWebhookSubmit}
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#0066cc',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            🚀 Submit Webhook
          </button>
          <span style={{ fontWeight: 'bold', color: webhookStatus.startsWith('Error') ? 'red' : 'green' }}>
            {webhookStatus}
          </span>
        </div>

        {webhookLogs.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>Submission Logs:</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px', padding: '8px', backgroundColor: '#fafafa', color: '#111827' }}>
              {webhookLogs.map((log, idx) => (
                <div key={idx} style={{ borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '8px', fontSize: '13px' }}>
                  <strong>[{log.timestamp}]</strong> Reset quota for <strong>{log.providerName}</strong> <br />
                  <span style={{ color: '#555' }}>Key: <code>{log.key}</code></span> <br />
                  <span style={{ color: log.status === 200 ? '#15803d' : '#d32f2f' }}>Status {log.status}</span> — 
                  <span style={{ color: log.response.duplicated ? '#e65100' : '#15803d', fontWeight: 'bold' }}>
                    {log.response.duplicated ? ' ⚠️ Duplicated Key (Idempotent Hit)' : ' ✅ First processing (DB Updated)'}
                  </span>
                  <pre style={{ margin: '4px 0 0 0', fontSize: '11px', backgroundColor: '#eee', padding: '4px', borderRadius: '3px', color: '#111827' }}>
                    {JSON.stringify(log.response, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FEATURE 2: CONCURRENCY TESTER */}
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
        <h2 style={{ marginTop: '0' }}>Feature 2: Concurrency Lead Distributor Tester</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Simulates high load by firing **10 simultaneous POST requests** using `Promise.all()`. Our database row-level locking ensures only valid requests are accepted, and no provider ever exceeds their quota threshold.
        </p>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Select Service:</label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #aaa', width: '250px' }}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleConcurrencyTest}
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#d32f2f',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            🔥 Fire 10 Concurrent Requests
          </button>
          <span style={{ fontWeight: 'bold', color: 'blue' }}>{concurrencyStatus}</span>
        </div>

        {concurrencyResults.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Results Panel:</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Req #</th>
                  <th style={{ padding: '8px' }}>Name</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Assigned Providers</th>
                  <th style={{ padding: '8px' }}>Details / Error</th>
                </tr>
              </thead>
              <tbody style={{ color: '#111827' }}>
                {concurrencyResults.map((res) => {
                  const isSuccess = res.status === 201;
                  return (
                    <tr key={res.index} style={{ borderBottom: '1px solid #eee', backgroundColor: isSuccess ? '#e8f5e9' : '#ffebee', color: '#111827' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{res.index}</td>
                      <td style={{ padding: '8px' }}>{res.customerName}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: isSuccess ? '#15803d' : '#d32f2f' }}>
                        {res.status}
                      </td>
                      <td style={{ padding: '8px' }}>
                        {isSuccess
                          ? res.body.assignedProviders?.map((p: any) => `${p.name} (Leads: ${p.currentMonthLeads}/${p.quota})`).join(', ')
                          : '-'}
                      </td>
                      <td style={{ padding: '8px', color: isSuccess ? '#15803d' : '#d32f2f' }}>
                        {isSuccess ? 'Success' : res.body.error}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
