import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import type { MenuType } from '../store/AuthContext';

/** 从菜单树中提取所有叶子路径 */
function collectMenuPaths(menus: MenuType[]): Set<string> {
  const paths = new Set<string>();
  const traverse = (nodes: MenuType[]) => {
    for (const node of nodes) {
      if (node.path) paths.add(node.path);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  };
  traverse(menus);
  return paths;
}

/** 不受菜单权限约束的白名单路径 */
const WHITE_PATHS = new Set(['/dashboard', '/profile']);

/**
 * 路由权限守卫
 * 检查当前路由是否在用户菜单权限中，否则跳转403
 */
const PermissionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { menus, permissions, loaded } = useAuth();

  // 未加载完成时不拦截
  if (!loaded) return <>{children}</>;

  // 超级管理员放行
  if (permissions.includes('*:*:*')) return <>{children}</>;

  const currentPath = location.pathname;

  // 白名单放行
  if (WHITE_PATHS.has(currentPath)) return <>{children}</>;

  // 检查菜单权限
  const allowedPaths = collectMenuPaths(menus);
  if (allowedPaths.has(currentPath)) return <>{children}</>;

  // 无权限，跳转403
  return <Navigate to="/403" replace />;
};

export default PermissionGuard;
