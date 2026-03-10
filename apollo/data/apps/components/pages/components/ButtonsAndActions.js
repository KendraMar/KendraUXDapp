import React from 'react';
import {
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Button,
  ActionList,
  ActionListItem,
  ToggleGroup,
  ToggleGroupItem,
  ClipboardCopy,
  ClipboardCopyVariant
} from '@patternfly/react-core';

const ButtonsAndActions = () => {
  const [selectedToggle, setSelectedToggle] = React.useState('option1');

  return (
    <Grid hasGutter>
      {/* Buttons */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Buttons - All Variants</CardTitle>
          <CardBody>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="tertiary">Tertiary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="warning">Warning</Button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Button variant="link">Link</Button>
              <Button variant="plain">Plain</Button>
              <Button isDisabled>Disabled</Button>
              <Button isLoading>Loading</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardBody>
        </Card>
      </GridItem>

      {/* Action List */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Action List</CardTitle>
          <CardBody>
            <ActionList>
              <ActionListItem>
                <Button variant="primary">Primary Action</Button>
              </ActionListItem>
              <ActionListItem>
                <Button variant="secondary">Secondary Action</Button>
              </ActionListItem>
              <ActionListItem>
                <Button variant="link">Link Action</Button>
              </ActionListItem>
            </ActionList>
          </CardBody>
        </Card>
      </GridItem>

      {/* Toggle Group */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Toggle Group</CardTitle>
          <CardBody>
            <ToggleGroup aria-label="Toggle group example">
              <ToggleGroupItem
                text="Option 1"
                buttonId="toggle1"
                isSelected={selectedToggle === 'option1'}
                onChange={() => setSelectedToggle('option1')}
              />
              <ToggleGroupItem
                text="Option 2"
                buttonId="toggle2"
                isSelected={selectedToggle === 'option2'}
                onChange={() => setSelectedToggle('option2')}
              />
              <ToggleGroupItem
                text="Option 3"
                buttonId="toggle3"
                isSelected={selectedToggle === 'option3'}
                onChange={() => setSelectedToggle('option3')}
              />
            </ToggleGroup>
          </CardBody>
        </Card>
      </GridItem>

      {/* Clipboard Copy */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Clipboard Copy</CardTitle>
          <CardBody>
            <ClipboardCopy
              hoverTip="Copy"
              clickTip="Copied!"
              variant={ClipboardCopyVariant.expansion}
            >
              npm install @patternfly/react-core
            </ClipboardCopy>
            <ClipboardCopy
              hoverTip="Copy"
              clickTip="Copied!"
              variant={ClipboardCopyVariant.inline}
              style={{ marginTop: '1rem' }}
            >
              Inline copy text
            </ClipboardCopy>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default ButtonsAndActions;


