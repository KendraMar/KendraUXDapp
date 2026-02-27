import React, { useState, useEffect } from 'react';
import {
  Flex,
  FlexItem,
  ToggleGroup,
  ToggleGroupItem,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle
} from '@patternfly/react-core';
import {
  ThIcon,
  ListIcon,
  ColumnsIcon
} from '@patternfly/react-icons';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';

/**
 * CollectionLayout - Reusable component for pages that display collections
 * of items in either a card grid or a table/list view.
 *
 * Features:
 * - Toggle between card and list views
 * - Card view: configurable column count (2–6)
 * - List view: configurable density (compact / normal / spacious)
 * - All preferences persisted in localStorage per storageKey
 *
 * Props:
 * @param {string}   storageKey      Unique key for localStorage (e.g. 'canvas')
 * @param {Array}    items           Data array to display
 * @param {Function} renderCard      (item, index) => JSX — renders a single card (no grid wrapper needed)
 * @param {Array}    columns         [{ key, label, render: (item) => JSX, width? }] — table column defs
 * @param {Function} onItemClick     (item) => void — called when a table row or card is clicked
 * @param {JSX}      emptyState      JSX to display when items is empty
 * @param {JSX}      toolbarItems    Additional JSX rendered on the left side of the toolbar
 * @param {string}   defaultView     'card' | 'list' (default: 'card')
 * @param {number}   defaultColumns  Default card column count (default: 3)
 * @param {string}   defaultDensity  'compact' | 'normal' | 'spacious' (default: 'normal')
 */
const CollectionLayout = ({
  storageKey,
  items,
  renderCard,
  columns = [],
  onItemClick,
  emptyState,
  toolbarItems,
  defaultView = 'card',
  defaultColumns = 4,
  defaultDensity = 'normal'
}) => {
  const lsKey = `apollo-collection-${storageKey}`;

  // ── persisted state ──────────────────────────────────────────────
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem(`${lsKey}-view`);
    return saved === 'card' || saved === 'list' ? saved : defaultView;
  });

  const [cardColumns, setCardColumns] = useState(() => {
    const saved = parseInt(localStorage.getItem(`${lsKey}-columns`), 10);
    return saved >= 2 && saved <= 6 ? saved : defaultColumns;
  });

  const [tableDensity, setTableDensity] = useState(() => {
    const saved = localStorage.getItem(`${lsKey}-density`);
    return ['compact', 'normal', 'spacious'].includes(saved) ? saved : defaultDensity;
  });

  useEffect(() => { localStorage.setItem(`${lsKey}-view`, viewMode); }, [lsKey, viewMode]);
  useEffect(() => { localStorage.setItem(`${lsKey}-columns`, String(cardColumns)); }, [lsKey, cardColumns]);
  useEffect(() => { localStorage.setItem(`${lsKey}-density`, tableDensity); }, [lsKey, tableDensity]);

  // ── dropdown open state ──────────────────────────────────────────
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isDensityOpen, setIsDensityOpen] = useState(false);

  // ── density label map ────────────────────────────────────────────
  const densityLabels = { compact: 'Compact', normal: 'Normal', spacious: 'Spacious' };

  // ── spacious padding for table cells ─────────────────────────────
  const spaciousStyle = tableDensity === 'spacious'
    ? { padding: '1rem 1rem' }
    : undefined;

  // ── render ───────────────────────────────────────────────────────
  return (
    <>
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div
        className="collection-layout-toolbar"
        style={{
          flexShrink: 0,
          padding: '0.5rem 1.5rem',
          borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
        }}
      >
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          {toolbarItems && (
            <FlexItem flex={{ default: 'flex_1' }}>
              {toolbarItems}
            </FlexItem>
          )}
          <FlexItem align={{ default: 'alignRight' }}>
            <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
              {/* View toggle */}
              <FlexItem>
                <ToggleGroup aria-label="View mode">
                  <ToggleGroupItem
                    icon={<ThIcon />}
                    aria-label="Card view"
                    isSelected={viewMode === 'card'}
                    onChange={() => setViewMode('card')}
                  />
                  <ToggleGroupItem
                    icon={<ListIcon />}
                    aria-label="List view"
                    isSelected={viewMode === 'list'}
                    onChange={() => setViewMode('list')}
                  />
                </ToggleGroup>
              </FlexItem>

              {/* Settings dropdown — card columns or list density */}
              <FlexItem>
                {viewMode === 'card' ? (
                  <Dropdown
                    isOpen={isColumnsOpen}
                    onOpenChange={setIsColumnsOpen}
                    onSelect={() => setIsColumnsOpen(false)}
                    popperProps={{ position: 'right' }}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsColumnsOpen(!isColumnsOpen)}
                        isExpanded={isColumnsOpen}
                        variant="plainText"
                        icon={<ColumnsIcon />}
                        style={{ fontSize: '0.875rem' }}
                      >
                        {cardColumns}
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      {[2, 3, 4, 5, 6].map((n) => (
                        <DropdownItem
                          key={n}
                          onClick={() => setCardColumns(n)}
                          description={n === cardColumns ? 'Current' : undefined}
                        >
                          {n} columns
                        </DropdownItem>
                      ))}
                    </DropdownList>
                  </Dropdown>
                ) : (
                  <Dropdown
                    isOpen={isDensityOpen}
                    onOpenChange={setIsDensityOpen}
                    onSelect={() => setIsDensityOpen(false)}
                    popperProps={{ position: 'right' }}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsDensityOpen(!isDensityOpen)}
                        isExpanded={isDensityOpen}
                        variant="plainText"
                        style={{ fontSize: '0.875rem' }}
                      >
                        {densityLabels[tableDensity]}
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      {Object.entries(densityLabels).map(([key, label]) => (
                        <DropdownItem
                          key={key}
                          onClick={() => setTableDensity(key)}
                          description={key === tableDensity ? 'Current' : undefined}
                        >
                          {label}
                        </DropdownItem>
                      ))}
                    </DropdownList>
                  </Dropdown>
                )}
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </div>

      {/* ── Content area ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {items.length === 0 ? (
          emptyState
        ) : viewMode === 'card' ? (
          /* ── Card grid ─────────────────────────────────────────── */
          <div
            className="collection-card-grid"
            style={{
              gridTemplateColumns: `repeat(${cardColumns}, minmax(0, 1fr))`
            }}
          >
            {items.map((item, i) => (
              <div key={item.id || i}>
                {renderCard(item, i)}
              </div>
            ))}
          </div>
        ) : (
          /* ── Table / list view ─────────────────────────────────── */
          <Table
            aria-label="Collection table"
            variant={tableDensity === 'compact' ? 'compact' : undefined}
          >
            <Thead>
              <Tr>
                {columns.map((col) => (
                  <Th key={col.key} width={col.width}>{col.label}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {items.map((item, idx) => (
                <Tr
                  key={item.id || idx}
                  isClickable={!!onItemClick}
                  onRowClick={onItemClick ? () => onItemClick(item) : undefined}
                  style={onItemClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map((col) => (
                    <Td
                      key={col.key}
                      dataLabel={col.label}
                      style={spaciousStyle}
                    >
                      {col.render ? col.render(item) : item[col.key]}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </div>
    </>
  );
};

export default CollectionLayout;
