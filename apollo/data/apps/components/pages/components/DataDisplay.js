import React from 'react';
import {
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Avatar,
  Badge,
  Label,
  LabelGroup,
  List,
  ListItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
  TreeView,
  SimpleList,
  SimpleListItem,
  Skeleton,
  Truncate,
  Timestamp,
  TimestampFormat,
  NotificationBadge,
  CodeBlock,
  CodeBlockCode,
  Divider
} from '@patternfly/react-core';

const DataDisplay = () => {
  const [labels, setLabels] = React.useState(['Label 1', 'Label 2', 'Label 3']);
  const [activeSimpleListItem, setActiveSimpleListItem] = React.useState(0);

  const deleteLabel = (labelToDelete) => {
    setLabels(labels.filter(label => label !== labelToDelete));
  };

  const treeViewData = [
    {
      name: 'Folder 1',
      id: 'folder1',
      children: [
        { name: 'File 1.1', id: 'file1.1' },
        { name: 'File 1.2', id: 'file1.2' }
      ]
    },
    {
      name: 'Folder 2',
      id: 'folder2',
      children: [
        { name: 'File 2.1', id: 'file2.1' }
      ]
    }
  ];

  return (
    <Grid hasGutter>
      {/* Avatar and Badges */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Avatar & Badges</CardTitle>
          <CardBody>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Avatars:</strong>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', alignItems: 'center' }}>
                <Avatar alt="User Avatar" size="sm" />
                <Avatar alt="User Avatar" size="md" />
                <Avatar alt="User Avatar" size="lg" />
                <Avatar alt="User Avatar" size="xl" />
              </div>
            </div>
            <Divider style={{ margin: '1rem 0' }} />
            <div>
              <strong>Badges & Notification Badge:</strong>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <Badge>Default</Badge>
                <Badge isRead>Read</Badge>
                <Badge screenReaderText="Unread">25</Badge>
                <NotificationBadge variant="unread" count={10} />
                <NotificationBadge variant="attention" count={5} />
              </div>
            </div>
          </CardBody>
        </Card>
      </GridItem>

      {/* Labels */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Labels & Label Groups</CardTitle>
          <CardBody>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Colored Labels:</strong>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <Label color="blue">Blue</Label>
                <Label color="green">Green</Label>
                <Label color="orange">Orange</Label>
                <Label color="red">Red</Label>
                <Label color="purple">Purple</Label>
              </div>
            </div>
            <Divider style={{ margin: '1rem 0' }} />
            <div>
              <strong>Closeable Label Group:</strong>
              <LabelGroup categoryName="Category" style={{ marginTop: '0.5rem' }}>
                {labels.map((label, index) => (
                  <Label key={index} color="blue" onClose={() => deleteLabel(label)}>
                    {label}
                  </Label>
                ))}
              </LabelGroup>
            </div>
          </CardBody>
        </Card>
      </GridItem>

      {/* Lists */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Lists</CardTitle>
          <CardBody>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Simple List:</strong>
              <List style={{ marginTop: '0.5rem' }}>
                <ListItem>List item 1</ListItem>
                <ListItem>List item 2</ListItem>
                <ListItem>List item 3</ListItem>
              </List>
            </div>
            <Divider style={{ margin: '1rem 0' }} />
            <div>
              <strong>Ordered List:</strong>
              <List component="ol" style={{ marginTop: '0.5rem' }}>
                <ListItem>First item</ListItem>
                <ListItem>Second item</ListItem>
                <ListItem>Third item</ListItem>
              </List>
            </div>
          </CardBody>
        </Card>
      </GridItem>

      {/* Description List */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Description List</CardTitle>
          <CardBody>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>John Doe</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Email</DescriptionListTerm>
                <DescriptionListDescription>john.doe@example.com</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Role</DescriptionListTerm>
                <DescriptionListDescription>Administrator</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription>
                  <Label color="green">Active</Label>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
      </GridItem>

      {/* Data List */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Data List</CardTitle>
          <CardBody>
            <DataList aria-label="data list example">
              <DataListItem>
                <DataListItemRow>
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell key="primary">
                        <span><strong>Primary content</strong></span>
                      </DataListCell>,
                      <DataListCell key="secondary">
                        Secondary content
                      </DataListCell>,
                      <DataListCell key="status">
                        <Label color="green">Active</Label>
                      </DataListCell>
                    ]}
                  />
                </DataListItemRow>
              </DataListItem>
              <DataListItem>
                <DataListItemRow>
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell key="primary">
                        <span><strong>Another item</strong></span>
                      </DataListCell>,
                      <DataListCell key="secondary">
                        More information here
                      </DataListCell>,
                      <DataListCell key="status">
                        <Label color="orange">Pending</Label>
                      </DataListCell>
                    ]}
                  />
                </DataListItemRow>
              </DataListItem>
            </DataList>
          </CardBody>
        </Card>
      </GridItem>

      {/* Simple List (clickable) */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Simple List (Interactive)</CardTitle>
          <CardBody>
            <SimpleList onSelect={(ref, index) => setActiveSimpleListItem(index)}>
              <SimpleListItem isActive={activeSimpleListItem === 0}>
                List item 1
              </SimpleListItem>
              <SimpleListItem isActive={activeSimpleListItem === 1}>
                List item 2
              </SimpleListItem>
              <SimpleListItem isActive={activeSimpleListItem === 2}>
                List item 3
              </SimpleListItem>
            </SimpleList>
          </CardBody>
        </Card>
      </GridItem>

      {/* Tree View */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Tree View</CardTitle>
          <CardBody>
            <TreeView data={treeViewData} />
          </CardBody>
        </Card>
      </GridItem>

      {/* Skeleton */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Skeleton (Loading Placeholder)</CardTitle>
          <CardBody>
            <Skeleton shape="square" width="100%" style={{ marginBottom: '0.5rem' }} />
            <Skeleton shape="square" width="100%" style={{ marginBottom: '0.5rem' }} />
            <Skeleton shape="square" width="75%" />
          </CardBody>
        </Card>
      </GridItem>

      {/* Truncate and Timestamp */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Truncate & Timestamp</CardTitle>
          <CardBody>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Truncate with Tooltip:</strong>
              <div style={{ marginTop: '0.5rem' }}>
                <Truncate content="This is a very long text that will be truncated and shown with an ellipsis and tooltip on hover" />
              </div>
            </div>
            <Divider style={{ margin: '1rem 0' }} />
            <div>
              <strong>Timestamp:</strong>
              <div style={{ marginTop: '0.5rem' }}>
                <Timestamp date={new Date()} />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <Timestamp date={new Date()} dateFormat={TimestampFormat.full} />
              </div>
            </div>
          </CardBody>
        </Card>
      </GridItem>

      {/* Code Block */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Code Block</CardTitle>
          <CardBody>
            <CodeBlock>
              <CodeBlockCode>
                {`import React from 'react';
import { Button } from '@patternfly/react-core';

const MyComponent = () => {
  return <Button variant="primary">Click me</Button>;
};

export default MyComponent;`}
              </CodeBlockCode>
            </CodeBlock>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default DataDisplay;


