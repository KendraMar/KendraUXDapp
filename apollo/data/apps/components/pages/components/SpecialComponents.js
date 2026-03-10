import React from 'react';
import {
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Button,
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionToggle,
  ExpandableSection,
  Wizard,
  WizardStep,
  BackToTop,
  SkipToContent,
  AboutModal,
  Brand,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  TextInput,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemHeader,
  NotificationDrawerListItemBody,
  DualListSelector,
  CalendarMonth
} from '@patternfly/react-core';

const SpecialComponents = () => {
  const [isAccordionExpanded, setIsAccordionExpanded] = React.useState(false);
  const [isExpandableSectionExpanded, setIsExpandableSectionExpanded] = React.useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = React.useState(false);
  const [isNotificationDrawerExpanded, setIsNotificationDrawerExpanded] = React.useState(false);
  const [calendarDate, setCalendarDate] = React.useState(new Date());
  const [availableOptions, setAvailableOptions] = React.useState([
    'Option 1',
    'Option 2', 
    'Option 3',
    'Option 4'
  ]);
  const [chosenOptions, setChosenOptions] = React.useState([]);

  const onListChange = (newAvailableOptions, newChosenOptions) => {
    setAvailableOptions(newAvailableOptions);
    setChosenOptions(newChosenOptions);
  };

  return (
    <Grid hasGutter>
      {/* Accordion */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Accordion</CardTitle>
          <CardBody>
            <Accordion asDefinitionList={false}>
              <AccordionItem>
                <AccordionToggle
                  onClick={() => setIsAccordionExpanded(!isAccordionExpanded)}
                  isExpanded={isAccordionExpanded}
                  id="accordion-toggle-1"
                >
                  Click to expand
                </AccordionToggle>
                <AccordionContent
                  id="accordion-content-1"
                  isHidden={!isAccordionExpanded}
                >
                  <p>This content is revealed when you expand the accordion.</p>
                  <p>Accordions are great for organizing content that users might not need to see all at once.</p>
                  <p>They help reduce visual complexity and allow progressive disclosure of information.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardBody>
        </Card>
      </GridItem>

      {/* Expandable Section */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Expandable Section</CardTitle>
          <CardBody>
            <ExpandableSection
              toggleText={isExpandableSectionExpanded ? "Show less" : "Show more"}
              onToggle={(isExpanded) => setIsExpandableSectionExpanded(isExpanded)}
              isExpanded={isExpandableSectionExpanded}
            >
              <p>This is hidden content that appears when expanded.</p>
              <p>Use expandable sections to progressively disclose information.</p>
              <p>They're similar to accordions but with a simpler, lighter-weight implementation.</p>
            </ExpandableSection>
          </CardBody>
        </Card>
      </GridItem>

      {/* Calendar */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Calendar Month</CardTitle>
          <CardBody>
            <CalendarMonth
              date={calendarDate}
              onChange={(_event, date) => setCalendarDate(date)}
            />
            <div style={{ marginTop: '1rem', color: '#6a6e73' }}>
              Selected: {calendarDate.toLocaleDateString()}
            </div>
          </CardBody>
        </Card>
      </GridItem>

      {/* Toolbar */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Toolbar</CardTitle>
          <CardBody>
            <Toolbar>
              <ToolbarContent>
                <ToolbarItem>
                  <Button variant="primary">Action</Button>
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="secondary">Another</Button>
                </ToolbarItem>
                <ToolbarItem variant="separator" />
                <ToolbarItem>
                  <TextInput placeholder="Search..." />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
          </CardBody>
        </Card>
      </GridItem>

      {/* About Modal */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>About Modal</CardTitle>
          <CardBody>
            <Button variant="primary" onClick={() => setIsAboutModalOpen(true)}>
              Open About Modal
            </Button>
            <AboutModal
              isOpen={isAboutModalOpen}
              onClose={() => setIsAboutModalOpen(false)}
              trademark="Trademark and copyright information"
              brandImageSrc="/favicon.ico"
              brandImageAlt="Logo"
              productName="Apollo Dashboard"
            >
              <p>Version 1.0.0</p>
              <p>Built with PatternFly 6 components.</p>
            </AboutModal>
          </CardBody>
        </Card>
      </GridItem>

      {/* Back to Top */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Back to Top</CardTitle>
          <CardBody>
            <div style={{ height: '200px', overflow: 'auto', border: '1px solid #ccc', padding: '1rem', position: 'relative' }}>
              <p>Scroll down in this container...</p>
              <div style={{ height: '400px' }}>
                <p style={{ marginTop: '300px' }}>You've scrolled down!</p>
              </div>
              <BackToTop />
            </div>
          </CardBody>
        </Card>
      </GridItem>

      {/* Dual List Selector */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Dual List Selector</CardTitle>
          <CardBody>
            <DualListSelector
              availableOptions={availableOptions}
              chosenOptions={chosenOptions}
              onListChange={onListChange}
              id="dual-list-selector"
            />
          </CardBody>
        </Card>
      </GridItem>

      {/* Notification Drawer */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Notification Drawer</CardTitle>
          <CardBody>
            <Button 
              variant="primary" 
              onClick={() => setIsNotificationDrawerExpanded(!isNotificationDrawerExpanded)}
            >
              {isNotificationDrawerExpanded ? 'Hide' : 'Show'} Notifications
            </Button>
            {isNotificationDrawerExpanded && (
              <div style={{ marginTop: '1rem', border: '1px solid #ccc' }}>
                <NotificationDrawer>
                  <NotificationDrawerHeader count={3}>
                    Notifications
                  </NotificationDrawerHeader>
                  <NotificationDrawerBody>
                    <NotificationDrawerList>
                      <NotificationDrawerListItem variant="info">
                        <NotificationDrawerListItemHeader
                          variant="info"
                          title="Info notification"
                        />
                        <NotificationDrawerListItemBody>
                          This is an informational notification.
                        </NotificationDrawerListItemBody>
                      </NotificationDrawerListItem>
                      <NotificationDrawerListItem variant="success">
                        <NotificationDrawerListItemHeader
                          variant="success"
                          title="Success notification"
                        />
                        <NotificationDrawerListItemBody>
                          Operation completed successfully!
                        </NotificationDrawerListItemBody>
                      </NotificationDrawerListItem>
                      <NotificationDrawerListItem variant="warning">
                        <NotificationDrawerListItemHeader
                          variant="warning"
                          title="Warning notification"
                        />
                        <NotificationDrawerListItemBody>
                          Please review this warning message.
                        </NotificationDrawerListItemBody>
                      </NotificationDrawerListItem>
                    </NotificationDrawerList>
                  </NotificationDrawerBody>
                </NotificationDrawer>
              </div>
            )}
          </CardBody>
        </Card>
      </GridItem>

      {/* Skip to Content */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Skip to Content</CardTitle>
          <CardBody>
            <p style={{ marginBottom: '1rem' }}>
              The Skip to Content component is an accessibility feature that appears on tab focus.
            </p>
            <SkipToContent href="#main-content">
              Skip to main content
            </SkipToContent>
            <div id="main-content" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <p>This is the main content area. Try tabbing to see the skip link appear.</p>
            </div>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default SpecialComponents;


