import React from 'react';
import { FileText, Play, X } from 'lucide-react';

export default function DataPreviewModal({ previewData, onConfirm, onCancel, isStarting }) {
  if (!previewData) return null;

  const { filename, detected_column, total_emails, preview } = previewData;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{filename}</h3>
              <p className="text-slate-400 text-xs">
                Detected Column: <span className="font-mono text-sky-400 font-semibold">{detected_column}</span> • {total_emails.toLocaleString()} total rows
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Sample Preview Table */}
        <div className="p-6">
          <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-3">
            Sample Preview (First {preview.length} rows)
          </h4>
          <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/50">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Email Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {preview.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-500 font-mono">{item.row_index + 1}</td>
                    <td className="py-2 px-3 font-medium text-slate-200">{item.original_email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={onCancel}
            disabled={isStarting}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isStarting}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50"
          >
            {isStarting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> Start Verification
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
