import React from 'react';

const ColorPalette = ({ colors, onRemoveColor, onPickColor }) => {
  return (
    <div className="moodboard-control-group">
      <label>Palette</label>
      <div className="moodboard-color-chips">
        {colors.map((color, index) => (
          <div
            key={index}
            className="moodboard-color-chip"
            style={{ backgroundColor: color }}
            onClick={() => onRemoveColor(color)}
            title={color}
          >
            <div className="moodboard-color-chip-tooltip">{color}</div>
          </div>
        ))}
      </div>
      <button className="moodboard-btn" onClick={onPickColor}>
        ◉
      </button>
    </div>
  );
};

export default ColorPalette;
