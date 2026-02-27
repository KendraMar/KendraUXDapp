import React, { createContext, useState, useCallback, useContext } from 'react';

interface AskRedHatContextType {
  isVisible: boolean;
  triggerPhrase: string;
  checkForTriggerPhrase: (input: string) => boolean;
  showAskRedHat: () => void;
  hideAskRedHat: () => void;
}

const AskRedHatContext = createContext<AskRedHatContextType | undefined>(undefined);

export const AskRedHatProvider: React.FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [triggerPhrase, setTriggerPhrase] = useState('');

  const checkForTriggerPhrase = useCallback((input: string) => {
    console.log('AskRedHatProvider: checkForTriggerPhrase called with:', input);
    const normalizedInput = input.toLowerCase().trim();
    const triggerPhrases = [
      'upgrade my rhel systems to rhel9',
      'upgrade my rhel systems to rhel 9',
      'upgrade rhel systems to rhel9',
      'upgrade rhel systems to rhel 9',
      'upgrade to rhel9',
      'upgrade to rhel 9'
    ];

    const foundPhrase = triggerPhrases.find(phrase => 
      normalizedInput.includes(phrase.toLowerCase())
    );

    if (foundPhrase) {
      console.log('AskRedHatProvider: Found trigger phrase:', foundPhrase);
      setTriggerPhrase(foundPhrase);
      setIsVisible(true);
      return true;
    }
    console.log('AskRedHatProvider: No trigger phrase found');
    return false;
  }, []);

  const showAskRedHat = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideAskRedHat = useCallback(() => {
    setIsVisible(false);
    setTriggerPhrase('');
  }, []);

  return (
    <AskRedHatContext.Provider value={{ isVisible, triggerPhrase, checkForTriggerPhrase, showAskRedHat, hideAskRedHat }}>
      {children}
    </AskRedHatContext.Provider>
  );
};

export const useAskRedHat = () => {
  const context = useContext(AskRedHatContext);
  if (!context) {
    throw new Error('useAskRedHat must be used within an AskRedHatProvider');
  }
  return context;
};
