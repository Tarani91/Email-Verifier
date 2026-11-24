import React, { useState, useEffect, useCallback } from 'react';
import {
  BookMarked, Plus, Trash2, Search, ChevronLeft, ChevronRight,
  Upload, AlertCircle, CheckCircle2, XCircle, RefreshCw, Info
} from 'lucide-react';
import {
  addKnownEmails, getKnownEmails, getKnownEmailStats,
  deleteKnownEmail, clearKnownEmails
} from '../services/api';

export default function KnownEmails() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [statsTotal, setStatsTotal] = useState(0);

  // Add panel state
  const [bulkText, setBulkText] = useState('');
  const [label, setLabel] = useState('');
  const [addResult, setAddResult] = useState(null);
  const [adding, setAdding] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, stats] = await Promise.all([
        getKnownEmails(page, 50, search),
        getKnownEmailStats()
      ]);
      setRecords(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
      setStatsTotal(stats.total || 0);
    } catch (err) {
      console.error('Failed to load known emails:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    const lines = bulkText
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (!lines.length) return;

    setAdding(true);
    setAddResult(null);
    try {
      const payload = lines.map(email => ({ email, label: label.trim() || undefined }));
      const result = await addKnownEmails(payload);
      setAddResult(result);
      setBulkText('');
      setLabel('');
      fetchData();
    } catch (err) {
      setAddResult({ error: err?.response?.data?.detail || 'Failed to add emails.' });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteKnownEmail(id);
      fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleClear = async () => {
    try {
      await clearKnownEmails();
      setClearConfirm(false);
      fetchData();
    } catch (err) {
      console.error('Clear failed:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-tr from-violet-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-violet-500/20">
          <BookMarked className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Known Emails Registry</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Add emails you already own or have used — they'll be flagged as{' '}
            <span className="text-violet-400 font-semibold">Known Duplicate</span> in future checks.
          </p>
        </div>
        <div className="ml-auto bg-violet-500/10 border border-violet-500/20 rounded-xl px-5 py-3 text-center">
          <div className="text-2xl font-bold text-violet-400">{statsTotal.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total Known Emails</div>
        </div>
      </div>

      {/* Add Emails Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-100 mb-1 flex items-center gap-2">
          <Plus className="w-5 h-5 text-violet-400" /> Add Known Emails
        </h2>
        <p className="text-slate-400 text-xs mb-4">
          Paste one email per line, or separate with commas / semicolons. All will be added to the registry.
        </p>

        <div className="space-y-3">
          <textarea
            rows={5}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`john@company.com\njane@example.com\nalice@domain.org`}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-violet-500 transition-colors resize-y"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Optional label / note (e.g. 'Campaign 2024', 'CRM export')"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !bulkText.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-violet-500/25"
            >
              {adding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {adding ? 'Adding...' : 'Add to Registry'}
            </button>
          </div>
        </div>

        {/* Result Banner */}
        {addResult && (
          <div className={`mt-4 rounded-xl px-4 py-3 text-sm flex items-start gap-3 border ${
            addResult.error
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            {addResult.error
              ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            }
            <div>
              {addResult.error
                ? addResult.error
                : (
                  <>
                    <span className="font-semibold">{addResult.added} email{addResult.added !== 1 ? 's' : ''} added</span>
                    {addResult.skipped > 0 && <span className="text-emerald-400/70"> · {addResult.skipped} already in registry</span>}
                    {addResult.invalid?.length > 0 && (
                      <div className="text-rose-300/80 mt-1">
                        {addResult.invalid.length} invalid (skipped): {addResult.invalid.join(', ')}
                      </div>
                    )}
                  </>
                )
              }
            </div>
          </div>
        )}
      </div>

      {/* Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Registry</h2>
            <p className="text-slate-500 text-xs mt-0.5">{total.toLocaleString()} email{total !== 1 ? 's' : ''} in registry</p>
          </div>
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </form>
            {!clearConfirm ? (
              <button
                onClick={() => setClearConfirm(true)}
                disabled={total === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-medium text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-400">Sure?</span>
                <button onClick={handleClear} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg">Yes, clear</button>
                <button onClick={() => setClearConfirm(false)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg">Cancel</button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/90 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Label / Note</th>
                <th className="py-3.5 px-4">Added At</th>
                <th className="py-3.5 px-4">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan="5" className="py-12 text-center text-slate-500">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Info className="w-8 h-8 opacity-40" />
                      <span>No known emails in registry yet.</span>
                      <span className="text-xs text-slate-600">Add emails above — they'll be flagged when found in future checks.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{(page - 1) * 50 + idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-slate-100">{rec.original_email}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {rec.label
                        ? <span className="inline-block bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-full px-2.5 py-0.5">{rec.label}</span>
                        : <span className="text-slate-600">—</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                      {new Date(rec.added_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Remove from registry"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
