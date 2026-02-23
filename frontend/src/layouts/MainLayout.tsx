import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  PieChartOutlined, FullscreenOutlined, FullscreenExitOutlined,
  SunOutlined, MoonOutlined, HomeOutlined, SearchOutlined, SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, Dropdown, Avatar, Spin, message, Popover, Breadcrumb, Watermark, FloatButton, Drawer } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../api/auth';
import { useAuth } from '../store/AuthContext';
import type { MenuType } from '../store/AuthContext';
import { useTheme, COLOR_SCHEMES } from '../store/ThemeContext';
import { useTabs } from '../store/TabContext';
import { getIcon } from '../utils/iconMap';
import { useWebSocketNotice } from '../hooks/useWebSocketNotice';
import SettingsDrawer from '../components/SettingsDrawer';
import PermissionGuard from '../components/PermissionGuard';
import SearchModal from '../components/SearchModal';
import NoticePopover from '../components/NoticePopover';
import TabBar from '../components/TabBar';

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

/** Recursively convert backend menu tree into Ant Design menu items */
function buildMenuItems(menus: MenuType[]): MenuItem[] {
  return menus
    .filter((m) => m.visible === 1)
    .map((menu) => {
      const item: any = {
        key: menu.path,
        icon: getIcon(menu.icon),
        label: menu.name,
      };
      if (menu.children && menu.children.length > 0) {
        item.children = buildMenuItems(menu.children);
      }
      return item as MenuItem;
    });
}

/** Collect all parent keys from the menu tree that contain the given path */
function getOpenKeys(menus: MenuType[], path: string): string[] {
  const keys: string[] = [];
  const find = (nodes: MenuType[], parents: string[]): boolean => {
    for (const node of nodes) {
      if (node.path === path) {
        keys.push(...parents);
        return true;
      }
      if (node.children && node.children.length > 0) {
        if (find(node.children, [...parents, node.path])) return true;
      }
    }
    return false;
  };
  find(menus, []);
  return keys;
}

/** Flatten menu tree to build path -> name title map */
function buildTitleMap(menus: MenuType[]): Record<string, string> {
  const map: Record<string, string> = {};
  const traverse = (nodes: MenuType[]) => {
    for (const node of nodes) {
      if (node.path) map[node.path] = node.name;
      if (node.children) traverse(node.children);
    }
  };
  traverse(menus);
  return map;
}

