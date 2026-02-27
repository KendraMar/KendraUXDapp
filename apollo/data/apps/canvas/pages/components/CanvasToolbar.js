import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Flex,
  FlexItem,
  Button,
  Tooltip,
  Divider,
  Switch,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle
} from '@patternfly/react-core';
import {
  ArrowLeftIcon,
  SaveIcon,
  UndoIcon,
  RedoIcon,
  SearchPlusIcon,
  SearchMinusIcon,
  ExpandArrowsAltIcon
} from '@patternfly/react-icons';
import { CANVAS_THEMES, GRID_STYLES } from '../canvasConstants';

const THEME_ICONS = {
  dark: { color: '#1a1a1a', border: '#555' },
  blueprint: { color: '#0a2e5c', border: '#5ba3f5' },
  light: { color: '#f5f5f5', border: '#ccc' },
  draft: { color: '#f0e8d8', border: '#b8a882' },
  graph: { color: '#fafcfa', border: '#6aaa6a' }
};

// Small inline SVG icons representing each grid style
const GridStyleIcon = ({ style: gridStyle, size = 16 }) => {
  const s = size;
  const c = 'currentColor';
  const o = 0.45;

  if (gridStyle === 'dots') {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
        <circle cx="4" cy="4" r="1.2" fill={c} opacity={o} />
        <circle cx="12" cy="4" r="1.2" fill={c} opacity={o} />
        <circle cx="4" cy="12" r="1.2" fill={c} opacity={o} />
        <circle cx="12" cy="12" r="1.2" fill={c} opacity={o} />
        <circle cx="8" cy="8" r="1.2" fill={c} opacity={o} />
      </svg>
    );
  }

  if (gridStyle === 'wide') {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
        <line x1="8" y1="0" x2="8" y2="16" stroke={c} strokeWidth="0.8" opacity={o} />
        <line x1="0" y1="8" x2="16" y2="8" stroke={c} strokeWidth="0.8" opacity={o} />
      </svg>
    );
  }

  if (gridStyle === 'cross') {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
        {[4, 12].map(cx => [4, 12].map(cy => (
          <g key={`${cx}-${cy}`}>
            <line x1={cx - 2} y1={cy} x2={cx + 2} y2={cy} stroke={c} strokeWidth="0.8" opacity={o} />
            <line x1={cx} y1={cy - 2} x2={cx} y2={cy + 2} stroke={c} strokeWidth="0.8" opacity={o} />
          </g>
        )))}
      </svg>
    );
  }

  if (gridStyle === 'none') {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
        <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke={c} strokeWidth="0.8" opacity={0.25} />
        <line x1="3" y1="13" x2="13" y2="3" stroke={c} strokeWidth="0.8" opacity={0.3} />
      </svg>
    );
  }

  // Default: lines
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
      <line x1="5" y1="0" x2="5" y2="16" stroke={c} strokeWidth="0.6" opacity={o} />
      <line x1="11" y1="0" x2="11" y2="16" stroke={c} strokeWidth="0.6" opacity={o} />
      <line x1="0" y1="5" x2="16" y2="5" stroke={c} strokeWidth="0.6" opacity={o} />
      <line x1="0" y1="11" x2="16" y2="11" stroke={c} strokeWidth="0.6" opacity={o} />
    </svg>
  );
};

