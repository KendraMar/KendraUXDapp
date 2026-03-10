import React from 'react';

const ImageGrid = ({ 
  images, 
  spacing, 
  draggedImageId, 
  dragOverImageId, 
  enlargedImageId,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onRemoveImage,
  onToggleEnlarge
}) => {
  if (images.length === 0) {
    return (
      <div className="moodboard-empty-state">
        <p>No images found in the mood folder.</p>
        <p>Add some images to get started!</p>
      </div>
    );
  }

  return (
    <div 
      className="moodboard-grid"
      style={{ gap: `${spacing}px` }}
    >
      {images.map((image) => (
        <div
          key={image.id}
          className={`moodboard-grid-item ${draggedImageId === image.id ? 'dragging' : ''} ${dragOverImageId === image.id ? 'drag-over' : ''} ${enlargedImageId === image.id ? 'enlarged' : ''}`}
          draggable
          onDragStart={(e) => onDragStart(e, image.id)}
          onDragOver={(e) => onDragOver(e, image.id)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, image.id)}
          onDragEnd={onDragEnd}
        >
          <img src={image.src} alt={image.name} />
          <button 
            className="moodboard-remove-btn"
            onClick={() => onRemoveImage(image.id)}
          >
            X
          </button>
          <button 
            className="moodboard-enlarge-btn"
            onClick={() => onToggleEnlarge(image.id)}
          >
            ⤢
          </button>
          <div className="moodboard-filename-tooltip">
            {image.name}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGrid;
