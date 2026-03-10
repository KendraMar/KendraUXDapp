import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import html2canvas from 'html2canvas-pro';
import {
  Button,
  TextInput,
  TextArea,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Spinner
} from '@patternfly/react-core';
import {
  PencilAltIcon,
  HighlighterIcon,
  TimesIcon,
  SaveIcon,
  UndoIcon,
  FontIcon
} from '@patternfly/react-icons';

// Tool configurations
const TOOLS = {
  PENCIL: 'pencil',
  HIGHLIGHTER: 'highlighter',
  TEXT: 'text'
};

// Default font sizes for text tool
const FONT_SIZE_OPTIONS = [14, 18, 24, 32, 48];

// Default colors
const COLOR_OPTIONS = [
  '#FF0000', // Red
  '#FF6B00', // Orange
  '#FFD700', // Yellow
  '#00FF00', // Green
  '#00BFFF', // Blue
  '#8B00FF', // Purple
  '#FF1493', // Pink
  '#000000', // Black
  '#FFFFFF'  // White
];

const ScreenAnnotation = ({ isActive, onClose, onSave }) => {
  const canvasRef = useRef(null);
  const backgroundCanvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Tool state
  const [currentTool, setCurrentTool] = useState(TOOLS.PENCIL);
  const [currentColor, setCurrentColor] = useState('#FF0000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState([]);
  
  // Text annotations state
  const [textAnnotations, setTextAnnotations] = useState([]);
  const [activeTextInput, setActiveTextInput] = useState(null); // {id, x, y, text, fontSize}
  const [currentFontSize, setCurrentFontSize] = useState(24);
  const [resizingText, setResizingText] = useState(null); // {id, startY, startFontSize}
  const textInputRef = useRef(null);
  
  // Screenshot capture state
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [contentBounds, setContentBounds] = useState(null); // {top, left, width, height}
  
  // Save modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [screenshotTitle, setScreenshotTitle] = useState('');
  const [screenshotDescription, setScreenshotDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Capture the page background when annotation mode activates
  useEffect(() => {
    if (isActive && !backgroundImage) {
      captureBackground();
    }
  }, [isActive, backgroundImage]);

  // Setup canvas when background is ready
  useEffect(() => {
    if (backgroundImage && canvasRef.current && contentBounds) {
      const canvas = canvasRef.current;
      
      // Set canvas to match the content area dimensions
      canvas.width = contentBounds.width;
      canvas.height = contentBounds.height;
      
      // Only draw background if we have a real image (not fallback)
      if (backgroundImage !== 'fallback' && backgroundCanvasRef.current) {
        const bgCanvas = backgroundCanvasRef.current;
        
        // Set background canvas to match content area
        bgCanvas.width = contentBounds.width;
        bgCanvas.height = contentBounds.height;
        
        // Draw background image
        const bgCtx = bgCanvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          // Draw image scaled to fit the content area
          bgCtx.drawImage(img, 0, 0, contentBounds.width, contentBounds.height);
        };
        img.src = backgroundImage;
      }
    }
  }, [backgroundImage, contentBounds]);

  // Redraw all strokes and text annotations when they change
  useEffect(() => {
    if (canvasRef.current) {
      redrawCanvas();
    }
  }, [strokes, textAnnotations]);

  // Focus text input when it appears
  useEffect(() => {
    if (activeTextInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [activeTextInput]);

  const captureBackground = async () => {
    setIsCapturing(true);
    
    try {
      // Find the main content area (PatternFly page main)
      const mainContent = document.querySelector('.pf-v6-c-page__main') || 
                          document.querySelector('main') || 
                          document.body;
      
      // Get the bounds of the main content area
      const rect = mainContent.getBoundingClientRect();
      const bounds = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      };
      setContentBounds(bounds);
      
      // Hide the overlay visually but keep it in the DOM to preserve layout
      if (containerRef.current) {
        containerRef.current.style.visibility = 'hidden';
      }
      
      // Wait for the browser to paint
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Capture the full body and crop to content area
      // This avoids issues with capturing specific PatternFly elements
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scale: 1,
        // Crop to content area bounds
        x: bounds.left,
        y: bounds.top,
        width: bounds.width,
        height: bounds.height,
        // Ignore the annotation overlay element
        ignoreElements: (element) => {
          return element.classList && element.classList.contains('screen-annotation-overlay');
        }
      });
      
      const imageData = canvas.toDataURL('image/png');
      
      // Restore overlay visibility
      if (containerRef.current) {
        containerRef.current.style.visibility = 'visible';
      }
      
      // Validate that we got actual content (not just a blank canvas)
      if (imageData && imageData.length > 1000) {
        setBackgroundImage(imageData);
      } else {
        console.warn('Captured image appears to be empty, using fallback');
        setBackgroundImage('fallback');
      }
    } catch (error) {
      console.error('Error capturing background:', error);
      // Restore overlay visibility
      if (containerRef.current) {
        containerRef.current.style.visibility = 'visible';
      }
      // Set a placeholder so annotation mode still works
      setBackgroundImage('fallback');
    } finally {
      setIsCapturing(false);
    }
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all strokes
    strokes.forEach(stroke => {
      drawStroke(ctx, stroke);
    });
    
    // Draw current stroke if drawing
    if (currentStroke.length > 0) {
      drawStroke(ctx, {
        points: currentStroke,
        tool: currentTool,
        color: currentColor
      });
    }
    
    // Draw all text annotations
    textAnnotations.forEach(textAnnotation => {
      drawTextAnnotation(ctx, textAnnotation);
    });
  }, [strokes, currentStroke, currentTool, currentColor, textAnnotations]);

  const drawTextAnnotation = (ctx, annotation) => {
    ctx.font = `${annotation.fontSize}px "RedHatText", -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textBaseline = 'top';
    
    // Handle multi-line text
    const lines = annotation.text.split('\n');
    
    // Draw white outline first (stroke)
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    lines.forEach((line, index) => {
      ctx.strokeText(line, annotation.x, annotation.y + (index * annotation.fontSize * 1.2));
    });
    
    // Then draw the fill color on top
    ctx.fillStyle = annotation.color;
    lines.forEach((line, index) => {
      ctx.fillText(line, annotation.x, annotation.y + (index * annotation.fontSize * 1.2));
    });
  };

  const drawStroke = (ctx, stroke) => {
    if (stroke.points.length < 2) return;
    
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (stroke.tool === TOOLS.HIGHLIGHTER) {
      ctx.lineWidth = 20;
      ctx.globalAlpha = 0.3;
    } else {
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1.0;
    }
    
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  };

  const getPointerPosition = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const pos = getPointerPosition(e);
    
    // Handle text tool differently
    if (currentTool === TOOLS.TEXT) {
      // If there's already an active text input, commit it first
      if (activeTextInput) {
        commitTextInput();
      }
      
      // Check if clicking on an existing text annotation for resizing
      const clickedAnnotation = findTextAnnotationAt(pos.x, pos.y);
      if (clickedAnnotation) {
        setResizingText({
          id: clickedAnnotation.id,
          startY: pos.y,
          startFontSize: clickedAnnotation.fontSize
        });
        return;
      }
      
      // Create new text input at click position
      const newTextInput = {
        id: `text-${Date.now()}`,
        x: pos.x,
        y: pos.y,
        text: '',
        fontSize: currentFontSize,
        color: currentColor
      };
      setActiveTextInput(newTextInput);
      return;
    }
    
    // Standard drawing behavior for other tools
    setIsDrawing(true);
    setCurrentStroke([pos]);
  };

  const findTextAnnotationAt = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    
    // Check each text annotation in reverse order (top-most first)
    for (let i = textAnnotations.length - 1; i >= 0; i--) {
      const annotation = textAnnotations[i];
      ctx.font = `${annotation.fontSize}px "RedHatText", -apple-system, BlinkMacSystemFont, sans-serif`;
      
      const lines = annotation.text.split('\n');
      const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
      const textHeight = lines.length * annotation.fontSize * 1.2;
      
      // Check if click is within the text bounds (with some padding)
      const padding = 10;
      if (
        x >= annotation.x - padding &&
        x <= annotation.x + textWidth + padding &&
        y >= annotation.y - padding &&
        y <= annotation.y + textHeight + padding
      ) {
        return annotation;
      }
    }
    return null;
  };

  const commitTextInput = () => {
    if (activeTextInput && activeTextInput.text.trim()) {
      setTextAnnotations(prev => [...prev, {
        id: activeTextInput.id,
        x: activeTextInput.x,
        y: activeTextInput.y,
        text: activeTextInput.text,
        fontSize: activeTextInput.fontSize,
        color: activeTextInput.color
      }]);
    }
    setActiveTextInput(null);
  };

  const handlePointerMove = (e) => {
    // Handle text resizing
    if (resizingText) {
      e.preventDefault();
      const pos = getPointerPosition(e);
      const deltaY = pos.y - resizingText.startY;
      const newFontSize = Math.max(12, Math.min(72, resizingText.startFontSize + deltaY / 2));
      
      setTextAnnotations(prev => prev.map(ann =>
        ann.id === resizingText.id
          ? { ...ann, fontSize: Math.round(newFontSize) }
          : ann
      ));
      return;
    }
    
    if (!isDrawing) return;
    e.preventDefault();
    
    const pos = getPointerPosition(e);
    setCurrentStroke(prev => [...prev, pos]);
    
    // Draw current stroke in real-time
    redrawCanvas();
  };

  const handlePointerUp = () => {
    // Finish text resizing
    if (resizingText) {
      setResizingText(null);
      return;
    }
    
    if (isDrawing && currentStroke.length > 0) {
      setStrokes(prev => [...prev, {
        points: currentStroke,
        tool: currentTool,
        color: currentColor
      }]);
      setCurrentStroke([]);
    }
    setIsDrawing(false);
  };

  const handleUndo = () => {
    // Undo last action (could be stroke or text annotation)
    // We'll undo the most recent action based on which was added last
    if (activeTextInput) {
      // If there's an active text input, cancel it
      setActiveTextInput(null);
      return;
    }
    
    // Compare last stroke and last text annotation timestamps (by position in array)
    // For simplicity, we'll check if there are more recent text annotations
    if (textAnnotations.length > 0 && strokes.length === 0) {
      setTextAnnotations(prev => prev.slice(0, -1));
    } else if (strokes.length > 0 && textAnnotations.length === 0) {
      setStrokes(prev => prev.slice(0, -1));
    } else if (strokes.length > 0 && textAnnotations.length > 0) {
      // Both exist - remove the most recent one
      // This is simplified; in a real app you'd track order
      setStrokes(prev => prev.slice(0, -1));
    }
  };

  const handleCancel = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setTextAnnotations([]);
    setActiveTextInput(null);
    setBackgroundImage(null);
    setContentBounds(null);
    onClose();
  };

  const handleSaveClick = () => {
    // Generate default title based on current URL
    const pagePath = window.location.pathname;
    const pageName = pagePath === '/' ? 'Home' : pagePath.replace(/^\//, '').replace(/-/g, ' ');
    setScreenshotTitle(`Screenshot of ${pageName}`);
    setIsSaveModalOpen(true);
  };

  const handleSaveConfirm = async () => {
    setIsSaving(true);
    
    try {
      // Use content bounds for the merged canvas dimensions
      const canvasWidth = contentBounds ? contentBounds.width : window.innerWidth;
      const canvasHeight = contentBounds ? contentBounds.height : window.innerHeight;
      
      // Create a merged canvas with background + annotations
      const mergedCanvas = document.createElement('canvas');
      mergedCanvas.width = canvasWidth;
      mergedCanvas.height = canvasHeight;
      const mergedCtx = mergedCanvas.getContext('2d');
      
      // Draw background
      if (backgroundImage && backgroundImage !== 'fallback') {
        const bgImg = new Image();
        await new Promise((resolve, reject) => {
          bgImg.onload = resolve;
          bgImg.onerror = reject;
          bgImg.src = backgroundImage;
        });
        // Draw background at its natural size (already captured at correct dimensions)
        mergedCtx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);
      } else if (backgroundImage === 'fallback' || !backgroundImage) {
        // For fallback mode or if background wasn't captured, try to capture now
        try {
          // Hide overlay visually
          if (containerRef.current) {
            containerRef.current.style.visibility = 'hidden';
          }
          
          // Wait for repaint
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Find the main content area (PatternFly page main)
          const mainContent = document.querySelector('.pf-v6-c-page__main') || 
                              document.querySelector('main') || 
                              document.body;
          
          // Find the main content area bounds
          const contentElement = document.querySelector('.pf-v6-c-page__main') || 
                                 document.querySelector('main') || 
                                 document.body;
          const rect = contentElement.getBoundingClientRect();
          
          // Capture the full body and crop to content area
          const captureCanvas = await html2canvas(document.body, {
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            scale: 1,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            ignoreElements: (element) => {
              return element.classList && element.classList.contains('screen-annotation-overlay');
            }
          });
          
          // Restore overlay visibility
          if (containerRef.current) {
            containerRef.current.style.visibility = 'visible';
          }
          
          // Draw the captured canvas, scaling to fit the merged canvas dimensions
          mergedCtx.drawImage(captureCanvas, 0, 0, mergedCanvas.width, mergedCanvas.height);
        } catch (captureError) {
          console.warn('Could not capture background at save time:', captureError);
          // Fill with a neutral background color if capture fails
          mergedCtx.fillStyle = '#f5f5f5';
          mergedCtx.fillRect(0, 0, mergedCanvas.width, mergedCanvas.height);
          // Restore overlay visibility
          if (containerRef.current) {
            containerRef.current.style.visibility = 'visible';
          }
        }
      }
      
      // Draw annotations on top
      if (canvasRef.current) {
        mergedCtx.drawImage(canvasRef.current, 0, 0);
      }
      
      const imageData = mergedCanvas.toDataURL('image/png');
      
      // Send to backend API
      const response = await fetch('/api/screenshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          title: screenshotTitle || 'Untitled Screenshot',
          description: screenshotDescription,
          sourceUrl: window.location.pathname,
          width: mergedCanvas.width,
          height: mergedCanvas.height,
          annotations: {
            strokeCount: strokes.length,
            textCount: textAnnotations.length,
            tools: [...new Set([...strokes.map(s => s.tool), ...(textAnnotations.length > 0 ? ['text'] : [])])]
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Clean up and notify parent
        setStrokes([]);
        setCurrentStroke([]);
        setTextAnnotations([]);
        setActiveTextInput(null);
        setBackgroundImage(null);
        setContentBounds(null);
        setIsSaveModalOpen(false);
        setScreenshotTitle('');
        setScreenshotDescription('');
        if (onSave) onSave(data.screenshot);
        onClose();
      } else {
        console.error('Failed to save screenshot');
      }
    } catch (error) {
      console.error('Error saving screenshot:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isActive) return;
      
      if (e.key === 'Escape') {
        handleCancel();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveClick();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, strokes]);

  if (!isActive) return null;

  const isFallbackMode = backgroundImage === 'fallback';
  
  // Calculate overlay position based on content bounds
  const overlayStyle = contentBounds ? {
    position: 'fixed',
    top: contentBounds.top,
    left: contentBounds.left,
    width: contentBounds.width,
    height: contentBounds.height,
    zIndex: 10000
  } : {
    // Fallback to full viewport while capturing
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000
  };
  
  return ReactDOM.createPortal(
    <div 
      ref={containerRef}
      className={`screen-annotation-overlay ${isFallbackMode ? 'screen-annotation-fallback' : ''}`}
      style={overlayStyle}
    >
      {/* Loading indicator while capturing */}
      {isCapturing && (
        <div className="screen-annotation-loading">
          <Spinner size="xl" />
          <span>Capturing screen...</span>
        </div>
      )}
      
      {/* Background canvas (captured page) - only render if not in fallback mode */}
      {!isFallbackMode && (
        <canvas
          ref={backgroundCanvasRef}
          className="screen-annotation-background"
        />
      )}
      
      {/* Drawing canvas - disable interaction when modal is open */}
      <canvas
        ref={canvasRef}
        className={`screen-annotation-canvas ${isSaveModalOpen ? 'screen-annotation-canvas-disabled' : ''}`}
        onMouseDown={isSaveModalOpen ? undefined : handlePointerDown}
        onMouseMove={isSaveModalOpen ? undefined : handlePointerMove}
        onMouseUp={isSaveModalOpen ? undefined : handlePointerUp}
        onMouseLeave={isSaveModalOpen ? undefined : handlePointerUp}
        onTouchStart={isSaveModalOpen ? undefined : handlePointerDown}
        onTouchMove={isSaveModalOpen ? undefined : handlePointerMove}
        onTouchEnd={isSaveModalOpen ? undefined : handlePointerUp}
      />
      
      {/* Floating Text Input */}
      {activeTextInput && (
        <div
          className="screen-annotation-text-input-container"
          style={{
            left: activeTextInput.x,
            top: activeTextInput.y
          }}
        >
          <textarea
            ref={textInputRef}
            className="screen-annotation-text-input"
            value={activeTextInput.text}
            onChange={(e) => {
              setActiveTextInput(prev => ({ ...prev, text: e.target.value }));
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
              e.target.style.width = 'auto';
              e.target.style.width = Math.max(100, e.target.scrollWidth) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitTextInput();
              } else if (e.key === 'Escape') {
                setActiveTextInput(null);
              }
            }}
            onBlur={() => {
              // Small delay to allow clicking elsewhere to create new text
              setTimeout(() => commitTextInput(), 150);
            }}
            placeholder="Type..."
            rows={1}
            style={{
              fontSize: activeTextInput.fontSize,
              color: activeTextInput.color,
              minWidth: '50px',
              width: 'auto',
              height: activeTextInput.fontSize * 1.2 + 'px'
            }}
          />
          <div className="screen-annotation-text-hint">
            Enter to confirm, Shift+Enter for new line, Esc to cancel
          </div>
        </div>
      )}
      
      {/* Tools Palette - hide when save modal is open */}
      {!isSaveModalOpen && (
      <div className="screen-annotation-toolbar">
        {/* Tool Buttons */}
        <div className="screen-annotation-tools">
          <button
            className={`screen-annotation-tool-btn ${currentTool === TOOLS.PENCIL ? 'active' : ''}`}
            onClick={() => setCurrentTool(TOOLS.PENCIL)}
            title="Pencil (solid line)"
          >
            <PencilAltIcon />
          </button>
          <button
            className={`screen-annotation-tool-btn ${currentTool === TOOLS.HIGHLIGHTER ? 'active' : ''}`}
            onClick={() => setCurrentTool(TOOLS.HIGHLIGHTER)}
            title="Highlighter (semi-transparent)"
          >
            <HighlighterIcon />
          </button>
          <button
            className={`screen-annotation-tool-btn ${currentTool === TOOLS.TEXT ? 'active' : ''}`}
            onClick={() => setCurrentTool(TOOLS.TEXT)}
            title="Text (click to add text label)"
          >
            <FontIcon />
          </button>
        </div>
        
        {/* Font Size Picker (only visible when Text tool is selected) */}
        {currentTool === TOOLS.TEXT && (
          <div className="screen-annotation-font-sizes">
            {FONT_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                className={`screen-annotation-font-size-btn ${currentFontSize === size ? 'active' : ''}`}
                onClick={() => setCurrentFontSize(size)}
                title={`${size}px`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
        
        {/* Color Picker */}
        <div className="screen-annotation-colors">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              className={`screen-annotation-color-btn ${currentColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setCurrentColor(color)}
              title={color}
            />
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="screen-annotation-actions">
          <button
            className="screen-annotation-action-btn"
            onClick={handleUndo}
            disabled={strokes.length === 0 && textAnnotations.length === 0 && !activeTextInput}
            title="Undo (Ctrl+Z)"
          >
            <UndoIcon />
          </button>
          <button
            className="screen-annotation-action-btn screen-annotation-cancel-btn"
            onClick={handleCancel}
            title="Cancel (Escape)"
          >
            <TimesIcon />
          </button>
          <button
            className="screen-annotation-action-btn screen-annotation-save-btn"
            onClick={handleSaveClick}
            title="Save Screenshot (Ctrl+S)"
          >
            <SaveIcon />
          </button>
        </div>
      </div>
      )}
      
      {/* Save Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        aria-labelledby="save-screenshot-title"
        variant="small"
      >
        <ModalHeader title="Save Screenshot" labelId="save-screenshot-title" />
        <ModalBody>
          <Form>
            <FormGroup label="Title" isRequired fieldId="screenshot-title">
              <TextInput
                id="screenshot-title"
                value={screenshotTitle}
                onChange={(event, value) => setScreenshotTitle(value)}
                placeholder="Enter a title for this screenshot"
                isRequired
              />
            </FormGroup>
            <FormGroup label="Description (optional)" fieldId="screenshot-description">
              <TextArea
                id="screenshot-description"
                value={screenshotDescription}
                onChange={(event, value) => setScreenshotDescription(value)}
                placeholder="Add notes or context about this screenshot"
                rows={3}
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            key="save"
            variant="primary"
            onClick={handleSaveConfirm}
            isDisabled={!screenshotTitle.trim() || isSaving}
            isLoading={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            key="cancel"
            variant="link"
            onClick={() => setIsSaveModalOpen(false)}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>,
    document.body
  );
};

export default ScreenAnnotation;
