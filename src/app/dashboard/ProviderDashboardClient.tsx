'use client';

import { useState, useEffect } from 'react';

interface Lead {
  customerName: string;
  phoneNumber: string;
  assignedAt: string;
}

interface ProviderData {
  id: string;
  name: string;
  quota: number;
  currentMonthLeads: number;
  leads: Lead[];
}

interface Props {
  providerId: string;
  initialData: ProviderData;
}

export default function ProviderDashboardClient({ providerId, initialData }: Props) {
  const [data, setData] = useState<ProviderData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/providers?providerId=${providerId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch fresh data');
        }
        const freshData = await res.json();
        setData(freshData);
        setError(null);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err: any) {
        console.error('Polling error:', err);
        setError(err.message || 'Error fetching real-time updates');
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, [providerId]);

  const remainingQuota = data.quota - data.currentMonthLeads;

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0' }}>{data.name}'s Dashboard</h1>
        <p style={{ margin: '0 0 16px 0', color: '#666' }}>Provider ID: <code>{data.id}</code></p>
        
        {error && (
          <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '8px 12px', borderRadius: '4px', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ border: '1px solid #eee', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#555' }}>Monthly Quota</h3>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.quota}</span>
          </div>
          <div style={{ border: '1px solid #eee', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#555' }}>Leads Assigned</h3>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.currentMonthLeads}</span>
          </div>
          <div style={{ border: '1px solid #eee', padding: '12px', borderRadius: '6px', textAlign: 'center', backgroundColor: '#e8f5e9' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#2e7d32', fontWeight: 'bold' }}>Quota Remaining</h3>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32' }}>{remainingQuota}</span>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#888', textAlign: 'right', marginTop: '12px', marginBottom: '0' }}>
          Last updated: {lastUpdated} (Updating every 3s)
        </p>
      </div>

      <h2>Assigned Leads ({data.leads.length})</h2>
      {data.leads.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>No leads assigned yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '10px 8px' }}>Customer Name</th>
              <th style={{ padding: '10px 8px' }}>Phone Number</th>
              <th style={{ padding: '10px 8px' }}>Assigned At</th>
            </tr>
          </thead>
          <tbody>
            {data.leads.map((lead, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px 8px' }}>{lead.customerName}</td>
                <td style={{ padding: '10px 8px' }}>{lead.phoneNumber}</td>
                <td style={{ padding: '10px 8px' }}>{new Date(lead.assignedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
