import React, { useState, useEffect } from 'react';
import { Search, Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, XCircle, Copy, ServerOff } from 'lucide-react';
import { getJobResults, getDownloadUrl } from '../services/api';

const STATUS_BADGES = {
  'Valid': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'Business Email': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  'Free Provider': 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  'Invalid Format': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  'Invalid Domain': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  'No MX Record': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'Disposable': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'Duplicate': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  'Role Account': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
};

const ROW_HIGHLIGHTS = {
  'Valid': 'bg-emerald-950/20 hover:bg-emerald-900/30 border-l-4 border-l-emerald-500',
  'Business Email': 'bg-emerald-950/20 hover:bg-emerald-900/30 border-l-4 border-l-emerald-500',
  'Free Provider': 'bg-emerald-950/20 hover:bg-emerald-900/30 border-l-4 border-l-emerald-500',
  'Invalid Format': 'bg-rose-950/40 hover:bg-rose-900/50 border-l-4 border-l-rose-500',
  'Invalid Domain': 'bg-rose-950/40 hover:bg-rose-900/50 border-l-4 border-l-rose-500',
  'No MX Record': 'bg-amber-950/30 hover:bg-amber-900/40 border-l-4 border-l-amber-500',
  'Disposable': 'bg-yellow-950/30 hover:bg-yellow-900/40 border-l-4 border-l-yellow-500',
  'Duplicate': 'bg-purple-950/30 hover:bg-purple-900/40 border-l-4 border-l-purple-500',
  'Role Account': 'bg-indigo-950/20 hover:bg-indigo-900/30 border-l-4 border-l-indigo-500',
};

export default function EmailTable({ jobId }) {
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchResults = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const data = await getJobResults(jobId, page, 25, statusFilter, searchQuery);
      setResults(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Failed to load email results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [jobId, page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResults();
  };

  if (!jobId) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl my-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-100">Verification Report Details</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Showing {totalCount.toLocaleString()} total verified email rows (Invalid rows highlighted in red)
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3">
          <a
            href={getDownloadUrl(jobId, 'csv')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20"
          >
            <FileText className="w-4 h-4" /> Download CSV
          </a>
          <a
            href={getDownloadUrl(jobId, 'excel')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" /> Download Highlighted Excel
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search email, domain, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Statuses</option>
          <option value="Valid">Valid</option>
          <option value="Business Email">Business Email</option>
          <option value="Free Provider">Free Provider</option>
          <option value="Invalid Format">Invalid Format</option>
          <option value="Invalid Domain">Invalid Domain</option>
          <option value="No MX Record">No MX Record</option>
          <option value="Disposable">Disposable</option>
          <option value="Duplicate">Duplicate</option>
          <option value="Role Account">Role Account</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/90 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">#</th>
              <th className="py-3.5 px-4">Original Email</th>
              <th className="py-3.5 px-4">Quality</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Domain</th>
              <th className="py-3.5 px-4">MX Record</th>
              <th className="py-3.5 px-4">Details / Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-500">
                  Loading verification results...
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-500">
                  No matching email records found.
                </td>
              </tr>
            ) : (
              results.map((rec) => {
                const badgeStyle = STATUS_BADGES[rec.status] || 'bg-slate-800 text-slate-300 border-slate-700';
                const rowStyle = ROW_HIGHLIGHTS[rec.status] || 'hover:bg-slate-800/40';
                const isValid = ['Valid', 'Business Email', 'Free Provider'].includes(rec.status);

                return (
                  <tr key={rec.id} className={`${rowStyle} transition-colors`}>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{rec.row_index + 1}</td>
                    <td className="py-3 px-4 font-medium text-slate-100">{rec.original_email}</td>
                    <td className="py-3 px-4">
                      {isValid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          VALID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          INVALID
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-400">{rec.domain || '-'}</td>
                    <td className="py-3 px-4">
                      {rec.has_mx_record ? (
                        <span className="text-xs font-medium text-emerald-400">Yes</span>
                      ) : (
                        <span className="text-xs font-medium text-rose-400">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300">{rec.reason}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
