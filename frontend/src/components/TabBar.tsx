import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import {
  ReloadOutlined, CloseOutlined, CloseCircleOutlined,
  VerticalLeftOutlined, VerticalRightOutlined, MinusCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTabs } from '../store/TabContext';

const TabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tabs, activeKey, setActiveKey, removeTab, closeOther, closeLeft, closeRight, closeAll, refreshTab } = useTabs();
  const [contextMenu, setContextMenu] = useState<{ key: string; x: number; y: number } | null>(null);

  // Dismiss context menu on any click
  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleTabChange = (key: string) => {
    setActiveKey(key);
    navigate(key);
  };

  const handleTabEdit = (_: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
    if (action === 'remove') {
      const nextKey = removeTab(_ as string);
      if (nextKey) navigate(nextKey);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    setContextMenu({ key, x: e.clientX, y: e.clientY });
  };

  const handleAction = (action: string) => {
    if (!contextMenu) return;
    const { key } = contextMenu;
    switch (action) {
      case 'refresh':
        if (key === location.pathname) {
          refreshTab();
        } else {
          navigate(key);
        }
        break;
      case 'closeCurrent': {
        const nextKey = removeTab(key);
        if (nextKey) navigate(nextKey);
        break;
      }
      case 'closeOther':
        closeOther(key);
        navigate(key);
        break;
      case 'closeLeft':
        closeLeft(key);
        navigate(key);
        break;
      case 'closeRight':
        closeRight(key);
        navigate(key);
        break;
      case 'closeAll':
        closeAll();
        navigate('/dashboard');
        break;
    }
    setContextMenu(null);
  };

  const tabItems = tabs.map((tab) => ({
    key: tab.key,
    label: (
      <span onContextMenu={(e) => handleContextMenu(e, tab.key)}>
        {tab.title}
      </span>
    ),
    closable: tab.key !== '/dashboard',
  }));

  return (
    <div className="layout-tabs">
      <Tabs
        type="editable-card"
        hideAdd
        activeKey={activeKey}
        onChange={handleTabChange}
        onEdit={handleTabEdit}
        items={tabItems}
        size="small"
      />
      {contextMenu && (
        <div
          className="tab-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="tab-context-menu-item" onClick={() => handleAction('refresh')}>
            <ReloadOutlined /> 刷新当前
          </div>
          <div
            className={`tab-context-menu-item ${contextMenu.key === '/dashboard' ? 'tab-context-menu-item-disabled' : ''}`}
            onClick={() => contextMenu.key !== '/dashboard' && handleAction('closeCurrent')}
          >
            <CloseOutlined /> 关闭当前
          </div>
          <div className="tab-context-menu-divider" />
          <div className="tab-context-menu-item" onClick={() => handleAction('closeOther')}>
            <CloseCircleOutlined /> 关闭其他
          </div>
          <div className="tab-context-menu-item" onClick={() => handleAction('closeLeft')}>
            <VerticalRightOutlined /> 关闭左侧
          </div>
          <div className="tab-context-menu-item" onClick={() => handleAction('closeRight')}>
            <VerticalLeftOutlined /> 关闭右侧
          </div>
          <div className="tab-context-menu-divider" />
          <div className="tab-context-menu-item" onClick={() => handleAction('closeAll')}>
            <MinusCircleOutlined /> 关闭全部
          </div>
        </div>
      )}
    </div>
  );
};

export default TabBar;
