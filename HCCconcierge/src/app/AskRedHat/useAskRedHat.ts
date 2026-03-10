import { useState, useEffect } from 'react';

export const useAskRedHat = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [triggerPhrase, setTriggerPhrase] = useState('');

  const checkForTriggerPhrase = (input: string) => {
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
      setTriggerPhrase(foundPhrase);
      setIsVisible(true);
      return true;
    }
    return false;
  };

  const hideAskRedHat = () => {
    setIsVisible(false);
    setTriggerPhrase('');
  };

  return {
    isVisible,
    triggerPhrase,
    checkForTriggerPhrase,
    hideAskRedHat
  };
};

