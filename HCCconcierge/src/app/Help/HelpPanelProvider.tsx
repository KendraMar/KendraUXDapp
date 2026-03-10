import React, { createContext, useState, useCallback, useContext } from 'react';

interface HelpPanelContextType {
  isOpen: boolean;
  activeTabKey: string | number;
  showConversionContent: boolean;
  openHelpPanel: (tabKey?: string | number) => void;
  closeHelpPanel: () => void;
  toggleHelpPanel: () => void;
  setActiveTabKey: (tabKey: string | number) => void;
  setShowConversionContent: (show: boolean) => void;
}

const HelpPanelContext = createContext<HelpPanelContextType | undefined>(undefined);

export const HelpPanelProvider: React.FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  // Default to open on dashboard/homepage
  const [isOpen, setIsOpen] = useState(true);
  const [activeTabKey, setActiveTabKeyState] = useState<string | number>(0); // Default to Interact tab
  const [showConversionContent, setShowConversionContentState] = useState(false);

  const openHelpPanel = useCallback((tabKey?: string | number) => {
    setIsOpen(true);
    if (tabKey !== undefined) {
      setActiveTabKeyState(tabKey);
    }
  }, []);

  const closeHelpPanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleHelpPanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const setActiveTabKey = useCallback((tabKey: string | number) => {
    setActiveTabKeyState(tabKey);
  }, []);

  const setShowConversionContent = useCallback((show: boolean) => {
    setShowConversionContentState(show);
  }, []);

  return (
    <HelpPanelContext.Provider value={{ isOpen, activeTabKey, showConversionContent, openHelpPanel, closeHelpPanel, toggleHelpPanel, setActiveTabKey, setShowConversionContent }}>
      {children}
    </HelpPanelContext.Provider>
  );
};

export const useHelpPanel = () => {
  const context = useContext(HelpPanelContext);
  if (!context) {
    throw new Error('useHelpPanel must be used within a HelpPanelProvider');
  }
  return context;
};