const CanvasToolbar = ({
  canvas,
  onNavigateBack,
  historyIndex,
  history,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  snapToGrid,
  onSnapToGridChange,
  hasChanges,
  isSaving,
  onSave,
  canvasTheme,
  onThemeChange,
  gridStyle,
  onGridStyleChange
}) => {
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isGridDropdownOpen, setIsGridDropdownOpen] = useState(false);
  const currentTheme = CANVAS_THEMES[canvasTheme] || CANVAS_THEMES.dark;
  const currentGridStyle = GRID_STYLES[gridStyle] || GRID_STYLES.lines;

  return (
    <PageSection variant="light" style={{ flexShrink: 0, padding: '0.5rem 1rem' }}>
      <Flex alignItems={{ default: 'alignItemsCenter' }}>
        <FlexItem>
          <Button variant="plain" onClick={onNavigateBack}>
            <ArrowLeftIcon />
          </Button>
        </FlexItem>
        <FlexItem flex={{ default: 'flex_1' }}>
          <Title headingLevel="h1" size="lg">
            {canvas?.title || 'Canvas'}
          </Title>
        </FlexItem>
        
        {/* Toolbar */}
        <FlexItem>
          <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
            {/* Undo/Redo */}
            <FlexItem>
              <Tooltip content={`Undo (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Z)`}>
                <Button 
                  variant="plain" 
                  onClick={onUndo}
                  isDisabled={historyIndex <= 0}
                >
                  <UndoIcon />
                </Button>
              </Tooltip>
            </FlexItem>
            <FlexItem>
              <Tooltip content={`Redo (${navigator.platform.includes('Mac') ? '⌘+Shift+Z' : 'Ctrl+Y'})`}>
                <Button 
                  variant="plain" 
                  onClick={onRedo}
                  isDisabled={historyIndex >= history.length - 1}
                >
                  <RedoIcon />
                </Button>
              </Tooltip>
            </FlexItem>

            {/* Theme Dropdown */}
            <FlexItem>
              <Dropdown
                isOpen={isThemeDropdownOpen}
                onSelect={() => setIsThemeDropdownOpen(false)}
                onOpenChange={setIsThemeDropdownOpen}
                popperProps={{ position: 'right' }}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                    isExpanded={isThemeDropdownOpen}
                    variant="plain"
                    style={{ padding: '4px 8px' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        background: THEME_ICONS[canvasTheme]?.color || '#1a1a1a',
                        border: `2px solid ${THEME_ICONS[canvasTheme]?.border || '#555'}`,
                        flexShrink: 0
                      }} />
                      <span style={{ fontSize: '13px' }}>{currentTheme.name}</span>
                    </span>
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  {Object.values(CANVAS_THEMES).map(theme => (
                    <DropdownItem
                      key={theme.id}
                      onClick={() => onThemeChange(theme.id)}
                      isSelected={canvasTheme === theme.id}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          background: THEME_ICONS[theme.id]?.color || theme.canvasBg,
                          border: canvasTheme === theme.id
                            ? `2px solid #0066cc`
                            : `2px solid ${THEME_ICONS[theme.id]?.border || '#666'}`,
                          boxShadow: canvasTheme === theme.id ? '0 0 0 1px #0066cc' : 'none',
                          flexShrink: 0
                        }} />
                        <span>{theme.name}</span>
                      </span>
                    </DropdownItem>
                  ))}
                </DropdownList>
              </Dropdown>
            </FlexItem>

            {/* Grid Style Dropdown */}
            <FlexItem>
              <Dropdown
                isOpen={isGridDropdownOpen}
                onSelect={() => setIsGridDropdownOpen(false)}
                onOpenChange={setIsGridDropdownOpen}
                popperProps={{ position: 'right' }}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsGridDropdownOpen(!isGridDropdownOpen)}
                    isExpanded={isGridDropdownOpen}
                    variant="plain"
                    style={{ padding: '4px 8px' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <GridStyleIcon style={gridStyle} size={16} />
                      <span style={{ fontSize: '13px' }}>{currentGridStyle.name}</span>
                    </span>
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  {Object.values(GRID_STYLES).map(gs => (
                    <DropdownItem
                      key={gs.id}
                      onClick={() => onGridStyleChange(gs.id)}
                      isSelected={gridStyle === gs.id}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <GridStyleIcon style={gs.id} size={20} />
                        <span style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{gs.name}</span>
                          <span style={{ fontSize: '11px', opacity: 0.6 }}>{gs.description}</span>
                        </span>
                      </span>
                    </DropdownItem>
                  ))}
                </DropdownList>
              </Dropdown>
            </FlexItem>

            <Divider orientation={{ default: 'vertical' }} />

            {/* Zoom Controls */}
            <FlexItem>
              <Tooltip content="Zoom out">
                <Button variant="plain" onClick={onZoomOut}>
                  <SearchMinusIcon />
                </Button>
              </Tooltip>
            </FlexItem>
            <FlexItem>
              <span style={{ fontSize: '12px', minWidth: '50px', textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </span>
            </FlexItem>
            <FlexItem>
              <Tooltip content="Zoom in">
                <Button variant="plain" onClick={onZoomIn}>
                  <SearchPlusIcon />
                </Button>
              </Tooltip>
            </FlexItem>
            <FlexItem>
              <Tooltip content="Reset view">
                <Button variant="plain" onClick={onResetZoom}>
                  <ExpandArrowsAltIcon />
                </Button>
              </Tooltip>
            </FlexItem>

            <Divider orientation={{ default: 'vertical' }} />

            {/* Grid Toggle */}
            <FlexItem>
              <Switch
                id="snap-grid"
                label="Snap to grid"
                isChecked={snapToGrid}
                onChange={(e, checked) => onSnapToGridChange(checked)}
                isReversed
              />
            </FlexItem>

            {/* Save */}
            {hasChanges && (
              <>
                <Divider orientation={{ default: 'vertical' }} />
                <FlexItem>
                  <Button 
                    variant="primary" 
                    icon={<SaveIcon />}
                    onClick={onSave}
                    isLoading={isSaving}
                  >
                    Save
                  </Button>
                </FlexItem>
              </>
            )}
          </Flex>
        </FlexItem>
      </Flex>
    </PageSection>
  );
};

export default CanvasToolbar;
