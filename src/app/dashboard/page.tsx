'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Lead {
  customerName: string;
  phoneNumber: string;
  createdAt: string;
}

interface Provider {
  id: string;
  name: string;
  quota: number;
  currentMonthLeads: number;
  assignments: {
    lead: Lead;
  }[];
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const providerId = searchParams.get('providerId') || '1';
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/providers/${providerId}`);
        if (!res.ok) {
          if (res.status === 404) setError(true);
          throw new Error('Failed to fetch');
        }
        const data = await res.json();
        setProvider(data);
        setLoading(false);
        setError(false);
      } catch (err) {
        console.error(err);
        if (!provider) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [providerId, provider]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Provider Not Found</h1>
        <p className="text-gray-400 text-center">The requested provider ID <strong>{providerId}</strong> does not exist in our system.</p>
        <div className="mt-8 text-slate-600 text-sm">
          Tip: Use the Testing Panel to create providers and leads.
        </div>
      </div>
    );
  }

  const leads = provider.assignments.map(a => a.lead);

  return (
    <div className="min-h-screen bg-gray-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
              {provider.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Updates Active
            </div>
          </div>
          <div className="text-xs font-mono text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            ID: {provider.id}
          </div>
        </header>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl shadow-blue-500/5">
            <p className="text-sm font-medium text-slate-400 mb-1">Remaining Quota</p>
            <div className="text-4xl font-bold text-blue-400">
              {Math.max(0, provider.quota - provider.currentMonthLeads)}
              <span className="text-lg text-slate-600 ml-2">/ {provider.quota}</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl shadow-indigo-500/5">
            <p className="text-sm font-medium text-slate-400 mb-1">Total Leads Received</p>
            <div className="text-4xl font-bold text-indigo-400">
              {provider.currentMonthLeads}
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-semibold text-white">Recently Assigned Leads</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Customer Name</th>
                  <th className="px-6 py-4 font-semibold">Phone Number</th>
                  <th className="px-6 py-4 font-semibold">Assigned Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leads.length > 0 ? (
                  leads.map((lead, index) => (
                    <tr key={index} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-200 group-hover:text-white">{lead.customerName}</td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-sm">{lead.phoneNumber}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">
                      No leads assigned to this provider yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProviderDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
