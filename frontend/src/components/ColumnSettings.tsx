import { useState, useCallback } from 'react';
import { Popover, Checkbox, Button, Tooltip } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface ColumnSettingsProps<T = any> {
  columns: ColumnsType<T>;
  storageKey: string;
  onChange: (visibleColumns: ColumnsType<T>, hiddenKeys: string[]) => void;
}

function ColumnSettings<T>({ columns, storageKey, onChange }: ColumnSettingsProps<T>) {
  const [hiddenKeys, setHiddenKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`col_settings_${storageKey}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const persist = useCallback((keys: string[]) => {
    localStorage.setItem(`col_settings_${storageKey}`, JSON.stringify(keys));
  }, [storageKey]);

  const handleToggle = (key: string, checked: boolean) => {
    setHiddenKeys((prev) => {
      const next = checked ? prev.filter((k) => k !== key) : [...prev, key];
      persist(next);
      onChange([], next);
      return next;
    });
  };

  const handleReset = () => {
    setHiddenKeys([]);
    persist([]);
    onChange([], []);
  };

  const content = (
    <div style={{ maxHeight: 320, overflow: 'auto', minWidth: 160 }}>
      {columns.map((col: any) => {
        const key = col.key || col.dataIndex;
        if (!key) return null;
        const title = typeof col.title === 'string' ? col.title : key;
        return (
          <div key={key} style={{ padding: '4px 0' }}>
            <Checkbox
              checked={!hiddenKeys.includes(key)}
              onChange={(e) => handleToggle(key, e.target.checked)}
            >
              {title}
            </Checkbox>
          </div>
        );
      })}
      <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 8, paddingTop: 8 }}>
        <Button type="link" size="small" onClick={handleReset} style={{ padding: 0 }}>
          重置
        </Button>
      </div>
    </div>
  );

  return (
    <Popover content={content} title="列设置" trigger="click" placement="bottomRight">
      <Tooltip title="列设置">
        <Button icon={<SettingOutlined />} size="small" />
      </Tooltip>
    </Popover>
  );
}

export default ColumnSettings;
