import React from 'react';
import {
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Alert,
  Banner,
  Progress,
  ProgressVariant,
  Spinner,
  EmptyState,
  EmptyStateVariant,
  EmptyStateBody,
  EmptyStateActions,
  Title,
  Button,
  Tooltip,
  Popover,
  HelperText,
  HelperTextItem,
  Hint,
  HintBody,
  Divider,
  Icon
} from '@patternfly/react-core';
import { SearchIcon, InfoCircleIcon } from '@patternfly/react-icons';

const Feedback = () => {
  const [showAlert, setShowAlert] = React.useState(false);

  return (
    <Grid hasGutter>
      {/* Alerts */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Alerts</CardTitle>
          <CardBody>
            <div style={{ marginBottom: '1rem' }}>
              <Button variant="primary" onClick={() => setShowAlert(!showAlert)}>
                {showAlert ? 'Hide Alert' : 'Show Dismissible Alert'}
              </Button>
            </div>
            {showAlert && (
              <Alert
                variant="success"
                title="Success Alert"
                actionClose={<Button variant="plain" onClick={() => setShowAlert(false)}>×</Button>}
                style={{ marginBottom: '1rem' }}
              >
                This is a dismissible success alert with an action close button.
              </Alert>
            )}
            <Alert variant="success" title="Success alert" isInline style={{ marginBottom: '0.5rem' }} />
            <Alert variant="danger" title="Danger alert" isInline style={{ marginBottom: '0.5rem' }} />
            <Alert variant="warning" title="Warning alert" isInline style={{ marginBottom: '0.5rem' }} />
            <Alert variant="info" title="Info alert" isInline />
          </CardBody>
        </Card>
      </GridItem>

      {/* Banners */}
      <GridItem span={12}>
        <Card>
          <CardTitle>Banners</CardTitle>
          <CardBody>
            <Banner variant="info" style={{ marginBottom: '0.5rem' }}>
              This is an info banner
            </Banner>
            <Banner variant="success" style={{ marginBottom: '0.5rem' }}>
              This is a success banner
            </Banner>
            <Banner variant="warning" style={{ marginBottom: '0.5rem' }}>
              This is a warning banner
            </Banner>
            <Banner variant="danger">
              This is a danger banner
            </Banner>
          </CardBody>
        </Card>
      </GridItem>

      {/* Progress Bars */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Progress Bars</CardTitle>
          <CardBody>
            <Progress value={25} title="25% complete" style={{ marginBottom: '1rem' }} />
            <Progress value={50} title="50% complete" style={{ marginBottom: '1rem' }} />
            <Progress 
              value={75} 
              title="Success variant" 
              variant={ProgressVariant.success} 
              style={{ marginBottom: '1rem' }} 
            />
            <Progress 
              value={90} 
              title="Danger variant" 
              variant={ProgressVariant.danger} 
            />
          </CardBody>
        </Card>
      </GridItem>

      {/* Spinners */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Spinners</CardTitle>
          <CardBody>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Small</div>
                <Spinner size="sm" />
              </div>
              <div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Medium</div>
                <Spinner size="md" />
              </div>
              <div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Large</div>
                <Spinner size="lg" />
              </div>
              <div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>XL</div>
                <Spinner size="xl" />
              </div>
            </div>
          </CardBody>
        </Card>
      </GridItem>

      {/* Tooltip and Popover */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Tooltip & Popover</CardTitle>
          <CardBody>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Tooltip:</strong>
              <div style={{ marginTop: '0.5rem' }}>
                <Tooltip content="This is a helpful tooltip">
                  <Button variant="secondary">Hover for tooltip</Button>
                </Tooltip>
              </div>
            </div>
            <Divider style={{ margin: '1rem 0' }} />
            <div>
              <strong>Popover:</strong>
              <div style={{ marginTop: '0.5rem' }}>
                <Popover
                  headerContent="Popover Header"
                  bodyContent={
                    <div>
                      This is a popover with more detailed information that can include multiple paragraphs and rich content.
                    </div>
                  }
                >
                  <Button variant="secondary">Click for popover</Button>
                </Popover>
              </div>
            </div>
          </CardBody>
        </Card>
      </GridItem>

      {/* Helper Text */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Helper Text</CardTitle>
          <CardBody>
            <HelperText>
              <HelperTextItem variant="default">Default helper text</HelperTextItem>
              <HelperTextItem variant="indeterminate">Indeterminate helper text</HelperTextItem>
              <HelperTextItem variant="warning">Warning helper text</HelperTextItem>
              <HelperTextItem variant="success">Success helper text</HelperTextItem>
              <HelperTextItem variant="error">Error helper text</HelperTextItem>
            </HelperText>
          </CardBody>
        </Card>
      </GridItem>

      {/* Hint */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Hint</CardTitle>
          <CardBody>
            <Hint>
              <HintBody>
                <Icon size="md" isInline>
                  <InfoCircleIcon />
                </Icon>
                {' '}This is a hint component that provides helpful information or tips to users.
              </HintBody>
            </Hint>
          </CardBody>
        </Card>
      </GridItem>

      {/* Empty State */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Empty State</CardTitle>
          <CardBody>
            <EmptyState variant={EmptyStateVariant.sm}>
              <Icon size="xl" isInline>
                <SearchIcon />
              </Icon>
              <Title headingLevel="h4" size="lg">
                No results found
              </Title>
              <EmptyStateBody>
                Try adjusting your search criteria and try again.
              </EmptyStateBody>
              <EmptyStateActions>
                <Button variant="primary">Clear filters</Button>
                <Button variant="link">Reset search</Button>
              </EmptyStateActions>
            </EmptyState>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default Feedback;


