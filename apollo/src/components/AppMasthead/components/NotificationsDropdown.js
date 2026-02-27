import React, { useState, useEffect, useCallback } from 'react';
import { Button, Spinner } from '@patternfly/react-core';
import { BellIcon, SyncAltIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';

const CHECK_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours — match server-side

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const NotificationsDropdown = ({
  isOpen,
  onToggle,
  notificationsPanelRef,
  notificationsButtonRef
}) => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/updates/status');
      const data = await res.json();
      if (data.success) {
        setUpdateInfo(data);
      }
    } catch {
      // Silently ignore — server may not be reachable
    }
  }, []);

  const triggerCheck = useCallback(async () => {
    setLoading(true);
    setApplyResult(null);
    try {
      const res = await fetch('/api/updates/check', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setUpdateInfo(data);
        setDismissed(false);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    setApplying(true);
    setApplyResult(null);
    try {
      const res = await fetch('/api/updates/apply', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setApplyResult({ success: true, message: data.message });
        // Refresh status
        fetchStatus();
      } else {
        setApplyResult({ success: false, message: data.error });
      }
    } catch (err) {
      setApplyResult({ success: false, message: err.message });
    } finally {
      setApplying(false);
    }
  }, [fetchStatus]);

  // Fetch cached status on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll for status periodically (matches server check interval)
  useEffect(() => {
    const interval = setInterval(fetchStatus, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Also re-fetch when the panel is opened
  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen, fetchStatus]);

  const hasUpdate = updateInfo?.available && !dismissed;

  return (
    <div className="notifications-wrapper">
      <Button 
        ref={notificationsButtonRef}
        variant="plain" 
        aria-label="Notifications"
        onClick={onToggle}
        icon={<BellIcon />}
        className={isOpen ? 'notifications-button-active' : ''}
      />
      {hasUpdate && (
        <span className="notifications-badge">1</span>
      )}
      {isOpen && (
        <div ref={notificationsPanelRef} className="notifications-panel">
          <div className="notifications-panel-header">
            <span className="notifications-panel-title">Notifications</span>
            <Button
              variant="link"
              isInline
              className="notifications-mark-read"
              onClick={triggerCheck}
              isDisabled={loading}
              icon={loading ? <Spinner size="sm" /> : <SyncAltIcon />}
            >
              {loading ? 'Checking...' : 'Check now'}
            </Button>
          </div>
          <div className="notifications-panel-list">
            {/* Apply result message */}
            {applyResult && (
              <div className={`notifications-item ${applyResult.success ? 'notifications-update-success' : 'notifications-update-error'}`}>
                <div className="notifications-item-content">
                  <div className="notifications-item-title">
                    {applyResult.success ? 'Update applied' : 'Update failed'}
                  </div>
                  <div className="notifications-item-description">
                    {applyResult.message}
                  </div>
                </div>
              </div>
            )}

            {/* Update available notification */}
            {hasUpdate && (
              <div className="notifications-item notifications-item-unread">
                <div className="notifications-item-content">
                  <div className="notifications-item-title">
                    Update available for KendraUXDapp
                  </div>
                  <div className="notifications-item-description">
                    A newer version of KendraUXDapp is available with improvements and fixes.
                  </div>
                  <div className="notifications-update-actions">
                    <Button
                      variant="link"
                      isInline
                      icon={<ExternalLinkAltIcon />}
                      iconPosition="end"
                      onClick={() => window.open(updateInfo.changelogUrl, '_blank')}
                      size="sm"
                    >
                      View changes
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={applyUpdate}
                      isDisabled={applying}
                      isLoading={applying}
                    >
                      {applying ? 'Updating...' : 'Update'}
                    </Button>
                  </div>
                </div>
                <span className="notifications-unread-dot" />
              </div>
            )}

            {/* No updates state */}
            {!hasUpdate && !applyResult && (
              <div className="notifications-empty">
                <div className="notifications-empty-icon">
                  <BellIcon />
                </div>
                <div className="notifications-empty-text">
                  KendraUXDapp is up to date
                </div>
                {updateInfo?.lastChecked && (
                  <div className="notifications-empty-time">
                    Last checked {timeAgo(updateInfo.lastChecked)}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="notifications-panel-footer">
            {hasUpdate ? (
              <Button variant="link" isInline onClick={() => setDismissed(true)}>
                Dismiss
              </Button>
            ) : (
              <span className="notifications-footer-hint">
                Checks automatically 3× daily
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
