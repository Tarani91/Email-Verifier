import React from 'react';
import { Loader2, CheckCircle2, AlertOctagon, Mail } from 'lucide-react';

export default function ProgressTracker({ jobStatus }) {
  if (!jobStatus) return null;

  const {
    filename,
    total_emails,
    processed_emails,
    progress_percentage,
    status,
    error_message
  } = jobStatus;

  return (
    <div className="w-full max-w-4xl mx-auto my-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-100">{filename}</h4>
            <p className="text-slate-400 text-xs">
              {processed_emails?.toLocaleString()} of {total_emails?.toLocaleString()} emails processed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'processing' && (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verification in Progress
            </span>
          )}
          {status === 'completed' && (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          )}
          {status === 'failed' && (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertOctagon className="w-3.5 h-3.5" /> Failed
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-medium">
          <span className="text-slate-400">Verification Progress</span>
          <span className="text-sky-400 font-bold">{progress_percentage}%</span>
        </div>
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-lg shadow-sky-500/30"
            style={{ width: `${progress_percentage}%` }}
          />
        </div>
      </div>

      {error_message && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
          Error: {error_message}
        </div>
      )}
    </div>
  );
}
