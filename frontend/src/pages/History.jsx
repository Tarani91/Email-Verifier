import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, FileText, FileSpreadsheet, CheckCircle2, Clock, AlertOctagon } from 'lucide-react';
import { getJobHistory, getDownloadUrl } from '../services/api';

export default function History({ onSelectJob }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getJobHistory();
      setJobs(data || []);
    } catch (err) {
      console.error('Failed to load job history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Verification History</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Access and download past email verification reports
            </p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
        >
          Refresh List
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-5">Filename</th>
                <th className="py-4 px-5">Date Created</th>
                <th className="py-4 px-5">Total Emails</th>
                <th className="py-4 px-5">Valid / Invalid</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    Loading job history...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No verification jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.job_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-5 font-semibold text-slate-100">{job.filename}</td>
                    <td className="py-4 px-5 text-xs text-slate-400">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-slate-200">
                      {job.total_emails.toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-xs">
                      <span className="text-emerald-400 font-semibold">{job.stats?.valid || 0}</span>
                      <span className="text-slate-600 font-bold mx-1">/</span>
                      <span className="text-rose-400 font-semibold">{job.stats?.invalid || 0}</span>
                    </td>
                    <td className="py-4 px-5">
                      {job.status === 'completed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      )}
                      {job.status === 'processing' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          <Clock className="w-3 h-3 animate-spin" /> Processing
                        </span>
                      )}
                      {job.status === 'failed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertOctagon className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={getDownloadUrl(job.job_id, 'csv')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-medium rounded-lg transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" /> CSV
                        </a>
                        <a
                          href={getDownloadUrl(job.job_id, 'excel')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-medium rounded-lg transition-all"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
