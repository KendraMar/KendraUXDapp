import React, { createContext, useState, useCallback, useContext } from 'react';

interface SetupGuideContextType {
  isVisible: boolean;
  showSetupGuide: () => void;
  hideSetupGuide: () => void;
}

const SetupGuideContext = createContext<SetupGuideContextType | undefined>(undefined);

export const SetupGuideProvider: React.FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  const showSetupGuide = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideSetupGuide = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <SetupGuideContext.Provider value={{ isVisible, showSetupGuide, hideSetupGuide }}>
      {children}
    </SetupGuideContext.Provider>
  );
};

export const useSetupGuide = () => {
  const context = useContext(SetupGuideContext);
  if (!context) {
    throw new Error('useSetupGuide must be used within a SetupGuideProvider');
  }
  return context;
};




