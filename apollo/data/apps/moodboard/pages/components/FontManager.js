import React from 'react';
import { SAMPLE_TEXT } from '../constants';

const FontManager = ({ fonts, onRemoveFont, onUpdateFontColor, onAddFont, newFontName, onNewFontNameChange, onAddFontKeyDown }) => {
  return (
    <div className="moodboard-type-section">
      <div className="moodboard-type-grid">
        {fonts.filter(f => f.visible !== false).map((font) => (
          <div
            key={font.name}
            className="moodboard-type-sample"
            style={{
              fontFamily: font.family,
              background: font.backgroundColor
            }}
          >
            <button 
              className="moodboard-type-remove-btn"
              onClick={() => onRemoveFont(font.name)}
            >
              X
            </button>
            
            <p className="font-name" style={{ color: font.textColor }}>
              {font.name}
            </p>
            
            <h1 style={{ color: font.textColor }}>Heading One</h1>
            <h2 style={{ color: font.textColor }}>Heading Two</h2>
            <p style={{ color: font.textColor }}>{SAMPLE_TEXT}</p>
            <ul style={{ color: font.textColor }}>
              <li>List item one</li>
              <li>List item two</li>
              <li>List item three</li>
            </ul>
            
            <input
              type="color"
              className="moodboard-type-color-picker moodboard-type-bg-picker"
              value={font.backgroundColor}
              onChange={(e) => onUpdateFontColor(font.name, 'backgroundColor', e.target.value)}
              title="Background color"
            />
            <input
              type="color"
              className="moodboard-type-color-picker moodboard-type-text-picker"
              value={font.textColor}
              onChange={(e) => onUpdateFontColor(font.name, 'textColor', e.target.value)}
              title="Text color"
            />
          </div>
        ))}
      </div>
      
      {/* Add Font Section */}
      <div className="moodboard-add-font-section">
        <label>Add Google Font</label>
        <input
          type="text"
          className="moodboard-font-input"
          value={newFontName}
          onChange={(e) => onNewFontNameChange(e.target.value)}
          onKeyDown={onAddFontKeyDown}
          placeholder="e.g., Roboto"
        />
        <button className="moodboard-btn" onClick={onAddFont}>
          Add Font
        </button>
      </div>
    </div>
  );
};

export default FontManager;
