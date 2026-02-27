import React, { useRef, useCallback } from 'react';
import { Nav, NavList, NavItem, NavGroup, Tooltip } from '@patternfly/react-core';
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { getIcon } from '../constants';

const NavigationList = ({
  navItems,
  isCollapsed,
  isCustomizing,
  isDragging,
  draggedItemId,
  draggedItemIndex,
  currentDropIndex,
  collapsedSections,
  agentSuggestedItems,
  animateItems = false,
  onClearAgentBadge,
  onNavDragStart,
  onNavDragEnd,
  onNavDragOver,
  onNavDrop,
  onToggleSectionCollapse
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const navContainerRef = useRef(null);

  // Helper to check if a nav item should be active (includes child routes)
  const isNavItemActive = (itemPath) => {
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + '/');
  };

  // Helper to determine slide direction for an item based on drag state
  const getSlideDirection = (itemIndex) => {
    if (draggedItemIndex === null || currentDropIndex === null) return null;
    if (itemIndex === draggedItemIndex) return null; // Don't slide the dragged item
    if (currentDropIndex === draggedItemIndex) return null; // No movement yet
    
    if (draggedItemIndex < currentDropIndex) {
      // Dragging down: items between original and current position slide up
      if (itemIndex > draggedItemIndex && itemIndex <= currentDropIndex) {
        return 'up';
      }
    } else if (draggedItemIndex > currentDropIndex) {
      // Dragging up: items between current and original position slide down
      if (itemIndex >= currentDropIndex && itemIndex < draggedItemIndex) {
        return 'down';
      }
    }
    return null;
  };

  // Check if a nav item has an agent-suggested badge
  const hasAgentBadge = (itemId) => agentSuggestedItems.includes(itemId);

  // Group items by sections for rendering
  const groupItemsBySection = (items) => {
    const groups = [];
    let currentGroup = { section: null, items: [] };
    
    items.forEach((item) => {
      if (item.type === 'section') {
        // Push current group if it has items
        if (currentGroup.items.length > 0 || currentGroup.section) {
          groups.push(currentGroup);
        }
        // Start a new group with this section
        currentGroup = { section: item, items: [] };
      } else {
        currentGroup.items.push(item);
      }
    });
    
    // Push the last group
    if (currentGroup.items.length > 0 || currentGroup.section) {
      groups.push(currentGroup);
    }
    
    return groups;
  };

  // Check if a section is collapsed
  const isSectionCollapsed = (sectionId) => collapsedSections.has(sectionId);

  if (isCollapsed) {
    // In collapsed mode, skip section headers and just show items
    return (
      <Nav aria-label="Nav">
        <NavList>
          {navItems.filter(item => item.type !== 'section').map((item) => (
            <Tooltip
              key={item.id}
              content={item.customLabel || item.displayName}
              position="right"
              enableFlip={true}
            >
              <NavItem
                itemId={item.path}
                isActive={isNavItemActive(item.path)}
                icon={getIcon(item.icon)}
                onClick={() => !isCustomizing && navigate(item.path)}
                style={{
                  '--pf-v6-c-nav__link--ColumnGap': '0',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              />
            </Tooltip>
          ))}
        </NavList>
      </Nav>
    );
  }

  // Group items by sections for expanded view
  const groups = groupItemsBySection(navItems);
  
  // Create a flat index map for drag/drop positioning
  let flatIndex = 0;
  const itemIndexMap = {};
  navItems.forEach((item) => {
    itemIndexMap[item.id] = flatIndex++;
  });

  return (
    <div
      ref={navContainerRef}
      onDragOver={onNavDragOver}
      onDrop={onNavDrop}
      style={{ height: '100%' }}
    >
      <Nav 
        aria-label="Nav" 
        className={isDragging ? 'apollo-nav-dragging-active' : ''}
      >
        {groups.map((group, groupIndex) => {
          const renderedNavItems = group.items.map((item) => {
            const itemIndex = itemIndexMap[item.id];
            const isBeingDragged = draggedItemId === item.id;
            const slideDirection = getSlideDirection(itemIndex);
            const slideClass = slideDirection === 'up' ? 'apollo-nav-item-slide-up' : 
                              slideDirection === 'down' ? 'apollo-nav-item-slide-down' : '';
            const hasBadge = hasAgentBadge(item.id);
            const animateClass = animateItems
              ? `apollo-nav-item-animate-in apollo-nav-animate-delay-${Math.min(itemIndex, 14)}`
              : '';
            return (
              <div
                key={item.id}
                className={`apollo-nav-item-draggable ${isBeingDragged ? 'apollo-nav-item-dragging' : ''} ${slideClass} ${animateClass}`}
                draggable={!isCollapsed && !isCustomizing}
                onDragStart={(e) => onNavDragStart(e, item, itemIndex)}
                onDragEnd={onNavDragEnd}
                onDragOver={onNavDragOver}
              >
                <NavItem
                  itemId={item.path}
                  isActive={isNavItemActive(item.path)}
                  icon={getIcon(item.icon)}
                  onClick={(e) => {
                    // Only navigate if we weren't dragging
                    if (!isDragging && !isCustomizing) {
                      // Clear the badge when user clicks on the item
                      if (hasBadge) {
                        onClearAgentBadge(item.id);
                      }
                      navigate(item.path);
                    }
                  }}
                  style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
                  className={hasBadge ? 'apollo-nav-item-with-badge' : ''}
                >
                  {item.customLabel || item.displayName}
                  {hasBadge && <span className="apollo-nav-agent-badge" />}
                </NavItem>
              </div>
            );
          });
          
          if (group.section) {
            const sectionIndex = itemIndexMap[group.section.id];
            const isCollapsed = isSectionCollapsed(group.section.id);
            const sectionAnimateClass = animateItems
              ? `apollo-nav-section-animate-in apollo-nav-animate-delay-${Math.min(sectionIndex, 14)}`
              : '';
            return (
              <NavGroup 
                key={group.section.id} 
                title={
                  <div className="apollo-nav-section-header">
                    <span className="apollo-nav-section-header-title">{group.section.title}</span>
                    <button
                      className="apollo-nav-section-collapse-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSectionCollapse(group.section.id);
                      }}
                      aria-label={isCollapsed ? `Expand ${group.section.title}` : `Collapse ${group.section.title}`}
                      title={isCollapsed ? 'Expand section' : 'Collapse section'}
                    >
                      {isCollapsed ? <AngleRightIcon /> : <AngleDownIcon />}
                    </button>
                  </div>
                }
                className={`apollo-nav-group ${isCollapsed ? 'apollo-nav-group-collapsed' : ''} ${sectionAnimateClass}`}
              >
                {!isCollapsed && renderedNavItems}
              </NavGroup>
            );
          }
          
          // Items without a section - render in a NavList
          return (
            <NavList key={`ungrouped-${groupIndex}`}>
              {renderedNavItems}
            </NavList>
          );
        })}
      </Nav>
    </div>
  );
};

export default NavigationList;
