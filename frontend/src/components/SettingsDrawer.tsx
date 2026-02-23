import React, { useState, useEffect, useCallback } from 'react';
import { Drawer, Switch, InputNumber, Input, Divider, message, Button, Space, Tooltip } from 'antd';
import {
  CheckOutlined, SyncOutlined, BgColorsOutlined,
  SafetyCertificateOutlined, CloudUploadOutlined, KeyOutlined,
} from '@ant-design/icons';
import { useTheme, COLOR_SCHEMES } from '../store/ThemeContext';
import { getConfigByKey, updateConfigByKey, refreshConfigCache } from '../api/config';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  watermarkEnabled: boolean;
  onWatermarkChange: (enabled: boolean) => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose, watermarkEnabled, onWatermarkChange }) => {
  const { isDark, toggleTheme, colorScheme, setColorSchemeKey } = useTheme();

  // 系统参数
  const [captchaEnabled, setCaptchaEnabled] = useState(true);
  const [initPassword, setInitPassword] = useState('123456');
  const [maxUploadSize, setMaxUploadSize] = useState(50);
  const [configLoading, setConfigLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 加载系统参数
  const loadConfigs = useCallback(async () => {
    setConfigLoading(true);
    try {
      const [captchaRes, pwdRes, sizeRes]: any[] = await Promise.all([
        getConfigByKey('sys.account.captchaEnabled'),
        getConfigByKey('sys.account.initPassword'),
        getConfigByKey('sys.upload.maxSize'),
      ]);
      setCaptchaEnabled(captchaRes.data === 'true');
      if (pwdRes.data) setInitPassword(pwdRes.data);
      if (sizeRes.data) setMaxUploadSize(Number(sizeRes.data));
    } catch {
      // handled
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadConfigs();
  }, [open, loadConfigs]);

  const handleConfigUpdate = async (key: string, value: string, label: string) => {
    try {
      await updateConfigByKey(key, value);
      message.success(`${label}已更新`);
    } catch {
      // handled
    }
  };

  const handleCaptchaChange = async (checked: boolean) => {
    setCaptchaEnabled(checked);
    await handleConfigUpdate('sys.account.captchaEnabled', String(checked), '验证码开关');
  };

  const handlePasswordBlur = async () => {
    if (initPassword) {
      await handleConfigUpdate('sys.account.initPassword', initPassword, '初始密码');
    }
  };

  const handleUploadSizeBlur = async () => {
    if (maxUploadSize > 0) {
      await handleConfigUpdate('sys.upload.maxSize', String(maxUploadSize), '上传大小限制');
    }
  };

  const handleRefreshCache = async () => {
    setRefreshing(true);
    try {
      await refreshConfigCache();
      message.success('缓存刷新成功');
    } catch {
      // handled
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Drawer
      title="系统设置"
      placement="right"
      width={320}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: '16px 20px' } }}
    >
      {/* 主题设置 */}
      <div className="settings-section-title">
        <BgColorsOutlined style={{ marginRight: 6 }} />
        主题设置
      </div>

      <div className="settings-item">
        <span>暗黑模式</span>
        <Switch
          checked={isDark}
          onChange={toggleTheme}
          size="small"
        />
      </div>

      <div className="settings-item">
        <span>水印</span>
        <Switch
          checked={watermarkEnabled}
          onChange={onWatermarkChange}
          size="small"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>主题色</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {COLOR_SCHEMES.map((s) => (
            <Tooltip title={s.label} key={s.key}>
              <div
                onClick={() => setColorSchemeKey(s.key)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: s.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: colorScheme.key === s.key ? '2px solid var(--color-text)' : '2px solid transparent',
                  outline: colorScheme.key === s.key ? '2px solid ' + s.primary : 'none',
                  outlineOffset: 2,
                  transition: 'all 0.2s',
                }}
              >
                {colorScheme.key === s.key && (
                  <CheckOutlined style={{ color: '#fff', fontSize: 14 }} />
                )}
              </div>
            </Tooltip>
          ))}
        </div>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* 系统参数 */}
      <div className="settings-section-title">
        <SafetyCertificateOutlined style={{ marginRight: 6 }} />
        系统参数
      </div>

      <div className="settings-item">
        <span>登录验证码</span>
        <Switch
          checked={captchaEnabled}
          onChange={handleCaptchaChange}
          size="small"
          loading={configLoading}
        />
      </div>

      <div className="settings-item-vertical">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <KeyOutlined style={{ fontSize: 13, color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: 13 }}>用户初始密码</span>
        </div>
        <Input.Password
          value={initPassword}
          onChange={(e) => setInitPassword(e.target.value)}
          onBlur={handlePasswordBlur}
          size="small"
          style={{ width: '100%' }}
        />
      </div>

      <div className="settings-item-vertical">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <CloudUploadOutlined style={{ fontSize: 13, color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: 13 }}>文件上传大小限制 (MB)</span>
        </div>
        <InputNumber
          value={maxUploadSize}
          onChange={(v) => setMaxUploadSize(v || 50)}
          onBlur={handleUploadSizeBlur}
          min={1}
          max={500}
          size="small"
          style={{ width: '100%' }}
          addonAfter="MB"
        />
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* 缓存管理 */}
      <div className="settings-section-title">
        <SyncOutlined style={{ marginRight: 6 }} />
        缓存管理
      </div>

      <Space direction="vertical" style={{ width: '100%' }}>
        <Button
          block
          icon={<SyncOutlined spin={refreshing} />}
          onClick={handleRefreshCache}
          loading={refreshing}
        >
          刷新系统缓存
        </Button>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary, #999)' }}>
          清除并重新加载所有系统参数缓存
        </div>
      </Space>
    </Drawer>
  );
};

export default SettingsDrawer;
