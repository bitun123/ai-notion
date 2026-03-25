import React, { useState, useRef } from 'react';
import { uploadPdf } from '../api';

const TABS = [
  { id: 'url',   label: 'Paste URL',    icon: '🔗' },
  { id: 'video', label: 'Video',        icon: '🎬' },
  { id: 'pdf',   label: 'Upload PDF',   icon: '📄' },
];

const SaveInput = ({ onSave }) => {
  const [activeTab, setActiveTab] = useState('url');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // ── URL / Video submit ─────────────────────────────────────────────────────
  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    try {
      await onSave(url.trim());
      setUrl('');
      showSuccess('Saved! Content is being processed in the background.');
    } catch {
      // error handled by parent
    } finally {
      setLoading(false);
    }
  };

  // ── PDF upload submit ──────────────────────────────────────────────────────
  const handlePdfSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) return;
    setPdfError('');
    setLoading(true);
    try {
      await uploadPdf(pdfFile);
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showSuccess('PDF uploaded! Content extracted and processing.');
      await onSave(null); // trigger list refresh without URL
    } catch (err) {
      setPdfError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setPdfError('Only PDF files are supported.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setPdfError('File too large. Max 20 MB.');
      return;
    }
    setPdfError('');
    setPdfFile(file);
  };

  return (
    <div className="max-w-2xl mx-auto mb-12">
      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mb-3 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setUrl(''); setPdfFile(null); setPdfError(''); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* URL Tab */}
      {(activeTab === 'url' || activeTab === 'video') && (
        <form
          onSubmit={handleUrlSubmit}
          className="flex gap-2 p-2 bg-white rounded-2xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
        >
          <input
            type="url"
            placeholder={activeTab === 'video'
              ? 'Paste a YouTube, Vimeo, or video URL...'
              : 'Paste any URL — article, PDF link, or image...'}
            className="flex-1 px-4 py-2 outline-none text-slate-700 bg-transparent text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      {/* PDF Upload Tab */}
      {activeTab === 'pdf' && (
        <form
          onSubmit={handlePdfSubmit}
          className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
        >
          <label
            htmlFor="pdf-file-input"
            className={`flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              pdfFile
                ? 'border-indigo-300 bg-indigo-50/50'
                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
            }`}
          >
            <span className="text-3xl">{pdfFile ? '📄' : '⬆️'}</span>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">
                {pdfFile ? pdfFile.name : 'Click to select a PDF'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {pdfFile
                  ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB`
                  : 'PDF files up to 20 MB'}
              </p>
            </div>
          </label>
          <input
            id="pdf-file-input"
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {pdfError && (
            <p className="mt-2 text-xs text-red-500 font-medium">{pdfError}</p>
          )}

          <button
            type="submit"
            disabled={!pdfFile || loading}
            className="mt-3 w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40"
          >
            {loading ? 'Uploading & Extracting…' : 'Upload PDF'}
          </button>
        </form>
      )}

      {/* Success toast */}
      {success && (
        <div className="mt-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl flex items-center gap-2">
          <span>✅</span> {success}
        </div>
      )}
    </div>
  );
};

export default SaveInput;
