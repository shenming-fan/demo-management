import React, { createContext, useContext, useState, useCallback } from 'react';
import { getUserInfo, getUserMenus } from '../api/auth';

export interface MenuType {
  id: number;
  parentId: number;
  name: string;
  type: number;
  path: string;
  component: string;
  permission: string;
  icon: string;
  sort: number;
  visible: number;
  status: number;
  isFrame: number;
  isCache: number;
  children?: MenuType[];
}

interface UserInfo {
  userId: number;
  username: string;
  nickname: string;
  avatar: string;
  phone: string | null;
  email: string | null;
  gender: number | null;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  userInfo: UserInfo | null;
  menus: MenuType[];
  permissions: string[];
  loaded: boolean;
  loadAuthData: () => Promise<void>;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [menus, setMenus] = useState<MenuType[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadAuthData = useCallback(async () => {
    const [infoRes, menuRes]: any[] = await Promise.all([
      getUserInfo(),
      getUserMenus(),
    ]);
    const info = infoRes.data;
    setUserInfo(info);
    setPermissions(info.permissions || []);
    setMenus(menuRes.data || []);
    setLoaded(true);
    localStorage.setItem('userInfo', JSON.stringify(info));
  }, []);

  const clearAuth = useCallback(() => {
    setUserInfo(null);
    setMenus([]);
    setPermissions([]);
    setLoaded(false);
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  }, []);

  const hasPermission = useCallback(
    (perm: string) => {
      if (permissions.includes('*:*:*')) return true;
      return permissions.includes(perm);
    },
    [permissions],
  );

  return (
    <AuthContext.Provider
      value={{ userInfo, menus, permissions, loaded, loadAuthData, clearAuth, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
