import React from 'react';

const ExportModal = ({ isOpen, exportData, onClose, onCopy }) => {
  if (!isOpen) return null;

  return (
    <div 
      className={`moodboard-modal ${isOpen ? 'visible' : ''}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="moodboard-modal-content">
        <div className="moodboard-modal-header">
          <h2>Export Data</h2>
          <div>
            <button className="moodboard-modal-btn" onClick={onCopy}>
              Copy
            </button>
            <button className="moodboard-modal-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <pre>{exportData}</pre>
      </div>
    </div>
  );
};

export default ExportModal;
