import React from 'react';
import {
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Flex,
  FlexItem,
  Stack,
  StackItem,
  Split,
  SplitItem,
  Level,
  LevelItem,
  Gallery,
  GalleryItem,
  Divider,
  Bullseye,
  Panel,
  PanelMain,
  PanelMainBody,
  PanelHeader,
  PanelFooter,
  Sidebar,
  SidebarPanel,
  SidebarContent
} from '@patternfly/react-core';

const LayoutComponents = () => {
  return (
    <Grid hasGutter>
      {/* Flex */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Flex Layout</CardTitle>
          <CardBody>
            <Flex>
              <FlexItem>
                <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  Flex Item 1
                </div>
              </FlexItem>
              <FlexItem>
                <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  Flex Item 2
                </div>
              </FlexItem>
              <FlexItem>
                <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  Flex Item 3
                </div>
              </FlexItem>
            </Flex>
          </CardBody>
        </Card>
      </GridItem>

      {/* Stack */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Stack Layout</CardTitle>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  Stack Item 1
                </div>
              </StackItem>
              <StackItem>
                <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  Stack Item 2
                </div>
              </StackItem>
              <StackItem>
                <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  Stack Item 3
                </div>
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </GridItem>

      {/* Split */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Split Layout</CardTitle>
          <CardBody>
            <Split hasGutter>
              <SplitItem>
                <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  Left
                </div>
              </SplitItem>
              <SplitItem isFilled>
                <div style={{ padding: '1rem', backgroundColor: '#e0e0e0', borderRadius: '4px' }}>
                  Main (filled)
                </div>
              </SplitItem>
              <SplitItem>
                <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  Right
                </div>
              </SplitItem>
            </Split>
          </CardBody>
        </Card>
      </GridItem>

      {/* Level */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Level Layout</CardTitle>
          <CardBody>
            <Level>
              <LevelItem>
                <div style={{ padding: '0.5rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  Left Item
                </div>
              </LevelItem>
              <LevelItem>
                <div style={{ padding: '0.5rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  Center Item
                </div>
              </LevelItem>
              <LevelItem>
                <div style={{ padding: '0.5rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  Right Item
                </div>
              </LevelItem>
            </Level>
          </CardBody>
        </Card>
      </GridItem>

      {/* Gallery */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Gallery Layout</CardTitle>
          <CardBody>
            <Gallery hasGutter minWidths={{ default: '200px' }}>
              <GalleryItem>
                <Card>
                  <CardBody>Gallery Item 1</CardBody>
                </Card>
              </GalleryItem>
              <GalleryItem>
                <Card>
                  <CardBody>Gallery Item 2</CardBody>
                </Card>
              </GalleryItem>
              <GalleryItem>
                <Card>
                  <CardBody>Gallery Item 3</CardBody>
                </Card>
              </GalleryItem>
              <GalleryItem>
                <Card>
                  <CardBody>Gallery Item 4</CardBody>
                </Card>
              </GalleryItem>
            </Gallery>
          </CardBody>
        </Card>
      </GridItem>

      {/* Bullseye */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Bullseye (Center)</CardTitle>
          <CardBody>
            <Bullseye style={{ minHeight: '200px', border: '1px dashed #ccc', borderRadius: '4px' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                Centered Content
              </div>
            </Bullseye>
          </CardBody>
        </Card>
      </GridItem>

      {/* Panel */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Panel</CardTitle>
          <CardBody>
            <Panel>
              <PanelHeader>Panel Header</PanelHeader>
              <Divider />
              <PanelMain>
                <PanelMainBody>
                  This is the main content area of the panel. Panels provide a bordered container for content.
                </PanelMainBody>
              </PanelMain>
              <Divider />
              <PanelFooter>Panel Footer</PanelFooter>
            </Panel>
          </CardBody>
        </Card>
      </GridItem>

      {/* Sidebar */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Sidebar Layout</CardTitle>
          <CardBody>
            <Sidebar hasGutter>
              <SidebarPanel width={{ default: 'width_25' }}>
                <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  Sidebar Panel
                </div>
              </SidebarPanel>
              <SidebarContent>
                <div style={{ padding: '1rem', backgroundColor: '#e0e0e0', borderRadius: '4px' }}>
                  Main Content Area
                </div>
              </SidebarContent>
            </Sidebar>
          </CardBody>
        </Card>
      </GridItem>

      {/* Divider Examples */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Dividers</CardTitle>
          <CardBody>
            <div style={{ padding: '0.5rem' }}>Content above divider</div>
            <Divider />
            <div style={{ padding: '0.5rem' }}>Content below horizontal divider</div>
            <Divider />
            <div style={{ padding: '0.5rem' }}>More content</div>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default LayoutComponents;


