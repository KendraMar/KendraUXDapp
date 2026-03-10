import * as React from 'react';

interface GlobalSearchContextType {
  isGlobalSearchOpen: boolean;
  openGlobalSearch: () => void;
  closeGlobalSearch: () => void;
}

const GlobalSearchContext = React.createContext<GlobalSearchContextType | undefined>(undefined);

export const GlobalSearchProvider: React.FunctionComponent<{ children: React.ReactNode }> = ({ children }) => {
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = React.useState(false);

  const openGlobalSearch = () => {
    setIsGlobalSearchOpen(true);
  };

  const closeGlobalSearch = () => {
    setIsGlobalSearchOpen(false);
  };

  return (
    <GlobalSearchContext.Provider value={{
      isGlobalSearchOpen,
      openGlobalSearch,
      closeGlobalSearch
    }}>
      {children}
    </GlobalSearchContext.Provider>
  );
};

export const useGlobalSearch = () => {
  const context = React.useContext(GlobalSearchContext);
  if (context === undefined) {
    throw new Error('useGlobalSearch must be used within a GlobalSearchProvider');
  }
  return context;
};

