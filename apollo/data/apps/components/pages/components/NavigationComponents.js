import React from 'react';
import {
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Tabs,
  Tab,
  TabTitleText,
  Breadcrumb,
  BreadcrumbItem,
  Pagination,
  JumpLinks,
  JumpLinksItem,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  Divider
} from '@patternfly/react-core';

const NavigationComponents = () => {
  const [activeTabKey, setActiveTabKey] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const onDropdownToggle = () => setIsDropdownOpen(!isDropdownOpen);
  const onDropdownSelect = () => setIsDropdownOpen(false);

  return (
    <Grid hasGutter>
      {/* Tabs */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Tabs</CardTitle>
          <CardBody>
            <Tabs
              activeKey={activeTabKey}
              onSelect={(event, tabIndex) => setActiveTabKey(tabIndex)}
            >
              <Tab eventKey={0} title={<TabTitleText>First Tab</TabTitleText>}>
                <div style={{ padding: '1rem' }}>
                  <p>Content for the first tab. Tabs help organize content into separate views.</p>
                </div>
              </Tab>
              <Tab eventKey={1} title={<TabTitleText>Second Tab</TabTitleText>}>
                <div style={{ padding: '1rem' }}>
                  <p>Content for the second tab. Each tab can contain different components.</p>
                </div>
              </Tab>
              <Tab eventKey={2} title={<TabTitleText>Third Tab</TabTitleText>}>
                <div style={{ padding: '1rem' }}>
                  <p>Content for the third tab. Use tabs to reduce visual complexity.</p>
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </GridItem>

      {/* Breadcrumb */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Breadcrumb</CardTitle>
          <CardBody>
            <Breadcrumb>
              <BreadcrumbItem to="#">Home</BreadcrumbItem>
              <BreadcrumbItem to="#">Components</BreadcrumbItem>
              <BreadcrumbItem to="#">Navigation</BreadcrumbItem>
              <BreadcrumbItem to="#" isActive>Breadcrumb</BreadcrumbItem>
            </Breadcrumb>
          </CardBody>
        </Card>
      </GridItem>

      {/* Pagination */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Pagination</CardTitle>
          <CardBody>
            <Pagination
              itemCount={100}
              perPage={perPage}
              page={page}
              onSetPage={(_event, pageNumber) => setPage(pageNumber)}
              onPerPageSelect={(_event, perPage) => {
                setPerPage(perPage);
                setPage(1);
              }}
              variant="top"
            />
          </CardBody>
        </Card>
      </GridItem>

      {/* Dropdown */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Dropdown</CardTitle>
          <CardBody>
            <Dropdown
              isOpen={isDropdownOpen}
              onSelect={onDropdownSelect}
              onOpenChange={(isOpen) => setIsDropdownOpen(isOpen)}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={onDropdownToggle}
                  isExpanded={isDropdownOpen}
                >
                  Dropdown Menu
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem key="action1">Action 1</DropdownItem>
                <DropdownItem key="action2">Action 2</DropdownItem>
                <DropdownItem key="action3">Action 3</DropdownItem>
                <Divider key="separator" />
                <DropdownItem key="action4">Separated Action</DropdownItem>
              </DropdownList>
            </Dropdown>
          </CardBody>
        </Card>
      </GridItem>

      {/* Menu */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Menu</CardTitle>
          <CardBody>
            <Menu>
              <MenuContent>
                <MenuList>
                  <MenuItem itemId="item1">Menu Item 1</MenuItem>
                  <MenuItem itemId="item2">Menu Item 2</MenuItem>
                  <MenuItem itemId="item3">Menu Item 3</MenuItem>
                  <Divider />
                  <MenuItem itemId="item4">Menu Item 4</MenuItem>
                </MenuList>
              </MenuContent>
            </Menu>
          </CardBody>
        </Card>
      </GridItem>

      {/* Jump Links */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Jump Links</CardTitle>
          <CardBody>
            <JumpLinks
              label="Jump to section"
              scrollableSelector="#scrollable-element"
            >
              <JumpLinksItem href="#section1">Section 1</JumpLinksItem>
              <JumpLinksItem href="#section2">Section 2</JumpLinksItem>
              <JumpLinksItem href="#section3">Section 3</JumpLinksItem>
            </JumpLinks>
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <p style={{ color: '#6a6e73', fontSize: '0.875rem' }}>
                Jump links provide quick navigation to sections within a page. They work best with long scrollable content.
              </p>
            </div>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default NavigationComponents;


