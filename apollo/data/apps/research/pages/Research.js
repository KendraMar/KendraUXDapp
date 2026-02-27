import React from 'react';
import {
  PageSection,
  Title,
  Content
} from '@patternfly/react-core';

const Research = () => {
  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Research
        </Title>
        <Content component="p">
          Explore research findings, user studies, and design insights
        </Content>
      </PageSection>
      <PageSection>
        <Content>
          <p>Research content will be displayed here.</p>
        </Content>
      </PageSection>
    </>
  );
};

export default Research;


