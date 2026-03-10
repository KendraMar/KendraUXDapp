import React, { useState, useEffect, useRef } from 'react';
import { Spinner } from '@patternfly/react-core';
import { DEFAULT_FONTS } from './constants';
import ImageGrid from './components/ImageGrid';
import FontManager from './components/FontManager';
import ExportModal from './components/ExportModal';
import Header from './components/Header';

const MoodBoard = () => {
  // State
  const [images, setImages] = useState([]);
  const [colors, setColors] = useState([]);
  const [fonts, setFonts] = useState(DEFAULT_FONTS.map(f => ({ 
    ...f, 
    textColor: '#808080', 
    backgroundColor: '#3b3b3b',
    visible: true
  })));
  const [loading, setLoading] = useState(true);
  const [spacing, setSpacing] = useState(24);
  const [backgroundColor, setBackgroundColor] = useState('#2a2a2a');
  const [headerHidden, setHeaderHidden] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState(null);
  const [dragOverImageId, setDragOverImageId] = useState(null);
  const [enlargedImageId, setEnlargedImageId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportData, setExportData] = useState('');
  const [newFontName, setNewFontName] = useState('');
  const [loadedFonts, setLoadedFonts] = useState(new Set());
  
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  // Load images from server
  useEffect(() => {
    loadImages();
    loadMoodBoardData();
  }, []);

  // Load Google Fonts
  useEffect(() => {
    fonts.forEach(font => {
      if (!loadedFonts.has(font.name)) {
        loadGoogleFont(font.name);
      }
    });
  }, [fonts]);

  const loadGoogleFont = (fontName) => {
    if (loadedFonts.has(fontName)) return;
    
    const fontUrl = fontName.replace(/\s+/g, '+');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontUrl}:wght@400;600;700&display=swap`;
    document.head.appendChild(link);
    
    setLoadedFonts(prev => new Set([...prev, fontName]));
  };

  const loadImages = async () => {
    try {
      const response = await fetch('/api/moodboard/images');
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoodBoardData = async () => {
    try {
      const response = await fetch('/api/moodboard/data');
      if (response.ok) {
        const data = await response.json();
        if (data.colors) setColors(data.colors);
        if (data.fonts && data.fonts.length > 0) {
          setFonts(data.fonts.map(f => ({
            ...f,
            family: `'${f.name}', sans-serif`,
            visible: f.visible !== false
          })));
        }
        if (data.spacing) setSpacing(data.spacing);
        if (data.backgroundColor) setBackgroundColor(data.backgroundColor);
      }
    } catch (error) {
      console.error('Error loading mood board data:', error);
    }
  };

  const saveMoodBoardData = async (dataToSave) => {
    try {
      await fetch('/api/moodboard/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
    } catch (error) {
      console.error('Error saving mood board data:', error);
    }
  };

  // Eyedropper for color picking
  const pickColor = async () => {
    if (!window.EyeDropper) {
      alert('EyeDropper is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (colors.length >= 5) {
      alert('Maximum of 5 colors reached. Remove a color to add a new one.');
      return;
    }

    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      const newColor = result.sRGBHex;
      
      if (!colors.includes(newColor)) {
        const updatedColors = [...colors, newColor];
        setColors(updatedColors);
        saveMoodBoardData({ colors: updatedColors, fonts, spacing, backgroundColor });
      }
    } catch (error) {
      console.log('Color selection cancelled');
    }
  };

  const removeColor = (colorToRemove) => {
    const updatedColors = colors.filter(c => c !== colorToRemove);
    setColors(updatedColors);
    saveMoodBoardData({ colors: updatedColors, fonts, spacing, backgroundColor });
  };

  // Image handling
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const formData = new FormData();
        formData.append('image', file);
        
        try {
          const response = await fetch('/api/moodboard/upload', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const data = await response.json();
            setImages(prev => [...prev, data.image]);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = async (imageId) => {
    try {
      await fetch(`/api/moodboard/images/${imageId}`, {
        method: 'DELETE'
      });
      setImages(prev => prev.filter(img => img.id !== imageId));
      if (enlargedImageId === imageId) {
        setEnlargedImageId(null);
      }
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const toggleEnlarge = (imageId) => {
    setEnlargedImageId(prev => prev === imageId ? null : imageId);
  };

  // Drag and drop for image reordering
  const handleDragStart = (e, imageId) => {
    setDraggedImageId(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, imageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (imageId !== draggedImageId) {
      setDragOverImageId(imageId);
    }
  };

  const handleDragLeave = () => {
    setDragOverImageId(null);
  };

  const handleDrop = (e, targetImageId) => {
    e.preventDefault();
    setDragOverImageId(null);
    
    if (draggedImageId && draggedImageId !== targetImageId) {
      const dragIndex = images.findIndex(img => img.id === draggedImageId);
      const targetIndex = images.findIndex(img => img.id === targetImageId);
      
      const newImages = [...images];
      const [draggedImage] = newImages.splice(dragIndex, 1);
      
      if (dragIndex < targetIndex) {
        newImages.splice(targetIndex, 0, draggedImage);
      } else {
        newImages.splice(targetIndex, 0, draggedImage);
      }
      
      setImages(newImages);
    }
    
    setDraggedImageId(null);
  };

  const handleDragEnd = () => {
    setDraggedImageId(null);
    setDragOverImageId(null);
  };

  // Font handling
  const addFont = () => {
    if (!newFontName.trim()) {
      alert('Please enter a Google Font name');
      return;
    }
    
    const fontExists = fonts.some(f => 
      f.name.toLowerCase() === newFontName.trim().toLowerCase()
    );
    
    if (fontExists) {
      alert('This font is already added.');
      return;
    }
    
    loadGoogleFont(newFontName.trim());
    
    const newFont = {
      name: newFontName.trim(),
      family: `'${newFontName.trim()}', sans-serif`,
      textColor: '#808080',
      backgroundColor: '#3b3b3b',
      custom: true,
      visible: true
    };
    
    const updatedFonts = [...fonts, newFont];
    setFonts(updatedFonts);
    setNewFontName('');
    saveMoodBoardData({ colors, fonts: updatedFonts, spacing, backgroundColor });
  };

  const removeFont = (fontName) => {
    const updatedFonts = fonts.filter(f => f.name !== fontName);
    setFonts(updatedFonts);
    saveMoodBoardData({ colors, fonts: updatedFonts, spacing, backgroundColor });
  };

  const updateFontColor = (fontName, colorType, color) => {
    const updatedFonts = fonts.map(f => 
      f.name === fontName ? { ...f, [colorType]: color } : f
    );
    setFonts(updatedFonts);
    saveMoodBoardData({ colors, fonts: updatedFonts, spacing, backgroundColor });
  };

  // Export/Import
  const handleExport = () => {
    const data = {
      colors,
      images: images.map(img => ({ id: img.id, name: img.name, src: img.src })),
      fonts: fonts.filter(f => f.visible).map(f => ({
        name: f.name,
        textColor: f.textColor,
        backgroundColor: f.backgroundColor,
        custom: f.custom
      }))
    };
    
    setExportData(JSON.stringify(data, null, 2));
    setIsExportModalOpen(true);
  };

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.colors) setColors(data.colors);
      if (data.fonts) {
        // Merge imported fonts with defaults
        const importedFontNames = data.fonts.map(f => typeof f === 'string' ? f : f.name);
        const updatedFonts = DEFAULT_FONTS.map(df => {
          const importedFont = data.fonts.find(f => (typeof f === 'string' ? f : f.name) === df.name);
          if (importedFont && typeof importedFont === 'object') {
            return {
              ...df,
              textColor: importedFont.textColor || '#808080',
              backgroundColor: importedFont.backgroundColor || '#3b3b3b',
              visible: true
            };
          }
          return { ...df, visible: importedFontNames.includes(df.name) };
        });
        
        // Add custom fonts
        data.fonts.forEach(f => {
          if (typeof f === 'object' && f.custom) {
            loadGoogleFont(f.name);
            updatedFonts.push({
              name: f.name,
              family: `'${f.name}', sans-serif`,
              textColor: f.textColor || '#808080',
              backgroundColor: f.backgroundColor || '#3b3b3b',
              custom: true,
              visible: true
            });
          }
        });
        
        setFonts(updatedFonts);
      }
      
      saveMoodBoardData({ colors: data.colors || colors, fonts: data.fonts || fonts, spacing, backgroundColor });
    } catch (error) {
      console.error('Error importing:', error);
      alert('Failed to import. Please check the file format.');
    }
    
    if (jsonInputRef.current) {
      jsonInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all images from the view?')) {
      setImages([]);
    }
  };

  const handleSpacingChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setSpacing(value);
    saveMoodBoardData({ colors, fonts, spacing: value, backgroundColor });
  };

  const handleBackgroundChange = (e) => {
    const color = e.target.value;
    setBackgroundColor(color);
    saveMoodBoardData({ colors, fonts, spacing, backgroundColor: color });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100%',
        background: '#2a2a2a'
      }}>
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="moodboard-applet">
      {/* Inline styles to match original exactly */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&display=swap');
        
        .moodboard-applet {
          font-family: 'IBM Plex Mono', monospace;
          min-height: 100%;
          margin: 0;
          padding: 0;
        }
        
        .moodboard-header {
          position: sticky;
          top: 0;
          height: 50px;
          background: black;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          z-index: 100;
          transition: transform 0.3s ease;
        }
        
        .moodboard-header.hidden {
          transform: translateY(-100%);
        }
        
        .moodboard-header h1 {
          color: white;
          font-size: 1rem;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
          margin: 0;
          font-weight: 400;
        }
        
        .moodboard-header-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .moodboard-control-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .moodboard-control-group label {
          color: white;
          font-size: 0.75rem;
        }
        
        .moodboard-color-picker {
          width: 40px;
          height: 30px;
          border: 1px solid white;
          background: black;
          cursor: pointer;
          padding: 2px;
        }
        
        .moodboard-color-picker::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        
        .moodboard-color-picker::-webkit-color-swatch {
          border: none;
        }
        
        .moodboard-slider {
          width: 80px;
          height: 4px;
          background: white;
          outline: none;
          cursor: pointer;
          -webkit-appearance: none;
        }
        
        .moodboard-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          cursor: pointer;
          border: 1px solid black;
        }
        
        .moodboard-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: white;
          cursor: pointer;
          border: 1px solid black;
        }
        
        .moodboard-color-chips {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        
        .moodboard-color-chip {
          width: 30px;
          height: 30px;
          border: 1px solid white;
          cursor: pointer;
          position: relative;
          transition: transform 0.2s ease;
        }
        
        .moodboard-color-chip:hover {
          transform: scale(1.1);
        }
        
        .moodboard-color-chip::after {
          content: 'X';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 0.7rem;
          opacity: 0;
          transition: opacity 0.2s ease;
          text-shadow: 0 0 3px black;
        }
        
        .moodboard-color-chip:hover::after {
          opacity: 1;
        }
        
        .moodboard-color-chip-tooltip {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: black;
          color: white;
          border: 1px solid white;
          padding: 0.25rem 0.5rem;
          font-size: 0.65rem;
          white-space: nowrap;
          margin-top: 0.5rem;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
          z-index: 102;
        }
        
        .moodboard-color-chip:hover .moodboard-color-chip-tooltip {
          opacity: 1;
        }
        
        .moodboard-btn {
          background: black;
          color: white;
          padding: 0.5rem 1rem;
          border: 1px solid white;
          border-radius: 0;
          font-size: 0.75rem;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .moodboard-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .moodboard-show-header-btn {
          position: fixed;
          top: 10px;
          right: 10px;
          background: transparent;
          color: #808080;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0;
          font-size: 0.75rem;
          font-weight: 400;
          cursor: pointer;
          z-index: 99;
          display: none;
          transition: opacity 0.3s ease;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .moodboard-show-header-btn.visible {
          display: block;
        }
        
        .moodboard-show-header-btn:hover {
          opacity: 0.7;
        }
        
        .moodboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .moodboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          margin-bottom: 2rem;
        }
        
        .moodboard-grid-item {
          position: relative;
          overflow: hidden;
          border-radius: 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background: white;
          aspect-ratio: 1;
          cursor: grab;
        }
        
        .moodboard-grid-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .moodboard-grid-item.dragging {
          opacity: 0.5;
          cursor: grabbing;
        }
        
        .moodboard-grid-item.drag-over {
          border: 2px solid white;
        }
        
        .moodboard-grid-item.enlarged {
          grid-column: span 2;
          grid-row: span 2;
        }
        
        .moodboard-grid-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        
        .moodboard-remove-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 30px;
          height: 30px;
          background: black;
          color: white;
          border: 1px solid white;
          border-radius: 0;
          font-size: 1.2rem;
          font-weight: 400;
          cursor: pointer;
          display: none;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 10;
        }
        
        .moodboard-grid-item:hover .moodboard-remove-btn {
          display: flex;
        }
        
        .moodboard-remove-btn:hover {
          background: white;
          color: black;
        }
        
        .moodboard-enlarge-btn {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 30px;
          height: 30px;
          background: black;
          color: white;
          border: 1px solid white;
          border-radius: 0;
          font-size: 1.2rem;
          font-weight: 400;
          cursor: pointer;
          display: none;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 10;
        }
        
        .moodboard-grid-item:hover .moodboard-enlarge-btn {
          display: flex;
        }
        
        .moodboard-enlarge-btn:hover {
          background: white;
          color: black;
        }
        
        .moodboard-filename-tooltip {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 0.5rem;
          font-size: 0.7rem;
          text-align: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 5;
          pointer-events: none;
          word-break: break-all;
        }
        
        .moodboard-grid-item:hover .moodboard-filename-tooltip {
          opacity: 1;
        }
        
        .moodboard-empty-state {
          text-align: center;
          color: #ccc;
          padding: 4rem 2rem;
          font-size: 1.2rem;
        }
        
        .moodboard-empty-state p {
          margin-bottom: 1rem;
        }
        
        .moodboard-type-section {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .moodboard-type-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        
        .moodboard-type-sample {
          position: relative;
          padding: 2rem;
          border: none;
          border-radius: 0;
        }
        
        .moodboard-type-sample .font-name {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 1.5rem 0;
          text-shadow: none;
        }
        
        .moodboard-type-sample h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
          line-height: 1.2;
          text-shadow: none;
        }
        
        .moodboard-type-sample h2 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          line-height: 1.3;
          text-shadow: none;
        }
        
        .moodboard-type-sample p {
          font-size: 1rem;
          margin-bottom: 1rem;
          line-height: 1.6;
          text-shadow: none;
        }
        
        .moodboard-type-sample ul {
          margin-left: 1.5rem;
          line-height: 1.6;
        }
        
        .moodboard-type-sample ul li {
          margin-bottom: 0.5rem;
          text-shadow: none;
        }
        
        .moodboard-type-color-picker {
          position: absolute;
          bottom: 1rem;
          width: 40px;
          height: 30px;
          border: 1px solid white;
          background: black;
          cursor: pointer;
          padding: 2px;
        }
        
        .moodboard-type-color-picker::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        
        .moodboard-type-color-picker::-webkit-color-swatch {
          border: none;
        }
        
        .moodboard-type-bg-picker {
          right: 60px;
        }
        
        .moodboard-type-text-picker {
          right: 1rem;
        }
        
        .moodboard-type-remove-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 30px;
          height: 30px;
          background: black;
          color: white;
          border: 1px solid white;
          border-radius: 0;
          font-size: 1.2rem;
          font-weight: 400;
          cursor: pointer;
          display: none;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 10;
        }
        
        .moodboard-type-sample:hover .moodboard-type-remove-btn {
          display: flex;
        }
        
        .moodboard-type-remove-btn:hover {
          background: white;
          color: black;
        }
        
        .moodboard-add-font-section {
          margin-top: 2rem;
          padding: 2rem;
          background: rgb(59, 59, 59);
          display: flex;
          gap: 1rem;
          align-items: center;
          justify-content: center;
        }
        
        .moodboard-add-font-section label {
          color: #808080;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .moodboard-font-input {
          background: black;
          color: white;
          padding: 0.5rem;
          border: 1px solid white;
          border-radius: 0;
          font-size: 0.75rem;
          font-family: 'IBM Plex Mono', monospace;
          height: 32px;
          width: 150px;
        }
        
        .moodboard-font-input::placeholder {
          color: #808080;
        }
        
        .moodboard-font-input:focus {
          outline: none;
          border-color: #ffffff;
        }
        
        .moodboard-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 200;
          align-items: center;
          justify-content: center;
        }
        
        .moodboard-modal.visible {
          display: flex;
        }
        
        .moodboard-modal-content {
          background: black;
          border: 1px solid white;
          padding: 2rem;
          max-width: 80%;
          max-height: 80%;
          overflow: auto;
          position: relative;
        }
        
        .moodboard-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .moodboard-modal-header h2 {
          color: white;
          font-size: 1rem;
          font-weight: 400;
          margin: 0;
        }
        
        .moodboard-modal-btn {
          background: black;
          color: white;
          border: 1px solid white;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          cursor: pointer;
          margin-left: 0.5rem;
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .moodboard-modal-btn:hover {
          background: white;
          color: black;
        }
        
        .moodboard-modal pre {
          background: #1a1a1a;
          color: #00ff00;
          padding: 1rem;
          overflow: auto;
          font-size: 0.75rem;
          line-height: 1.5;
        }
      `}</style>
      
      {/* Header */}
      <Header
        backgroundColor={backgroundColor}
        spacing={spacing}
        colors={colors}
        onBackgroundChange={handleBackgroundChange}
        onSpacingChange={handleSpacingChange}
        onRemoveColor={removeColor}
        onPickColor={pickColor}
        onExport={handleExport}
        onImport={handleImport}
        onClearAll={handleClearAll}
        onAddImage={handleFileSelect}
        onHideHeader={() => setHeaderHidden(true)}
        jsonInputRef={jsonInputRef}
        fileInputRef={fileInputRef}
      />
      
      {/* Show Header Button (when hidden) */}
      <button 
        className={`moodboard-show-header-btn ${headerHidden ? 'visible' : ''}`}
        onClick={() => setHeaderHidden(false)}
      >
        Show Header
      </button>
      
      {/* Main Content */}
      <div style={{ background: backgroundColor, minHeight: 'calc(100vh - 50px)' }}>
        {/* Image Grid */}
        <div className="moodboard-container">
          <ImageGrid
            images={images}
            spacing={spacing}
            draggedImageId={draggedImageId}
            dragOverImageId={dragOverImageId}
            enlargedImageId={enlargedImageId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onRemoveImage={removeImage}
            onToggleEnlarge={toggleEnlarge}
          />
        </div>
        
        {/* Typography Section */}
        <FontManager
          fonts={fonts}
          onRemoveFont={removeFont}
          onUpdateFontColor={updateFontColor}
          onAddFont={addFont}
          newFontName={newFontName}
          onNewFontNameChange={setNewFontName}
          onAddFontKeyDown={(e) => e.key === 'Enter' && addFont()}
        />
      </div>
      
      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        exportData={exportData}
        onClose={() => setIsExportModalOpen(false)}
        onCopy={handleCopyExport}
      />
    </div>
  );
};

export default MoodBoard;
