import React from 'react';
import {
  Tooltip,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle
} from '@patternfly/react-core';
import {
  MouseIcon,
  FontIcon,
  LinkIcon,
  OutlinedFileImageIcon,
  LayerGroupIcon,
  PencilAltIcon,
  StickyNoteIcon,
  TrashIcon,
  TimesIcon,
  PaletteIcon
} from '@patternfly/react-icons';
import { TOOL_MODES, NODE_COLORS } from '../canvasConstants';

const TOOL_ITEMS = [
  { mode: TOOL_MODES.SELECT, icon: MouseIcon, label: 'Select', shortcut: 'V' },
  { mode: TOOL_MODES.TEXT, icon: FontIcon, label: 'Text', shortcut: 'T' },
  { mode: TOOL_MODES.STICKY, icon: StickyNoteIcon, label: 'Sticky Note', shortcut: 'S' },
  { mode: TOOL_MODES.DRAW, icon: PencilAltIcon, label: 'Draw', shortcut: 'D' },
  null, // divider
  { mode: TOOL_MODES.IMAGE, icon: OutlinedFileImageIcon, label: 'Image', shortcut: null },
  { mode: TOOL_MODES.LINK, icon: LinkIcon, label: 'Link', shortcut: null },
  { mode: TOOL_MODES.GROUP, icon: LayerGroupIcon, label: 'Group', shortcut: null }
];

const CanvasSidebar = ({
  activeTool,
  onToolChange,
  fileInputRef,
  onLinkModalOpen,
  // Color picker
  isColorPickerOpen,
  setIsColorPickerOpen,
  selectedNodes,
  selectedEdges,
  getSelectionColor,
  onApplyColor,
  onClearColor,
  // Delete
  onDeleteSelected,
  // Theme
  theme
}) => {
  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;

  return (
    <div
      style={{
        width: '48px',
        background: theme?.sidebarBg || '#1e1e1e',
        borderRight: `1px solid ${theme?.sidebarBorder || '#333'}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 0',
        gap: '2px',
        flexShrink: 0,
        zIndex: 10,
        transition: 'background 0.3s ease, border-color 0.3s ease'
      }}
    >
      {/* Tool mode buttons */}
      {TOOL_ITEMS.map((item, index) => {
        if (item === null) {
          return (
            <Divider
              key={`divider-${index}`}
              style={{ width: '32px', margin: '6px 0' }}
            />
          );
        }

        const Icon = item.icon;
        const isActive = activeTool === item.mode;
        const tooltipContent = item.shortcut
          ? `${item.label} (${item.shortcut})`
          : item.label;

        return (
          <Tooltip key={item.mode} content={tooltipContent} position="right">
            <button
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? '#0066cc' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: isActive ? '#fff' : '#aaa',
                transition: 'all 0.15s ease',
                outline: 'none'
              }}
              onClick={() => {
                if (item.mode === TOOL_MODES.IMAGE) {
                  fileInputRef.current?.click();
                } else if (item.mode === TOOL_MODES.LINK) {
                  onLinkModalOpen();
                } else {
                  onToolChange(item.mode);
                }
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#333';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#aaa';
                }
              }}
            >
              <Icon style={{ fontSize: '16px' }} />
            </button>
          </Tooltip>
        );
      })}

      {/* Selection actions (color & delete) */}
      <Divider style={{ width: '32px', margin: '6px 0' }} />

      {/* Color picker */}
      <Dropdown
        isOpen={isColorPickerOpen}
        onSelect={() => setIsColorPickerOpen(false)}
        onOpenChange={setIsColorPickerOpen}
        popperProps={{ position: 'right-start', enableFlip: false }}
        toggle={(toggleRef) => (
          <Tooltip content="Color" position="right">
            <button
              ref={toggleRef}
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: hasSelection ? 'pointer' : 'default',
                opacity: hasSelection ? 1 : 0.4,
                outline: 'none',
                padding: 0
              }}
              onClick={() => {
                if (hasSelection) {
                  setIsColorPickerOpen(!isColorPickerOpen);
                }
              }}
              disabled={!hasSelection}
            >
              <span style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                background: getSelectionColor()
                  ? NODE_COLORS.find(c => c.id === getSelectionColor())?.value || '#666'
                  : 'linear-gradient(135deg, #fb464c 0%, #e9973f 25%, #e0de71 50%, #44cf6e 75%, #a882ff 100%)',
                border: '2px solid rgba(255,255,255,0.2)',
                flexShrink: 0
              }} />
            </button>
          </Tooltip>
        )}
      >
        <DropdownList>
          {NODE_COLORS.map(color => (
            <DropdownItem
              key={color.id}
              onClick={() => onApplyColor(color.id)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  background: color.value,
                  border: getSelectionColor() === color.id ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                  boxShadow: getSelectionColor() === color.id ? '0 0 0 2px #0066cc' : 'none',
                  flexShrink: 0
                }} />
                {color.name}
              </span>
            </DropdownItem>
          ))}
          <Divider />
          <DropdownItem
            key="none"
            onClick={onClearColor}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                background: '#444',
                border: '1px dashed rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <TimesIcon style={{ fontSize: '10px', opacity: 0.5 }} />
              </span>
              No color
            </span>
          </DropdownItem>
        </DropdownList>
      </Dropdown>

      {/* Delete */}
      <Tooltip content="Delete selected" position="right">
        <button
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: hasSelection ? 'pointer' : 'default',
            color: hasSelection ? '#ff6b6b' : '#555',
            opacity: hasSelection ? 1 : 0.4,
            transition: 'all 0.15s ease',
            outline: 'none'
          }}
          onClick={() => {
            if (hasSelection) onDeleteSelected();
          }}
          disabled={!hasSelection}
          onMouseEnter={(e) => {
            if (hasSelection) {
              e.currentTarget.style.background = 'rgba(255, 107, 107, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <TrashIcon style={{ fontSize: '16px' }} />
        </button>
      </Tooltip>

      {/* Spacer fills remaining space below */}
      <div style={{ flex: 1 }} />
    </div>
  );
};

export default CanvasSidebar;
