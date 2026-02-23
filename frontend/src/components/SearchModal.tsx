import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, Input } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { MenuType } from '../store/AuthContext';

/** Flatten leaf menus for search */
function flattenMenus(menus: MenuType[], parentNames: string[] = []): { name: string; path: string; breadcrumb: string }[] {
  const result: { name: string; path: string; breadcrumb: string }[] = [];
  for (const menu of menus) {
    if (menu.children && menu.children.length > 0) {
      result.push(...flattenMenus(menu.children, [...parentNames, menu.name]));
    } else if (menu.path && menu.visible === 1) {
      result.push({
        name: menu.name,
        path: menu.path,
        breadcrumb: [...parentNames, menu.name].join(' / '),
      });
    }
  }
  return result;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  menus: MenuType[];
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onClose, menus }) => {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const searchInputRef = useRef<any>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      setSearchKeyword('');
      setActiveIndex(0);
    }
  }, [open]);

  // Global shortcut Ctrl+K / Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // This is handled by parent, but keep Escape here
      }
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const flatMenuItems = useMemo(() => {
    const items = flattenMenus(menus);
    items.unshift({ name: '工作台', path: '/dashboard', breadcrumb: '工作台' });
    return items;
  }, [menus]);

  const searchResults = useMemo(() => {
    if (!searchKeyword.trim()) return flatMenuItems;
    const kw = searchKeyword.toLowerCase();
    return flatMenuItems.filter((item) =>
      item.name.toLowerCase().includes(kw) || item.breadcrumb.toLowerCase().includes(kw)
    );
  }, [flatMenuItems, searchKeyword]);

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      closable={false}
      className="search-modal"
      styles={{ body: { padding: 0 } }}
    >
      <div className="search-modal-input">
        <SearchOutlined className="search-modal-icon" />
        <Input
          ref={searchInputRef}
          placeholder="搜索菜单... (Ctrl+K)"
          variant="borderless"
          value={searchKeyword}
          onChange={(e) => { setSearchKeyword(e.target.value); setActiveIndex(0); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (searchResults.length > 0) {
                handleNavigate(searchResults[activeIndex]?.path || searchResults[0].path);
              }
            }
          }}
        />
        <span className="search-modal-close" onClick={onClose}>
          <CloseOutlined />
        </span>
      </div>
      <div className="search-modal-results">
        {searchResults.length === 0 ? (
          <div className="search-modal-empty">未找到相关菜单</div>
        ) : (
          searchResults.map((item, index) => (
            <div
              key={item.path}
              className={`search-modal-item ${index === activeIndex ? 'search-modal-item-active' : ''}`}
              onClick={() => handleNavigate(item.path)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className="search-modal-item-name">{item.name}</span>
              <span className="search-modal-item-path">{item.breadcrumb}</span>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default SearchModal;
