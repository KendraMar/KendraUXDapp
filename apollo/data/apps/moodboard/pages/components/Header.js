import React from 'react';
import ColorPalette from './ColorPalette';

const Header = ({
  backgroundColor,
  spacing,
  colors,
  onBackgroundChange,
  onSpacingChange,
  onRemoveColor,
  onPickColor,
  onExport,
  onImport,
  onClearAll,
  onAddImage,
  onHideHeader,
  jsonInputRef,
  fileInputRef
}) => {
  return (
    <header className="moodboard-header">
      <h1>MOOD</h1>
      
      <div className="moodboard-header-controls">
        {/* Background Color */}
        <div className="moodboard-control-group">
          <label>BG</label>
          <input
            type="color"
            className="moodboard-color-picker"
            value={backgroundColor}
            onChange={onBackgroundChange}
          />
        </div>
        
        {/* Spacing Slider */}
        <div className="moodboard-control-group">
          <label>Spacing</label>
          <input
            type="range"
            className="moodboard-slider"
            min="0"
            max="48"
            value={spacing}
            onChange={onSpacingChange}
          />
        </div>
        
        {/* Color Palette */}
        <ColorPalette 
          colors={colors}
          onRemoveColor={onRemoveColor}
          onPickColor={onPickColor}
        />
        
        {/* Action Buttons */}
        <button className="moodboard-btn" onClick={onExport}>
          Export
        </button>
        
        <button className="moodboard-btn" onClick={() => jsonInputRef.current?.click()}>
          Import
        </button>
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json"
          onChange={onImport}
          style={{ display: 'none' }}
        />
        
        <button className="moodboard-btn" onClick={onClearAll}>
          Clear
        </button>
        
        <button className="moodboard-btn" onClick={() => fileInputRef.current?.click()}>
          Add Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onAddImage}
          style={{ display: 'none' }}
        />
        
        <button className="moodboard-btn" onClick={onHideHeader}>
          Hide Header
        </button>
      </div>
    </header>
  );
};

export default Header;
