import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import PageLoading from '../components/PageLoading';
import ErrorBoundary from '../components/ErrorBoundary';

// 懒加载页面组件
const Login = lazy(() => import('../pages/login'));
const Dashboard = lazy(() => import('../pages/dashboard'));
const ProfilePage = lazy(() => import('../pages/profile'));
const BigScreen = lazy(() => import('../pages/bigscreen'));
const NotFound = lazy(() => import('../pages/error/404'));
const Forbidden = lazy(() => import('../pages/error/403'));

// 系统管理
const User = lazy(() => import('../pages/system/user'));
const Role = lazy(() => import('../pages/system/role'));
const MenuPage = lazy(() => import('../pages/system/menu'));
const DictPage = lazy(() => import('../pages/system/dict'));
const LogPage = lazy(() => import('../pages/system/log'));
const OnlinePage = lazy(() => import('../pages/system/online'));
const LoginLogPage = lazy(() => import('../pages/system/login-log'));
const DeptPage = lazy(() => import('../pages/system/dept'));
const ServerPage = lazy(() => import('../pages/system/server'));
const NoticePage = lazy(() => import('../pages/system/notice'));
const JobPage = lazy(() => import('../pages/system/job'));
const FilePage = lazy(() => import('../pages/system/file'));
const PostPage = lazy(() => import('../pages/system/post'));
const ConfigPage = lazy(() => import('../pages/system/config'));
const CachePage = lazy(() => import('../pages/system/cache'));

// 工具
const Gen = lazy(() => import('../pages/tool/gen'));
const ApiDocPage = lazy(() => import('../pages/tool/api-doc'));

/** 懒加载包装: Suspense + ErrorBoundary */
function lazyLoad(Component: React.LazyExoticComponent<React.FC>) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoading />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/bigscreen',
    element: (
      <Suspense fallback={<PageLoading />}>
        <BigScreen />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      { path: 'dashboard', element: lazyLoad(Dashboard) },
      { path: 'profile', element: lazyLoad(ProfilePage) },
      {
        path: 'system',
        children: [
          { path: 'user', element: lazyLoad(User) },
          { path: 'role', element: lazyLoad(Role) },
          { path: 'menu', element: lazyLoad(MenuPage) },
          { path: 'dict', element: lazyLoad(DictPage) },
          { path: 'log', element: lazyLoad(LogPage) },
          { path: 'online', element: lazyLoad(OnlinePage) },
          { path: 'login-log', element: lazyLoad(LoginLogPage) },
          { path: 'dept', element: lazyLoad(DeptPage) },
          { path: 'server', element: lazyLoad(ServerPage) },
          { path: 'notice', element: lazyLoad(NoticePage) },
          { path: 'job', element: lazyLoad(JobPage) },
          { path: 'file', element: lazyLoad(FilePage) },
          { path: 'post', element: lazyLoad(PostPage) },
          { path: 'config', element: lazyLoad(ConfigPage) },
          { path: 'cache', element: lazyLoad(CachePage) },
        ],
      },
      {
        path: 'tool',
        children: [
          { path: 'gen', element: lazyLoad(Gen) },
          { path: 'api-doc', element: lazyLoad(ApiDocPage) },
        ],
      },
      { path: '403', element: lazyLoad(Forbidden) },
      { path: '*', element: lazyLoad(NotFound) },
    ],
  },
]);

export default router;
