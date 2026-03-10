import * as React from 'react';
import { TellUsWhatYoudLikeToDoCard } from '@app/components/TellUsWhatYoudLikeToDoCard';
import { useNavigate } from 'react-router-dom';
import { useAskRedHat } from '@app/AskRedHat';
import { useSetupGuide } from '@app/SetupGuide';

interface GlobalSearchProps {
  isVisible: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FunctionComponent<GlobalSearchProps> = ({ isVisible, onClose }) => {
  const navigate = useNavigate();
  const { isVisible: isAskRedHatVisible, checkForTriggerPhrase } = useAskRedHat();
  const { showSetupGuide } = useSetupGuide();
  const [isAnimating, setIsAnimating] = React.useState(false);
  
  console.log('GlobalSearch: isAskRedHatVisible:', isAskRedHatVisible);
  console.log('GlobalSearch: checkForTriggerPhrase function:', typeof checkForTriggerPhrase);

  // Handle slide-in animation when dropdown opens
  React.useEffect(() => {
    if (isVisible) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible]);
  // Calculate position to align upper left corner with magnifying glass
  const getDropdownStyle = () => {
    // Try multiple selectors to find the magnifying glass button
    const searchToggleButton = document.querySelector('[aria-label="Expandable search input toggle"]') as HTMLElement ||
                              document.querySelector('[aria-label="Global search"]') as HTMLElement ||
                              document.querySelector('button[aria-label*="search"]') as HTMLElement ||
                              document.querySelector('.pf-c-search__toggle') as HTMLElement;
    console.log('GlobalSearch: searchToggleButton found:', !!searchToggleButton);
    console.log('GlobalSearch: searchToggleButton element:', searchToggleButton);
    
    if (searchToggleButton) {
      const rect = searchToggleButton.getBoundingClientRect();
      console.log('GlobalSearch: magnifying glass position:', { 
        top: rect.top, 
        bottom: rect.bottom, 
        left: rect.left, 
        right: rect.right,
        width: rect.width,
        height: rect.height
      });
      
      return {
        position: 'fixed' as const,
        top: `${rect.bottom}px`, // No gap - directly connected to magnifying glass
        left: `${rect.left}px`, // Always positioned at magnifying glass
        backgroundColor: 'white',
        borderRadius: '0 8px 8px 8px', // No top radius - connects to magnifying glass
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        width: '1000px',
        maxHeight: '70vh',
        overflow: 'auto' as const,
        zIndex: 10000,
        transform: isAnimating ? 'scale(1)' : 'scale(0.95)', // Scale animation from magnifying glass
        opacity: isAnimating ? 1 : 0, // Fade in effect
        transition: 'transform 0.2s ease-out, opacity 0.2s ease-out' // Smooth scale and fade animation
      };
    }
    
    // Fallback positioning
    return {
      position: 'fixed' as const,
      top: '60px',
      left: '20px', // Always positioned at fallback location
      backgroundColor: 'white',
      borderRadius: '0 8px 8px 8px', // No top radius - connects to magnifying glass
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      width: '1000px',
      maxHeight: '70vh',
      overflow: 'auto' as const,
      zIndex: 10000,
      transform: isAnimating ? 'scale(1)' : 'scale(0.95)', // Scale animation
      opacity: isAnimating ? 1 : 0, // Fade in effect
      transition: 'transform 0.2s ease-out, opacity 0.2s ease-out' // Smooth scale and fade animation
    };
  };

  if (!isVisible) return null;

  console.log('GlobalSearch: Rendering with isVisible:', isVisible);
  console.log('GlobalSearch: AskRedHat context available:', !!checkForTriggerPhrase);
  
  const dropdownStyle = getDropdownStyle();
  console.log('GlobalSearch: Final dropdown style:', dropdownStyle);

  return (
    <div style={dropdownStyle} data-global-search-dropdown>
      {/* Content */}
      <div style={{ padding: '16px' }}>
        <TellUsWhatYoudLikeToDoCard 
          onClose={onClose} 
          showArrow={false}
          checkForTriggerPhrase={checkForTriggerPhrase}
          onShowSetupGuide={() => {
            // Use global SetupGuide context
            console.log('Setup guide requested from GlobalSearch - showing setup guide');
            showSetupGuide();
            onClose(); // Close the dropdown
          }}
        />
      </div>
    </div>
  );
};

export { GlobalSearch };