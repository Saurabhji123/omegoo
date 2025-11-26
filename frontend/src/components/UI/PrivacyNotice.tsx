/**
 * Privacy Notice Component
 * Compact banner explaining shadow login guest tracking
 * Provides "Delete my data" link for GDPR compliance
 */

import React, { useState, useEffect } from 'react';
import { useGuest } from '../../contexts/GuestContext';
import { guestAPI } from '../../services/api';

const PrivacyNotice: React.FC = () => {
  const { guestId, deleteGuestData } = useGuest();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the notice before
    const dismissed = localStorage.getItem('privacy_notice_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('privacy_notice_dismissed', 'true');
  };

  const handleDeleteData = async () => {
    if (!guestId) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete all your guest data? This action cannot be undone. You will be assigned a new guest ID on your next visit.'
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      // Delete guest data from server
      await guestAPI.deleteGuestData(guestId);

      // Delete local guest data
      deleteGuestData();

      alert('Your guest data has been deleted successfully. You will be assigned a new guest ID on reload.');

      // Reload page to generate new guest ID
      window.location.reload();
    } catch (error) {
      console.error('[PrivacyNotice] Delete failed:', error);
      alert('Failed to delete guest data. Please try again.');
      setIsDeleting(false);
    }
  };

  if (isDismissed || !guestId) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 backdrop-blur-sm" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm text-white/90">
            We use anonymous device fingerprinting to provide a seamless experience. 
            No personal data is collected.{' '}
            <button
              onClick={handleDeleteData}
              disabled={isDeleting}
              className="text-blue-300 hover:text-blue-200 underline font-medium transition disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete my data'}
            </button>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <a
            href="/privacy-policy"
            className="text-xs text-white/70 hover:text-white transition"
          >
            Privacy Policy
          </a>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition"
            aria-label="Dismiss privacy notice"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyNotice;
