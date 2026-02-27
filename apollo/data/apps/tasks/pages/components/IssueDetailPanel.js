import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Card,
  CardBody,
  Label,
  Content,
  Flex,
  FlexItem,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  Divider,
  Button,
  Tooltip,
  Title,
  Dropdown,
  DropdownList,
  DropdownItem
} from '@patternfly/react-core';
import {
  StarIcon,
  OutlinedStarIcon,
  FlagIcon,
  OutlinedFlagIcon,
  PencilAltIcon,
  TrashIcon,
  EllipsisVIcon
} from '@patternfly/react-icons';
import { getPriorityColor, getPriorityIcon, getStatusColor, flagColors } from '../utils/taskHelpers';
import { shiftMarkdownHeadings } from '../utils/taskFormatters';

const IssueDetailPanel = ({ 
  selectedIssue, 
  summarizing, 
  summaryError, 
  generateSummary,
  onEdit,
  onDelete,
  onToggleStar,
  onSetFlag
}) => {
  const [isKebabOpen, setIsKebabOpen] = useState(false);
  const [isFlagSelectOpen, setIsFlagSelectOpen] = useState(false);

  // Flag colors for this component
  const detailFlagColors = flagColors;

  const onKebabToggle = () => {
    setIsKebabOpen(!isKebabOpen);
  };

  const onKebabSelect = () => {
    setIsKebabOpen(false);
  };

  // Process markdown description with shifted headings
  const renderedDescription = useMemo(() => {
    if (!selectedIssue.description) return null;
    
    // Shift heading levels (H1 -> H3, H2 -> H4, etc.)
    const shiftedMarkdown = shiftMarkdownHeadings(selectedIssue.description, 2);
    
    // Configure marked for safe rendering
    const html = marked(shiftedMarkdown, {
      breaks: true,
      gfm: true
    });
    
    // Sanitize the HTML output
    return DOMPurify.sanitize(html);
  }, [selectedIssue.description]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
              {selectedIssue.priority && (
                <FlexItem>
                  <Label 
                    color={getPriorityColor(selectedIssue.priority)} 
                    icon={getPriorityIcon(selectedIssue.priority)}
                  >
                    {selectedIssue.priority}
                  </Label>
                </FlexItem>
              )}
              {selectedIssue.status && (
                <FlexItem>
                  <Label color={getStatusColor(selectedIssue.status)}>
                    {selectedIssue.status}
                  </Label>
                </FlexItem>
              )}
              {selectedIssue.issueType && (
                <FlexItem>
                  <Label color="grey">
                    {selectedIssue.issueType}
                  </Label>
                </FlexItem>
              )}
            </Flex>
          </FlexItem>
          <FlexItem>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsFlexStart' }}>
              <FlexItem flex={{ default: 'flex_1' }}>
                <Title headingLevel="h2" size="xl">
                  {selectedIssue.summary}
                </Title>
              </FlexItem>
              {selectedIssue.source === 'local' && (
                <FlexItem>
                  <Dropdown
                    isOpen={isKebabOpen}
                    onSelect={onKebabSelect}
                    onOpenChange={(isOpen) => setIsKebabOpen(isOpen)}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        aria-label="Task actions"
                        variant="plain"
                        onClick={onKebabToggle}
                        isExpanded={isKebabOpen}
                      >
                        <EllipsisVIcon />
                      </MenuToggle>
                    )}
                    popperProps={{ position: 'right' }}
                  >
                    <DropdownList>
                      <DropdownItem
                        key="edit"
                        icon={<PencilAltIcon />}
                        onClick={() => onEdit(selectedIssue)}
                      >
                        Edit task
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        icon={<TrashIcon />}
                        onClick={() => onDelete(selectedIssue)}
                        style={{ color: 'var(--pf-v6-global--danger-color--100)' }}
                      >
                        Delete task
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </FlexItem>
              )}
            </Flex>
          </FlexItem>
          <FlexItem>
            <Content style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem' }}>
              <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                  <strong>{selectedIssue.key}</strong>
                </FlexItem>
                {selectedIssue.created && (
                  <>
                    <FlexItem>•</FlexItem>
                    <FlexItem>Created: {new Date(selectedIssue.created).toLocaleDateString()}</FlexItem>
                  </>
                )}
                {selectedIssue.updated && (
                  <>
                    <FlexItem>•</FlexItem>
                    <FlexItem>Updated: {new Date(selectedIssue.updated).toLocaleDateString()}</FlexItem>
                  </>
                )}
                {selectedIssue.due && (
                  <>
                    <FlexItem>•</FlexItem>
                    <FlexItem>Due: {new Date(selectedIssue.due).toLocaleDateString()}</FlexItem>
                  </>
                )}
              </Flex>
            </Content>
          </FlexItem>
          <FlexItem>
            <Content style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem' }}>
              <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }} wrap={{ default: 'wrap' }}>
                {selectedIssue.reporter && (
                  <FlexItem>Reporter: {selectedIssue.reporter}</FlexItem>
                )}
                {selectedIssue.assignee && (
                  <>
                    {selectedIssue.reporter && <FlexItem>•</FlexItem>}
                    <FlexItem>Assignee: {selectedIssue.assignee}</FlexItem>
                  </>
                )}
                {selectedIssue.project && (
                  <>
                    {(selectedIssue.reporter || selectedIssue.assignee) && <FlexItem>•</FlexItem>}
                    <FlexItem>Project: {selectedIssue.project}</FlexItem>
                  </>
                )}
              </Flex>
            </Content>
          </FlexItem>
          {selectedIssue.labels && selectedIssue.labels.length > 0 && (
            <FlexItem>
              <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem' }}>Labels:</FlexItem>
                {selectedIssue.labels.map((label, idx) => (
                  <FlexItem key={idx}>
                    <Label color="purple" isCompact>
                      {label}
                    </Label>
                  </FlexItem>
                ))}
              </Flex>
            </FlexItem>
          )}
          {/* Star and Flag controls for local tasks */}
          {selectedIssue.source === 'local' && (
            <FlexItem>
              <Flex spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsCenter' }}>
                {/* Star toggle */}
                <FlexItem>
                  <Tooltip content={selectedIssue.starred ? 'Remove star' : 'Add star'}>
                    <Button
                      variant="plain"
                      onClick={(e) => onToggleStar(selectedIssue, e)}
                      style={{ 
                        padding: '4px 8px',
                        color: selectedIssue.starred ? '#f0ab00' : 'var(--pf-v6-global--Color--200)'
                      }}
                      aria-label={selectedIssue.starred ? 'Starred' : 'Not starred'}
                    >
                      {selectedIssue.starred ? <StarIcon /> : <OutlinedStarIcon />}
                      <span style={{ marginLeft: '4px', fontSize: '0.875rem' }}>
                        {selectedIssue.starred ? 'Starred' : 'Star'}
                      </span>
                    </Button>
                  </Tooltip>
                </FlexItem>
                {/* Flag selector */}
                <FlexItem>
                  <Select
                    isOpen={isFlagSelectOpen}
                    selected={selectedIssue.flag || ''}
                    onSelect={(event, value) => {
                      onSetFlag(selectedIssue, value === 'none' ? null : value);
                      setIsFlagSelectOpen(false);
                    }}
                    onOpenChange={(isOpen) => setIsFlagSelectOpen(isOpen)}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsFlagSelectOpen(!isFlagSelectOpen)}
                        isExpanded={isFlagSelectOpen}
                        style={{ minWidth: '120px' }}
                      >
                        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            {selectedIssue.flag ? (
                              <FlagIcon style={{ color: detailFlagColors[selectedIssue.flag] }} />
                            ) : (
                              <OutlinedFlagIcon />
                            )}
                          </FlexItem>
                          <FlexItem>
                            {selectedIssue.flag ? selectedIssue.flag.charAt(0).toUpperCase() + selectedIssue.flag.slice(1) : 'Set flag'}
                          </FlexItem>
                        </Flex>
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      <SelectOption value="none">
                        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem><OutlinedFlagIcon /></FlexItem>
                          <FlexItem>No flag</FlexItem>
                        </Flex>
                      </SelectOption>
                      {['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'].map(color => (
                        <SelectOption key={color} value={color}>
                          <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem><FlagIcon style={{ color: detailFlagColors[color] }} /></FlexItem>
                            <FlexItem>{color.charAt(0).toUpperCase() + color.slice(1)}</FlexItem>
                          </Flex>
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </FlexItem>
              </Flex>
            </FlexItem>
          )}
          {selectedIssue.url && (
            <FlexItem>
              <a 
                href={selectedIssue.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  fontSize: '0.875rem',
                  color: 'var(--pf-v6-global--link--Color)'
                }}
              >
                View in Jira →
              </a>
            </FlexItem>
          )}
          {selectedIssue.source === 'local' && (
            <FlexItem>
              <Label color="gold" isCompact>
                Local Task
              </Label>
            </FlexItem>
          )}
        </Flex>
      </div>

      <Divider style={{ marginBottom: '1.5rem' }} />

      {/* AI Summary */}
      {selectedIssue.aiSummary ? (
        <Card isCompact style={{ marginBottom: '1.5rem', backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)' }}>
          <CardBody>
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <h3 style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 'bold',
                      color: 'var(--pf-v6-global--primary-color--100)',
                      margin: 0
                    }}>
                      AI Summary
                    </h3>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => generateSummary(selectedIssue.key)}
                      isLoading={summarizing}
                      isDisabled={summarizing}
                      icon={<StarIcon />}
                    >
                      Regenerate
                    </Button>
                  </FlexItem>
                </Flex>
              </FlexItem>
              <FlexItem>
                <Content style={{ fontSize: '0.95rem' }}>
                  {selectedIssue.aiSummary}
                </Content>
              </FlexItem>
            </Flex>
          </CardBody>
        </Card>
      ) : (
        <Card isCompact style={{ marginBottom: '1.5rem', backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)' }}>
          <CardBody>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem flex={{ default: 'flex_1' }}>
                <Content style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  No AI summary available for this issue
                </Content>
              </FlexItem>
              <FlexItem>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => generateSummary(selectedIssue.key)}
                  isLoading={summarizing}
                  isDisabled={summarizing}
                  icon={<StarIcon />}
                >
                  {summarizing ? 'Summarizing...' : 'Summarize with local AI'}
                </Button>
              </FlexItem>
            </Flex>
            {summaryError && (
              <Content style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--danger-color--100)', marginTop: '0.5rem' }}>
                Error: {summaryError}
              </Content>
            )}
          </CardBody>
        </Card>
      )}

      {/* Issue Details */}
      <Card>
        <CardBody>
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
            {renderedDescription && (
              <FlexItem>
                <div 
                  className="task-description-markdown"
                  dangerouslySetInnerHTML={{ __html: renderedDescription }}
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: '1.6'
                  }}
                />
              </FlexItem>
            )}

            {selectedIssue.components && selectedIssue.components.length > 0 && (
              <FlexItem>
                <h3 style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: 'bold',
                  marginBottom: '0.5rem'
                }}>
                  Components
                </h3>
                <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                  {selectedIssue.components.map((component, idx) => (
                    <FlexItem key={idx}>
                      <Label color="cyan" isCompact>
                        {component}
                      </Label>
                    </FlexItem>
                  ))}
                </Flex>
              </FlexItem>
            )}
          </Flex>
        </CardBody>
      </Card>
    </div>
  );
};

export default IssueDetailPanel;
