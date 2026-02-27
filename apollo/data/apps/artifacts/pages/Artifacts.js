import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Gallery,
  GalleryItem,
  Content,
  Label,
} from '@patternfly/react-core';

const Artifacts = () => {
  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Artifacts
        </Title>
        <Content component="p" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
          Browse and manage your project artifacts, documents, and deliverables.
        </Content>
      </PageSection>
      <PageSection>
        <Gallery hasGutter minWidths={{ default: '100%', md: '50%', xl: '33%' }}>
          <GalleryItem>
            <Card isFullHeight>
              <CardBody>
                <Title headingLevel="h3" size="lg">
                  Sample Artifact
                </Title>
                <Content component="p">
                  Your artifacts will appear here once you start adding them.
                </Content>
                <Label color="blue">Document</Label>
              </CardBody>
            </Card>
          </GalleryItem>
        </Gallery>
      </PageSection>
    </>
  );
};

export default Artifacts;

