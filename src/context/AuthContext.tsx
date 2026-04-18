import React, { createContext, useContext, useState } from 'react';
import { type Role, Roles } from '../utils/roles';

type User = {
  username: string;
  firstName: string;
  lastName: string;
  role: Role;
} | null;

interface AuthContextType {
  user: User;
  login: (userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // const [user, setUser] = useState<User>(null); // Default is public user
  const [user, setUser] = useState<User>({
    username: 'tony_stark',
    firstName: 'Tony',
    lastName: 'Stark',
    role: Roles.OWNER,
  }); // Owner role for testing; change to other roles as needed for testing conditional visibility
  // const [user, setUser] = useState<User>({
  //     username: 'pepper_potts',
  //     firstName: 'Pepper',
  //     lastName: 'Potts',
  //     role: Roles.SALES_AGENT
  // }); // Sales Agent role
  // const [user, setUser] = useState<User>({
  //   username: 'happy_hogan',
  //   firstName: 'Happy',
  //   lastName: 'Hogan',
  //   role: Roles.ACQUISITION_SPECIALIST,
  // }); // Acquisition Specialist role
  // const [user, setUser] = useState<User>({
  //   username: 'bruce_banner',
  //   firstName: 'Bruce',
  //   lastName: 'Banner',
  //   role: Roles.OPERATING_MANAGER,
  // }); // Operating Manager role

  const login = (userData: User) => setUser(userData);
  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
