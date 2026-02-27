import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AlertActionCloseButton,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  ClipboardCopy,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  ExpandableSection,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  InputGroup,
  JumpLinks,
  JumpLinksItem,
  Label,
  MenuToggle,
  Modal,
  ModalVariant,
  PageSection,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Switch,
  Tab,
  TabTitleIcon,
  TabTitleText,
  Tabs,
  TextInput,
  Title,
  Tooltip,
  Truncate
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { 
  AngleDownIcon,
  AngleRightIcon,
  BellIcon,
  CheckCircleIcon,
  CheckIcon,
  CodeIcon,
  CommentIcon,
  EllipsisVIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  PencilAltIcon,
  PlayIcon,
  PlusCircleIcon,
  SyncAltIcon,
  TimesIcon,
  UserIcon,
  UsersIcon
} from '@patternfly/react-icons';

const RoleDeleted: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [isInstantEmailEnabled, setIsInstantEmailEnabled] = React.useState(true);
  const [isDailyDigestEnabled, setIsDailyDigestEnabled] = React.useState(false);
  const [isNotificationDrawerEnabled, setIsNotificationDrawerEnabled] = React.useState(true);
  const [isWorkspaceNotificationsEnabled, setIsWorkspaceNotificationsEnabled] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPersonalAutosaveEnabled, setIsPersonalAutosaveEnabled] = React.useState(true);
  const [isPersonalSaving, setIsPersonalSaving] = React.useState(false);
  const [isEmailOptionsOpen, setIsEmailOptionsOpen] = React.useState(false);
  const [isDrawerOptionsOpen, setIsDrawerOptionsOpen] = React.useState(false);
  const [isSlackOptionsOpen, setIsSlackOptionsOpen] = React.useState(false);
  const [isTeamsOptionsOpen, setIsTeamsOptionsOpen] = React.useState(false);
  const [isGChatOptionsOpen, setIsGChatOptionsOpen] = React.useState(false);
  const [isSplunkOptionsOpen, setIsSplunkOptionsOpen] = React.useState(false);
  const [isServiceNowOptionsOpen, setIsServiceNowOptionsOpen] = React.useState(false);
  const [isPagerDutyOptionsOpen, setIsPagerDutyOptionsOpen] = React.useState(false);
  const [isWebhooksOptionsOpen, setIsWebhooksOptionsOpen] = React.useState(false);
  const [isEmailRecipientDropdownOpen, setIsEmailRecipientDropdownOpen] = React.useState(false);
  
  // Toast and Modal states
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [rowToDelete, setRowToDelete] = React.useState<{id: string, type: string, name: string} | null>(null);
  
  // Row selection states
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  
  // Row options menu states
  const [openRowMenus, setOpenRowMenus] = React.useState<{[key: string]: boolean}>({});
  const [isEmailRecipientSelectOpen, setIsEmailRecipientSelectOpen] = React.useState(false);
  
  // Mock user group data for typeahead
  const userGroups = [
    'All Administrators',
    'Security Team',
    'DevOps Engineers',
    'Platform Managers',
    'Identity & Access Management',
    'System Administrators',
    'Cloud Operations',
    'Network Security',
    'Application Owners',
    'Database Administrators'
  ];
  // State for managing multiple rows and edit modes in workspace defaults tables
  const [emailRows, setEmailRows] = React.useState<any[]>([
    {
      id: 'email-default',
      recipient: 'Default access',
      type: 'User group',
      instantEmailEnabled: true,
      dailyDigestEnabled: true,
      isDefault: true
    }
  ]);
  const [drawerRows, setDrawerRows] = React.useState<any[]>([
    {
      id: 'drawer-default', 
      recipient: 'Default access',
      type: 'User group',
      isConsoleAlertsEnabled: true,
      isDefault: true
    }
  ]);
  const [slackRows, setSlackRows] = React.useState<any[]>([]);
  const [teamsRows, setTeamsRows] = React.useState<any[]>([]);
  const [gChatRows, setGChatRows] = React.useState<any[]>([]);
  const [splunkRows, setSplunkRows] = React.useState<any[]>([]);
  const [serviceNowRows, setServiceNowRows] = React.useState<any[]>([]);
  const [pagerDutyRows, setPagerDutyRows] = React.useState<any[]>([]);
  const [webhookRows, setWebhookRows] = React.useState<any[]>([]);
  const [editingEmailRowId, setEditingEmailRowId] = React.useState<string | null>(null);
  const [editingDrawerRowId, setEditingDrawerRowId] = React.useState<string | null>(null);
  const [editingSlackRowId, setEditingSlackRowId] = React.useState<string | null>(null);
  const [editingTeamsRowId, setEditingTeamsRowId] = React.useState<string | null>(null);
  const [editingGChatRowId, setEditingGChatRowId] = React.useState<string | null>(null);
  const [editingSplunkRowId, setEditingSplunkRowId] = React.useState<string | null>(null);
  const [editingServiceNowRowId, setEditingServiceNowRowId] = React.useState<string | null>(null);
  const [editingPagerDutyRowId, setEditingPagerDutyRowId] = React.useState<string | null>(null);
  const [editingWebhookRowId, setEditingWebhookRowId] = React.useState<string | null>(null);

  // Helper functions for adding new rows
  const handleAddEmailUserGroup = () => {
    const newRow = {
      id: `new-email-${Date.now()}`,
      recipient: '',
      type: 'User group',
      instantEmailEnabled: false, // Will be set to true when saved
      dailyDigestEnabled: false // Will be set to true when saved
    };
    setEmailRows(prev => [newRow, ...prev]);
    setEditingEmailRowId(newRow.id);
    setIsEmailRecipientDropdownOpen(false); // Close the dropdown
  };

  const handleAddDrawerRecipient = () => {
    const newRow = {
      id: `new-drawer-${Date.now()}`,
      recipient: '',
      type: 'User group',
      isConsoleAlertsEnabled: false // Will be set to true when saved
    };
    setDrawerRows(prev => [newRow, ...prev]);
    setEditingDrawerRowId(newRow.id);
  };

  const handleAddSlackRecipient = () => {
    const newRow = {
      id: `new-slack-${Date.now()}`,
      recipient: '',
      endpointUrl: '',
      isEnabled: false // Will be set to true when saved
    };
    setSlackRows(prev => [newRow, ...prev]);
    setEditingSlackRowId(newRow.id);
  };

  const handleAddTeamsRecipient = () => {
    const newRow = {
      id: `new-teams-${Date.now()}`,
      recipient: '',
      endpointUrl: '',
      isEnabled: false // Will be set to true when saved
    };
    setTeamsRows(prev => [newRow, ...prev]);
    setEditingTeamsRowId(newRow.id);
  };

  const handleAddGChatRecipient = () => {
    const newRow = {
      id: `new-gchat-${Date.now()}`,
      recipient: '',
      endpointUrl: '',
      isEnabled: false // Will be set to true when saved
    };
    setGChatRows(prev => [newRow, ...prev]);
    setEditingGChatRowId(newRow.id);
  };

  const handleAddSplunkRecipient = () => {
    const newRow = {
      id: `new-splunk-${Date.now()}`,
      recipient: '',
      endpointUrl: '',
      isEnabled: false // Will be set to true when saved
    };
    setSplunkRows(prev => [newRow, ...prev]);
    setEditingSplunkRowId(newRow.id);
  };

  const handleAddServiceNowRecipient = () => {
    const newRow = {
      id: `new-servicenow-${Date.now()}`,
      recipient: '',
      endpointUrl: '',
      isEnabled: false // Will be set to true when saved
    };
    setServiceNowRows(prev => [newRow, ...prev]);
    setEditingServiceNowRowId(newRow.id);
  };

  const handleAddPagerDutyRecipient = () => {
    const newRow = {
      id: `new-pagerduty-${Date.now()}`,
      recipient: '',
      endpointUrl: '',
      isEnabled: false // Will be set to true when saved
    };
    setPagerDutyRows(prev => [newRow, ...prev]);
    setEditingPagerDutyRowId(newRow.id);
  };

  const handleAddWebhookRecipient = () => {
    const newRow = {
      id: `new-webhook-${Date.now()}`,
      recipient: '',
      endpointUrl: '',
      isEnabled: false // Will be set to true when saved
    };
    setWebhookRows(prev => [newRow, ...prev]);
    setEditingWebhookRowId(newRow.id);
  };

  // Save and cancel handlers for new rows
  const handleSaveEmailRecipient = () => {
    // Apply changes and make row read-only, ensure switches default to "on"
    setEmailRows(prev => prev.map(row => 
      row.id === editingEmailRowId 
        ? { ...row, instantEmailEnabled: true, dailyDigestEnabled: true }
        : row
    ));
    setEditingEmailRowId(null);
    // In a real app, you would save to backend here
  };

  const handleCancelEmailRecipient = () => {
    // Cancel and remove the new row
    setEmailRows(prev => prev.filter(row => row.id !== editingEmailRowId));
    setEditingEmailRowId(null);
  };

  const handleSaveDrawerRecipient = () => {
    // Apply changes and make row read-only, ensure switch defaults to "on"
    setDrawerRows(prev => prev.map(row => 
      row.id === editingDrawerRowId 
        ? { ...row, isConsoleAlertsEnabled: true }
        : row
    ));
    setEditingDrawerRowId(null);
    // In a real app, you would save to backend here
  };

  const handleCancelDrawerRecipient = () => {
    // Cancel and remove the new row
    setDrawerRows(prev => prev.filter(row => row.id !== editingDrawerRowId));
    setEditingDrawerRowId(null);
  };

  const handleSaveSlackRecipient = () => {
    // Apply changes and make row read-only, ensure switch defaults to "on"
    setSlackRows(prev => prev.map(row => 
      row.id === editingSlackRowId 
        ? { ...row, isEnabled: true }
        : row
    ));
    setEditingSlackRowId(null);
    // In a real app, you would save to backend here
  };

  const handleCancelSlackRecipient = () => {
    // Cancel and remove the new row
    setSlackRows(prev => prev.filter(row => row.id !== editingSlackRowId));
    setEditingSlackRowId(null);
  };

  const handleSaveTeamsRecipient = () => {
    // Apply changes and make row read-only, ensure switch defaults to "on"
    setTeamsRows(prev => prev.map(row => 
      row.id === editingTeamsRowId 
        ? { ...row, isEnabled: true }
        : row
    ));
    setEditingTeamsRowId(null);
    // In a real app, you would save to backend here
  };

  const handleCancelTeamsRecipient = () => {
    // Cancel and remove the new row
    setTeamsRows(prev => prev.filter(row => row.id !== editingTeamsRowId));
    setEditingTeamsRowId(null);
  };

  const handleSaveGChatRecipient = () => {
    // Apply changes and make row read-only, ensure switch defaults to "on"
    setGChatRows(prev => prev.map(row => 
      row.id === editingGChatRowId 
        ? { ...row, isEnabled: true }
        : row
    ));
    setEditingGChatRowId(null);
    // In a real app, you would save to backend here
  };

  const handleCancelGChatRecipient = () => {
    // Cancel and remove the new row
    setGChatRows(prev => prev.filter(row => row.id !== editingGChatRowId));
    setEditingGChatRowId(null);
  };

  const handleSaveSplunkRecipient = () => {
    // Apply changes and make row read-only, ensure switch defaults to "on"
    setSplunkRows(prev => prev.map(row => 
      row.id === editingSplunkRowId 
        ? { ...row, isEnabled: true }
        : row
    ));
    setEditingSplunkRowId(null);
    // In a real app, you would save to backend here
  };

  const handleCancelSplunkRecipient = () => {
    // Cancel and remove the new row
    setSplunkRows(prev => prev.filter(row => row.id !== editingSplunkRowId));
    setEditingSplunkRowId(null);
  };

  const handleSaveServiceNowRecipient = () => {
    // Apply changes and make row read-only, ensure switch defaults to "on"
    setServiceNowRows(prev => prev.map(row => 
      row.id === editingServiceNowRowId 
        ? { ...row, isEnabled: true }
        : row
    ));
    setEditingServiceNowRowId(null);
    // In a real app, you would save to backend here
  };

  const handleCancelServiceNowRecipient = () => {
    // Cancel and remove the new row
    setServiceNowRows(prev => prev.filter(row => row.id !== editingServiceNowRowId));
    setEditingServiceNowRowId(null);
  };

  const handleSavePagerDutyRecipient = () => {
    // Apply changes and make row read-only, ensure switch defaults to "on"
    setPagerDutyRows(prev => prev.map(row => 
      row.id === editingPagerDutyRowId 
        ? { ...row, isEnabled: true }
        : row
    ));
    setEditingPagerDutyRowId(null);
    // In a real app, you would save to backend here
  };

  const handleCancelPagerDutyRecipient = () => {
    // Cancel and remove the new row
    setPagerDutyRows(prev => prev.filter(row => row.id !== editingPagerDutyRowId));
    setEditingPagerDutyRowId(null);
  };

  const handleSaveWebhookRecipient = () => {
    // Apply changes and make row read-only, ensure switch defaults to "on"
    setWebhookRows(prev => prev.map(row => 
      row.id === editingWebhookRowId 
        ? { ...row, isEnabled: true }
        : row
    ));
    setEditingWebhookRowId(null);
    // In a real app, you would save to backend here
  };

  const handleCancelWebhookRecipient = () => {
    // Cancel and remove the new row
    setWebhookRows(prev => prev.filter(row => row.id !== editingWebhookRowId));
    setEditingWebhookRowId(null);
  };

  // Row action handlers
  const handleEditDetails = (rowId: string, type: string) => {
    // Close the menu
    setOpenRowMenus(prev => ({ ...prev, [`${type}-${rowId}`]: false }));
    
    // Set the appropriate editing state based on type
    switch (type) {
      case 'email':
        setEditingEmailRowId(rowId);
        break;
      case 'drawer':
        setEditingDrawerRowId(rowId);
        break;
      case 'slack':
        setEditingSlackRowId(rowId);
        break;
      case 'teams':
        setEditingTeamsRowId(rowId);
        break;
      case 'gchat':
        setEditingGChatRowId(rowId);
        break;
      case 'splunk':
        setEditingSplunkRowId(rowId);
        break;
      case 'servicenow':
        setEditingServiceNowRowId(rowId);
        break;
      case 'pagerduty':
        setEditingPagerDutyRowId(rowId);
        break;
      case 'webhook':
        setEditingWebhookRowId(rowId);
        break;
    }
  };

  const handleExecuteTest = (recipientName: string, serviceType: string) => {
    // Close the menu
    setOpenRowMenus({});
    
    // Show success toast
    const serviceMap: {[key: string]: string} = {
      'email': 'Email',
      'drawer': 'Notification Drawer',
      'slack': 'Slack',
      'teams': 'Microsoft Teams',
      'gchat': 'Google Chat',
      'splunk': 'Splunk',
      'servicenow': 'ServiceNow',
      'pagerduty': 'PagerDuty',
      'webhook': 'Webhook'
    };
    
    setToastMessage(`'Role deleted' event sent an alert to ${recipientName} via ${serviceMap[serviceType]}.`);
    setShowToast(true);
  };

  const handleRemoveRecipient = (rowId: string, type: string, recipientName: string) => {
    // Close the menu
    setOpenRowMenus(prev => ({ ...prev, [`${type}-${rowId}`]: false }));
    
    // Set the row to delete and show modal
    setRowToDelete({ id: rowId, type, name: recipientName });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!rowToDelete) return;
    
    const { id, type } = rowToDelete;
    
    // Remove from appropriate state array
    switch (type) {
      case 'email':
        setEmailRows(prev => prev.filter(row => row.id !== id));
        break;
      case 'drawer':
        setDrawerRows(prev => prev.filter(row => row.id !== id));
        break;
      case 'slack':
        setSlackRows(prev => prev.filter(row => row.id !== id));
        break;
      case 'teams':
        setTeamsRows(prev => prev.filter(row => row.id !== id));
        break;
      case 'gchat':
        setGChatRows(prev => prev.filter(row => row.id !== id));
        break;
      case 'splunk':
        setSplunkRows(prev => prev.filter(row => row.id !== id));
        break;
      case 'servicenow':
        setServiceNowRows(prev => prev.filter(row => row.id !== id));
        break;
      case 'pagerduty':
        setPagerDutyRows(prev => prev.filter(row => row.id !== id));
        break;
      case 'webhook':
        setWebhookRows(prev => prev.filter(row => row.id !== id));
        break;
    }
    
    // Remove from selected rows if selected
    setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    
    // Close modal and reset
    setShowDeleteModal(false);
    setRowToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setRowToDelete(null);
  };

  // Row selection handlers
  const handleRowSelect = (rowId: string, checked: boolean) => {
    setSelectedRows(prev => {
      if (checked) {
        return [...prev, rowId];
      } else {
        return prev.filter(id => id !== rowId);
      }
    });
  };

  const handleSelectAll = (type: string, checked: boolean) => {
    const getRows = (type: string) => {
      switch (type) {
        case 'email': return emailRows;
        case 'drawer': return drawerRows;
        case 'slack': return slackRows;
        case 'teams': return teamsRows;
        case 'gchat': return gChatRows;
        case 'splunk': return splunkRows;
        case 'servicenow': return serviceNowRows;
        case 'pagerduty': return pagerDutyRows;
        case 'webhook': return webhookRows;
        default: return [];
      }
    };
    
    const rows = getRows(type);
    const rowIds = rows.map(row => row.id);
    
    setSelectedRows(prev => {
      if (checked) {
        // Add all row IDs from this type
        const newSelected = [...prev];
        rowIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      } else {
        // Remove all row IDs from this type
        return prev.filter(id => !rowIds.includes(id));
      }
    });
  };
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);
  const [isWebhookOptionsOpen, setIsWebhookOptionsOpen] = React.useState(false);
  const [isWebhook1Enabled, setIsWebhook1Enabled] = React.useState(false);
  const [slackUsername, setSlackUsername] = React.useState('@KendraUsernameXOXO');
  const [isEditingSlackUsername, setIsEditingSlackUsername] = React.useState(false);
  const [slackUsernameEditValue, setSlackUsernameEditValue] = React.useState('@KendraUsernameXOXO');
  const [expandedWebhookRows, setExpandedWebhookRows] = React.useState<string[]>([]);
  const [expandedSections, setExpandedSections] = React.useState<{[key: string]: boolean}>({
    'email': true,
    'notification-drawer': true,
    'slack': true,
    'teams': true,
    'google-chat': true,
    'webhooks': true
  });

  const handleTabClick = (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  const handleSectionToggle = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleStartEditSlackUsername = () => {
    setIsEditingSlackUsername(true);
    setSlackUsernameEditValue(slackUsername);
  };

  const handleSaveSlackUsername = () => {
    setSlackUsername(slackUsernameEditValue);
    setIsEditingSlackUsername(false);
  };

  const handleCancelEditSlackUsername = () => {
    setSlackUsernameEditValue(slackUsername);
    setIsEditingSlackUsername(false);
  };

  const handleWebhookRowExpand = (rowId: string) => {
    setExpandedWebhookRows(prev => 
      prev.includes(rowId) 
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  };

  // Handle autosave functionality
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isWorkspaceNotificationsEnabled) {
      interval = setInterval(() => {
        setIsSaving(true);
        // Show saving indicator for 2 seconds
        setTimeout(() => {
          setIsSaving(false);
        }, 2000);
      }, 10000); // Every 10 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isWorkspaceNotificationsEnabled]);

  // Handle personal autosave functionality
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPersonalAutosaveEnabled) {
      interval = setInterval(() => {
        setIsPersonalSaving(true);
        // Show saving indicator for 2 seconds
        setTimeout(() => {
          setIsPersonalSaving(false);
        }, 2000);
      }, 10000); // Every 10 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPersonalAutosaveEnabled]);

  return (
    <>
      {/* Toast Alert */}
      {showToast && (
        <Alert
          variant="success"
          title="Test command executed successfully"
          actionClose={
            <AlertActionCloseButton
              onClose={() => setShowToast(false)}
            />
          }
          style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            maxWidth: '600px',
            width: 'auto'
          }}
        >
          {toastMessage}
        </Alert>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        variant={ModalVariant.small}
        title="Remove recipient"
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
      >
        <p>
          Are you sure you want to remove <strong>{rowToDelete?.name}</strong>? This action cannot be undone.
        </p>
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete
          </Button>
          <Button variant="link" onClick={handleCancelDelete}>
            Cancel
          </Button>
        </div>
      </Modal>

      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem to="/overview">Settings</BreadcrumbItem>
          <BreadcrumbItem to="/alert-manager">Alert Manager</BreadcrumbItem>
          <BreadcrumbItem isActive>Role deleted</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      
      <PageSection hasBodyWrapper={false}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
              <BellIcon style={{ fontSize: '32px', color: '#0066cc' }} aria-label="page-header-icon" />
            </div>
          </FlexItem>
          <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
            <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }}></div>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <div>
              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <Title headingLevel="h1" size="2xl">Role deleted</Title>
                </FlexItem>
                <FlexItem>
                  <Label color="grey">Roles | IAM</Label>
                </FlexItem>
              </Flex>
              <Content>
                <p style={{ margin: 0, color: '#6a6e73' }}>Configure how you want to be notified when roles are deleted in your workspace.</p>
              </Content>
            </div>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection hasBodyWrapper={false} style={{ paddingTop: 0 }}>
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
          <Tab eventKey={0} title={<><TabTitleIcon><UserIcon /></TabTitleIcon><TabTitleText>My alert preferences</TabTitleText></>}>
            <PageSection>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
                {/* Current Preferences Card */}
                <FlexItem>
                  <Card>
                    <CardHeader
                      actions={{
                        actions: (
                          <Button variant="link" icon={<SyncAltIcon />} iconPosition="start">
                            Reset to workspace default
                          </Button>
                        )
                      }}
                    >
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          <Title headingLevel="h3" size="md">Current preferences</Title>
                        </FlexItem>
                        <FlexItem>
                          <Label color="yellow">Customized from default</Label>
                        </FlexItem>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      <DescriptionList isHorizontal isCompact columnModifier={{ default: '2Col' }}>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Instant email</DescriptionListTerm>
                          <DescriptionListDescription>Enabled</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Notification drawer</DescriptionListTerm>
                          <DescriptionListDescription>Enabled</DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </CardBody>
                  </Card>
                </FlexItem>

                {/* Jump Links and Expandable Sections Layout */}
                <FlexItem>
                  <Flex justifyContent={{ default: 'justifyContentFlexStart' }} spaceItems={{ default: 'spaceItemsLg' }}>
                    {/* Left side - 25% width for jump links */}
                    <FlexItem flex={{ default: 'flex_1' }} style={{ maxWidth: '25%' }}>
                      <JumpLinks 
                        isVertical 
                        label="Jump to section"
                        aria-label="Jump to section navigation"
                      >
                        <JumpLinksItem 
                          href="#email"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('email');
                          }}
                        >
                          Email
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#notification-drawer"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('notification-drawer');
                          }}
                        >
                          Notification Drawer
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#slack"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('slack');
                          }}
                        >
                          Slack
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#teams"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('teams');
                          }}
                        >
                          Microsoft Teams
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#google-chat"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('google-chat');
                          }}
                        >
                          Google Chat
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#splunk"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('splunk');
                          }}
                        >
                          Splunk
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#servicenow"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('servicenow');
                          }}
                        >
                          ServiceNow
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#pagerduty"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('pagerduty');
                          }}
                        >
                          PagerDuty
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#webhooks"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('webhooks');
                          }}
                        >
                          Webhooks
                        </JumpLinksItem>
                      </JumpLinks>
                    </FlexItem>
                    
                    {/* Right side - 75% width for expandable sections */}
                    <FlexItem flex={{ default: 'flex_3' }} style={{ maxWidth: '75%' }}>
                      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                        {/* H2 Header with Switch */}
                        <FlexItem>
                          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>
                              <Title headingLevel="h2" size="xl">My alert preferences</Title>
                            </FlexItem>
                            <FlexItem>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  <Switch
                                    id="personal-notifications-enabled"
                                    label="Autosave"
                                    isReversed={true}
                                    isChecked={isPersonalAutosaveEnabled}
                                    hasCheckIcon={true}
                                    onChange={(_event, checked) => setIsPersonalAutosaveEnabled(checked)}
                                  />
                                </FlexItem>
                                {isPersonalAutosaveEnabled ? (
                                  <FlexItem>
                                    {isPersonalSaving ? (
                                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                                        <FlexItem>
                                          <Spinner size="sm" />
                                        </FlexItem>
                                        <FlexItem>
                                          <span style={{ fontSize: '14px', color: '#6a6e73' }}>Saving...</span>
                                        </FlexItem>
                                      </Flex>
                                    ) : (
                                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                                        <FlexItem>
                                          <CheckCircleIcon style={{ color: '#3e8635', fontSize: '14px' }} />
                                        </FlexItem>
                                        <FlexItem>
                                          <span style={{ fontSize: '14px', color: '#6a6e73' }}>Saved</span>
                                        </FlexItem>
                                      </Flex>
                                    )}
                                  </FlexItem>
                                ) : (
                                  <FlexItem>
                                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                      <FlexItem>
                                        <Button variant="primary">
                                          Save
                                        </Button>
                                      </FlexItem>
                                      <FlexItem>
                                        <Button variant="link">
                                          Cancel
                                        </Button>
                                      </FlexItem>
                                    </Flex>
                                  </FlexItem>
                                )}
                              </Flex>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                        
                        {/* Description */}
                        <FlexItem>
                          <Content>
                            <p style={{ color: '#6a6e73', marginBottom: '16px' }}>
                              View and customize your personal alert settings for email, in-console alerts, third-party integrations, and Webhooks. <Button variant="link" isInline onClick={() => {}}>Contact your workspace admin</Button> if you need to override additional settings.
                            </p>
                          </Content>
                        </FlexItem>
                        
                        {/* H4 Subheader */}
                        <FlexItem>
                          <Title headingLevel="h4" size="md">Core platform notifiers</Title>
                        </FlexItem>
                        
                        <FlexItem>
                          <ExpandableSection 
                            id="email"
                            displaySize="lg"
                            toggleContent={
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <EnvelopeIcon style={{ width: '24px', height: 'auto' }} />
                                <span>Email</span>
                              </Flex>
                            }
                            isExpanded={expandedSections['email']}
                            onToggle={() => handleSectionToggle('email')}
                          >
                            <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                              Receive role deletion notifications directly in your email inbox with customizable formatting and delivery options.
                            </div>
                            
                            <Card>
                              <CardBody>
                                <Form isHorizontal>
                                  <FormGroup label="Instant email" fieldId="instant-email">
                                    <Switch
                                      id="instant-email"
                                      aria-label="Instant email"
                                      isChecked={isInstantEmailEnabled}
                                      onChange={(_event, checked) => setIsInstantEmailEnabled(checked)}
                                    />
                                  </FormGroup>
                                  <FormGroup label="Daily digest" fieldId="daily-digest">
                                    <Switch
                                      id="daily-digest"
                                      aria-label="Daily digest"
                                      isChecked={isDailyDigestEnabled}
                                      onChange={(_event, checked) => setIsDailyDigestEnabled(checked)}
                                    />
                                  </FormGroup>
                                </Form>
                              </CardBody>
                            </Card>
                          </ExpandableSection>
                        </FlexItem>

                        <FlexItem>
                          <ExpandableSection 
                            id="notification-drawer"
                            displaySize="lg"
                            toggleContent={
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <BellIcon style={{ width: '24px', height: 'auto' }} />
                                <span>Notification Drawer</span>
                              </Flex>
                            }
                            isExpanded={expandedSections['notification-drawer']}
                            onToggle={() => handleSectionToggle('notification-drawer')}
                          >
                            <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                              Show role deletion alerts in the in-console notification drawer accessible from the bell icon in the masthead.
                            </div>
                            
                            <Card>
                              <CardBody>
                                <Form isHorizontal>
                                  <FormGroup label="In-console alerts" fieldId="in-console-alerts">
                                    <Switch
                                      id="in-console-alerts"
                                      aria-label="In-console alerts"
                                      isChecked={isNotificationDrawerEnabled}
                                      onChange={(_event, checked) => setIsNotificationDrawerEnabled(checked)}
                                    />
                                  </FormGroup>
                                </Form>
                              </CardBody>
                            </Card>
                          </ExpandableSection>
                        </FlexItem>

                        {/* H4 Third-party notifiers header */}
                        <FlexItem>
                          <Title headingLevel="h4" size="md">Third-party notifiers</Title>
                        </FlexItem>

                        <FlexItem>
                          <ExpandableSection 
                            id="slack"
                            displaySize="lg"
                            toggleContent={
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <img 
                                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png" 
                                  alt="Slack"
                                  style={{ width: '24px', height: 'auto' }}
                                />
                                <span>Slack</span>
                              </Flex>
                            }
                            isExpanded={expandedSections['slack']}
                            onToggle={() => handleSectionToggle('slack')}
                          >
                            <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                              Connect your Slack account to receive notifications when roles are deleted in your workspace.
                            </div>
                            
                            <Card>
                              <CardBody>
                                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                  <FlexItem>
                                    {!isEditingSlackUsername ? (
                                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                                        <FlexItem>
                                          <span>{slackUsername}</span>
                                        </FlexItem>
                                        <FlexItem>
                                          <Button
                                            variant="plain"
                                            aria-label="Edit slack username"
                                            icon={<PencilAltIcon />}
                                            onClick={handleStartEditSlackUsername}
                                          />
                                        </FlexItem>
                                      </Flex>
                                    ) : (
                                      <InputGroup>
                                        <TextInput
                                          id="slack-username-edit"
                                          value={slackUsernameEditValue}
                                          onChange={(_event, value) => setSlackUsernameEditValue(value)}
                                          aria-label="Edit slack username"
                                        />
                                        <Button
                                          variant="control"
                                          aria-label="Save slack username"
                                          icon={<CheckIcon />}
                                          onClick={handleSaveSlackUsername}
                                        />
                                        <Button
                                          variant="control"
                                          aria-label="Cancel edit slack username"
                                          icon={<TimesIcon />}
                                          onClick={handleCancelEditSlackUsername}
                                        />
                                      </InputGroup>
                                    )}
                                  </FlexItem>
                                  <FlexItem>
                                    <ClipboardCopy 
                                      variant="inline-compact"
                                      className="pf-v6-u-font-size-sm"
                                    >
                                      https://redhat.enterprise.slack.com/team/UB71VEV0V
                                    </ClipboardCopy>
                                  </FlexItem>
                                </Flex>
                              </CardBody>
                            </Card>
                          </ExpandableSection>
                        </FlexItem>

                        <FlexItem>
                          <ExpandableSection 
                            id="teams"
                            displaySize="lg"
                            toggleContent={
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <img 
                                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg/2203px-Microsoft_Office_Teams_%282018%E2%80%93present%29.svg.png" 
                                  alt="Microsoft Teams"
                                  style={{ width: '24px', height: 'auto' }}
                                />
                                <span>Microsoft Teams</span>
                              </Flex>
                            }
                            isExpanded={expandedSections['teams']}
                            onToggle={() => handleSectionToggle('teams')}
                          >
                            <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                              Connect your Microsoft Teams account to receive notifications when roles are deleted in your workspace.
                            </div>
                            
                            <Card>
                              <CardBody>
                                <Button variant="link" icon={<PlusCircleIcon />} iconPosition="start">
                                  Add Microsoft account
                                </Button>
                              </CardBody>
                            </Card>
                          </ExpandableSection>
                        </FlexItem>

                        <FlexItem>
                          <ExpandableSection 
                            id="google-chat"
                            displaySize="lg"
                            toggleContent={
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <img 
                                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Google_Chat_icon_%282020%29.svg/1964px-Google_Chat_icon_%282020%29.svg.png" 
                                  alt="Google Chat"
                                  style={{ width: '24px', height: 'auto' }}
                                />
                                <span>Google Chat</span>
                              </Flex>
                            }
                            isExpanded={expandedSections['google-chat']}
                            onToggle={() => handleSectionToggle('google-chat')}
                          >
                            <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                              Connect your Google Chat account to receive notifications when roles are deleted in your workspace.
                            </div>
                            
                            <Card>
                              <CardBody>
                                <Button variant="link" icon={<PlusCircleIcon />} iconPosition="start">
                                  Add Google account
                                </Button>
                              </CardBody>
                            </Card>
                          </ExpandableSection>
                        </FlexItem>

                        <FlexItem>
                          <ExpandableSection 
                            id="webhooks"
                            displaySize="lg"
                            toggleContent={
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <img 
                                  src="https://www.svgrepo.com/show/361957/webhooks.svg" 
                                  alt="Webhooks"
                                  style={{ width: '24px', height: 'auto' }}
                                />
                                <span>Webhooks</span>
                              </Flex>
                            }
                            isExpanded={expandedSections['webhooks']}
                            onToggle={() => handleSectionToggle('webhooks')}
                          >
                            <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                              Configure custom webhook endpoints to integrate role deletion notifications with your own systems and workflows.
                            </div>
                            
                            <Card style={{ padding: 0 }}>
                              <Table aria-label="Webhook configurations" isExpandable>
                                <Thead>
                                  <Tr>
                                    <Th width={10}></Th>
                                    <Th width={30}>Recipient</Th>
                                    <Th width={40}>Endpoint URL</Th>
                                    <Th width={15}>Status</Th>
                                    <Th width={10}></Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  <Tr>
                                    <Td 
                                      expand={{
                                        rowIndex: 0,
                                        isExpanded: expandedWebhookRows.includes('webhook-1'),
                                        onToggle: () => handleWebhookRowExpand('webhook-1')
                                      }}
                                    />
                                    <Td>
                                      <Tooltip content="Internal monitoring system">
                                        <Truncate content="Internal monitoring system" />
                                      </Tooltip>
                                    </Td>
                                    <Td>
                                      <Tooltip content="https://monitoring.example.com/webhooks/alerts">
                                        <Truncate content="https://monitoring.example.com/webhooks/alerts" />
                                      </Tooltip>
                                    </Td>
                                    <Td>
                                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                                        <Switch
                                          id="webhook-1-status"
                                          aria-label="Enable webhook 1"
                                          isChecked={isWebhook1Enabled}
                                          onChange={(_event, checked) => setIsWebhook1Enabled(checked)}
                                        />
                                        <span style={{ fontSize: '14px', color: '#6a6e73' }}>
                                          {isWebhook1Enabled ? 'On' : 'Off'}
                                        </span>
                                      </Flex>
                                    </Td>
                                    <Td>
                                      <Dropdown
                                        isOpen={isWebhookOptionsOpen}
                                        onOpenChange={(isOpen) => setIsWebhookOptionsOpen(isOpen)}
                                        toggle={(toggleRef) => (
                                          <MenuToggle
                                            ref={toggleRef}
                                            aria-label="Webhook options"
                                            variant="plain"
                                            onClick={() => setIsWebhookOptionsOpen(!isWebhookOptionsOpen)}
                                          >
                                            <EllipsisVIcon />
                                          </MenuToggle>
                                        )}
                                        shouldFocusToggleOnSelect
                                      >
                                        <DropdownList>
                                          <DropdownItem>Edit webhook</DropdownItem>
                                          <DropdownItem>Test connection</DropdownItem>
                                          <DropdownItem>View logs</DropdownItem>
                                          <DropdownItem>Delete webhook</DropdownItem>
                                        </DropdownList>
                                      </Dropdown>
                                    </Td>
                                  </Tr>
                                  {expandedWebhookRows.includes('webhook-1') && (
                                    <Tr isExpanded>
                                      <Td colSpan={5}>
                                        <div style={{ padding: '16px', backgroundColor: '#f8f8f8' }}>
                                          <DescriptionList isHorizontal isCompact>
                                            <DescriptionListGroup>
                                              <DescriptionListTerm>SSL verification</DescriptionListTerm>
                                              <DescriptionListDescription>
                                                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                                                  <CheckIcon style={{ color: '#3e8635' }} />
                                                  <span>Enabled</span>
                                                </Flex>
                                              </DescriptionListDescription>
                                            </DescriptionListGroup>
                                            <DescriptionListGroup>
                                              <DescriptionListTerm>Authentication type</DescriptionListTerm>
                                              <DescriptionListDescription>None</DescriptionListDescription>
                                            </DescriptionListGroup>
                                          </DescriptionList>
                                        </div>
                                      </Td>
                                    </Tr>
                                  )}
                                </Tbody>
                              </Table>
                            </Card>
                          </ExpandableSection>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                
                {/* Bottom Save/Cancel Actions - only show when autosave is OFF */}
                {!isPersonalAutosaveEnabled && (
                  <FlexItem>
                    <Flex justifyContent={{ default: 'justifyContentFlexStart' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem>
                        <Button variant="primary">
                          Save
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button variant="link">
                          Cancel
                        </Button>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                )}
              </Flex>
            </PageSection>
          </Tab>
          <Tab eventKey={1} title={<><TabTitleIcon><UsersIcon /></TabTitleIcon><TabTitleText>Default workspace settings</TabTitleText></>}>
            <PageSection>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
                {/* Layout with Jump Links and Expandable Sections */}
                <FlexItem>
                  <Flex direction={{ default: 'row' }} justifyContent={{ default: 'justifyContentFlexStart' }} spaceItems={{ default: 'spaceItemsLg' }}>
                    {/* Left side - 25% width for jump links */}
                    <FlexItem flex={{ default: 'flex_1' }} style={{ maxWidth: '25%' }}>
                      <JumpLinks isVertical label="Jump to section">
                        <JumpLinksItem 
                          href="#email"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('email');
                          }}
                        >
                          Email
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#notification-drawer"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('notification-drawer');
                          }}
                        >
                          Notification Drawer
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#slack"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('slack');
                          }}
                        >
                          Slack
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#teams"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('teams');
                          }}
                        >
                          Microsoft Teams
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#google-chat"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('google-chat');
                          }}
                        >
                          Google Chat
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#splunk"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('splunk');
                          }}
                        >
                          Splunk
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#servicenow"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('servicenow');
                          }}
                        >
                          ServiceNow
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#pagerduty"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('pagerduty');
                          }}
                        >
                          PagerDuty
                        </JumpLinksItem>
                        <JumpLinksItem 
                          href="#webhooks"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSectionToggle('webhooks');
                          }}
                        >
                          Webhooks
                        </JumpLinksItem>
                      </JumpLinks>
                    </FlexItem>
                    
                    {/* Right side - 75% width for expandable sections */}
                    <FlexItem flex={{ default: 'flex_3' }} style={{ maxWidth: '75%' }}>
                      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                        {/* H2 Header with Switch */}
                        <FlexItem>
                          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>
                              <Title headingLevel="h2" size="xl">Workspace Default Settings</Title>
                            </FlexItem>
                            <FlexItem>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <FlexItem>
                                  <Switch
                                    id="workspace-notifications-enabled"
                                    label="Autosave"
                                    isReversed={true}
                                    isChecked={isWorkspaceNotificationsEnabled}
                                    hasCheckIcon={true}
                                    onChange={(_event, checked) => setIsWorkspaceNotificationsEnabled(checked)}
                                  />
                                </FlexItem>
                                {isWorkspaceNotificationsEnabled ? (
                                  <FlexItem>
                                    {isSaving ? (
                                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                                        <FlexItem>
                                          <Spinner size="sm" />
                                        </FlexItem>
                                        <FlexItem>
                                          <span style={{ fontSize: '14px', color: '#6a6e73' }}>Saving...</span>
                                        </FlexItem>
                                      </Flex>
                                    ) : (
                                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                                        <FlexItem>
                                          <CheckCircleIcon style={{ color: '#3e8635', fontSize: '14px' }} />
                                        </FlexItem>
                                        <FlexItem>
                                          <span style={{ fontSize: '14px', color: '#6a6e73' }}>Saved</span>
                                        </FlexItem>
                                      </Flex>
                                    )}
                                  </FlexItem>
                                ) : (
                                  <FlexItem>
                                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                      <FlexItem>
                                        <Button variant="primary">
                                          Save
                                        </Button>
                                      </FlexItem>
                                      <FlexItem>
                                        <Button variant="link">
                                          Cancel
                                        </Button>
                                      </FlexItem>
                                    </Flex>
                                  </FlexItem>
                                )}
                              </Flex>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                        
                        {/* Description */}
                        <FlexItem>
                          <Content>
                            <p style={{ color: '#6a6e73', marginBottom: '16px' }}>
                              Determine the the default alert behaviors for your workspace. Users with the 'Alert default overrider' role may chose to opt-out of alert notifiers made at below, and all users can opt-into alerts beyond what the default settings are below. Manage user alert opt-out settings in the <Button variant="link" isInline onClick={() => {}}>Roles</Button> service in Identity & Access Management.
                            </p>
                          </Content>
                        </FlexItem>
                        
                        {/* H4 Subheader */}
                        <FlexItem>
                          <Title headingLevel="h4" size="md">Core platform notifiers</Title>
                        </FlexItem>
                        
                        <FlexItem>
                          <div style={{ border: '1px solid #d2d2d2', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px 8px 0 0' }}>
                              <button
                                onClick={() => handleSectionToggle('email')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '14px',
                                  fontWeight: '400',
                                  color: '#0066cc'
                                }}
                              >
                                <span style={{ transform: expandedSections['email'] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                  <AngleRightIcon />
                                </span>
                                <EnvelopeIcon style={{ width: '24px', height: 'auto' }} />
                                <span>Email</span>
                              </button>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <Dropdown
                                  isOpen={isEmailRecipientDropdownOpen}
                                  onOpenChange={(isOpen) => setIsEmailRecipientDropdownOpen(isOpen)}
                                  popperProps={{ position: 'right' }}
                                  toggle={(toggleRef) => (
                                    <MenuToggle
                                      ref={toggleRef}
                                      aria-label="Add email recipients"
                                      variant="secondary"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEmailRecipientDropdownOpen(!isEmailRecipientDropdownOpen);
                                      }}
                                    >
                                      Add recipient(s)
                                    </MenuToggle>
                                  )}
                                  shouldFocusToggleOnSelect
                                >
                                  <DropdownList>
                                    <DropdownItem>Add individual user</DropdownItem>
                                    <DropdownItem onClick={handleAddEmailUserGroup}>Add user group</DropdownItem>
                                    <DropdownItem>Add external email</DropdownItem>
                                  </DropdownList>
                                </Dropdown>
                                <Dropdown
                                  isOpen={isEmailOptionsOpen}
                                  onOpenChange={(isOpen) => setIsEmailOptionsOpen(isOpen)}
                                  popperProps={{ position: 'right' }}
                                  toggle={(toggleRef) => (
                                    <MenuToggle
                                      ref={toggleRef}
                                      aria-label="Email options"
                                      variant="plain"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEmailOptionsOpen(!isEmailOptionsOpen);
                                      }}
                                    >
                                      <EllipsisVIcon />
                                    </MenuToggle>
                                  )}
                                  shouldFocusToggleOnSelect
                                >
                                  <DropdownList>
                                    <DropdownItem>Edit settings</DropdownItem>
                                    <DropdownItem>Duplicate configuration</DropdownItem>
                                    <DropdownItem>Reset to defaults</DropdownItem>
                                    <DropdownItem>Export settings</DropdownItem>
                                  </DropdownList>
                                </Dropdown>
                              </Flex>
                            </div>
                            {expandedSections['email'] && (
                              <div style={{ padding: '0 16px 16px 16px' }}>
                                <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                                  Receive role deletion notifications directly in your email inbox with customizable formatting and delivery options.
                                </div>
                                
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                              <Table aria-label="Email notification settings">
                                <Thead>
                                  <Tr>
                                    <Th width={10}>
                                      <Checkbox
                                        id="email-select-all"
                                        isChecked={emailRows.filter(row => !row.isDefault).length > 0 && emailRows.filter(row => !row.isDefault).every(row => selectedRows.includes(row.id))}
                                        onChange={(event, checked) => handleSelectAll('email', checked)}
                                        aria-label="Select all email recipients"
                                      />
                                    </Th>
                                    <Th width={editingEmailRowId ? 15 : 25}>Recipient</Th>
                                    <Th width={editingEmailRowId ? 10 : 15}>Type</Th>
                                    <Th width={editingEmailRowId ? 15 : 20}>Instant email</Th>
                                    <Th width={editingEmailRowId ? 15 : 20}>Daily digest</Th>
                                    <Th width={10}></Th>
                                    {editingEmailRowId && <Th width={20}></Th>}
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {emailRows.filter(row => !row.isDefault).map((emailRow) => (
                                    <Tr key={emailRow.id}>
                                      <Td>
                                        <Checkbox
                                          id={`email-select-${emailRow.id}`}
                                          isChecked={selectedRows.includes(emailRow.id)}
                                          onChange={(event, checked) => handleRowSelect(emailRow.id, checked)}
                                          aria-label={`Select ${emailRow.recipient || 'email recipient'}`}
                                        />
                                      </Td>
                                      <Td>
                                        {editingEmailRowId === emailRow.id ? (
                                          <Select
                                            isOpen={isEmailRecipientSelectOpen}
                                            selected={emailRow.recipient}
                                            onSelect={(_event, selection) => {
                                              setEmailRows(prev => prev.map(row => 
                                                row.id === emailRow.id 
                                                  ? { ...row, recipient: selection as string }
                                                  : row
                                              ));
                                              setIsEmailRecipientSelectOpen(false);
                                            }}
                                            onOpenChange={(isOpen) => setIsEmailRecipientSelectOpen(isOpen)}
                                            toggle={(toggleRef) => (
                                              <MenuToggle
                                                ref={toggleRef}
                                                onClick={() => setIsEmailRecipientSelectOpen(!isEmailRecipientSelectOpen)}
                                                isExpanded={isEmailRecipientSelectOpen}
                                                style={{ width: '100%' }}
                                              >
                                                {emailRow.recipient || 'Select user group'}
                                              </MenuToggle>
                                            )}
                                            shouldFocusToggleOnSelect
                                          >
                                            <SelectList>
                                              {userGroups.map((group, index) => (
                                                <SelectOption key={index} value={group}>
                                                  {group}
                                                </SelectOption>
                                              ))}
                                            </SelectList>
                                          </Select>
                                        ) : (
                                          emailRow.recipient || 'New user group'
                                        )}
                                      </Td>
                                      <Td>
                                        {emailRow.type}
                                      </Td>
                                      <Td>
                                        {editingEmailRowId === emailRow.id ? (
                                          <Switch
                                            id={`email-instant-preview-${emailRow.id}`}
                                            aria-label="Will be enabled when saved"
                                            isChecked={true}
                                            isDisabled={true}
                                          />
                                        ) : (
                                          <Switch
                                            id={`email-instant-${emailRow.id}`}
                                            aria-label="Email recipient instant email"
                                            isChecked={emailRow.instantEmailEnabled}
                                            onChange={(_event, checked) => {
                                              setEmailRows(prev => prev.map(row => 
                                                row.id === emailRow.id 
                                                  ? { ...row, instantEmailEnabled: checked }
                                                  : row
                                              ));
                                            }}
                                          />
                                        )}
                                      </Td>
                                      <Td>
                                        {editingEmailRowId === emailRow.id ? (
                                          <Switch
                                            id={`email-digest-preview-${emailRow.id}`}
                                            aria-label="Will be enabled when saved"
                                            isChecked={true}
                                            isDisabled={true}
                                          />
                                        ) : (
                                          <Switch
                                            id={`email-digest-${emailRow.id}`}
                                            aria-label="Email recipient daily digest"
                                            isChecked={emailRow.dailyDigestEnabled}
                                            onChange={(_event, checked) => {
                                              setEmailRows(prev => prev.map(row => 
                                                row.id === emailRow.id 
                                                  ? { ...row, dailyDigestEnabled: checked }
                                                  : row
                                              ));
                                            }}
                                          />
                                        )}
                                      </Td>
                                      <Td>
                                        {editingEmailRowId !== emailRow.id && (
                                          <Dropdown
                                            isOpen={openRowMenus[`email-${emailRow.id}`] || false}
                                            onOpenChange={(isOpen) => {
                                              setOpenRowMenus(prev => ({ ...prev, [`email-${emailRow.id}`]: isOpen }));
                                            }}
                                            popperProps={{ position: 'right' }}
                                            toggle={(toggleRef) => (
                                              <MenuToggle
                                                ref={toggleRef}
                                                aria-label="Row actions"
                                                variant="plain"
                                                onClick={() => {
                                                  setOpenRowMenus(prev => ({ 
                                                    ...prev, 
                                                    [`email-${emailRow.id}`]: !prev[`email-${emailRow.id}`] 
                                                  }));
                                                }}
                                              >
                                                <EllipsisVIcon />
                                              </MenuToggle>
                                            )}
                                            shouldFocusToggleOnSelect
                                          >
                                            <DropdownList>
                                              <DropdownItem
                                                icon={<PencilAltIcon />}
                                                onClick={() => handleEditDetails(emailRow.id, 'email')}
                                              >
                                                Edit details
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<PlayIcon />}
                                                onClick={() => handleExecuteTest(emailRow.recipient || 'recipient', 'email')}
                                              >
                                                Execute test command
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<MinusCircleIcon />}
                                                isDanger
                                                onClick={() => handleRemoveRecipient(emailRow.id, 'email', emailRow.recipient || 'recipient')}
                                              >
                                                Remove recipient
                                              </DropdownItem>
                                            </DropdownList>
                                          </Dropdown>
                                        )}
                                      </Td>
                                      {editingEmailRowId === emailRow.id && (
                                        <Td>
                                          <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              isDisabled={!emailRow.recipient?.trim()}
                                              onClick={handleSaveEmailRecipient}
                                            >
                                              <CheckIcon />
                                            </Button>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={handleCancelEmailRecipient}
                                            >
                                              <TimesIcon />
                                            </Button>
                                          </div>
                                        </Td>
                                      )}
                                    </Tr>
                                  ))}
                                  {emailRows.filter(row => row.isDefault).map((emailRow) => (
                                    <Tr key={emailRow.id}>
                                      <Td>
                                        <Checkbox
                                          id={`email-default-${emailRow.id}`}
                                          isDisabled={true}
                                          isChecked={false}
                                          aria-label="Default recipient cannot be selected"
                                        />
                                      </Td>
                                      <Td>{emailRow.recipient}</Td>
                                      <Td>{emailRow.type}</Td>
                                      <Td>
                                        <Switch
                                          id={`email-instant-default-${emailRow.id}`}
                                          aria-label="Default instant email"
                                          isChecked={emailRow.instantEmailEnabled}
                                          onChange={(_event, checked) => {
                                            setEmailRows(prev => prev.map(row => 
                                              row.id === emailRow.id 
                                                ? { ...row, instantEmailEnabled: checked }
                                                : row
                                            ));
                                          }}
                                        />
                                      </Td>
                                      <Td>
                                        <Switch
                                          id={`email-digest-default-${emailRow.id}`}
                                          aria-label="Default daily digest"
                                          isChecked={emailRow.dailyDigestEnabled}
                                          onChange={(_event, checked) => {
                                            setEmailRows(prev => prev.map(row => 
                                              row.id === emailRow.id 
                                                ? { ...row, dailyDigestEnabled: checked }
                                                : row
                                            ));
                                          }}
                                        />
                                      </Td>
                                      <Td>
                                        <Dropdown
                                          isOpen={openRowMenus[`email-default-${emailRow.id}`] || false}
                                          onOpenChange={(isOpen) => {
                                            setOpenRowMenus(prev => ({ ...prev, [`email-default-${emailRow.id}`]: isOpen }));
                                          }}
                                          popperProps={{ position: 'right' }}
                                          toggle={(toggleRef) => (
                                            <MenuToggle
                                              ref={toggleRef}
                                              aria-label="Row actions"
                                              variant="plain"
                                              onClick={() => {
                                                setOpenRowMenus(prev => ({ 
                                                  ...prev, 
                                                  [`email-default-${emailRow.id}`]: !prev[`email-default-${emailRow.id}`] 
                                                }));
                                              }}
                                            >
                                              <EllipsisVIcon />
                                            </MenuToggle>
                                          )}
                                          shouldFocusToggleOnSelect
                                        >
                                          <DropdownList>
                                            <DropdownItem
                                              icon={<PencilAltIcon />}
                                              onClick={() => handleEditDetails(emailRow.id, 'email')}
                                            >
                                              Edit details
                                            </DropdownItem>
                                            <DropdownItem
                                              icon={<PlayIcon />}
                                              onClick={() => handleExecuteTest(emailRow.recipient || 'recipient', 'email')}
                                            >
                                              Execute test command
                                            </DropdownItem>
                                          </DropdownList>
                                        </Dropdown>
                                      </Td>
                                      {editingEmailRowId && <Td></Td>}
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Card>
                              </div>
                            )}
                          </div>
                        </FlexItem>

                        <FlexItem>
                          <div style={{ border: '1px solid #d2d2d2', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px 8px 0 0' }}>
                              <button
                                onClick={() => handleSectionToggle('notification-drawer')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '14px',
                                  fontWeight: '400',
                                  color: '#0066cc'
                                }}
                              >
                                <span style={{ transform: expandedSections['notification-drawer'] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                  <AngleRightIcon />
                                </span>
                                <BellIcon style={{ width: '24px', height: 'auto' }} />
                                <span>Notification Drawer</span>
                              </button>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddDrawerRecipient();
                                  }}
                                >
                                  Add recipient(s)
                                </Button>
                                <Dropdown
                                  isOpen={isDrawerOptionsOpen}
                                  onOpenChange={(isOpen) => setIsDrawerOptionsOpen(isOpen)}
                                  popperProps={{ position: 'right' }}
                                  toggle={(toggleRef) => (
                                    <MenuToggle
                                      ref={toggleRef}
                                      aria-label="Notification drawer options"
                                      variant="plain"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsDrawerOptionsOpen(!isDrawerOptionsOpen);
                                      }}
                                    >
                                      <EllipsisVIcon />
                                    </MenuToggle>
                                  )}
                                  shouldFocusToggleOnSelect
                                >
                                  <DropdownList>
                                    <DropdownItem>Edit settings</DropdownItem>
                                    <DropdownItem>Duplicate configuration</DropdownItem>
                                    <DropdownItem>Reset to defaults</DropdownItem>
                                    <DropdownItem>Export settings</DropdownItem>
                                  </DropdownList>
                                </Dropdown>
                              </Flex>
                            </div>
                            {expandedSections['notification-drawer'] && (
                              <div style={{ padding: '0 16px 16px 16px' }}>
                                <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                                  Show role deletion alerts in the in-console notification drawer accessible from the bell icon in the masthead.
                                </div>
                                
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                              <Table aria-label="Notification drawer settings">
                                <Thead>
                                  <Tr>
                                    <Th width={10}>
                                      <Checkbox
                                        id="drawer-select-all"
                                        isChecked={drawerRows.filter(row => !row.isDefault).length > 0 && drawerRows.filter(row => !row.isDefault).every(row => selectedRows.includes(row.id))}
                                        onChange={(event, checked) => handleSelectAll('drawer', checked)}
                                        aria-label="Select all notification drawer recipients"
                                      />
                                    </Th>
                                    <Th width={editingDrawerRowId ? 30 : 35}>Recipient</Th>
                                    <Th width={editingDrawerRowId ? 15 : 20}>Type</Th>
                                    <Th width={editingDrawerRowId ? 25 : 25}>In-console alerts</Th>
                                    <Th width={10}></Th>
                                    {editingDrawerRowId && <Th width={20}></Th>}
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {drawerRows.filter(row => !row.isDefault).map((drawerRow) => (
                                    <Tr key={drawerRow.id}>
                                      <Td>
                                        <Checkbox
                                          id={`drawer-select-${drawerRow.id}`}
                                          isChecked={selectedRows.includes(drawerRow.id)}
                                          onChange={(event, checked) => handleRowSelect(drawerRow.id, checked)}
                                          aria-label={`Select ${drawerRow.recipient || 'drawer recipient'}`}
                                        />
                                      </Td>
                                      <Td>
                                        {editingDrawerRowId === drawerRow.id ? (
                                          <TextInput
                                            value={drawerRow.recipient}
                                            onChange={(event, value) => {
                                              setDrawerRows(prev => prev.map(row => 
                                                row.id === drawerRow.id 
                                                  ? { ...row, recipient: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter recipient name"
                                          />
                                        ) : (
                                          drawerRow.recipient || 'New recipient'
                                        )}
                                      </Td>
                                      <Td>{drawerRow.type || 'User group'}</Td>
                                      <Td>
                                        {editingDrawerRowId === drawerRow.id ? (
                                          // Show disabled "on" switch during edit mode
                                          <Switch
                                            id={`drawer-switch-preview-${drawerRow.id}`}
                                            aria-label="Will be enabled when saved"
                                            isChecked={true}
                                            isDisabled={true}
                                          />
                                        ) : (
                                          // Show functional switch after saving
                                          <Switch
                                            id={`drawer-switch-${drawerRow.id}`}
                                            aria-label="Recipient in-console alerts"
                                            isChecked={drawerRow.isConsoleAlertsEnabled}
                                            onChange={(_event, checked) => {
                                              setDrawerRows(prev => prev.map(row => 
                                                row.id === drawerRow.id 
                                                  ? { ...row, isConsoleAlertsEnabled: checked }
                                                  : row
                                              ));
                                            }}
                                          />
                                        )}
                                      </Td>
                                      <Td>
                                        {editingDrawerRowId !== drawerRow.id && (
                                          <Dropdown
                                            isOpen={openRowMenus[`drawer-${drawerRow.id}`] || false}
                                            onOpenChange={(isOpen) => {
                                              setOpenRowMenus(prev => ({ ...prev, [`drawer-${drawerRow.id}`]: isOpen }));
                                            }}
                                            popperProps={{ position: 'right' }}
                                            toggle={(toggleRef) => (
                                              <MenuToggle
                                                ref={toggleRef}
                                                aria-label="Row actions"
                                                variant="plain"
                                                onClick={() => {
                                                  setOpenRowMenus(prev => ({ 
                                                    ...prev, 
                                                    [`drawer-${drawerRow.id}`]: !prev[`drawer-${drawerRow.id}`] 
                                                  }));
                                                }}
                                              >
                                                <EllipsisVIcon />
                                              </MenuToggle>
                                            )}
                                            shouldFocusToggleOnSelect
                                          >
                                            <DropdownList>
                                              <DropdownItem
                                                icon={<PencilAltIcon />}
                                                onClick={() => handleEditDetails(drawerRow.id, 'drawer')}
                                              >
                                                Edit details
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<PlayIcon />}
                                                onClick={() => handleExecuteTest(drawerRow.recipient || 'recipient', 'drawer')}
                                              >
                                                Execute test command
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<MinusCircleIcon />}
                                                isDanger
                                                onClick={() => handleRemoveRecipient(drawerRow.id, 'drawer', drawerRow.recipient || 'recipient')}
                                              >
                                                Remove recipient
                                              </DropdownItem>
                                            </DropdownList>
                                          </Dropdown>
                                        )}
                                      </Td>
                                      {editingDrawerRowId === drawerRow.id && (
                                        <Td>
                                          <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              isDisabled={!drawerRow.recipient?.trim()}
                                              onClick={handleSaveDrawerRecipient}
                                            >
                                              <CheckIcon />
                                            </Button>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={handleCancelDrawerRecipient}
                                            >
                                              <TimesIcon />
                                            </Button>
                                          </div>
                                        </Td>
                                      )}
                                    </Tr>
                                  ))}
                                  {drawerRows.filter(row => row.isDefault).map((drawerRow) => (
                                    <Tr key={drawerRow.id}>
                                      <Td>
                                        <Checkbox
                                          id={`drawer-default-${drawerRow.id}`}
                                          isDisabled={true}
                                          isChecked={false}
                                          aria-label="Default recipient cannot be selected"
                                        />
                                      </Td>
                                      <Td>{drawerRow.recipient}</Td>
                                      <Td>{drawerRow.type || 'User group'}</Td>
                                      <Td>
                                        <Switch
                                          id={`drawer-switch-default-${drawerRow.id}`}
                                          aria-label="Default in-console alerts"
                                          isChecked={drawerRow.isConsoleAlertsEnabled}
                                          onChange={(_event, checked) => {
                                            setDrawerRows(prev => prev.map(row => 
                                              row.id === drawerRow.id 
                                                ? { ...row, isConsoleAlertsEnabled: checked }
                                                : row
                                            ));
                                          }}
                                        />
                                      </Td>
                                      <Td>
                                        <Dropdown
                                          isOpen={openRowMenus[`drawer-default-${drawerRow.id}`] || false}
                                          onOpenChange={(isOpen) => {
                                            setOpenRowMenus(prev => ({ ...prev, [`drawer-default-${drawerRow.id}`]: isOpen }));
                                          }}
                                          popperProps={{ position: 'right' }}
                                          toggle={(toggleRef) => (
                                            <MenuToggle
                                              ref={toggleRef}
                                              aria-label="Row actions"
                                              variant="plain"
                                              onClick={() => {
                                                setOpenRowMenus(prev => ({ 
                                                  ...prev, 
                                                  [`drawer-default-${drawerRow.id}`]: !prev[`drawer-default-${drawerRow.id}`] 
                                                }));
                                              }}
                                            >
                                              <EllipsisVIcon />
                                            </MenuToggle>
                                          )}
                                          shouldFocusToggleOnSelect
                                        >
                                          <DropdownList>
                                            <DropdownItem
                                              icon={<PencilAltIcon />}
                                              onClick={() => handleEditDetails(drawerRow.id, 'drawer')}
                                            >
                                              Edit details
                                            </DropdownItem>
                                            <DropdownItem
                                              icon={<PlayIcon />}
                                              onClick={() => handleExecuteTest(drawerRow.recipient || 'recipient', 'drawer')}
                                            >
                                              Execute test command
                                            </DropdownItem>
                                          </DropdownList>
                                        </Dropdown>
                                      </Td>
                                      {editingDrawerRowId && <Td></Td>}
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Card>
                              </div>
                            )}
                          </div>
                        </FlexItem>

                        {/* H4 Third-party notifiers header */}
                        <FlexItem>
                          <Title headingLevel="h4" size="md">Third-party notifiers</Title>
                        </FlexItem>

                        <FlexItem>
                          <div style={{ border: '1px solid #d2d2d2', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px 8px 0 0' }}>
                              <button
                                onClick={() => handleSectionToggle('slack')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '14px',
                                  fontWeight: '400',
                                  color: '#0066cc'
                                }}
                              >
                                <span style={{ transform: expandedSections['slack'] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                  <AngleRightIcon />
                                </span>
                                <img 
                                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png" 
                                  alt="Slack"
                                  style={{ width: '24px', height: 'auto' }}
                                />
                                <span>Slack</span>
                              </button>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddSlackRecipient();
                                  }}
                                >
                                  Add recipient(s)
                                </Button>
                                <Dropdown
                                  isOpen={isSlackOptionsOpen}
                                  onOpenChange={(isOpen) => setIsSlackOptionsOpen(isOpen)}
                                  popperProps={{ position: 'right' }}
                                  toggle={(toggleRef) => (
                                    <MenuToggle
                                      ref={toggleRef}
                                      aria-label="Slack options"
                                      variant="plain"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSlackOptionsOpen(!isSlackOptionsOpen);
                                      }}
                                    >
                                      <EllipsisVIcon />
                                    </MenuToggle>
                                  )}
                                  shouldFocusToggleOnSelect
                                >
                                  <DropdownList>
                                    <DropdownItem>Edit settings</DropdownItem>
                                    <DropdownItem>Duplicate configuration</DropdownItem>
                                    <DropdownItem>Reset to defaults</DropdownItem>
                                    <DropdownItem>Export settings</DropdownItem>
                                  </DropdownList>
                                </Dropdown>
                              </Flex>
                            </div>
                            {expandedSections['slack'] && (
                              <div style={{ padding: '0 16px 16px 16px' }}>
                                <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                                  Connect your Slack account to receive notifications when roles are deleted in your workspace.
                                </div>
                                
{slackRows.length === 0 ? (
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                                  <EmptyState>
                                    <EmptyStateBody>
                                      You have not added any Slack recipients yet.
                                    </EmptyStateBody>
                                    <EmptyStateActions>
                                      <Button variant="link" icon={<PlusCircleIcon />} iconPosition="start" onClick={handleAddSlackRecipient}>
                                        Add recipient
                                      </Button>
                                    </EmptyStateActions>
                                  </EmptyState>
                                </Card>
                              ) : (
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                              <Table aria-label="Slack notification settings">
                                <Thead>
                                  <Tr>
                                    <Th width={10}>
                                      <Checkbox
                                        id="slack-select-all"
                                        isChecked={slackRows.length > 0 && slackRows.every(row => selectedRows.includes(row.id))}
                                        onChange={(event, checked) => handleSelectAll('slack', checked)}
                                        aria-label="Select all Slack recipients"
                                      />
                                    </Th>
                                    <Th width={editingSlackRowId ? 25 : 35}>Recipient</Th>
                                    <Th width={editingSlackRowId ? 25 : 35}>Endpoint URL</Th>
                                    <Th width={editingSlackRowId ? 15 : 15}>Status</Th>
                                    <Th width={10}></Th>
                                    {editingSlackRowId && <Th width={15}></Th>}
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {slackRows.map((slackRow) => (
                                    <Tr key={slackRow.id}>
                                      <Td>
                                        <Checkbox
                                          id={`slack-select-${slackRow.id}`}
                                          isChecked={selectedRows.includes(slackRow.id)}
                                          onChange={(event, checked) => handleRowSelect(slackRow.id, checked)}
                                          aria-label={`Select ${slackRow.recipient || 'Slack recipient'}`}
                                        />
                                      </Td>
                                      <Td>
                                        {editingSlackRowId === slackRow.id ? (
                                          <TextInput
                                            value={slackRow.recipient}
                                            onChange={(event, value) => {
                                              setSlackRows(prev => prev.map(row => 
                                                row.id === slackRow.id 
                                                  ? { ...row, recipient: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter recipient name"
                                          />
                                        ) : (
                                          slackRow.recipient || 'New recipient'
                                        )}
                                      </Td>
                                      <Td>
                                        {editingSlackRowId === slackRow.id ? (
                                          <TextInput
                                            value={slackRow.endpointUrl}
                                            onChange={(event, value) => {
                                              setSlackRows(prev => prev.map(row => 
                                                row.id === slackRow.id 
                                                  ? { ...row, endpointUrl: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter endpoint URL"
                                          />
                                        ) : (
                                          slackRow.endpointUrl ? (
                                            <Tooltip content={slackRow.endpointUrl}>
                                              <Truncate content={slackRow.endpointUrl} />
                                            </Tooltip>
                                          ) : (
                                            'Enter URL'
                                          )
                                        )}
                                      </Td>
                                      <Td>
                                        {editingSlackRowId === slackRow.id ? (
                                          // Show disabled "on" switch during edit mode
                                          <Switch
                                            id={`slack-switch-preview-${slackRow.id}`}
                                            aria-label="Will be enabled when saved"
                                            isChecked={true}
                                            isDisabled={true}
                                          />
                                        ) : (
                                          // Show functional switch after saving
                                          <Switch
                                            id={`slack-switch-${slackRow.id}`}
                                            aria-label="Slack recipient notifications"
                                            isChecked={slackRow.isEnabled}
                                            onChange={(_event, checked) => {
                                              setSlackRows(prev => prev.map(row => 
                                                row.id === slackRow.id 
                                                  ? { ...row, isEnabled: checked }
                                                  : row
                                              ));
                                            }}
                                          />
                                        )}
                                      </Td>
                                      <Td>
                                        {editingSlackRowId !== slackRow.id && (
                                          <Dropdown
                                            isOpen={openRowMenus[`slack-${slackRow.id}`] || false}
                                            onOpenChange={(isOpen) => {
                                              setOpenRowMenus(prev => ({ ...prev, [`slack-${slackRow.id}`]: isOpen }));
                                            }}
                                            popperProps={{ position: 'right' }}
                                            toggle={(toggleRef) => (
                                              <MenuToggle
                                                ref={toggleRef}
                                                aria-label="Row actions"
                                                variant="plain"
                                                onClick={() => {
                                                  setOpenRowMenus(prev => ({ 
                                                    ...prev, 
                                                    [`slack-${slackRow.id}`]: !prev[`slack-${slackRow.id}`] 
                                                  }));
                                                }}
                                              >
                                                <EllipsisVIcon />
                                              </MenuToggle>
                                            )}
                                            shouldFocusToggleOnSelect
                                          >
                                            <DropdownList>
                                              <DropdownItem
                                                icon={<PencilAltIcon />}
                                                onClick={() => handleEditDetails(slackRow.id, 'slack')}
                                              >
                                                Edit details
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<PlayIcon />}
                                                onClick={() => handleExecuteTest(slackRow.recipient || 'recipient', 'slack')}
                                              >
                                                Execute test command
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<MinusCircleIcon />}
                                                isDanger
                                                onClick={() => handleRemoveRecipient(slackRow.id, 'slack', slackRow.recipient || 'recipient')}
                                              >
                                                Remove recipient
                                              </DropdownItem>
                                            </DropdownList>
                                          </Dropdown>
                                        )}
                                      </Td>
                                      {editingSlackRowId === slackRow.id && (
                                        <Td>
                                          <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              isDisabled={!slackRow.recipient?.trim() || !slackRow.endpointUrl?.trim()}
                                              onClick={handleSaveSlackRecipient}
                                            >
                                              <CheckIcon />
                                            </Button>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={handleCancelSlackRecipient}
                                            >
                                              <TimesIcon />
                                            </Button>
                                          </div>
                                        </Td>
                                      )}
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Card>
                              )}
                              </div>
                            )}
                          </div>
                        </FlexItem>

                        <FlexItem>
                          <div style={{ border: '1px solid #d2d2d2', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px 8px 0 0' }}>
                              <button
                                onClick={() => handleSectionToggle('teams')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '14px',
                                  fontWeight: '400',
                                  color: '#0066cc'
                                }}
                              >
                                <span style={{ transform: expandedSections['teams'] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                  <AngleRightIcon />
                                </span>
                                <img 
                                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg/2203px-Microsoft_Office_Teams_%282018%E2%80%93present%29.svg.png" 
                                  alt="Microsoft Teams"
                                  style={{ width: '24px', height: 'auto' }}
                                />
                                <span>Microsoft Teams</span>
                              </button>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddTeamsRecipient();
                                  }}
                                >
                                  Add recipient(s)
                                </Button>
                                <Dropdown
                                  isOpen={isTeamsOptionsOpen}
                                  onOpenChange={(isOpen) => setIsTeamsOptionsOpen(isOpen)}
                                  popperProps={{ position: 'right' }}
                                  toggle={(toggleRef) => (
                                    <MenuToggle
                                      ref={toggleRef}
                                      aria-label="Teams options"
                                      variant="plain"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsTeamsOptionsOpen(!isTeamsOptionsOpen);
                                      }}
                                    >
                                      <EllipsisVIcon />
                                    </MenuToggle>
                                  )}
                                  shouldFocusToggleOnSelect
                                >
                                  <DropdownList>
                                    <DropdownItem>Edit settings</DropdownItem>
                                    <DropdownItem>Duplicate configuration</DropdownItem>
                                    <DropdownItem>Reset to defaults</DropdownItem>
                                    <DropdownItem>Export settings</DropdownItem>
                                  </DropdownList>
                                </Dropdown>
                              </Flex>
                            </div>
                            {expandedSections['teams'] && (
                              <div style={{ padding: '0 16px 16px 16px' }}>
                                <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                                  Connect your Microsoft Teams account to receive notifications when roles are deleted in your workspace.
                                </div>
                                
{teamsRows.length === 0 ? (
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                                  <EmptyState>
                                    <EmptyStateBody>
                                      You have not added any Microsoft Teams recipients yet.
                                    </EmptyStateBody>
                                    <EmptyStateActions>
                                      <Button variant="link" icon={<PlusCircleIcon />} iconPosition="start" onClick={handleAddTeamsRecipient}>
                                        Add recipient
                                      </Button>
                                    </EmptyStateActions>
                                  </EmptyState>
                                </Card>
                              ) : (
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                              <Table aria-label="Microsoft Teams notification settings">
                                <Thead>
                                  <Tr>
                                    <Th width={10}>
                                      <Checkbox
                                        id="teams-select-all"
                                        isChecked={teamsRows.length > 0 && teamsRows.every(row => selectedRows.includes(row.id))}
                                        onChange={(event, checked) => handleSelectAll('teams', checked)}
                                        aria-label="Select all Microsoft Teams recipients"
                                      />
                                    </Th>
                                    <Th width={editingTeamsRowId ? 25 : 35}>Recipient</Th>
                                    <Th width={editingTeamsRowId ? 25 : 35}>Endpoint URL</Th>
                                    <Th width={editingTeamsRowId ? 15 : 15}>Status</Th>
                                    <Th width={10}></Th>
                                    {editingTeamsRowId && <Th width={15}></Th>}
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {teamsRows.map((teamsRow) => (
                                    <Tr key={teamsRow.id}>
                                      <Td>
                                        <Checkbox
                                          id={`teams-select-${teamsRow.id}`}
                                          isChecked={selectedRows.includes(teamsRow.id)}
                                          onChange={(event, checked) => handleRowSelect(teamsRow.id, checked)}
                                          aria-label={`Select ${teamsRow.recipient || 'Teams recipient'}`}
                                        />
                                      </Td>
                                      <Td>
                                        {editingTeamsRowId === teamsRow.id ? (
                                          <TextInput
                                            value={teamsRow.recipient}
                                            onChange={(event, value) => {
                                              setTeamsRows(prev => prev.map(row => 
                                                row.id === teamsRow.id 
                                                  ? { ...row, recipient: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter recipient name"
                                          />
                                        ) : (
                                          teamsRow.recipient || 'New recipient'
                                        )}
                                      </Td>
                                      <Td>
                                        {editingTeamsRowId === teamsRow.id ? (
                                          <TextInput
                                            value={teamsRow.endpointUrl}
                                            onChange={(event, value) => {
                                              setTeamsRows(prev => prev.map(row => 
                                                row.id === teamsRow.id 
                                                  ? { ...row, endpointUrl: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter endpoint URL"
                                          />
                                        ) : (
                                          teamsRow.endpointUrl ? (
                                            <Tooltip content={teamsRow.endpointUrl}>
                                              <Truncate content={teamsRow.endpointUrl} />
                                            </Tooltip>
                                          ) : (
                                            'Enter URL'
                                          )
                                        )}
                                      </Td>
                                      <Td>
                                        {editingTeamsRowId === teamsRow.id ? (
                                          // Show disabled "on" switch during edit mode
                                          <Switch
                                            id={`teams-switch-preview-${teamsRow.id}`}
                                            aria-label="Will be enabled when saved"
                                            isChecked={true}
                                            isDisabled={true}
                                          />
                                        ) : (
                                          // Show functional switch after saving
                                          <Switch
                                            id={`teams-switch-${teamsRow.id}`}
                                            aria-label="Teams recipient notifications"
                                            isChecked={teamsRow.isEnabled}
                                            onChange={(_event, checked) => {
                                              setTeamsRows(prev => prev.map(row => 
                                                row.id === teamsRow.id 
                                                  ? { ...row, isEnabled: checked }
                                                  : row
                                              ));
                                            }}
                                          />
                                        )}
                                      </Td>
                                      <Td>
                                        {editingTeamsRowId !== teamsRow.id && (
                                          <Dropdown
                                            isOpen={openRowMenus[`teams-${teamsRow.id}`] || false}
                                            onOpenChange={(isOpen) => {
                                              setOpenRowMenus(prev => ({ ...prev, [`teams-${teamsRow.id}`]: isOpen }));
                                            }}
                                            popperProps={{ position: 'right' }}
                                            toggle={(toggleRef) => (
                                              <MenuToggle
                                                ref={toggleRef}
                                                aria-label="Row actions"
                                                variant="plain"
                                                onClick={() => {
                                                  setOpenRowMenus(prev => ({ 
                                                    ...prev, 
                                                    [`teams-${teamsRow.id}`]: !prev[`teams-${teamsRow.id}`] 
                                                  }));
                                                }}
                                              >
                                                <EllipsisVIcon />
                                              </MenuToggle>
                                            )}
                                            shouldFocusToggleOnSelect
                                          >
                                            <DropdownList>
                                              <DropdownItem
                                                icon={<PencilAltIcon />}
                                                onClick={() => handleEditDetails(teamsRow.id, 'teams')}
                                              >
                                                Edit details
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<PlayIcon />}
                                                onClick={() => handleExecuteTest(teamsRow.recipient || 'recipient', 'teams')}
                                              >
                                                Execute test command
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<MinusCircleIcon />}
                                                isDanger
                                                onClick={() => handleRemoveRecipient(teamsRow.id, 'teams', teamsRow.recipient || 'recipient')}
                                              >
                                                Remove recipient
                                              </DropdownItem>
                                            </DropdownList>
                                          </Dropdown>
                                        )}
                                      </Td>
                                      {editingTeamsRowId === teamsRow.id && (
                                        <Td>
                                          <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              isDisabled={!teamsRow.recipient?.trim() || !teamsRow.endpointUrl?.trim()}
                                              onClick={handleSaveTeamsRecipient}
                                            >
                                              <CheckIcon />
                                            </Button>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={handleCancelTeamsRecipient}
                                            >
                                              <TimesIcon />
                                            </Button>
                                          </div>
                                        </Td>
                                      )}
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Card>
                              )}
                              </div>
                            )}
                          </div>
                        </FlexItem>

                        <FlexItem>
                          <div style={{ border: '1px solid #d2d2d2', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px 8px 0 0' }}>
                              <button
                                onClick={() => handleSectionToggle('google-chat')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '14px',
                                  fontWeight: '400',
                                  color: '#0066cc'
                                }}
                              >
                                <span style={{ transform: expandedSections['google-chat'] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                  <AngleRightIcon />
                                </span>
                                <img 
                                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Google_Chat_icon_%282020%29.svg/1964px-Google_Chat_icon_%282020%29.svg.png" 
                                  alt="Google Chat"
                                  style={{ width: '24px', height: 'auto' }}
                                />
                                <span>Google Chat</span>
                              </button>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddGChatRecipient();
                                  }}
                                >
                                  Add recipient(s)
                                </Button>
                                <Dropdown
                                  isOpen={isGChatOptionsOpen}
                                  onOpenChange={(isOpen) => setIsGChatOptionsOpen(isOpen)}
                                  popperProps={{ position: 'right' }}
                                  toggle={(toggleRef) => (
                                    <MenuToggle
                                      ref={toggleRef}
                                      aria-label="Google Chat options"
                                      variant="plain"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsGChatOptionsOpen(!isGChatOptionsOpen);
                                      }}
                                    >
                                      <EllipsisVIcon />
                                    </MenuToggle>
                                  )}
                                  shouldFocusToggleOnSelect
                                >
                                  <DropdownList>
                                    <DropdownItem>Edit settings</DropdownItem>
                                    <DropdownItem>Duplicate configuration</DropdownItem>
                                    <DropdownItem>Reset to defaults</DropdownItem>
                                    <DropdownItem>Export settings</DropdownItem>
                                  </DropdownList>
                                </Dropdown>
                              </Flex>
                            </div>
                            {expandedSections['google-chat'] && (
                              <div style={{ padding: '0 16px 16px 16px' }}>
                                <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                                  Connect your Google Chat account to receive notifications when roles are deleted in your workspace.
                                </div>
                                
{gChatRows.length === 0 ? (
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                                  <EmptyState>
                                    <EmptyStateBody>
                                      You have not added any Google Chat recipients yet.
                                    </EmptyStateBody>
                                    <EmptyStateActions>
                                      <Button variant="link" icon={<PlusCircleIcon />} iconPosition="start" onClick={handleAddGChatRecipient}>
                                        Add recipient
                                      </Button>
                                    </EmptyStateActions>
                                  </EmptyState>
                                </Card>
                              ) : (
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                              <Table aria-label="Google Chat notification settings">
                                <Thead>
                                  <Tr>
                                    <Th width={10}>
                                      <Checkbox
                                        id="gchat-select-all"
                                        isChecked={gChatRows.length > 0 && gChatRows.every(row => selectedRows.includes(row.id))}
                                        onChange={(event, checked) => handleSelectAll('gchat', checked)}
                                        aria-label="Select all Google Chat recipients"
                                      />
                                    </Th>
                                    <Th width={editingGChatRowId ? 25 : 35}>Recipient</Th>
                                    <Th width={editingGChatRowId ? 25 : 35}>Endpoint URL</Th>
                                    <Th width={editingGChatRowId ? 15 : 15}>Status</Th>
                                    <Th width={10}></Th>
                                    {editingGChatRowId && <Th width={15}></Th>}
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {gChatRows.map((gChatRow) => (
                                    <Tr key={gChatRow.id}>
                                      <Td>
                                        <Checkbox
                                          id={`gchat-select-${gChatRow.id}`}
                                          isChecked={selectedRows.includes(gChatRow.id)}
                                          onChange={(event, checked) => handleRowSelect(gChatRow.id, checked)}
                                          aria-label={`Select ${gChatRow.recipient || 'Google Chat recipient'}`}
                                        />
                                      </Td>
                                      <Td>
                                        {editingGChatRowId === gChatRow.id ? (
                                          <TextInput
                                            value={gChatRow.recipient}
                                            onChange={(event, value) => {
                                              setGChatRows(prev => prev.map(row => 
                                                row.id === gChatRow.id 
                                                  ? { ...row, recipient: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter recipient name"
                                          />
                                        ) : (
                                          gChatRow.recipient || 'New recipient'
                                        )}
                                      </Td>
                                      <Td>
                                        {editingGChatRowId === gChatRow.id ? (
                                          <TextInput
                                            value={gChatRow.endpointUrl}
                                            onChange={(event, value) => {
                                              setGChatRows(prev => prev.map(row => 
                                                row.id === gChatRow.id 
                                                  ? { ...row, endpointUrl: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter endpoint URL"
                                          />
                                        ) : (
                                          gChatRow.endpointUrl ? (
                                            <Tooltip content={gChatRow.endpointUrl}>
                                              <Truncate content={gChatRow.endpointUrl} />
                                            </Tooltip>
                                          ) : (
                                            'Enter URL'
                                          )
                                        )}
                                      </Td>
                                      <Td>
                                        {editingGChatRowId === gChatRow.id ? (
                                          // Show disabled "on" switch during edit mode
                                          <Switch
                                            id={`gchat-switch-preview-${gChatRow.id}`}
                                            aria-label="Will be enabled when saved"
                                            isChecked={true}
                                            isDisabled={true}
                                          />
                                        ) : (
                                          // Show functional switch after saving
                                          <Switch
                                            id={`gchat-switch-${gChatRow.id}`}
                                            aria-label="Google Chat recipient notifications"
                                            isChecked={gChatRow.isEnabled}
                                            onChange={(_event, checked) => {
                                              setGChatRows(prev => prev.map(row => 
                                                row.id === gChatRow.id 
                                                  ? { ...row, isEnabled: checked }
                                                  : row
                                              ));
                                            }}
                                          />
                                        )}
                                      </Td>
                                      <Td>
                                        {editingGChatRowId !== gChatRow.id && (
                                          <Dropdown
                                            isOpen={openRowMenus[`gchat-${gChatRow.id}`] || false}
                                            onOpenChange={(isOpen) => {
                                              setOpenRowMenus(prev => ({ ...prev, [`gchat-${gChatRow.id}`]: isOpen }));
                                            }}
                                            popperProps={{ position: 'right' }}
                                            toggle={(toggleRef) => (
                                              <MenuToggle
                                                ref={toggleRef}
                                                aria-label="Row actions"
                                                variant="plain"
                                                onClick={() => {
                                                  setOpenRowMenus(prev => ({ 
                                                    ...prev, 
                                                    [`gchat-${gChatRow.id}`]: !prev[`gchat-${gChatRow.id}`] 
                                                  }));
                                                }}
                                              >
                                                <EllipsisVIcon />
                                              </MenuToggle>
                                            )}
                                            shouldFocusToggleOnSelect
                                          >
                                            <DropdownList>
                                              <DropdownItem
                                                icon={<PencilAltIcon />}
                                                onClick={() => handleEditDetails(gChatRow.id, 'gchat')}
                                              >
                                                Edit details
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<PlayIcon />}
                                                onClick={() => handleExecuteTest(gChatRow.recipient || 'recipient', 'gchat')}
                                              >
                                                Execute test command
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<MinusCircleIcon />}
                                                isDanger
                                                onClick={() => handleRemoveRecipient(gChatRow.id, 'gchat', gChatRow.recipient || 'recipient')}
                                              >
                                                Remove recipient
                                              </DropdownItem>
                                            </DropdownList>
                                          </Dropdown>
                                        )}
                                      </Td>
                                      {editingGChatRowId === gChatRow.id && (
                                        <Td>
                                          <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              isDisabled={!gChatRow.recipient?.trim() || !gChatRow.endpointUrl?.trim()}
                                              onClick={handleSaveGChatRecipient}
                                            >
                                              <CheckIcon />
                                            </Button>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={handleCancelGChatRecipient}
                                            >
                                              <TimesIcon />
                                            </Button>
                                          </div>
                                        </Td>
                                      )}
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Card>
                              )}
                              </div>
                            )}
                          </div>
                        </FlexItem>

                        <FlexItem>
                          <div style={{ border: '1px solid #d2d2d2', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px 8px 0 0' }}>
                              <button
                                onClick={() => handleSectionToggle('splunk')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '14px',
                                  fontWeight: '400',
                                  color: '#0066cc'
                                }}
                              >
                                <span style={{ transform: expandedSections['splunk'] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                  <AngleRightIcon />
                                </span>
                                <img 
                                  src="https://www.datocms-assets.com/55802/1715688864-splunklogo.png?auto=format" 
                                  alt="Splunk"
                                  style={{ width: '24px', height: 'auto' }}
                                />
                                <span>Splunk</span>
                              </button>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <Button
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddSplunkRecipient();
                                  }}
                                >
                                  Add recipient(s)
                                </Button>
                                <Dropdown
                                  isOpen={isSplunkOptionsOpen}
                                  onOpenChange={(isOpen) => setIsSplunkOptionsOpen(isOpen)}
                                  popperProps={{ position: 'right' }}
                                  toggle={(toggleRef) => (
                                    <MenuToggle
                                      ref={toggleRef}
                                      aria-label="Splunk options"
                                      variant="plain"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSplunkOptionsOpen(!isSplunkOptionsOpen);
                                      }}
                                    >
                                      <EllipsisVIcon />
                                    </MenuToggle>
                                  )}
                                  shouldFocusToggleOnSelect
                                >
                                  <DropdownList>
                                    <DropdownItem>Edit settings</DropdownItem>
                                    <DropdownItem>Duplicate configuration</DropdownItem>
                                    <DropdownItem>Reset to defaults</DropdownItem>
                                    <DropdownItem>Export settings</DropdownItem>
                                  </DropdownList>
                                </Dropdown>
                              </Flex>
                            </div>
                            {expandedSections['splunk'] && (
                              <div style={{ padding: '0 16px 16px 16px' }}>
                                <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                                  Integrate with Splunk to send role deletion notifications to your logging and monitoring platform.
                                </div>
                                
{splunkRows.length === 0 ? (
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                                  <EmptyState>
                                    <EmptyStateBody>
                                      You have not added any Splunk recipients yet.
                                    </EmptyStateBody>
                                    <EmptyStateActions>
                                      <Button variant="link" icon={<PlusCircleIcon />} iconPosition="start" onClick={handleAddSplunkRecipient}>
                                        Add recipient
                                      </Button>
                                    </EmptyStateActions>
                                  </EmptyState>
                                </Card>
                              ) : (
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                              <Table aria-label="Splunk notification settings">
                                <Thead>
                                  <Tr>
                                    <Th width={10}>
                                      <Checkbox
                                        id="splunk-select-all"
                                        isChecked={splunkRows.length > 0 && splunkRows.every(row => selectedRows.includes(row.id))}
                                        onChange={(event, checked) => handleSelectAll('splunk', checked)}
                                        aria-label="Select all Splunk recipients"
                                      />
                                    </Th>
                                    <Th width={editingSplunkRowId ? 25 : 35}>Recipient</Th>
                                    <Th width={editingSplunkRowId ? 25 : 35}>Endpoint URL</Th>
                                    <Th width={editingSplunkRowId ? 15 : 15}>Status</Th>
                                    <Th width={10}></Th>
                                    {editingSplunkRowId && <Th width={15}></Th>}
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {splunkRows.map((splunkRow) => (
                                    <Tr key={splunkRow.id}>
                                      <Td>
                                        <Checkbox
                                          id={`splunk-select-${splunkRow.id}`}
                                          isChecked={selectedRows.includes(splunkRow.id)}
                                          onChange={(event, checked) => handleRowSelect(splunkRow.id, checked)}
                                          aria-label={`Select ${splunkRow.recipient || 'Splunk recipient'}`}
                                        />
                                      </Td>
                                      <Td>
                                        {editingSplunkRowId === splunkRow.id ? (
                                          <TextInput
                                            value={splunkRow.recipient}
                                            onChange={(event, value) => {
                                              setSplunkRows(prev => prev.map(row => 
                                                row.id === splunkRow.id 
                                                  ? { ...row, recipient: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter recipient name"
                                          />
                                        ) : (
                                          splunkRow.recipient || 'New recipient'
                                        )}
                                      </Td>
                                      <Td>
                                        {editingSplunkRowId === splunkRow.id ? (
                                          <TextInput
                                            value={splunkRow.endpointUrl}
                                            onChange={(event, value) => {
                                              setSplunkRows(prev => prev.map(row => 
                                                row.id === splunkRow.id 
                                                  ? { ...row, endpointUrl: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter endpoint URL"
                                          />
                                        ) : (
                                          splunkRow.endpointUrl ? (
                                            <Tooltip content={splunkRow.endpointUrl}>
                                              <Truncate content={splunkRow.endpointUrl} />
                                            </Tooltip>
                                          ) : (
                                            'Enter URL'
                                          )
                                        )}
                                      </Td>
                                      <Td>
                                        {editingSplunkRowId === splunkRow.id ? (
                                          <Switch
                                            id={`splunk-switch-preview-${splunkRow.id}`}
                                            aria-label="Will be enabled when saved"
                                            isChecked={true}
                                            isDisabled={true}
                                          />
                                        ) : (
                                          <Switch
                                            id={`splunk-switch-${splunkRow.id}`}
                                            aria-label="Splunk recipient notifications"
                                            isChecked={splunkRow.isEnabled}
                                            onChange={(_event, checked) => {
                                              setSplunkRows(prev => prev.map(row => 
                                                row.id === splunkRow.id 
                                                  ? { ...row, isEnabled: checked }
                                                  : row
                                              ));
                                            }}
                                          />
                                        )}
                                      </Td>
                                      <Td>
                                        {editingSplunkRowId !== splunkRow.id && (
                                          <Dropdown
                                            isOpen={openRowMenus[`splunk-${splunkRow.id}`] || false}
                                            onOpenChange={(isOpen) => {
                                              setOpenRowMenus(prev => ({ ...prev, [`splunk-${splunkRow.id}`]: isOpen }));
                                            }}
                                            popperProps={{ position: 'right' }}
                                            toggle={(toggleRef) => (
                                              <MenuToggle
                                                ref={toggleRef}
                                                aria-label="Row actions"
                                                variant="plain"
                                                onClick={() => {
                                                  setOpenRowMenus(prev => ({ 
                                                    ...prev, 
                                                    [`splunk-${splunkRow.id}`]: !prev[`splunk-${splunkRow.id}`] 
                                                  }));
                                                }}
                                              >
                                                <EllipsisVIcon />
                                              </MenuToggle>
                                            )}
                                            shouldFocusToggleOnSelect
                                          >
                                            <DropdownList>
                                              <DropdownItem
                                                icon={<PencilAltIcon />}
                                                onClick={() => handleEditDetails(splunkRow.id, 'splunk')}
                                              >
                                                Edit details
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<PlayIcon />}
                                                onClick={() => handleExecuteTest(splunkRow.recipient || 'recipient', 'splunk')}
                                              >
                                                Execute test command
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<MinusCircleIcon />}
                                                isDanger
                                                onClick={() => handleRemoveRecipient(splunkRow.id, 'splunk', splunkRow.recipient || 'recipient')}
                                              >
                                                Remove recipient
                                              </DropdownItem>
                                            </DropdownList>
                                          </Dropdown>
                                        )}
                                      </Td>
                                      {editingSplunkRowId === splunkRow.id && (
                                        <Td>
                                          <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              isDisabled={!splunkRow.recipient?.trim() || !splunkRow.endpointUrl?.trim()}
                                              onClick={handleSaveSplunkRecipient}
                                            >
                                              <CheckIcon />
                                            </Button>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={handleCancelSplunkRecipient}
                                            >
                                              <TimesIcon />
                                            </Button>
                                          </div>
                                        </Td>
                                      )}
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Card>
                              )}
                              </div>
                            )}
                          </div>
                        </FlexItem>

                        <FlexItem>
                          <div style={{ border: '1px solid #d2d2d2', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px 8px 0 0' }}>
                              <button
                                onClick={() => handleSectionToggle('servicenow')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '14px',
                                  fontWeight: '400',
                                  color: '#0066cc'
                                }}
                              >
                                <span style={{ transform: expandedSections['servicenow'] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                  <AngleRightIcon />
                                </span>
                                <img 
                                  src="https://images.icon-icons.com/2699/PNG/512/servicenow_logo_icon_168835.png" 
                                  alt="ServiceNow"
                                  style={{ width: '24px', height: 'auto' }}
                                />
                                <span>ServiceNow</span>
                              </button>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <Button
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddServiceNowRecipient();
                                  }}
                                >
                                  Add recipient(s)
                                </Button>
                                <Dropdown
                                  isOpen={isServiceNowOptionsOpen}
                                  onOpenChange={(isOpen) => setIsServiceNowOptionsOpen(isOpen)}
                                  popperProps={{ position: 'right' }}
                                  toggle={(toggleRef) => (
                                    <MenuToggle
                                      ref={toggleRef}
                                      aria-label="ServiceNow options"
                                      variant="plain"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsServiceNowOptionsOpen(!isServiceNowOptionsOpen);
                                      }}
                                    >
                                      <EllipsisVIcon />
                                    </MenuToggle>
                                  )}
                                  shouldFocusToggleOnSelect
                                >
                                  <DropdownList>
                                    <DropdownItem>Edit settings</DropdownItem>
                                    <DropdownItem>Duplicate configuration</DropdownItem>
                                    <DropdownItem>Reset to defaults</DropdownItem>
                                    <DropdownItem>Export settings</DropdownItem>
                                  </DropdownList>
                                </Dropdown>
                              </Flex>
                            </div>
                            {expandedSections['servicenow'] && (
                              <div style={{ padding: '0 16px 16px 16px' }}>
                                <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                                  Create incidents in ServiceNow when roles are deleted in your workspace.
                                </div>
                                
{serviceNowRows.length === 0 ? (
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                                  <EmptyState>
                                    <EmptyStateBody>
                                      You have not added any ServiceNow recipients yet.
                                    </EmptyStateBody>
                                    <EmptyStateActions>
                                      <Button variant="link" icon={<PlusCircleIcon />} iconPosition="start" onClick={handleAddServiceNowRecipient}>
                                        Add recipient
                                      </Button>
                                    </EmptyStateActions>
                                  </EmptyState>
                                </Card>
                              ) : (
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                              <Table aria-label="ServiceNow notification settings">
                                <Thead>
                                  <Tr>
                                    <Th width={10}>
                                      <Checkbox
                                        id="servicenow-select-all"
                                        isChecked={serviceNowRows.length > 0 && serviceNowRows.every(row => selectedRows.includes(row.id))}
                                        onChange={(event, checked) => handleSelectAll('servicenow', checked)}
                                        aria-label="Select all ServiceNow recipients"
                                      />
                                    </Th>
                                    <Th width={editingServiceNowRowId ? 25 : 35}>Recipient</Th>
                                    <Th width={editingServiceNowRowId ? 25 : 35}>Endpoint URL</Th>
                                    <Th width={editingServiceNowRowId ? 15 : 15}>Status</Th>
                                    <Th width={10}></Th>
                                    {editingServiceNowRowId && <Th width={15}></Th>}
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {serviceNowRows.map((serviceNowRow) => (
                                    <Tr key={serviceNowRow.id}>
                                      <Td>
                                        <Checkbox
                                          id={`servicenow-select-${serviceNowRow.id}`}
                                          isChecked={selectedRows.includes(serviceNowRow.id)}
                                          onChange={(event, checked) => handleRowSelect(serviceNowRow.id, checked)}
                                          aria-label={`Select ${serviceNowRow.recipient || 'ServiceNow recipient'}`}
                                        />
                                      </Td>
                                      <Td>
                                        {editingServiceNowRowId === serviceNowRow.id ? (
                                          <TextInput
                                            value={serviceNowRow.recipient}
                                            onChange={(event, value) => {
                                              setServiceNowRows(prev => prev.map(row => 
                                                row.id === serviceNowRow.id 
                                                  ? { ...row, recipient: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter recipient name"
                                          />
                                        ) : (
                                          serviceNowRow.recipient || 'New recipient'
                                        )}
                                      </Td>
                                      <Td>
                                        {editingServiceNowRowId === serviceNowRow.id ? (
                                          <TextInput
                                            value={serviceNowRow.endpointUrl}
                                            onChange={(event, value) => {
                                              setServiceNowRows(prev => prev.map(row => 
                                                row.id === serviceNowRow.id 
                                                  ? { ...row, endpointUrl: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter endpoint URL"
                                          />
                                        ) : (
                                          serviceNowRow.endpointUrl ? (
                                            <Tooltip content={serviceNowRow.endpointUrl}>
                                              <Truncate content={serviceNowRow.endpointUrl} />
                                            </Tooltip>
                                          ) : (
                                            'Enter URL'
                                          )
                                        )}
                                      </Td>
                                      <Td>
                                        {editingServiceNowRowId === serviceNowRow.id ? (
                                          <Switch
                                            id={`servicenow-switch-preview-${serviceNowRow.id}`}
                                            aria-label="Will be enabled when saved"
                                            isChecked={true}
                                            isDisabled={true}
                                          />
                                        ) : (
                                          <Switch
                                            id={`servicenow-switch-${serviceNowRow.id}`}
                                            aria-label="ServiceNow recipient notifications"
                                            isChecked={serviceNowRow.isEnabled}
                                            onChange={(_event, checked) => {
                                              setServiceNowRows(prev => prev.map(row => 
                                                row.id === serviceNowRow.id 
                                                  ? { ...row, isEnabled: checked }
                                                  : row
                                              ));
                                            }}
                                          />
                                        )}
                                      </Td>
                                      <Td>
                                        {editingServiceNowRowId !== serviceNowRow.id && (
                                          <Dropdown
                                            isOpen={openRowMenus[`servicenow-${serviceNowRow.id}`] || false}
                                            onOpenChange={(isOpen) => {
                                              setOpenRowMenus(prev => ({ ...prev, [`servicenow-${serviceNowRow.id}`]: isOpen }));
                                            }}
                                            popperProps={{ position: 'right' }}
                                            toggle={(toggleRef) => (
                                              <MenuToggle
                                                ref={toggleRef}
                                                aria-label="Row actions"
                                                variant="plain"
                                                onClick={() => {
                                                  setOpenRowMenus(prev => ({ 
                                                    ...prev, 
                                                    [`servicenow-${serviceNowRow.id}`]: !prev[`servicenow-${serviceNowRow.id}`] 
                                                  }));
                                                }}
                                              >
                                                <EllipsisVIcon />
                                              </MenuToggle>
                                            )}
                                            shouldFocusToggleOnSelect
                                          >
                                            <DropdownList>
                                              <DropdownItem
                                                icon={<PencilAltIcon />}
                                                onClick={() => handleEditDetails(serviceNowRow.id, 'servicenow')}
                                              >
                                                Edit details
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<PlayIcon />}
                                                onClick={() => handleExecuteTest(serviceNowRow.recipient || 'recipient', 'servicenow')}
                                              >
                                                Execute test command
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<MinusCircleIcon />}
                                                isDanger
                                                onClick={() => handleRemoveRecipient(serviceNowRow.id, 'servicenow', serviceNowRow.recipient || 'recipient')}
                                              >
                                                Remove recipient
                                              </DropdownItem>
                                            </DropdownList>
                                          </Dropdown>
                                        )}
                                      </Td>
                                      {editingServiceNowRowId === serviceNowRow.id && (
                                        <Td>
                                          <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              isDisabled={!serviceNowRow.recipient?.trim() || !serviceNowRow.endpointUrl?.trim()}
                                              onClick={handleSaveServiceNowRecipient}
                                            >
                                              <CheckIcon />
                                            </Button>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={handleCancelServiceNowRecipient}
                                            >
                                              <TimesIcon />
                                            </Button>
                                          </div>
                                        </Td>
                                      )}
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Card>
                              )}
                              </div>
                            )}
                          </div>
                        </FlexItem>

                        <FlexItem>
                          <div style={{ border: '1px solid #d2d2d2', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px 8px 0 0' }}>
                              <button
                                onClick={() => handleSectionToggle('pagerduty')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '14px',
                                  fontWeight: '400',
                                  color: '#0066cc'
                                }}
                              >
                                <span style={{ transform: expandedSections['pagerduty'] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                  <AngleRightIcon />
                                </span>
                                <img 
                                  src="https://images.seeklogo.com/logo-png/42/1/pagerduty-logo-png_seeklogo-426741.png" 
                                  alt="PagerDuty"
                                  style={{ width: '24px', height: 'auto' }}
                                />
                                <span>PagerDuty</span>
                              </button>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <Button
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddPagerDutyRecipient();
                                  }}
                                >
                                  Add recipient(s)
                                </Button>
                                <Dropdown
                                  isOpen={isPagerDutyOptionsOpen}
                                  onOpenChange={(isOpen) => setIsPagerDutyOptionsOpen(isOpen)}
                                  popperProps={{ position: 'right' }}
                                  toggle={(toggleRef) => (
                                    <MenuToggle
                                      ref={toggleRef}
                                      aria-label="PagerDuty options"
                                      variant="plain"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsPagerDutyOptionsOpen(!isPagerDutyOptionsOpen);
                                      }}
                                    >
                                      <EllipsisVIcon />
                                    </MenuToggle>
                                  )}
                                  shouldFocusToggleOnSelect
                                >
                                  <DropdownList>
                                    <DropdownItem>Edit settings</DropdownItem>
                                    <DropdownItem>Duplicate configuration</DropdownItem>
                                    <DropdownItem>Reset to defaults</DropdownItem>
                                    <DropdownItem>Export settings</DropdownItem>
                                  </DropdownList>
                                </Dropdown>
                              </Flex>
                            </div>
                            {expandedSections['pagerduty'] && (
                              <div style={{ padding: '0 16px 16px 16px' }}>
                                <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                                  Send alerts to PagerDuty when roles are deleted in your workspace.
                                </div>
                                
{pagerDutyRows.length === 0 ? (
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                                  <EmptyState>
                                    <EmptyStateBody>
                                      You have not added any PagerDuty recipients yet.
                                    </EmptyStateBody>
                                    <EmptyStateActions>
                                      <Button variant="link" icon={<PlusCircleIcon />} iconPosition="start" onClick={handleAddPagerDutyRecipient}>
                                        Add recipient
                                      </Button>
                                    </EmptyStateActions>
                                  </EmptyState>
                                </Card>
                              ) : (
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                              <Table aria-label="PagerDuty notification settings">
                                <Thead>
                                  <Tr>
                                    <Th width={10}>
                                      <Checkbox
                                        id="pagerduty-select-all"
                                        isChecked={pagerDutyRows.length > 0 && pagerDutyRows.every(row => selectedRows.includes(row.id))}
                                        onChange={(event, checked) => handleSelectAll('pagerduty', checked)}
                                        aria-label="Select all PagerDuty recipients"
                                      />
                                    </Th>
                                    <Th width={editingPagerDutyRowId ? 25 : 35}>Recipient</Th>
                                    <Th width={editingPagerDutyRowId ? 25 : 35}>Endpoint URL</Th>
                                    <Th width={editingPagerDutyRowId ? 15 : 15}>Status</Th>
                                    <Th width={10}></Th>
                                    {editingPagerDutyRowId && <Th width={15}></Th>}
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {pagerDutyRows.map((pagerDutyRow) => (
                                    <Tr key={pagerDutyRow.id}>
                                      <Td>
                                        <Checkbox
                                          id={`pagerduty-select-${pagerDutyRow.id}`}
                                          isChecked={selectedRows.includes(pagerDutyRow.id)}
                                          onChange={(event, checked) => handleRowSelect(pagerDutyRow.id, checked)}
                                          aria-label={`Select ${pagerDutyRow.recipient || 'PagerDuty recipient'}`}
                                        />
                                      </Td>
                                      <Td>
                                        {editingPagerDutyRowId === pagerDutyRow.id ? (
                                          <TextInput
                                            value={pagerDutyRow.recipient}
                                            onChange={(event, value) => {
                                              setPagerDutyRows(prev => prev.map(row => 
                                                row.id === pagerDutyRow.id 
                                                  ? { ...row, recipient: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter recipient name"
                                          />
                                        ) : (
                                          pagerDutyRow.recipient || 'New recipient'
                                        )}
                                      </Td>
                                      <Td>
                                        {editingPagerDutyRowId === pagerDutyRow.id ? (
                                          <TextInput
                                            value={pagerDutyRow.endpointUrl}
                                            onChange={(event, value) => {
                                              setPagerDutyRows(prev => prev.map(row => 
                                                row.id === pagerDutyRow.id 
                                                  ? { ...row, endpointUrl: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter endpoint URL"
                                          />
                                        ) : (
                                          pagerDutyRow.endpointUrl ? (
                                            <Tooltip content={pagerDutyRow.endpointUrl}>
                                              <Truncate content={pagerDutyRow.endpointUrl} />
                                            </Tooltip>
                                          ) : (
                                            'Enter URL'
                                          )
                                        )}
                                      </Td>
                                      <Td>
                                        {editingPagerDutyRowId === pagerDutyRow.id ? (
                                          <Switch
                                            id={`pagerduty-switch-preview-${pagerDutyRow.id}`}
                                            aria-label="Will be enabled when saved"
                                            isChecked={true}
                                            isDisabled={true}
                                          />
                                        ) : (
                                          <Switch
                                            id={`pagerduty-switch-${pagerDutyRow.id}`}
                                            aria-label="PagerDuty recipient notifications"
                                            isChecked={pagerDutyRow.isEnabled}
                                            onChange={(_event, checked) => {
                                              setPagerDutyRows(prev => prev.map(row => 
                                                row.id === pagerDutyRow.id 
                                                  ? { ...row, isEnabled: checked }
                                                  : row
                                              ));
                                            }}
                                          />
                                        )}
                                      </Td>
                                      <Td>
                                        {editingPagerDutyRowId !== pagerDutyRow.id && (
                                          <Dropdown
                                            isOpen={openRowMenus[`pagerduty-${pagerDutyRow.id}`] || false}
                                            onOpenChange={(isOpen) => {
                                              setOpenRowMenus(prev => ({ ...prev, [`pagerduty-${pagerDutyRow.id}`]: isOpen }));
                                            }}
                                            popperProps={{ position: 'right' }}
                                            toggle={(toggleRef) => (
                                              <MenuToggle
                                                ref={toggleRef}
                                                aria-label="Row actions"
                                                variant="plain"
                                                onClick={() => {
                                                  setOpenRowMenus(prev => ({ 
                                                    ...prev, 
                                                    [`pagerduty-${pagerDutyRow.id}`]: !prev[`pagerduty-${pagerDutyRow.id}`] 
                                                  }));
                                                }}
                                              >
                                                <EllipsisVIcon />
                                              </MenuToggle>
                                            )}
                                            shouldFocusToggleOnSelect
                                          >
                                            <DropdownList>
                                              <DropdownItem
                                                icon={<PencilAltIcon />}
                                                onClick={() => handleEditDetails(pagerDutyRow.id, 'pagerduty')}
                                              >
                                                Edit details
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<PlayIcon />}
                                                onClick={() => handleExecuteTest(pagerDutyRow.recipient || 'recipient', 'pagerduty')}
                                              >
                                                Execute test command
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<MinusCircleIcon />}
                                                isDanger
                                                onClick={() => handleRemoveRecipient(pagerDutyRow.id, 'pagerduty', pagerDutyRow.recipient || 'recipient')}
                                              >
                                                Remove recipient
                                              </DropdownItem>
                                            </DropdownList>
                                          </Dropdown>
                                        )}
                                      </Td>
                                      {editingPagerDutyRowId === pagerDutyRow.id && (
                                        <Td>
                                          <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              isDisabled={!pagerDutyRow.recipient?.trim() || !pagerDutyRow.endpointUrl?.trim()}
                                              onClick={handleSavePagerDutyRecipient}
                                            >
                                              <CheckIcon />
                                            </Button>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={handleCancelPagerDutyRecipient}
                                            >
                                              <TimesIcon />
                                            </Button>
                                          </div>
                                        </Td>
                                      )}
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Card>
                              )}
                              </div>
                            )}
                          </div>
                        </FlexItem>

                        <FlexItem>
                          <div style={{ border: '1px solid #d2d2d2', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px 8px 0 0' }}>
                              <button
                                onClick={() => handleSectionToggle('webhooks')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '14px',
                                  fontWeight: '400',
                                  color: '#0066cc'
                                }}
                              >
                                <span style={{ transform: expandedSections['webhooks'] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                  <AngleRightIcon />
                                </span>
                                <img 
                                  src="https://www.svgrepo.com/show/361957/webhooks.svg" 
                                  alt="Webhooks"
                                  style={{ width: '24px', height: 'auto' }}
                                />
                                <span>Webhooks</span>
                              </button>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle add recipient action
                                  }}
                                >
                                  Add recipient(s)
                                </Button>
                                <Dropdown
                                  isOpen={isWebhooksOptionsOpen}
                                  onOpenChange={(isOpen) => setIsWebhooksOptionsOpen(isOpen)}
                                  popperProps={{ position: 'right' }}
                                  toggle={(toggleRef) => (
                                    <MenuToggle
                                      ref={toggleRef}
                                      aria-label="Webhooks options"
                                      variant="plain"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsWebhooksOptionsOpen(!isWebhooksOptionsOpen);
                                      }}
                                    >
                                      <EllipsisVIcon />
                                    </MenuToggle>
                                  )}
                                  shouldFocusToggleOnSelect
                                >
                                  <DropdownList>
                                    <DropdownItem>Edit settings</DropdownItem>
                                    <DropdownItem>Duplicate configuration</DropdownItem>
                                    <DropdownItem>Reset to defaults</DropdownItem>
                                    <DropdownItem>Export settings</DropdownItem>
                                  </DropdownList>
                                </Dropdown>
                              </Flex>
                            </div>
                            {expandedSections['webhooks'] && (
                              <div style={{ padding: '0 16px 16px 16px' }}>
                                <div style={{ padding: '16px 0', color: '#6a6e73' }}>
                                  Configure custom webhook endpoints to integrate role deletion notifications with your own systems and workflows.
                                </div>
                                
{webhookRows.length === 0 ? (
                                <Card style={{ backgroundColor: '#f5f5f5' }}>
                                  <EmptyState>
                                    <EmptyStateBody>
                                      You have not added any webhooks yet.
                                    </EmptyStateBody>
                                    <EmptyStateActions>
                                      <Button variant="link" icon={<PlusCircleIcon />} iconPosition="start" onClick={handleAddWebhookRecipient}>
                                        Add recipient
                                      </Button>
                                    </EmptyStateActions>
                                  </EmptyState>
                                </Card>
                              ) : (
                                <Card style={{ padding: 0, backgroundColor: '#f5f5f5' }}>
                              <Table aria-label="Webhook configurations">
                                <Thead>
                                  <Tr>
                                    <Th width={10}>
                                      <Checkbox
                                        id="webhooks-select-all"
                                        isChecked={webhookRows.length > 0 && webhookRows.every(row => selectedRows.includes(row.id))}
                                        onChange={(event, checked) => handleSelectAll('webhooks', checked)}
                                        aria-label="Select all webhook recipients"
                                      />
                                    </Th>
                                    <Th width={editingWebhookRowId ? 25 : 30}>Recipient</Th>
                                    <Th width={editingWebhookRowId ? 25 : 30}>Endpoint URL</Th>
                                    <Th width={editingWebhookRowId ? 15 : 20}>Status</Th>
                                    <Th width={10}></Th>
                                    {editingWebhookRowId && <Th width={15}></Th>}
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {webhookRows.map((webhookRow) => (
                                    <Tr key={webhookRow.id}>
                                      <Td>
                                        <Checkbox
                                          id={`webhook-select-${webhookRow.id}`}
                                          isChecked={selectedRows.includes(webhookRow.id)}
                                          onChange={(event, checked) => handleRowSelect(webhookRow.id, checked)}
                                          aria-label={`Select ${webhookRow.recipient || 'webhook recipient'}`}
                                        />
                                      </Td>
                                      <Td>
                                        {editingWebhookRowId === webhookRow.id ? (
                                          <TextInput
                                            value={webhookRow.recipient}
                                            onChange={(event, value) => {
                                              setWebhookRows(prev => prev.map(row => 
                                                row.id === webhookRow.id 
                                                  ? { ...row, recipient: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter recipient name"
                                          />
                                        ) : (
                                          webhookRow.recipient ? (
                                            <Tooltip content={webhookRow.recipient}>
                                              <Truncate content={webhookRow.recipient} />
                                            </Tooltip>
                                          ) : (
                                            'New webhook'
                                          )
                                        )}
                                      </Td>
                                      <Td>
                                        {editingWebhookRowId === webhookRow.id ? (
                                          <TextInput
                                            value={webhookRow.endpointUrl}
                                            onChange={(event, value) => {
                                              setWebhookRows(prev => prev.map(row => 
                                                row.id === webhookRow.id 
                                                  ? { ...row, endpointUrl: value }
                                                  : row
                                              ));
                                            }}
                                            placeholder="Enter endpoint URL"
                                          />
                                        ) : (
                                          webhookRow.endpointUrl ? (
                                            <Tooltip content={webhookRow.endpointUrl}>
                                              <Truncate content={webhookRow.endpointUrl} />
                                            </Tooltip>
                                          ) : (
                                            'Enter URL'
                                          )
                                        )}
                                      </Td>
                                      <Td>
                                        {editingWebhookRowId === webhookRow.id ? (
                                          <Switch
                                            id={`webhook-switch-preview-${webhookRow.id}`}
                                            aria-label="Will be enabled when saved"
                                            isChecked={true}
                                            isDisabled={true}
                                          />
                                        ) : (
                                          <Switch
                                            id={`webhook-switch-${webhookRow.id}`}
                                            aria-label="Webhook notifications"
                                            isChecked={webhookRow.isEnabled}
                                            onChange={(_event, checked) => {
                                              setWebhookRows(prev => prev.map(row => 
                                                row.id === webhookRow.id 
                                                  ? { ...row, isEnabled: checked }
                                                  : row
                                              ));
                                            }}
                                          />
                                        )}
                                      </Td>
                                      <Td>
                                        {editingWebhookRowId !== webhookRow.id && (
                                          <Dropdown
                                            isOpen={openRowMenus[`webhook-${webhookRow.id}`] || false}
                                            onOpenChange={(isOpen) => {
                                              setOpenRowMenus(prev => ({ ...prev, [`webhook-${webhookRow.id}`]: isOpen }));
                                            }}
                                            popperProps={{ position: 'right' }}
                                            toggle={(toggleRef) => (
                                              <MenuToggle
                                                ref={toggleRef}
                                                aria-label="Row actions"
                                                variant="plain"
                                                onClick={() => {
                                                  setOpenRowMenus(prev => ({ 
                                                    ...prev, 
                                                    [`webhook-${webhookRow.id}`]: !prev[`webhook-${webhookRow.id}`] 
                                                  }));
                                                }}
                                              >
                                                <EllipsisVIcon />
                                              </MenuToggle>
                                            )}
                                            shouldFocusToggleOnSelect
                                          >
                                            <DropdownList>
                                              <DropdownItem
                                                icon={<PencilAltIcon />}
                                                onClick={() => handleEditDetails(webhookRow.id, 'webhooks')}
                                              >
                                                Edit details
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<PlayIcon />}
                                                onClick={() => handleExecuteTest(webhookRow.recipient || 'recipient', 'webhooks')}
                                              >
                                                Execute test command
                                              </DropdownItem>
                                              <DropdownItem
                                                icon={<MinusCircleIcon />}
                                                isDanger
                                                onClick={() => handleRemoveRecipient(webhookRow.id, 'webhooks', webhookRow.recipient || 'recipient')}
                                              >
                                                Remove recipient
                                              </DropdownItem>
                                            </DropdownList>
                                          </Dropdown>
                                        )}
                                      </Td>
                                      {editingWebhookRowId === webhookRow.id && (
                                        <Td>
                                          <div style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              isDisabled={!webhookRow.recipient?.trim() || !webhookRow.endpointUrl?.trim()}
                                              onClick={handleSaveWebhookRecipient}
                                            >
                                              <CheckIcon />
                                            </Button>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={handleCancelWebhookRecipient}
                                            >
                                              <TimesIcon />
                                            </Button>
                                          </div>
                                        </Td>
                                      )}
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Card>
                              )}
                              </div>
                            )}
                          </div>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                
                {/* Bottom Save/Cancel Actions - only show when autosave is OFF */}
                {!isWorkspaceNotificationsEnabled && (
                  <FlexItem>
                    <Flex justifyContent={{ default: 'justifyContentFlexStart' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem>
                        <Button variant="primary">
                          Save
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button variant="link">
                          Cancel
                        </Button>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                )}
              </Flex>
            </PageSection>
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};

export { RoleDeleted };