/** Build breadcrumb path chain from menu tree */
function buildBreadcrumb(menus: MenuType[], path: string): { name: string }[] {
  const chain: { name: string }[] = [];
  const find = (nodes: MenuType[], parents: { name: string }[]): boolean => {
    for (const node of nodes) {
      if (node.path === path) {
        chain.push(...parents, { name: node.name });
        return true;
      }
      if (node.children && node.children.length > 0) {
        if (find(node.children, [...parents, { name: node.name }])) return true;
      }
    }
    return false;
  };
  find(menus, []);
  return chain;
}

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(() => localStorage.getItem('watermark') !== 'false');
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, menus, loaded, loadAuthData, clearAuth } = useAuth();
  const { isDark, toggleTheme, colorScheme, setColorSchemeKey } = useTheme();
  useWebSocketNotice();
  const { refreshKey, addTab } = useTabs();

  // Persist sidebar collapsed state
  const handleCollapse = useCallback((value: boolean) => {
    setCollapsed(value);
    localStorage.setItem('sidebar_collapsed', String(value));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!loaded) {
      loadAuthData().catch(() => {
        clearAuth();
        navigate('/login');
      });
    }
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Global search shortcut (Ctrl+K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleWatermarkChange = useCallback((enabled: boolean) => {
    setWatermarkEnabled(enabled);
    localStorage.setItem('watermark', String(enabled));
  }, []);

  const menuItems = useMemo(() => buildMenuItems(menus), [menus]);
  const pageTitles = useMemo(() => {
    const map = buildTitleMap(menus);
    map['/dashboard'] = '工作台';
    map['/profile'] = '个人中心';
    return map;
  }, [menus]);
  const defaultOpenKeys = useMemo(() => getOpenKeys(menus, location.pathname), [menus, location.pathname]);

  // Build breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items: { title: React.ReactNode }[] = [
      {
        title: (
          <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <HomeOutlined style={{ marginRight: 4 }} />
            工作台
          </span>
        ),
      },
    ];
    if (location.pathname !== '/dashboard') {
      const chain = buildBreadcrumb(menus, location.pathname);
      if (chain.length === 0) {
        const title = pageTitles[location.pathname];
        if (title) items.push({ title });
      } else {
        chain.forEach((item) => items.push({ title: item.name }));
      }
    }
    return items;
  }, [menus, location.pathname, pageTitles, navigate]);

  // Sync tabs with route changes
  useEffect(() => {
    const title = pageTitles[location.pathname];
    if (title) {
      addTab({ key: location.pathname, title, path: location.pathname });
    }
  }, [location.pathname, pageTitles, addTab]);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const handleMenuClick: MenuProps['onClick'] = (e) => navigate(e.key);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
      message.success('已退出登录');
      navigate('/login');
    }
  };

  const userMenu: MenuProps['items'] = [
    { key: 'profile', label: '个人中心', icon: <UserOutlined />, onClick: () => navigate('/profile') },
    { type: 'divider' },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout },
  ];

  // Show loading spinner while auth data is being loaded
  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const allMenuItems: MenuItem[] = [
    { key: '/dashboard', icon: <PieChartOutlined />, label: '工作台' },
    ...menuItems,
  ];

  const sidebarMenu = (
    <Menu
      theme="dark"
      mode="inline"
      items={allMenuItems}
      onClick={handleMenuClick}
      selectedKeys={[location.pathname]}
      defaultOpenKeys={defaultOpenKeys}
      style={{ border: 'none', padding: '8px 0' }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={handleCollapse}
        trigger={null}
        width={240}
        collapsedWidth={68}
        className={`layout-sidebar layout-sidebar-desktop ${collapsed ? 'sidebar-collapsed' : ''}`}
      >
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">D</div>
          <span className="sidebar-logo-text">Demo Admin</span>
        </div>
        {sidebarMenu}
      </Sider>

      {/* Mobile Sidebar Drawer */}
      <Drawer
        placement="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        width={240}
        className="mobile-sidebar-drawer"
        styles={{ body: { padding: 0, background: 'var(--color-sidebar)' }, header: { display: 'none' } }}
      >
        <div className="sidebar-logo" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="sidebar-logo-mark">D</div>
          <span className="sidebar-logo-text" style={{ opacity: 1, width: 'auto' }}>Demo Admin</span>
        </div>
        {sidebarMenu}
      </Drawer>

      <Layout>
        <Header className="layout-header">
          <div className="header-left">
            <span className="header-collapse-btn header-collapse-desktop" onClick={() => handleCollapse(!collapsed)}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <span className="header-collapse-btn header-collapse-mobile" onClick={() => setMobileDrawerOpen(true)}>
              <MenuUnfoldOutlined />
            </span>
            <Breadcrumb items={breadcrumbItems} className="header-breadcrumb" />
          </div>
          <div className="header-right">
            <span className="header-icon-btn" onClick={() => setSearchOpen(true)} title="搜索 (Ctrl+K)">
              <SearchOutlined />
            </span>
            <Popover
              placement="bottomRight"
              trigger="click"
              title={null}
              content={
                <div style={{ display: 'flex', gap: 10, padding: '4px 0' }}>
                  {COLOR_SCHEMES.map((s) => (
                    <div
                      key={s.key}
                      title={s.label}
                      onClick={() => setColorSchemeKey(s.key)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: s.primary, cursor: 'pointer',
                        border: colorScheme.key === s.key ? '2.5px solid var(--color-text)' : '2.5px solid transparent',
                        outline: colorScheme.key === s.key ? '2px solid ' + s.primary : 'none',
                        outlineOffset: 1, transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </div>
              }
            >
              <span className="header-icon-btn" title="主题色">
                <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: colorScheme.primary, border: '2px solid var(--color-border)', verticalAlign: 'middle' }} />
              </span>
            </Popover>
            <span className="header-icon-btn" onClick={toggleTheme} title={isDark ? '切换亮色模式' : '切换暗色模式'}>
              {isDark ? <SunOutlined /> : <MoonOutlined />}
            </span>
            <span className="header-icon-btn header-hide-mobile" onClick={toggleFullscreen} title={isFullscreen ? '退出全屏' : '全屏'}>
              {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </span>
            <span className="header-icon-btn" onClick={() => setSettingsOpen(true)} title="系统设置">
              <SettingOutlined />
            </span>
            <NoticePopover />
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div className="header-user">
                <Avatar
                  size={30}
                  icon={<UserOutlined />}
                  src={userInfo?.avatar ? '/api' + userInfo.avatar : undefined}
                  style={{ background: `linear-gradient(135deg, var(--color-primary), ${colorScheme.gold})` }}
                />
                <span className="header-user-name">
                  {userInfo?.nickname || userInfo?.username || '管理员'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <TabBar />

        <Watermark content={watermarkEnabled ? (userInfo?.nickname || userInfo?.username || '') : ''} font={{ color: 'rgba(0,0,0,0.03)' }} gap={[120, 120]}>
          <Content className="layout-content">
            <PermissionGuard>
              <Outlet key={refreshKey} />
            </PermissionGuard>
          </Content>
        </Watermark>
        <Footer className="layout-footer">
          Demo Admin &copy; {new Date().getFullYear()}
        </Footer>
      </Layout>

      <FloatButton.BackTop visibilityHeight={300} />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} menus={menus} />

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        watermarkEnabled={watermarkEnabled}
        onWatermarkChange={handleWatermarkChange}
      />
    </Layout>
  );
};

export default MainLayout;
