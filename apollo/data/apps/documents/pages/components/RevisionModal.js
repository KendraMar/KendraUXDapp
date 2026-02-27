import React from 'react';
import {
  Modal,
  ModalVariant,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Content,
  Title,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  SimpleList,
  SimpleListItem,
  Split,
  SplitItem,
  Spinner
} from '@patternfly/react-core';
import {
  UndoIcon
} from '@patternfly/react-icons';

const RevisionModal = ({
  isOpen,
  onClose,
  revisions,
  revisionsLoading,
  selectedRevision,
  revisionContent,
  onRevisionSelect,
  onRestoreRevision,
  onCreateSnapshot,
  isRestoringRevision
}) => {
  return (
    <Modal
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="revision-history-modal-title"
      aria-describedby="revision-history-modal-body"
    >
      <ModalHeader title="Revision History" />
      <ModalBody id="revision-history-modal-body">
        {revisionsLoading ? (
          <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: '2rem' }}>
            <Spinner size="lg" />
          </Flex>
        ) : revisions.length === 0 ? (
          <EmptyState variant="sm">
            <Title headingLevel="h4" size="md">No revisions yet</Title>
            <EmptyStateBody>
              Revisions are created automatically every 5 minutes while editing.
              You can also create a snapshot manually.
            </EmptyStateBody>
            <Button variant="primary" onClick={onCreateSnapshot}>
              Create Snapshot Now
            </Button>
          </EmptyState>
        ) : (
          <Split hasGutter>
            <SplitItem style={{ width: '280px', flexShrink: 0 }}>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={onCreateSnapshot}
                    style={{ width: '100%' }}
                  >
                    Create Snapshot
                  </Button>
                </FlexItem>
                <FlexItem>
                  <div style={{ 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                    border: '1px solid var(--pf-v6-global--BorderColor--100)',
                    borderRadius: '4px'
                  }}>
                    <SimpleList>
                      {revisions.map((revision) => (
                        <SimpleListItem
                          key={revision.id}
                          isActive={selectedRevision === revision.id}
                          onClick={() => onRevisionSelect(revision.id)}
                        >
                          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
                            <FlexItem>
                              <Content component="small" style={{ fontWeight: 500 }}>
                                {new Date(revision.savedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </Content>
                            </FlexItem>
                            <FlexItem>
                              <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                                {new Date(revision.savedAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Content>
                            </FlexItem>
                          </Flex>
                        </SimpleListItem>
                      ))}
                    </SimpleList>
                  </div>
                </FlexItem>
              </Flex>
            </SplitItem>
            <SplitItem isFilled>
              {selectedRevision && revisionContent ? (
                <div style={{
                  border: '1px solid var(--pf-v6-global--BorderColor--100)',
                  borderRadius: '4px',
                  padding: '1rem',
                  background: 'var(--pf-v6-global--BackgroundColor--200)',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  <div>
                    <Content component="h4" style={{ marginBottom: '0.5rem' }}>
                      {revisionContent.title}
                    </Content>
                    <Content component="small" style={{ 
                      color: 'var(--pf-v6-global--Color--200)',
                      display: 'block',
                      marginBottom: '1rem'
                    }}>
                      Saved at {new Date(revisionContent.savedAt).toLocaleString()}
                    </Content>
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      margin: 0
                    }}>
                      {revisionContent.content || '(empty document)'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  color: 'var(--pf-v6-global--Color--200)'
                }}>
                  Select a revision to preview
                </div>
              )}
            </SplitItem>
          </Split>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          icon={<UndoIcon />}
          onClick={onRestoreRevision}
          isDisabled={!selectedRevision || isRestoringRevision}
          isLoading={isRestoringRevision}
        >
          Restore This Revision
        </Button>
        <Button
          variant="link"
          onClick={onClose}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RevisionModal;
