import * as React from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  TextInput,
  Title
} from '@patternfly/react-core';
import { 
  ArrowRightIcon,
  ChevronDownIcon,
  PaperPlaneIcon
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAskRedHat } from '@app/AskRedHat';
import { useHelpPanel } from '@app/Help/HelpPanelProvider';

interface TellUsWhatYoudLikeToDoCardProps {
  onClose?: () => void;
  showArrow?: boolean;
  onShowSetupGuide?: () => void;
  checkForTriggerPhrase?: (input: string) => boolean;
  hasCustomView?: boolean;
}

const TellUsWhatYoudLikeToDoCard: React.FunctionComponent<TellUsWhatYoudLikeToDoCardProps> = ({ 
  onClose, 
  showArrow = true,
  onShowSetupGuide,
  checkForTriggerPhrase: propCheckForTriggerPhrase,
  hasCustomView = false
}) => {
  const navigate = useNavigate();
  const { checkForTriggerPhrase: contextCheckForTriggerPhrase } = useAskRedHat();
  const { openHelpPanel } = useHelpPanel();
  
  // Use prop if provided, otherwise use context
  const checkForTriggerPhrase = propCheckForTriggerPhrase || contextCheckForTriggerPhrase;
  const [isCustomViewsDropdownOpen, setIsCustomViewsDropdownOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});
  const inputRef = React.useRef<HTMLInputElement>(null);
  const customViewsButtonRef = React.useRef<HTMLButtonElement>(null);


  // Update dropdown position on scroll/resize
  React.useEffect(() => {
    if (!isCustomViewsDropdownOpen || !customViewsButtonRef.current) return;

    const updatePosition = () => {
      if (customViewsButtonRef.current) {
        const rect = customViewsButtonRef.current.getBoundingClientRect();
        setDropdownStyle({
          position: 'fixed',
          top: `${rect.bottom + 2}px`,
          left: `${rect.left}px`,
          zIndex: 9999
        });
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isCustomViewsDropdownOpen]);

  // Handle click outside dropdown to close it
  React.useEffect(() => {
    if (!isCustomViewsDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        customViewsButtonRef.current &&
        !customViewsButtonRef.current.contains(target) &&
        !target.closest('[data-custom-views-dropdown]')
      ) {
        setIsCustomViewsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCustomViewsDropdownOpen]);

  const handleSubmit = () => {
    console.log('Paper airplane clicked, input value:', inputValue);
    console.log('checkForTriggerPhrase function:', typeof checkForTriggerPhrase);
    
    // Check if the input triggers Ask Red Hat
    if (checkForTriggerPhrase(inputValue)) {
      console.log('Ask Red Hat triggered!');
      if (onClose) onClose();
      return; // Don't proceed with normal processing
    }
    
    if (inputValue.trim()) {
      console.log('Sending:', inputValue);
      
      // Check for specific access control request
      const userInput = inputValue.toLowerCase();
      console.log('User input (lowercase):', userInput);
      console.log('Contains access control:', userInput.includes('access control'));
      console.log('Contains user access:', userInput.includes('user access'));
      console.log('Contains set up access control:', userInput.includes('set up access control'));
      console.log('Contains rhel systems with critical vulnerabilities:', userInput.includes('rhel systems with critical vulnerabilities'));
      console.log('Contains what else do i need to set up on hybrid cloud console:', userInput.includes('what else do i need to set up on hybrid cloud console'));
      console.log('Contains roles/access queries:', userInput.includes('roles') || userInput.includes('access'));
      
      // Check for RHEL and OpenShift cluster queries
      if (userInput.includes('show me rhel and openshift clusters i have access to') ||
          userInput.includes('rhel and openshift clusters') ||
          userInput.includes('rhel openshift') ||
          (userInput.includes('rhel') && userInput.includes('openshift') && userInput.includes('clusters')) ||
          (userInput.includes('rhel') && userInput.includes('openshift') && userInput.includes('access'))) {
        console.log('Navigating to /rhelopenshift');
        navigate('/rhelopenshift');
        if (onClose) onClose();
        return;
      }

      if (userInput.includes('tell me about compliance issue cce') ||
          userInput.includes('compliance issue cce') ||
          userInput.includes('cce-') ||
          userInput.includes('compliance')) {
        console.log('Navigating to /rhel-compliance');
        navigate('/rhel-compliance');
        if (onClose) onClose();
        return;
      }

      if (userInput.includes('what roles do i have') ||
          userInput.includes('what access do i have') ||
          userInput.includes('tell me my roles') ||
          userInput.includes('tell me what access i have') ||
          userInput.includes('show them') ||
          (userInput.includes('roles') && userInput.includes('have')) ||
          (userInput.includes('access') && userInput.includes('have'))) {
        console.log('Navigating to /rhel-systems');
        navigate('/rhel-systems');
        if (onClose) onClose();
        return;
      } else if (userInput.includes('set up access control')) {
        console.log('Navigating to /user-access');
        navigate('/user-access');
        if (onClose) onClose();
        return;
      } else if (userInput.includes('rhel systems with critical vulnerabilities')) {
        console.log('Navigating to /cve-dashboard');
        navigate('/cve-dashboard');
        if (onClose) onClose();
        return;
      } else if (userInput.includes('what else do i need to set up on hybrid cloud console')) {
        console.log('Opening Help panel with Interact tab');
        openHelpPanel(0); // Open Help panel with Interact tab (tab 0)
        if (onClose) onClose();
        return;
      } else if (userInput.includes('access control') || userInput.includes('user access')) {
        console.log('Navigating to /my-user-access');
        navigate('/my-user-access');
        if (onClose) onClose();
        return;
      }

      console.log('Sending:', inputValue);
      if (onClose) onClose();
    } else {
      console.log('No input or empty input');
    }
  };

  return (
    <>
    <Card isFullHeight style={{ position: 'relative' }} variant="secondary">
      <CardHeader>
        <Title headingLevel="h4" className="pf-v6-c-card__title">
          Tell us what you'd like to do
        </Title>
      </CardHeader>
      {/* Pink pulsing arrow pointing at the card */}
      {showArrow && (
        <div className="pulsing-arrow-pointer">
          <ArrowRightIcon style={{ fontSize: '12px', transform: 'rotate(180deg)' }} />
        </div>
      )}
      <CardBody>
        <div style={{ position: 'relative' }}>
          <TextInput
            ref={inputRef}
            type="text"
            placeholder="Your request"
            value={inputValue}
            onChange={(_, value) => setInputValue(value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
            style={{ width: '100%', paddingBottom: '60px', paddingRight: '40px' }}
          />
          <button
            style={{
              position: 'absolute',
              right: '8px',
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
            onClick={handleSubmit}
          >
            <PaperPlaneIcon style={{ color: '#0066cc', fontSize: '24px' }} />
          </button>
          <div style={{ 
            position: 'absolute', 
            bottom: '8px', 
            left: '12px', 
            right: '12px', 
            display: 'flex', 
            gap: '8px', 
            flexWrap: 'wrap' 
          }}>
            <button
              style={{
                background: 'white',
                border: '1px solid #0066cc',
                color: '#0066cc',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
              onClick={() => {
                setInputValue('Show RHEL systems with critical vulnerabilities');
              }}
            >
              Show RHEL systems with critical vulnerabilities
            </button>
            <button
              style={{
                background: 'white',
                border: '1px solid #0066cc',
                color: '#0066cc',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
              onClick={() => {
                setInputValue('What else do I need to set up on Hybrid Cloud Console');
                // Also open the Help panel with Interact tab
                openHelpPanel(0);
              }}
            >
              What else do I need to set up on Hybrid Cloud Console
            </button>
            {/* My custom views button - Only show if user has saved a custom view */}
            {hasCustomView && (
              <div style={{ display: 'inline-block' }}>
                <button
                  ref={customViewsButtonRef}
                  data-custom-views-button="true"
                  style={{
                    background: 'white',
                    border: '1px solid #0066cc',
                    color: '#0066cc',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const buttonElement = e.currentTarget;
                    const newState = !isCustomViewsDropdownOpen;
                    
                    // Calculate position immediately from the clicked button
                    if (newState && buttonElement) {
                      const rect = buttonElement.getBoundingClientRect();
                      setDropdownStyle({
                        position: 'fixed',
                        top: `${rect.bottom + 2}px`,
                        left: `${rect.left}px`,
                        zIndex: 9999
                      });
                    }
                    
                    setIsCustomViewsDropdownOpen(newState);
                  }}
                >
                  My custom views
                  <ChevronDownIcon style={{ fontSize: '10px' }} />
                </button>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
    
    {/* Custom Views Dropdown - Outside card to avoid overflow clipping */}
    {hasCustomView && isCustomViewsDropdownOpen && (
      <div 
        data-custom-views-dropdown
        style={{ 
          ...dropdownStyle,
          backgroundColor: 'white', 
          border: '1px solid #d2d2d2', 
          borderRadius: '4px', 
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          minWidth: '200px'
        }}
      >
        <div
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#0066cc'
          }}
          onClick={() => {
            navigate('/rhelopenshift');
            setIsCustomViewsDropdownOpen(false);
            if (onClose) onClose();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f8ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          My RHEL and OpenShift clusters
        </div>
      </div>
    )}
    </>
  );
};

export { TellUsWhatYoudLikeToDoCard };
