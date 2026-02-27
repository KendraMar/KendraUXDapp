import React from 'react';
import {
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Button,
  Modal,
  ModalVariant,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
  Backdrop,
  Popover
} from '@patternfly/react-core';

const Overlays = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSmallModalOpen, setIsSmallModalOpen] = React.useState(false);
  const [isLargeModalOpen, setIsLargeModalOpen] = React.useState(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = React.useState(false);
  const [showBackdrop, setShowBackdrop] = React.useState(false);

  const handleModalToggle = () => setIsModalOpen(!isModalOpen);
  const handleSmallModalToggle = () => setIsSmallModalOpen(!isSmallModalOpen);
  const handleLargeModalToggle = () => setIsLargeModalOpen(!isLargeModalOpen);
  const handleDrawerToggle = () => setIsDrawerExpanded(!isDrawerExpanded);

  return (
    <Grid hasGutter>
      {/* Modal Variants */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Modals</CardTitle>
          <CardBody>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Button variant="primary" onClick={handleSmallModalToggle}>
                Open Small Modal
              </Button>
              <Button variant="primary" onClick={handleModalToggle}>
                Open Medium Modal
              </Button>
              <Button variant="primary" onClick={handleLargeModalToggle}>
                Open Large Modal
              </Button>
            </div>

            {/* Small Modal */}
            <Modal
              variant={ModalVariant.small}
              title="Small Modal"
              isOpen={isSmallModalOpen}
              onClose={handleSmallModalToggle}
              actions={[
                <Button key="confirm" variant="primary" onClick={handleSmallModalToggle}>
                  Confirm
                </Button>,
                <Button key="cancel" variant="link" onClick={handleSmallModalToggle}>
                  Cancel
                </Button>
              ]}
            >
              This is a small modal variant. It's ideal for simple confirmations or brief messages.
            </Modal>

            {/* Medium Modal */}
            <Modal
              variant={ModalVariant.medium}
              title="Medium Modal"
              isOpen={isModalOpen}
              onClose={handleModalToggle}
              actions={[
                <Button key="confirm" variant="primary" onClick={handleModalToggle}>
                  Confirm
                </Button>,
                <Button key="cancel" variant="link" onClick={handleModalToggle}>
                  Cancel
                </Button>
              ]}
            >
              <p>This is a medium modal (default size). It provides a good balance of space for most use cases.</p>
              <p>Modals overlay the page content and focus user attention on important information or actions.</p>
            </Modal>

            {/* Large Modal */}
            <Modal
              variant={ModalVariant.large}
              title="Large Modal"
              isOpen={isLargeModalOpen}
              onClose={handleLargeModalToggle}
              actions={[
                <Button key="confirm" variant="primary" onClick={handleLargeModalToggle}>
                  Confirm
                </Button>,
                <Button key="cancel" variant="link" onClick={handleLargeModalToggle}>
                  Cancel
                </Button>
              ]}
            >
              <p>This is a large modal variant. It's useful when you need to display more content or complex forms.</p>
              <p>Large modals can accommodate tables, multi-step forms, or detailed information that requires more space.</p>
              <p>Remember to keep the user experience in mind and only use large modals when the content truly needs the extra space.</p>
            </Modal>
          </CardBody>
        </Card>
      </GridItem>

      {/* Drawer */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Drawer</CardTitle>
          <CardBody>
            <Drawer isExpanded={isDrawerExpanded}>
              <DrawerContent
                panelContent={
                  <DrawerPanelContent widths={{ default: 'width_33' }}>
                    <DrawerHead>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Drawer Panel</span>
                      <DrawerActions>
                        <DrawerCloseButton onClick={handleDrawerToggle} />
                      </DrawerActions>
                    </DrawerHead>
                    <DrawerContentBody>
                      <p>This is the drawer panel content. It slides in from the right side.</p>
                      <p>Drawers are useful for displaying additional details or actions without leaving the current page.</p>
                      <p>They can contain forms, metadata, or any other content that supplements the main view.</p>
                    </DrawerContentBody>
                  </DrawerPanelContent>
                }
              >
                <DrawerContentBody>
                  <Button variant="primary" onClick={handleDrawerToggle}>
                    {isDrawerExpanded ? 'Close Drawer' : 'Open Drawer'}
                  </Button>
                  <p style={{ marginTop: '1rem' }}>
                    This is the main content area. Click the button to toggle the drawer panel.
                  </p>
                  <p>
                    The drawer provides a way to show additional content without navigating away from the current view.
                    It's particularly useful for detail views, filters, or supplementary information.
                  </p>
                </DrawerContentBody>
              </DrawerContent>
            </Drawer>
          </CardBody>
        </Card>
      </GridItem>

      {/* Backdrop */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Backdrop</CardTitle>
          <CardBody>
            <Button variant="primary" onClick={() => setShowBackdrop(true)}>
              Show Backdrop
            </Button>
            {showBackdrop && (
              <Backdrop onClick={() => setShowBackdrop(false)}>
                <div 
                  style={{ 
                    padding: '2rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    maxWidth: '400px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3>Content with Backdrop</h3>
                  <p>Click outside this box or the button below to close.</p>
                  <Button variant="primary" onClick={() => setShowBackdrop(false)}>
                    Close
                  </Button>
                </div>
              </Backdrop>
            )}
          </CardBody>
        </Card>
      </GridItem>

      {/* Popover */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Popover (Detailed)</CardTitle>
          <CardBody>
            <Popover
              headerContent="Popover Header"
              bodyContent={
                <div>
                  <p>This is a popover with detailed content.</p>
                  <p>Popovers can contain rich content including:</p>
                  <ul>
                    <li>Multiple paragraphs</li>
                    <li>Lists</li>
                    <li>Links and buttons</li>
                  </ul>
                </div>
              }
              footerContent={
                <div>
                  <a href="#">Learn more</a>
                </div>
              }
            >
              <Button variant="secondary">Click for detailed popover</Button>
            </Popover>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default Overlays;


