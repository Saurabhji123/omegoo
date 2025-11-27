import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

// Use production URL when deployed, localhost only for local dev
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_URL = isLocalhost ? 'http://localhost:3001' : 'https://omegoo-api-clean.onrender.com';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  reportedUserId: string;
  reporterUserId: string;
  chatMode: 'text' | 'audio' | 'video';
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  reportedUserId,
  reporterUserId,
  chatMode
}) => {
  const [violationType, setViolationType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const violationTypes = [
    { value: 'harassment', label: '🚫 Harassment or Bullying' },
    { value: 'inappropriate_content', label: '⚠️ Inappropriate Content' },
    { value: 'spam', label: '📧 Spam or Advertising' },
    { value: 'hate_speech', label: '💬 Hate Speech' },
    { value: 'violence', label: '🔪 Violence or Threats' },
    { value: 'sexual_content', label: '🔞 Sexual Content' },
    { value: 'fake_profile', label: '👤 Fake Profile' },
    { value: 'other', label: '📝 Other' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!violationType || !description.trim()) {
      alert('Please select a violation type and provide a description');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/api/reports/create`, {
        sessionId,
        reportedUserId,
        reporterUserId,
        violationType,
        description: description.trim(),
        chatMode
      });

      if (response.data.success) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Failed to submit report:', error);
      alert(error.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setViolationType('');
    setDescription('');
    setSubmitted(false);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="rounded-2xl shadow-2xl max-w-md w-full border border-white border-opacity-20 overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
        {/* Header */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white border-opacity-20">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-bold text-white">Report User</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Report Submitted</h4>
              <p className="text-gray-300">Thank you for helping keep our community safe.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Info */}
              <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-40 rounded-lg p-3">
                <p className="text-sm text-yellow-200">
                  Reports are reviewed by our moderation team. False reports may result in action against your account.
                </p>
              </div>

              {/* Violation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Reason for Report <span className="text-red-400">*</span>
                </label>
                <select
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <option value="" className="bg-gray-800">Select a reason...</option>
                  {violationTypes.map((type) => (
                    <option key={type.value} value={type.value} className="bg-gray-800">
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Additional Details <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  disabled={loading}
                  rows={4}
                  placeholder="Please provide specific details about what happened..."
                  className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {description.length}/500 characters
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !violationType || !description.trim()}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
