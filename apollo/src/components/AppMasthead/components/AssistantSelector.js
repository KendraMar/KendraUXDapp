import React from 'react';
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  TextInput,
  Spinner,
  Tabs,
  Tab,
  TabTitleText
} from '@patternfly/react-core';
import { RobotIcon, CheckIcon } from '@patternfly/react-icons';

const AssistantSelector = ({
  isOpen,
  onToggle,
  onOpenChange,
  agentsLoading,
  activeAssistant,
  assistantFilter,
  setAssistantFilter,
  assistantTab,
  setAssistantTab,
  allItems,
  onSelect
}) => {
  const filteredItems = React.useMemo(() => {
    return allItems.filter(item => {
      // Filter by tab
      if (assistantTab === 'people' && item.type !== 'person') return false;
      if (assistantTab === 'agents' && item.type !== 'agent') return false;
      // Filter by search text
      if (assistantFilter) {
        const searchLower = assistantFilter.toLowerCase();
        return item.name.toLowerCase().includes(searchLower) || 
               item.description.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [allItems, assistantTab, assistantFilter]);

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={() => {}}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setAssistantFilter('');
        }
      }}
      popperProps={{ position: 'start' }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onToggle}
          isExpanded={isOpen}
          variant="plain"
          aria-label="Select assistant"
          className="masthead-assistant-toggle"
        >
          {agentsLoading ? (
            <Spinner size="sm" />
          ) : activeAssistant?.type === 'person' ? (
            <span 
              className="masthead-assistant-avatar masthead-person-avatar"
              style={{ backgroundColor: activeAssistant.color }}
            >
              {activeAssistant.initials}
            </span>
          ) : activeAssistant ? (
            <img 
              src={activeAssistant.avatar} 
              alt={activeAssistant.name} 
              className={`masthead-assistant-avatar${activeAssistant.isCursorCli ? ' masthead-assistant-avatar--mono' : ''}`}
            />
          ) : (
            <RobotIcon />
          )}
        </MenuToggle>
      )}
    >
      <div className="assistant-dropdown-content">
        {/* Filter Input */}
        <div className="assistant-filter-bar">
          <TextInput
            value={assistantFilter}
            onChange={(e, val) => setAssistantFilter(val)}
            placeholder="Filter by name..."
            aria-label="Filter assistants and people"
            className="assistant-filter-input"
          />
        </div>
        
        {/* Tab Bar */}
        <Tabs 
          activeKey={assistantTab} 
          onSelect={(e, key) => setAssistantTab(key)}
          aria-label="Filter tabs"
          className="assistant-tabs"
          isFilled
        >
          <Tab eventKey="all" title={<TabTitleText>All</TabTitleText>} />
          <Tab eventKey="people" title={<TabTitleText>People</TabTitleText>} />
          <Tab eventKey="agents" title={<TabTitleText>Agents</TabTitleText>} />
        </Tabs>
        
        {/* Filtered List */}
        <DropdownList className="assistant-dropdown-list">
          {filteredItems.map((item) => (
            <DropdownItem 
              key={item.id}
              onClick={() => onSelect(item)}
              icon={
                item.type === 'person' ? (
                  <span 
                    className="assistant-dropdown-person-avatar"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.initials}
                  </span>
                ) : (
                  <img 
                    src={item.avatar} 
                    alt={item.name} 
                    className={item.isCursorCli ? 'masthead-assistant-avatar--mono' : ''}
                    style={{ width: '24px', height: '24px' }}
                  />
                )
              }
              description={item.description}
            >
              {item.name}
              {activeAssistant?.id === item.id && (
                <CheckIcon style={{ marginLeft: '8px', color: 'var(--pf-t--global--color--brand--default)' }} />
              )}
            </DropdownItem>
          ))}
          {filteredItems.length === 0 && (
            <div className="assistant-dropdown-empty">
              No results found
            </div>
          )}
        </DropdownList>
      </div>
    </Dropdown>
  );
};

export default AssistantSelector;
