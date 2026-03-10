import * as React from 'react';
import {
  Button,
  Card,
  CardBody,
  Content,
  Flex,
  FlexItem,
  PageSection,
  TextInput,
  Title,
  Badge,
  Divider
} from '@patternfly/react-core';
import { 
  BarsIcon,
  PlusIcon,
  ExternalLinkAltIcon,
  TimesIcon,
  ChevronDownIcon,
  PaperPlaneIcon,
  UserIcon
} from '@patternfly/react-icons';

interface AskRedHatProps {
  isVisible?: boolean;
  onClose?: () => void;
}

const AskRedHat: React.FunctionComponent<AskRedHatProps> = ({ isVisible = true, onClose }) => {
  const [inputValue, setInputValue] = React.useState('');
  const [messages, setMessages] = React.useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello Hallo Hola Bonjour こんにちは Olá مرحباً Ahoj Ciao 안녕하세요 Hallo 你好',
      timestamp: '10/23/2025 5:21:56 PM',
      subtitle: 'Get answers from our library of support resources.'
    },
    {
      id: 2,
      type: 'user',
      content: 'upgrade my RHEL systems to RHEL9',
      timestamp: '10/23/2025 5:21:38 PM'
    },
    {
      id: 3,
      type: 'ai',
      content: 'To upgrade your RHEL systems to RHEL9, follow these steps based on Red Hat\'s official documentation:',
      timestamp: '10/23/2025 5:21:38 PM',
      subtitle: '1. Prepare your systems\n2. Run pre-upgrade checks\n3. Create backups\n4. Execute the upgrade\n5. Verify the installation'
    }
  ]);

  const suggestedQuestions = [
    'Tell me about Ask Red Hat.',
    'What technologies are used in Ask Red Hat?'
  ];

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      // Add user message
      const newUserMessage = {
        id: messages.length + 1,
        type: 'user',
        content: inputValue,
        timestamp: new Date().toLocaleString()
      };
      
      setMessages([...messages, newUserMessage]);
      setInputValue('');
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '76px', // Account for masthead height
      right: '0',
      width: '400px',
      height: 'calc(100vh - 76px)', // Adjust height to account for masthead
      backgroundColor: 'white',
      borderLeft: '1px solid #d2d2d2',
      boxShadow: '-4px 0 8px rgba(0,0,0,0.1)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Bar */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #d2d2d2',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
          <FlexItem>
            <Button variant="plain" aria-label="Menu">
              <BarsIcon />
            </Button>
          </FlexItem>
          <FlexItem>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#cc0000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <PlusIcon style={{ fontSize: '12px' }} />
            </div>
          </FlexItem>
          <FlexItem>
            <Title headingLevel="h2" size="lg">Ask Red Hat</Title>
          </FlexItem>
        </Flex>

        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
          <FlexItem>
            <Button variant="warning" size="sm" style={{ backgroundColor: '#f0ad4e', color: '#000' }}>
              Preview
            </Button>
          </FlexItem>
          <FlexItem>
            <Button variant="plain" aria-label="Expand">
              <ExternalLinkAltIcon />
            </Button>
          </FlexItem>
          <FlexItem>
            <Button variant="plain" aria-label="Close" onClick={onClose}>
              <TimesIcon />
            </Button>
          </FlexItem>
        </Flex>
      </div>

      {/* AI Assistant Selection Bar */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '12px 16px',
        borderBottom: '1px solid #d2d2d2'
      }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <Content>AI Assistant: Ask Red Hat</Content>
              </FlexItem>
              <FlexItem>
                <Badge style={{ backgroundColor: '#0066cc', color: 'white' }}>AI</Badge>
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <ChevronDownIcon />
          </FlexItem>
        </Flex>
      </div>

      {/* Main Content Area */}
      <div style={{ 
        backgroundColor: '#fafafa', 
        flex: 1, 
        overflowY: 'auto',
        padding: '20px'
      }}>
          {/* User Greeting */}
          <div style={{ marginBottom: '24px' }}>
            <Title headingLevel="h3" size="lg" style={{ color: '#0066cc', marginBottom: '8px' }}>
              Hello, kmarchan
            </Title>
            <Content style={{ fontSize: '16px', fontWeight: 'bold', color: '#666' }}>
              How may I help you today?
            </Content>
          </div>

          {/* Suggested Questions */}
          <div style={{ marginBottom: '32px' }}>
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
              {suggestedQuestions.map((question, index) => (
                <FlexItem key={index}>
                  <Button
                    variant="secondary"
                    onClick={() => handleSuggestedQuestion(question)}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #d2d2d2',
                      color: '#333',
                      textAlign: 'left',
                      width: '100%',
                      justifyContent: 'flex-start'
                    }}
                  >
                    {question}
                  </Button>
                </FlexItem>
              ))}
            </Flex>
          </div>

          {/* Chat Messages */}
          <div style={{ marginBottom: '32px' }}>
            {messages.map((message) => (
              <div key={message.id} style={{ marginBottom: '16px' }}>
                {message.type === 'ai' ? (
                  <Card style={{ backgroundColor: 'white', border: '1px solid #d2d2d2' }}>
                    <CardBody>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }} style={{ marginBottom: '8px' }}>
                        <FlexItem>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#cc0000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <PlusIcon style={{ fontSize: '10px' }} />
                          </div>
                        </FlexItem>
                        <FlexItem>
                          <Badge style={{ backgroundColor: '#666', color: 'white' }}>AI</Badge>
                        </FlexItem>
                        <FlexItem>
                          <Content style={{ fontSize: '12px', color: '#666' }}>
                            {message.timestamp}
                          </Content>
                        </FlexItem>
                      </Flex>
                      <Content style={{ marginBottom: '8px' }}>
                        {message.content}
                      </Content>
                      {message.subtitle && (
                        <Content style={{ fontSize: '14px', color: '#666' }}>
                          {message.subtitle}
                        </Content>
                      )}
                    </CardBody>
                  </Card>
                ) : (
                  <div style={{ textAlign: 'right', marginBottom: '8px' }}>
                    <Flex justifyContent={{ default: 'justifyContentFlexEnd' }} alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem>
                        <Content style={{ fontSize: '12px', color: '#666' }}>
                          {message.timestamp}
                        </Content>
                      </FlexItem>
                      <FlexItem>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#666',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <UserIcon style={{ fontSize: '10px' }} />
                        </div>
                      </FlexItem>
                    </Flex>
                    <div style={{ textAlign: 'right', marginTop: '4px' }}>
                      <div style={{
                        backgroundColor: '#0066cc',
                        color: 'white',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        display: 'inline-block',
                        maxWidth: '80%',
                        wordWrap: 'break-word'
                      }}>
                        {message.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
      </div>

      {/* Input Field and Footer */}
      <div style={{
        backgroundColor: 'white',
        borderTop: '1px solid #d2d2d2',
        padding: '16px',
        flexShrink: 0
      }}>
          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
            <FlexItem flex={{ default: 'flex_1' }}>
              <TextInput
                value={inputValue}
                onChange={(_, value) => setInputValue(value)}
                placeholder="Send a message..."
                style={{
                  border: '2px solid #0066cc',
                  borderRadius: '8px',
                  padding: '12px'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
              />
            </FlexItem>
            <FlexItem>
              <Button
                variant="primary"
                onClick={handleSendMessage}
                style={{
                  backgroundColor: '#0066cc',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 16px'
                }}
              >
                <PaperPlaneIcon />
              </Button>
            </FlexItem>
          </Flex>
          
          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <Content style={{ fontSize: '12px', color: '#666' }}>
              Always review AI generated content prior to use.
            </Content>
          </div>
      </div>
    </div>
  );
};

export { AskRedHat };
