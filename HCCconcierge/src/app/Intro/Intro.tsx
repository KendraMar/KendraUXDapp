import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  PageSection,
  Title,
  List,
  ListItem,
  Card,
  CardBody,
  CardTitle,
  CardHeader,
} from '@patternfly/react-core';

const Intro: React.FunctionComponent = () => (
  <PageSection>
    <div>
      <Title headingLevel="h1" size="2xl">
        Prototype intro
      </Title>
      <p style={{ marginTop: '1rem', maxWidth: '60ch' }}>
        This prototype contains links to two different user experiences:
      </p>
    </div>

    <List isPlain style={{ marginTop: '1.5rem', maxWidth: '60ch' }}>
      <ListItem>
        <Card style={{ marginBottom: '1rem' }}>
          <CardHeader>
            <CardTitle>
              <Link to="/dashboard2">Experience 1</Link>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p>Enhanced RBAC is available and the user can opt in. Click Learn More to see simple interactions.</p>
          </CardBody>
        </Card>
      </ListItem>
      <ListItem>
        <Card style={{ marginBottom: '1rem' }}>
          <CardHeader>
            <CardTitle>
              <Link to="/dashboard">Experience 2</Link>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p>
              What if the dashboard presented a text input box where users can ask questions that generate UIs or navigate to a filtered page?
            </p>
            <p style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Interaction options:</p>
            <ul style={{ marginTop: 0, paddingLeft: '1.25rem' }}>
              <li>click either button or</li>
              <li>type &quot;Show me RHEL systems and OpenShift clusters I have access to&quot;</li>
            </ul>
          </CardBody>
        </Card>
      </ListItem>
    </List>
  </PageSection>
);

export { Intro };
