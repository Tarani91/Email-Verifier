import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, AlertCircle } from 'lucide-react';

export default function FileUploader({ onFileSelected, isUploading, serverError, onClearError }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validateFile = (file) => {
    setError('');
    if (onClearError) onClearError();
    if (!file) return false;
    
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidExt) {
      setError('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)');
      return false;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 50 MB.');
      return false;
    }

    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer bg-slate-900/60 backdrop-blur-sm ${
          dragActive
            ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
            : 'border-slate-700 hover:border-sky-500/50 hover:bg-slate-800/40'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="p-4 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <UploadCloud className="w-10 h-10 animate-bounce" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-100 mb-2">
          Drag & Drop your Email List here
        </h3>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
          Upload CSV or Excel files up to 100,000+ emails. Automatic header detection, duplicate removal, and DNS verification.
        </p>

        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg">
            <FileText className="w-4 h-4 text-emerald-400" /> .CSV
          </span>
          <span className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> .XLSX / .XLS
          </span>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <div className="flex items-center gap-3 text-sky-400 font-medium">
              <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
              Uploading & Parsing File...
            </div>
          </div>
        )}
      </div>

      {(error || serverError) && (
        <div className="mt-4 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm shadow-lg backdrop-blur-md">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span className="font-medium">{error || serverError}</span>
        </div>
      )}
    </div>
  );
}
