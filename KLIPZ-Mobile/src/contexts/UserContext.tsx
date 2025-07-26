import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'streamer' | 'clipper';

interface UserContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  initializeUserRole: (role: UserRole) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode; initialRole?: UserRole }> = ({ children, initialRole = 'streamer' }) => {
  const [userRole, setUserRole] = useState<UserRole>(initialRole);

  const initializeUserRole = (role: UserRole) => {
    setUserRole(role);
  };

  return (
    <UserContext.Provider value={{ userRole, setUserRole, initializeUserRole }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserProvider');
  }
  return context;
}; 