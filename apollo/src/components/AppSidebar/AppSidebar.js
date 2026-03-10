import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageSidebar,
  PageSidebarBody,
  Nav,
  NavList,
  NavItem,
  Button,
  Tooltip
} from '@patternfly/react-core';
import { EditIcon, CheckIcon } from '@patternfly/react-icons';
import SidebarResizeHandle from './components/SidebarResizeHandle';
import SpacesSwitcher from './components/SpacesSwitcher';
import ProfileSelector from './components/ProfileSelector';
import NavigationList from './components/NavigationList';
import NavigationCustomizer from './components/NavigationCustomizer';
import PinnedConversations from './components/PinnedConversations';
import DockedConversations from './components/DockedConversations';
import { allAvailableItems, generateSectionId, generateCustomPageId } from './constants';

const AppSidebar = ({ 
  isCollapsed = false, 
  isHidden = false, 
  pinnedConversations = [], 
  onUnpinConversation, 
  onCloseConversation, 
  onSpaceChange,
  sidebarWidth = 250,
  onSidebarResize,
  agentSuggestedItems = [],
  onClearAgentSuggestion,
  dockedConversations = [],
  onFloatDockedConversation,
  onCloseDockedConversation,
  onDockedFollowUp,
  navPosition = 'left'
}) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);
  
  // Space state
  const [spaces, setSpaces] = useState([]);
  const [activeSpaceId, setActiveSpaceId] = useState('default');
  
  // Profile state
  const [selectedProfile, setSelectedProfile] = useState('personal');
  
  // Nav state
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Section editing state
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  
  // Section collapse state - tracks which sections are collapsed
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  
  // Drag-and-drop state for nav reordering (always available)
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [currentDropIndex, setCurrentDropIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Animation state for new space nav items
  const [animateNavItems, setAnimateNavItems] = useState(false);

  // Load spaces from API
  useEffect(() => {
    fetchSpaces();
  }, []);

  // Listen for space updates from other pages (e.g. CreateSpaceSetup)
  useEffect(() => {
    const handleSpacesUpdated = () => fetchSpaces();
    window.addEventListener('apollo-spaces-updated', handleSpacesUpdated);
    return () => window.removeEventListener('apollo-spaces-updated', handleSpacesUpdated);
  }, []);

  // Listen for nav animation trigger (from CreateSpaceSetup)
  useEffect(() => {
    const handleNavAnimate = () => {
      setAnimateNavItems(true);
      // Clear animation flag after items have settled (longest delay + animation duration)
      setTimeout(() => setAnimateNavItems(false), 1200);
    };
    window.addEventListener('apollo-nav-animate', handleNavAnimate);
    return () => window.removeEventListener('apollo-nav-animate', handleNavAnimate);
  }, []);

  // Scroll to the active space after initial load
  useEffect(() => {
    if (!loading && spaces.length > 0 && scrollContainerRef.current) {
      const spaceIndex = spaces.findIndex(s => s.id === activeSpaceId);
      if (spaceIndex > 0) {
        const timer = setTimeout(() => {
          if (scrollContainerRef.current) {
            const scrollAmount = spaceIndex * scrollContainerRef.current.offsetWidth;
            isProgrammaticScrollRef.current = true;
            scrollContainerRef.current.scrollTo({
              left: scrollAmount,
              behavior: 'instant'
            });
            setTimeout(() => {
              isProgrammaticScrollRef.current = false;
            }, 50);
          }
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, activeSpaceId, spaces.length]);

  const fetchSpaces = async () => {
    try {
      const response = await fetch('/api/spaces');
      if (response.ok) {
        const data = await response.json();
        setSpaces(data.spaces || []);
        const spaceId = data.activeSpaceId || 'default';
        setActiveSpaceId(spaceId);
        if (onSpaceChange) {
          const initialSpace = (data.spaces || []).find(s => s.id === spaceId);
          onSpaceChange(spaceId, initialSpace?.items || [], initialSpace || null);
        }
      }
    } catch (error) {
      console.error('Error loading spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpaceChange = async (spaceId) => {
    try {
      const response = await fetch('/api/spaces/active', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId })
      });
      if (response.ok) {
        setActiveSpaceId(spaceId);
        if (onSpaceChange) {
          const space = spaces.find(s => s.id === spaceId);
          onSpaceChange(spaceId, space?.items || [], space || null);
        }
        scrollToSpace(spaceId);
      }
    } catch (error) {
      console.error('Error setting active space:', error);
    }
  };

  const scrollToSpace = (spaceId) => {
    if (scrollContainerRef.current) {
      const spaceIndex = spaces.findIndex(s => s.id === spaceId);
      if (spaceIndex !== -1) {
        const scrollAmount = spaceIndex * scrollContainerRef.current.offsetWidth;
        isProgrammaticScrollRef.current = true;
        scrollContainerRef.current.scrollTo({
          left: scrollAmount,
          behavior: 'smooth'
        });
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 500);
      }
    }
  };

  const handleScroll = () => {
    if (isProgrammaticScrollRef.current) {
      return;
    }
    
    if (isCustomizing) {
      return;
    }
    
    if (scrollContainerRef.current && !loading) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const index = Math.round(scrollLeft / containerWidth);
      
      if (spaces[index] && spaces[index].id !== activeSpaceId) {
        handleSpaceChange(spaces[index].id);
      }
    }
  };

  const activeSpace = spaces.find(s => s.id === activeSpaceId) || spaces[0];
  const navItems = activeSpace?.items || [];

  const saveNavConfig = async (items) => {
    if (!activeSpace) return;
    
    try {
      const response = await fetch(`/api/spaces/${activeSpace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (response.ok) {
        const updatedSpaces = spaces.map(s => 
          s.id === activeSpace.id ? { ...s, items } : s
        );
        setSpaces(updatedSpaces);
      }
    } catch (error) {
      console.error('Error saving navigation config:', error);
    }
  };

  const toggleCustomize = () => {
    if (isCustomizing && activeSpace) {
      const updatedItems = navItems.map((item, index) => ({
        ...item,
        order: index
      }));
      saveNavConfig(updatedItems);
    }
    setIsCustomizing(!isCustomizing);
  };

  const removeNavItem = async (itemId) => {
    if (!activeSpace) return;
    
    const updatedItems = navItems.filter(item => item.id !== itemId);
    const reorderedItems = updatedItems.map((item, index) => ({
      ...item,
      order: index
    }));
    
    const updatedSpaces = spaces.map(s => 
      s.id === activeSpace.id ? { ...s, items: reorderedItems } : s
    );
    setSpaces(updatedSpaces);
    
    await saveNavConfig(reorderedItems);
  };

  const addNavItem = async (item) => {
    if (!activeSpace) return;
    
    if (navItems.some(navItem => navItem.id === item.id)) return;
    
    const newItem = {
      ...item,
      order: navItems.length
    };
    
    const updatedItems = [...navItems, newItem];
    
    const updatedSpaces = spaces.map(s => 
      s.id === activeSpace.id ? { ...s, items: updatedItems } : s
    );
    setSpaces(updatedSpaces);
    
    await saveNavConfig(updatedItems);
  };

  const addCustomPage = async (customPage) => {
    if (!activeSpace) return;

    const newItem = {
      ...customPage,
      order: navItems.length
    };

    const updatedItems = [...navItems, newItem];

    const updatedSpaces = spaces.map(s =>
      s.id === activeSpace.id ? { ...s, items: updatedItems } : s
    );
    setSpaces(updatedSpaces);

    await saveNavConfig(updatedItems);
  };

  const getAvailableItems = () => {
    const currentIds = navItems.filter(item => item.type !== 'section').map(item => item.id);
    return allAvailableItems.filter(item => !currentIds.includes(item.id));
  };

  const addSection = async (title = 'New Section') => {
    if (!activeSpace) return;
    
    const newSection = {
      id: generateSectionId(),
      type: 'section',
      title: title,
      order: navItems.length
    };
    
    const updatedItems = [...navItems, newSection];
    
    const updatedSpaces = spaces.map(s => 
      s.id === activeSpace.id ? { ...s, items: updatedItems } : s
    );
    setSpaces(updatedSpaces);
    
    await saveNavConfig(updatedItems);
    
    setEditingSectionId(newSection.id);
    setEditingSectionTitle(title);
  };

  const renameSection = async (sectionId, newTitle) => {
    if (!activeSpace || !newTitle.trim()) return;
    
    const updatedItems = navItems.map(item => 
      item.id === sectionId ? { ...item, title: newTitle.trim() } : item
    );
    
    const updatedSpaces = spaces.map(s => 
      s.id === activeSpace.id ? { ...s, items: updatedItems } : s
    );
    setSpaces(updatedSpaces);
    
    await saveNavConfig(updatedItems);
    
    setEditingSectionId(null);
    setEditingSectionTitle('');
  };

  const removeSection = async (sectionId) => {
    if (!activeSpace) return;
    
    const updatedItems = navItems.filter(item => item.id !== sectionId);
    const reorderedItems = updatedItems.map((item, index) => ({
      ...item,
      order: index
    }));
    
    const updatedSpaces = spaces.map(s => 
      s.id === activeSpace.id ? { ...s, items: reorderedItems } : s
    );
    setSpaces(updatedSpaces);
    
    await saveNavConfig(reorderedItems);
  };

  const startEditingSection = (section) => {
    setEditingSectionId(section.id);
    setEditingSectionTitle(section.title);
  };

  const cancelEditingSection = () => {
    setEditingSectionId(null);
    setEditingSectionTitle('');
  };

  const finishEditingSection = (sectionId, title) => {
    if (sectionId && title.trim()) {
      renameSection(sectionId, title);
    } else {
      cancelEditingSection();
    }
  };

  const toggleSectionCollapse = (sectionId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const clearAgentBadge = (itemId) => {
    if (onClearAgentSuggestion) {
      onClearAgentSuggestion(itemId);
    }
  };

  const onDrop = (event, reorderedItems, oldIndex, newIndex) => {
    const updatedNavItems = reorderedItems.map((item, index) => {
      const originalItem = navItems.find(navItem => navItem.id === item.id);
      return { ...originalItem, order: index };
    });
    
    const updatedSpaces = spaces.map(s => 
      s.id === activeSpace.id ? { ...s, items: updatedNavItems } : s
    );
    setSpaces(updatedSpaces);
  };

  const handleNavDragStart = useCallback((e, item, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    
    setDraggedItemId(item.id);
    setDraggedItemIndex(index);
    setCurrentDropIndex(index);
    setIsDragging(true);
  }, []);

  const handleNavDragEnd = useCallback((e) => {
    if (draggedItemId && currentDropIndex !== null && draggedItemIndex !== null && 
        currentDropIndex !== draggedItemIndex && activeSpace) {
      const currentItems = [...navItems];
      const dragFromIndex = draggedItemIndex;
      const dragToIndex = currentDropIndex;

      if (dragFromIndex !== -1 && dragToIndex !== -1 && dragFromIndex !== dragToIndex) {
        const [draggedItem] = currentItems.splice(dragFromIndex, 1);
        currentItems.splice(dragToIndex, 0, draggedItem);

        const reorderedItems = currentItems.map((item, idx) => ({
          ...item,
          order: idx
        }));

        const updatedSpaces = spaces.map(s => 
          s.id === activeSpace.id ? { ...s, items: reorderedItems } : s
        );
        setSpaces(updatedSpaces);

        saveNavConfig(reorderedItems);
      }
    }
    
    setDraggedItemId(null);
    setDraggedItemIndex(null);
    setCurrentDropIndex(null);
    
    setTimeout(() => {
      setIsDragging(false);
    }, 50);
  }, [draggedItemId, draggedItemIndex, currentDropIndex, navItems, activeSpace, spaces, saveNavConfig]);

  const handleNavDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedItemIndex === null) return;
    
    const navContainer = e.currentTarget;
    const containerRect = navContainer.getBoundingClientRect();
    const mouseY = e.clientY - containerRect.top + navContainer.scrollTop;
    const itemHeight = 40;
    
    let targetIndex = Math.floor((mouseY + itemHeight / 2) / itemHeight);
    targetIndex = Math.max(0, Math.min(targetIndex, navItems.length - 1));
    
    if (targetIndex !== currentDropIndex) {
      setCurrentDropIndex(targetIndex);
    }
  }, [draggedItemIndex, currentDropIndex, navItems.length]);

  const handleNavDrop = useCallback((e) => {
    e.preventDefault();
  }, []);

  if (loading) {
    return (
      <PageSidebar isSidebarOpen={!isHidden}>
        <PageSidebarBody>
          <Nav aria-label="Nav">
            <NavList>
              <NavItem>Loading...</NavItem>
            </NavList>
          </Nav>
        </PageSidebarBody>
      </PageSidebar>
    );
  }

  // Filter conversations for unified display
  const spacePinnedConversations = pinnedConversations.filter(
    chat => chat.spaceId === activeSpaceId || (!chat.spaceId && activeSpaceId === 'default')
  );
  const totalConversations = dockedConversations.length + spacePinnedConversations.length;

  // Navigation content for a single space
  const renderNavContent = (spaceItems, spaceId) => {
    const isActiveSpace = spaceId === activeSpaceId;
    const availableItems = getAvailableItems();
    
    if (isCustomizing && isActiveSpace) {
      return (
        <NavigationCustomizer
          navItems={spaceItems}
          availableItems={availableItems}
          editingSectionId={editingSectionId}
          editingSectionTitle={editingSectionTitle}
          onRemoveItem={removeNavItem}
          onAddItem={addNavItem}
          onAddCustomPage={addCustomPage}
          onAddSection={addSection}
          onRemoveSection={removeSection}
          onStartEditingSection={startEditingSection}
          onFinishEditingSection={finishEditingSection}
          onCancelEditingSection={cancelEditingSection}
          onSectionTitleChange={setEditingSectionTitle}
          onDrop={onDrop}
        />
      );
    }
    
    return (
      <NavigationList
        navItems={spaceItems}
        isCollapsed={isCollapsed}
        isCustomizing={isCustomizing}
        isDragging={isDragging}
        draggedItemId={draggedItemId}
        draggedItemIndex={draggedItemIndex}
        currentDropIndex={currentDropIndex}
        collapsedSections={collapsedSections}
        agentSuggestedItems={agentSuggestedItems}
        animateItems={isActiveSpace && animateNavItems}
        onClearAgentBadge={clearAgentBadge}
        onNavDragStart={handleNavDragStart}
        onNavDragEnd={handleNavDragEnd}
        onNavDragOver={handleNavDragOver}
        onNavDrop={handleNavDrop}
        onToggleSectionCollapse={toggleSectionCollapse}
      />
    );
  };

  if (isHidden) {
    return (
      <PageSidebar style={{ display: 'none' }}>
        <PageSidebarBody />
      </PageSidebar>
    );
  }

  return (
    <PageSidebar isSidebarOpen={!isHidden}>
      <PageSidebarBody style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Resize handle */}
        <SidebarResizeHandle
          isCollapsed={isCollapsed}
          isHidden={isHidden}
          sidebarWidth={sidebarWidth}
          onSidebarResize={onSidebarResize}
          navPosition={navPosition}
        />
        
        {/* Space Switcher at the top */}
        <div style={{
          padding: isCollapsed ? '8px 4px' : '8px 16px 12px 16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <SpacesSwitcher
              isCollapsed={isCollapsed}
              spaces={spaces}
              activeSpaceId={activeSpaceId}
              activeSpace={activeSpace}
              onSpaceChange={handleSpaceChange}
              onSpacesUpdate={setSpaces}
              navigate={navigate}
            />
            
            <ProfileSelector
              isCollapsed={isCollapsed}
              selectedProfile={selectedProfile}
              onProfileChange={setSelectedProfile}
            />
          </div>
        </div>
        
        {/* All conversations - unified section */}
        {totalConversations > 0 && !isCollapsed && (
          <div className="apollo-pinned-conversations">
            <div className="apollo-pinned-section-header">
              <span>Conversations</span>
            </div>
            <DockedConversations
              dockedConversations={dockedConversations}
              isCollapsed={isCollapsed}
              sidebarWidth={sidebarWidth}
              onFloatDockedConversation={onFloatDockedConversation}
              onCloseDockedConversation={onCloseDockedConversation}
              onDockedFollowUp={onDockedFollowUp}
            />
            <PinnedConversations
              pinnedConversations={pinnedConversations}
              isCollapsed={isCollapsed}
              sidebarWidth={sidebarWidth}
              activeSpaceId={activeSpaceId}
              onUnpinConversation={onUnpinConversation}
              onCloseConversation={onCloseConversation}
            />
          </div>
        )}
        
        {/* Horizontal scroll snap container for spaces */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            display: 'flex',
            overflowX: isCustomizing ? 'hidden' : 'auto',
            overflowY: 'hidden',
            scrollSnapType: isCustomizing ? 'none' : 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <style>
            {`
              .space-scroll-container::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          {spaces.map((space) => (
            <div
              key={space.id}
              style={{
                flex: '0 0 100%',
                scrollSnapAlign: 'start',
                overflowY: 'auto',
                height: '100%'
              }}
            >
              {renderNavContent(space.items || [], space.id)}
            </div>
          ))}
        </div>
        
        {/* Space indicator dots */}
        {spaces.length > 1 && !isCollapsed && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px',
            borderTop: '1px solid var(--pf-t--global--border--color--default)'
          }}>
            {spaces.map((space) => (
              <button
                key={space.id}
                onClick={() => handleSpaceChange(space.id)}
                title={space.name}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  border: 'none',
                  background: space.id === activeSpaceId 
                    ? 'var(--pf-t--global--color--brand--default)' 
                    : 'var(--pf-t--global--border--color--default)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0
                }}
                aria-label={`Switch to ${space.name}`}
              />
            ))}
          </div>
        )}
        
        {/* Customize button at the bottom */}
        <div style={{ 
          padding: isCollapsed ? '16px 8px' : '16px', 
          borderTop: '1px solid var(--pf-t--global--border--color--default)',
          marginTop: 'auto'
        }}>
          {isCollapsed ? (
            <Tooltip content={isCustomizing ? 'Done' : 'Customization'} position="right">
              <Button
                variant="link"
                icon={isCustomizing ? <CheckIcon /> : <EditIcon />}
                onClick={toggleCustomize}
                isBlock
                aria-label={isCustomizing ? 'Done' : 'Customization'}
                style={{ padding: '8px', minWidth: 'auto' }}
              />
            </Tooltip>
          ) : (
            <Button
              variant="link"
              icon={isCustomizing ? <CheckIcon /> : <EditIcon />}
              onClick={toggleCustomize}
              isBlock
            >
              {isCustomizing ? 'Done' : 'Customization'}
            </Button>
          )}
        </div>
      </PageSidebarBody>
    </PageSidebar>
  );
};

export default AppSidebar;
