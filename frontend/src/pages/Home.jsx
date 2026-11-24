import React, { useState, useEffect, useRef } from 'react';
import FileUploader from '../components/FileUploader';
import DataPreviewModal from '../components/DataPreviewModal';
import ProgressTracker from '../components/ProgressTracker';
import MetricCards from '../components/MetricCards';
import DashboardCharts from '../components/DashboardCharts';
import EmailTable from '../components/EmailTable';

import { uploadFile, startVerification, getJobStatus, getErrorMessage } from '../services/api';

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const pollTimerRef = useRef(null);

  const handleFileSelected = async (file) => {
    setIsUploading(true);
    setUploadError('');
    try {
      const data = await uploadFile(file);
      setPreviewData(data);
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadError(getErrorMessage(err, 'Failed to upload file'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartVerification = async () => {
    if (!previewData) return;
    setIsStarting(true);
    setUploadError('');
    try {
      const res = await startVerification(previewData.job_id);
      setActiveJobId(previewData.job_id);
      setPreviewData(null);
      fetchStatus(previewData.job_id);
    } catch (err) {
      console.error('Start verification failed:', err);
      setUploadError(getErrorMessage(err, 'Failed to start verification job'));
    } finally {
      setIsStarting(false);
    }
  };

  const fetchStatus = async (jobId) => {
    try {
      const status = await getJobStatus(jobId);
      setJobStatus(status);
      
      // Continue polling if the job is still pending or actively processing
      if (status.status === 'pending' || status.status === 'processing') {
        pollTimerRef.current = setTimeout(() => fetchStatus(jobId), 1500);
      }
    } catch (err) {
      console.error('Failed to fetch job status:', err);
      // Auto-retry after 3s on transient network/HTTP error instead of killing polling
      pollTimerRef.current = setTimeout(() => fetchStatus(jobId), 3000);
    }
  };

  useEffect(() => {
    if (activeJobId) {
      fetchStatus(activeJobId);
    }
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [activeJobId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-sky-400 tracking-tight">
          Enterprise Email Verification
        </h1>
        <p className="text-slate-400 text-base sm:text-lg">
          Clean lists, boost deliverability, remove bounce risks, and preserve invalid records with detailed status reports.
        </p>
      </div>

      {/* File Upload Section */}
      {!activeJobId && (
        <FileUploader
          onFileSelected={handleFileSelected}
          isUploading={isUploading}
          serverError={uploadError}
          onClearError={() => setUploadError('')}
        />
      )}

      {/* Preview Modal */}
      {previewData && (
        <DataPreviewModal
          previewData={previewData}
          onConfirm={handleStartVerification}
          onCancel={() => setPreviewData(null)}
          isStarting={isStarting}
        />
      )}

      {/* Verification Active Section */}
      {activeJobId && jobStatus && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-sm font-semibold text-slate-300">
              Active Job ID: <span className="font-mono text-sky-400">{activeJobId}</span>
            </span>
            <button
              onClick={() => {
                setActiveJobId(null);
                setJobStatus(null);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Verify Another File
            </button>
          </div>

          <ProgressTracker jobStatus={jobStatus} />

          <MetricCards stats={jobStatus.stats} total={jobStatus.total_emails} />

          <DashboardCharts stats={jobStatus.stats} />

          <EmailTable jobId={activeJobId} processedCount={jobStatus.processed_emails} />
        </div>
      )}
    </div>
  );
}
