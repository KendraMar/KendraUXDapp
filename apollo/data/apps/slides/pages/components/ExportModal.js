import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  Popper,
  MenuToggle,
  Alert,
  Progress,
  ProgressSize
} from '@patternfly/react-core';
import {
  FileCodeIcon,
  FilePdfIcon,
  FileImageIcon,
  GoogleIcon,
  ExportIcon
} from '@patternfly/react-icons';

const ExportModal = ({ slideDeckId, slideDeckTitle, isExporting, setIsExporting }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState({ show: false, message: '', percent: 0 });
  const [exportError, setExportError] = useState(null);
  const [googleSlidesStatus, setGoogleSlidesStatus] = useState(null);
  const exportMenuRef = useRef(null);
  const exportToggleRef = useRef(null);

  // Check Google Slides connection status
  const checkGoogleSlidesStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/slides/google/status');
      const data = await response.json();
      setGoogleSlidesStatus(data);
    } catch (err) {
      console.error('Error checking Google Slides status:', err);
    }
  }, []);

  useEffect(() => {
    checkGoogleSlidesStatus();
  }, [checkGoogleSlidesStatus]);

  const handleExportHtml = async () => {
    setIsExportMenuOpen(false);
    setExportProgress({ show: true, message: 'Generating HTML...', percent: 50 });
    
    try {
      const link = document.createElement('a');
      link.href = `/api/slides/${slideDeckId}/export/html`;
      link.download = `${slideDeckTitle || 'presentation'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportProgress({ show: true, message: 'Download started!', percent: 100 });
      setTimeout(() => setExportProgress({ show: false, message: '', percent: 0 }), 2000);
    } catch (err) {
      console.error('Export HTML error:', err);
      setExportError('Failed to export HTML: ' + err.message);
      setExportProgress({ show: false, message: '', percent: 0 });
    }
  };

  const handleExportPdf = async () => {
    setIsExportMenuOpen(false);
    setIsExporting(true);
    setExportProgress({ show: true, message: 'Generating PDF (this may take a moment)...', percent: 30 });
    
    try {
      const response = await fetch(`/api/slides/${slideDeckId}/export/pdf`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF');
      }
      
      setExportProgress({ show: true, message: 'Downloading...', percent: 80 });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slideDeckTitle || 'presentation'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setExportProgress({ show: true, message: 'PDF downloaded!', percent: 100 });
      setTimeout(() => setExportProgress({ show: false, message: '', percent: 0 }), 2000);
    } catch (err) {
      console.error('Export PDF error:', err);
      setExportError('Failed to export PDF: ' + err.message);
      setExportProgress({ show: false, message: '', percent: 0 });
    }
    setIsExporting(false);
  };

  const handleExportPng = async () => {
    setIsExportMenuOpen(false);
    setIsExporting(true);
    setExportProgress({ show: true, message: 'Generating PNG images...', percent: 20 });
    
    try {
      const response = await fetch(`/api/slides/${slideDeckId}/export/png`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate PNG images');
      }
      
      setExportProgress({ show: true, message: `Downloading ${data.images.length} images...`, percent: 60 });
      
      // Download each image
      for (let i = 0; i < data.images.length; i++) {
        const image = data.images[i];
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${image.data}`;
        link.download = image.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Small delay between downloads
        if (i < data.images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        setExportProgress({
          show: true,
          message: `Downloaded ${i + 1} of ${data.images.length} images...`,
          percent: 60 + ((i + 1) / data.images.length) * 40
        });
      }
      
      setExportProgress({ show: true, message: `${data.images.length} PNG images downloaded!`, percent: 100 });
      setTimeout(() => setExportProgress({ show: false, message: '', percent: 0 }), 2000);
    } catch (err) {
      console.error('Export PNG error:', err);
      setExportError('Failed to export PNG: ' + err.message);
      setExportProgress({ show: false, message: '', percent: 0 });
    }
    setIsExporting(false);
  };

  const handleExportGoogleSlides = async () => {
    setIsExportMenuOpen(false);
    
    // Check if Google Slides is configured
    if (!googleSlidesStatus?.configured) {
      // Open OAuth flow in new window
      window.open('/api/slides/google/oauth/authorize', '_blank', 'width=600,height=700');
      setExportError('Please authorize Google Slides access in the popup window, then try exporting again.');
      return;
    }
    
    setIsExporting(true);
    setExportProgress({ show: true, message: 'Creating Google Slides presentation...', percent: 30 });
    
    try {
      const response = await fetch(`/api/slides/${slideDeckId}/export/google-slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to export to Google Slides');
      }
      
      setExportProgress({ show: true, message: 'Presentation created! Opening...', percent: 100 });
      
      // Open the new presentation
      window.open(data.url, '_blank');
      
      setTimeout(() => setExportProgress({ show: false, message: '', percent: 0 }), 2000);
    } catch (err) {
      console.error('Export Google Slides error:', err);
      setExportError('Failed to export to Google Slides: ' + err.message);
      setExportProgress({ show: false, message: '', percent: 0 });
    }
    setIsExporting(false);
  };

  const exportMenu = (
    <Menu ref={exportMenuRef} onSelect={() => setIsExportMenuOpen(false)}>
      <MenuContent>
        <MenuList>
          <MenuItem 
            icon={<FileCodeIcon />}
            onClick={handleExportHtml}
            description="Self-contained HTML file with embedded styles"
          >
            Standalone HTML
          </MenuItem>
          <MenuItem 
            icon={<FilePdfIcon />}
            onClick={handleExportPdf}
            description="Export all slides as a PDF document"
          >
            PDF Document
          </MenuItem>
          <MenuItem 
            icon={<FileImageIcon />}
            onClick={handleExportPng}
            description="Export each slide as a PNG image"
          >
            PNG Images
          </MenuItem>
          <MenuItem 
            icon={<GoogleIcon />}
            onClick={handleExportGoogleSlides}
            description={googleSlidesStatus?.configured ? 'Create a new Google Slides presentation' : 'Connect Google account to export'}
          >
            Google Slides {!googleSlidesStatus?.configured && '(Connect)'}
          </MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <>
      <Popper
        trigger={
          <MenuToggle
            ref={exportToggleRef}
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            isExpanded={isExportMenuOpen}
            isDisabled={isExporting}
            variant="secondary"
          >
            <ExportIcon /> Export
          </MenuToggle>
        }
        popper={exportMenu}
        isVisible={isExportMenuOpen}
        onDocumentClick={(event) => {
          if (!exportToggleRef.current?.contains(event.target) && 
              !exportMenuRef.current?.contains(event.target)) {
            setIsExportMenuOpen(false);
          }
        }}
      />
      {(exportProgress.show || exportError) && (
        <div style={{ marginTop: '0.5rem' }}>
          {exportError && (
            <Alert 
              variant="danger" 
              title="Export Error" 
              isInline 
              actionClose={<button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setExportError(null)}>×</button>}
              style={{ marginBottom: exportProgress.show ? '0.5rem' : 0 }}
            >
              {exportError}
            </Alert>
          )}
          {exportProgress.show && (
            <Progress
              value={exportProgress.percent}
              title={exportProgress.message}
              size={ProgressSize.sm}
            />
          )}
        </div>
      )}
    </>
  );
};

export default ExportModal;
