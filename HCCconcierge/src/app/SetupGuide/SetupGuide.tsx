import * as React from 'react';
import {
  Button,
  Card,
  CardBody,
  Content,
  Flex,
  FlexItem,
  TextInput,
  Title
} from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom';
import { 
  CheckIcon, 
  TimesIcon,
  PaperPlaneIcon
} from '@patternfly/react-icons';

interface SetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
  showCloudHelpByDefault?: boolean;
}

const SetupGuide: React.FunctionComponent<SetupGuideProps> = ({ isOpen, onClose, showCloudHelpByDefault = false }) => {
  const [searchValue, setSearchValue] = React.useState('');
  const [showCloudHelp, setShowCloudHelp] = React.useState(showCloudHelpByDefault);
  const [isVisible, setIsVisible] = React.useState(false);
  const navigate = useNavigate();

  // Debug logging
  React.useEffect(() => {
    console.log('SetupGuide: Component mounted/updated', { isOpen, onClose: typeof onClose });
  }, [isOpen, onClose]);

  // Handle slide-in animation when panel opens
  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const setupSteps = [
    {
      id: 'setup-notifications',
      title: 'Set up notifications',
      completed: true,
      description: ''
    },
    {
      id: 'connect-public-clouds',
      title: 'Connect to public clouds',
      completed: false,
      description: ''
    },
    {
      id: 'verify-access-control',
      title: 'Verify access control',
      completed: false,
      description: ''
    },
    {
      id: 'customize-dashboard',
      title: 'Customize your dashboard',
      completed: false,
      description: ''
    },
    {
      id: 'other-setup-step',
      title: 'Other setup step',
      completed: false,
      description: ''
    },
    {
      id: 'configure-third-party-idp',
      title: 'Configure Third Party IdP',
      completed: true,
      description: ''
    }
  ];

  const completedSteps = setupSteps.filter(step => step.completed).length;
  const totalSteps = setupSteps.length;

  const handleInputChange = (value: string) => {
    setSearchValue(value);
    // Don't show help text automatically - only when paper plane is clicked
  };

  const handlePaperPlaneClick = () => {
    const lowerValue = searchValue.toLowerCase();
    if (lowerValue.includes('connect to public clouds') || 
        lowerValue.includes('connect to clouds') || 
        lowerValue.includes('public clouds') || 
        lowerValue.includes('connect')) {
      setShowCloudHelp(true);
    } else {
      setShowCloudHelp(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '76px', // Account for masthead height
      right: isVisible ? 0 : '-400px', // Slide in from right
      width: '400px',
      height: 'calc(100vh - 76px)', // Adjust height to account for masthead
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      transition: 'right 0.3s ease-in-out' // Smooth slide animation
    }}>
      {/* Title outside the card */}
      <div style={{ marginBottom: '16px' }}>
        <Title headingLevel="h2" size="xl" style={{ fontWeight: 'bold', color: '#151515' }}>
          {completedSteps} of {totalSteps} HCC setup tasks complete
        </Title>
      </div>

      {/* Close button */}
      <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
        <Button 
          variant="plain" 
          aria-label="Close" 
          onClick={() => {
            console.log('SetupGuide: Close button clicked');
            onClose();
          }}
          style={{ 
            zIndex: 1001,
            pointerEvents: 'auto',
            cursor: 'pointer'
          }}
        >
          <TimesIcon />
        </Button>
      </div>

      {/* Setup Steps Card */}
      <Card style={{
        border: '1px solid #d2d2d2',
        borderRadius: '8px',
        backgroundColor: 'white'
      }}>
        <CardBody style={{ padding: '16px' }}>
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
            {setupSteps.map((step, index) => (
              <FlexItem key={step.id}>
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
                  <FlexItem>
                    {step.completed ? (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#0066cc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <CheckIcon style={{ color: 'white', fontSize: '12px' }} />
                      </div>
                    ) : (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: '2px dashed #d2d2d2',
                        backgroundColor: 'transparent',
                        flexShrink: 0
                      }} />
                    )}
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <Content style={{ 
                      color: '#151515',
                      fontSize: '14px'
                    }}>
                      {step.title}
                    </Content>
                  </FlexItem>
                </Flex>
              </FlexItem>
            ))}
          </Flex>
        </CardBody>
      </Card>

      {/* Help Text */}
      {showCloudHelp && (
        <Card style={{ marginTop: '16px', border: '1px solid #d2d2d2', borderRadius: '8px' }}>
          <CardBody>
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <Title headingLevel="h4" size="md" style={{ color: '#000', marginBottom: '8px' }}>
                  Connect to public clouds
                </Title>
              </FlexItem>
              <FlexItem>
                <Content style={{ fontSize: '14px', color: '#000' }}>
                  1. Navigate to the{' '}
                  <Button 
                    variant="link" 
                    isInline 
                    style={{ padding: 0, fontSize: '14px', color: '#0066cc' }}
                    onClick={() => navigate('/integrations')}
                  >
                    Integrations page
                  </Button>{' '}
                  and configure XYZ.
                </Content>
              </FlexItem>
              <FlexItem>
                <Content style={{ fontSize: '14px', color: '#000' }}>
                  2. Click Add integrations and configure your cloud provider
                </Content>
              </FlexItem>
              <FlexItem>
                <Content style={{ fontSize: '14px', color: '#000' }}>
                  3. do this other thing
                </Content>
              </FlexItem>
            </Flex>
          </CardBody>
        </Card>
      )}

      {/* AI Assistant Section */}
      <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #eee' }}>
        <div style={{ position: 'relative' }}>
          <TextInput
            type="text"
            placeholder="which set up task do you help with?"
            value={searchValue}
            onChange={(_, value) => handleInputChange(value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handlePaperPlaneClick();
              }
            }}
            style={{ 
              paddingRight: '50px',
              height: '48px',
              fontSize: '16px'
            }}
          />
          <button
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={handlePaperPlaneClick}
          >
            <PaperPlaneIcon style={{ color: '#0066cc', fontSize: '20px' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export { SetupGuide };
