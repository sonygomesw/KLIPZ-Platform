import React, { createContext, useContext, useState, useCallback } from 'react';

interface SubmissionContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const SubmissionContext = createContext<SubmissionContextType>({
  refreshKey: 0,
  triggerRefresh: () => {},
});

export const SubmissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <SubmissionContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </SubmissionContext.Provider>
  );
};

export const useSubmissionRefresh = () => {
  const context = useContext(SubmissionContext);
  if (!context) {
    throw new Error('useSubmissionRefresh must be used within a SubmissionProvider');
  }
  return context;
}; 