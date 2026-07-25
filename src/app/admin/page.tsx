'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = 'NEW' | 'CONTACTED' | 'CLOSED';

interface ContactLead {
  id: string;
  name: string;
  email: string;
  budget: string;
  message: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BUDGET_LABELS: Record<string, string> = {
  under_500:   '< $500',
  '500_2000':  '$500–$2K',
  '2000_10000':'$2K–$10K',
  '10000_plus':'$10K+',
};

const STATUS_CYCLE: Record<Status, Status> = {
  NEW:       'CONTACTED',
  CONTACTED: 'CLOSED',
  CLOSED:    'NEW',
};

const STATUS_META: Record<Status, { label: string; className: string; next: string }> = {
  NEW:       { label: 'New',       className: 'ld-status-new',       next: 'Mark Contacted' },
  CONTACTED: { label: 'Contacted', className: 'ld-status-contacted', next: 'Mark Closed'    },
  CLOSED:    { label: 'Closed',    className: 'ld-status-closed',    next: 'Reopen'          },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [leads, setLeads]           = useState<ContactLead[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'ALL'>('ALL');
  const [updating, setUpdating]     = useState<string | null>(null);
  const [errorMsg, setErrorMsg]     = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Fetch leads ─────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/contact-leads', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLeads(data.leads);
    } catch {
      setErrorMsg('Could not load leads. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ── Status toggle ────────────────────────────────────────────────────────────
  const cycleStatus = async (lead: ContactLead) => {
    const nextStatus = STATUS_CYCLE[lead.status];
    setUpdating(lead.id);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/contact-leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Update failed');
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: nextStatus } : l));
    } catch {
      setErrorMsg(`Failed to update status for ${lead.name}. Please try again.`);
    } finally {
      setUpdating(null);
    }
  };

  // ── Filtered & searched leads ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      const matchesSearch = !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.message.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     leads.length,
    new:       leads.filter(l => l.status === 'NEW').length,
    contacted: leads.filter(l => l.status === 'CONTACTED').length,
    closed:    leads.filter(l => l.status === 'CLOSED').length,
  }), [leads]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ld-admin-root">
      {/* Background */}
      <div className="ld-bg" aria-hidden="true">
        <div className="ld-bg-orb ld-bg-orb-admin-1" />
        <div className="ld-bg-orb ld-bg-orb-admin-2" />
        <div className="ld-bg-grid" />
      </div>

      {/* Header */}
      <header className="ld-admin-header">
        <div className="ld-container">
          <div className="ld-admin-header-inner">
            <div className="ld-admin-header-left">
              <Link href="/" className="ld-logo" style={{textDecoration:'none'}}>
                <span className="ld-logo-icon">LD</span>
                <span className="ld-logo-text">LeadDesk</span>
              </Link>
              <span className="ld-admin-badge">Admin</span>
            </div>
            <div className="ld-admin-header-right">
              <span className="ld-live-indicator">
                <span className="ld-pulse-dot" />
                {loading ? 'Loading…' : `${stats.total} leads`}
              </span>
              <Link href="/" className="ld-btn ld-btn-ghost ld-btn-sm">← Public Page</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="ld-admin-main">
        <div className="ld-container">

          {/* Page Title */}
          <div className="ld-admin-title-row">
            <div>
              <h1 className="ld-admin-title">Lead Pipeline</h1>
              <p className="ld-admin-subtitle">Manage and track all inbound project inquiries.</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="ld-stats-grid">
            <button onClick={() => setStatusFilter('ALL')} className={`ld-stat-card ${statusFilter === 'ALL' ? 'ld-stat-active' : ''}`}>
              <span className="ld-stat-value">{stats.total}</span>
              <span className="ld-stat-label">Total Leads</span>
            </button>
            <button onClick={() => setStatusFilter('NEW')} className={`ld-stat-card ld-stat-new ${statusFilter === 'NEW' ? 'ld-stat-active' : ''}`}>
              <span className="ld-stat-value">{stats.new}</span>
              <span className="ld-stat-label">New</span>
            </button>
            <button onClick={() => setStatusFilter('CONTACTED')} className={`ld-stat-card ld-stat-contacted ${statusFilter === 'CONTACTED' ? 'ld-stat-active' : ''}`}>
              <span className="ld-stat-value">{stats.contacted}</span>
              <span className="ld-stat-label">Contacted</span>
            </button>
            <button onClick={() => setStatusFilter('CLOSED')} className={`ld-stat-card ld-stat-closed ${statusFilter === 'CLOSED' ? 'ld-stat-active' : ''}`}>
              <span className="ld-stat-value">{stats.closed}</span>
              <span className="ld-stat-label">Closed</span>
            </button>
          </div>

          {/* Error banner */}
          {errorMsg && (
            <div className="ld-server-error" role="alert" style={{marginBottom:'1rem'}}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {errorMsg}
            </div>
          )}

          {/* Search & Filter */}
          <div className="ld-search-row">
            <div className="ld-search-wrapper">
              <svg className="ld-search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                id="admin-search"
                type="search"
                placeholder="Search by name, email, or message…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="ld-search-input"
                aria-label="Search leads"
              />
              {search && (
                <button onClick={() => setSearch('')} className="ld-search-clear" aria-label="Clear search">✕</button>
              )}
            </div>
            <div className="ld-filter-count">
              {filtered.length} of {leads.length} leads
            </div>
          </div>

          {/* Table */}
          <div className="ld-table-wrapper">
            {loading ? (
              <div className="ld-table-empty">
                <div className="ld-spinner ld-spinner-lg" />
                <p>Loading leads…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ld-table-empty">
                <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>🔍</div>
                <p style={{fontWeight:600, color:'var(--ld-text-primary)'}}>
                  {leads.length === 0 ? 'No leads yet' : 'No results found'}
                </p>
                <p style={{color:'var(--ld-text-muted)',fontSize:'0.85rem',marginTop:'0.25rem'}}>
                  {leads.length === 0 ? 'Submit a form on the public page to see leads appear here.' : 'Try a different search term or filter.'}
                </p>
              </div>
            ) : (
              <table className="ld-table" aria-label="Lead pipeline">
                <thead className="ld-thead">
                  <tr>
                    <th className="ld-th">Contact</th>
                    <th className="ld-th">Budget</th>
                    <th className="ld-th">Status</th>
                    <th className="ld-th">Submitted</th>
                    <th className="ld-th ld-th-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => {
                    const meta = STATUS_META[lead.status];
                    const isExpanded = expandedId === lead.id;
                    const isUpdating = updating === lead.id;
                    return (
                      <>
                        <tr key={lead.id} className={`ld-tr ${isExpanded ? 'ld-tr-expanded' : ''}`}>
                          <td className="ld-td">
                            <button
                              className="ld-contact-cell"
                              onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                              aria-expanded={isExpanded}
                              title={isExpanded ? 'Collapse message' : 'Expand to read message'}
                            >
                              <div className="ld-avatar">{lead.name.charAt(0).toUpperCase()}</div>
                              <div className="ld-contact-info">
                                <span className="ld-contact-name">{lead.name}</span>
                                <span className="ld-contact-email">{lead.email}</span>
                              </div>
                              <span className="ld-expand-arrow">{isExpanded ? '▴' : '▾'}</span>
                            </button>
                          </td>
                          <td className="ld-td">
                            <span className="ld-budget-badge">
                              {BUDGET_LABELS[lead.budget] || lead.budget}
                            </span>
                          </td>
                          <td className="ld-td">
                            <span className={`ld-status-badge ${meta.className}`}>{meta.label}</span>
                          </td>
                          <td className="ld-td ld-td-time">
                            <span title={new Date(lead.createdAt).toLocaleString()}>{timeAgo(lead.createdAt)}</span>
                          </td>
                          <td className="ld-td ld-td-action">
                            <button
                              id={`status-btn-${lead.id}`}
                              onClick={() => cycleStatus(lead)}
                              disabled={isUpdating}
                              className={`ld-btn ld-btn-cycle ld-btn-sm ${isUpdating ? 'ld-btn-loading' : ''}`}
                              title={`Change status to ${STATUS_CYCLE[lead.status]}`}
                            >
                              {isUpdating ? <span className="ld-spinner ld-spinner-sm" /> : meta.next}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${lead.id}-expanded`} className="ld-tr-message">
                            <td colSpan={5} className="ld-td-message">
                              <div className="ld-message-bubble">
                                <span className="ld-message-label">Project Brief</span>
                                <p className="ld-message-text">{lead.message}</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="ld-footer">
        <div className="ld-container">
          <div className="ld-footer-inner">
            <p className="ld-footer-credit">
              Built for{' '}
              <a
                href="https://digitalheroesco.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ld-footer-link"
              >
                Digital Heroes Training Task
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
