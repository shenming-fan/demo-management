import React, { useState, useEffect } from 'react';
import { Card, Progress, Table, Spin, Button, Tag, Space, message, Popconfirm, Modal, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, DeleteOutlined, EyeOutlined, ClearOutlined } from '@ant-design/icons';
import { getCacheInfo, getCacheKeys, getCacheValue, deleteCacheKey, clearCacheByPrefix } from '../../../api/cache';
import { useAuth } from '../../../store/AuthContext';

const parsePercent = (str: string): number => {
  return parseFloat(str) || 0;
};

const percentColor = (val: number): string => {
  if (val > 90) return '#C75450';
  if (val > 70) return '#D4A853';
  return '#5B8C5A';
};

const formatTTL = (ttl: number): string => {
  if (ttl === -1) return '永不过期';
  if (ttl === -2) return '已过期';
  if (ttl < 60) return ttl + '秒';
  if (ttl < 3600) return Math.floor(ttl / 60) + '分' + (ttl % 60) + '秒';
  const hours = Math.floor(ttl / 3600);
  const minutes = Math.floor((ttl % 3600) / 60);
  return hours + '小时' + minutes + '分';
};

interface CacheKeyItem {
  key: string;
  ttl: number;
}

const CACHE_PREFIXES = [
  { label: '全部', value: '' },
  { label: '登录Token', value: 'login_tokens:' },
  { label: '验证码', value: 'captcha:' },
  { label: '参数配置', value: 'sys_config:' },
];

const CachePage: React.FC = () => {
  const [info, setInfo] = useState<Record<string, any> | null>(null);
  const [keys, setKeys] = useState<CacheKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keysLoading, setKeysLoading] = useState(false);
  const [activePrefix, setActivePrefix] = useState('');
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [currentKey, setCurrentKey] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const { hasPermission } = useAuth();

  const loadInfo = async () => {
    setLoading(true);
    try {
      const res: any = await getCacheInfo();
      setInfo(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const loadKeys = async (prefix?: string) => {
    setKeysLoading(true);
    try {
      const res: any = await getCacheKeys(prefix);
      setKeys(res.data || []);
    } catch {
      // handled by interceptor
    } finally {
      setKeysLoading(false);
    }
  };

  useEffect(() => {
    loadInfo();
    loadKeys();
  }, []);

  const handlePrefixChange = (prefix: string) => {
    setActivePrefix(prefix);
    loadKeys(prefix);
  };

  const handleViewValue = async (key: string) => {
    try {
      const res: any = await getCacheValue(key);
      setCurrentKey(key);
      setCurrentValue(typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : String(res.data ?? ''));
      setValueModalOpen(true);
    } catch {
      // handled by interceptor
    }
  };

  const handleDeleteKey = async (key: string) => {
    try {
      await deleteCacheKey(key);
      message.success('删除成功');
      loadKeys(activePrefix);
      loadInfo();
    } catch {
      // handled by interceptor
    }
  };

  const handleClearPrefix = async (prefix: string) => {
    if (!prefix) return;
    try {
      await clearCacheByPrefix(prefix);
      message.success('清除成功');
      loadKeys(activePrefix);
      loadInfo();
    } catch {
      // handled by interceptor
    }
  };

  const handleRefresh = () => {
    loadInfo();
    loadKeys(activePrefix);
  };

  if (loading || !info) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
        <Spin size="large" />
      </div>
    );
  }

  const memUsage = parsePercent(info.memoryUsageRate || '0');

  const keyColumns: ColumnsType<CacheKeyItem> = [
    { title: 'Key', dataIndex: 'key', key: 'key', ellipsis: true },
    {
      title: '过期时间', dataIndex: 'ttl', key: 'ttl', width: 140,
      render: (ttl: number) => {
        const color = ttl === -1 ? 'blue' : ttl < 300 && ttl > 0 ? 'orange' : 'green';
        return <Tag color={color}>{formatTTL(ttl)}</Tag>;
      },
    },
    {
      title: '操作', key: 'action', width: 150,
      render: (_, record) => (
        <Space>
          {hasPermission('system:cache:list') && (
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewValue(record.key)}>
              查看
            </Button>
          )}
          {hasPermission('system:cache:delete') && (
            <Popconfirm title="确定删除此缓存？" onConfirm={() => handleDeleteKey(record.key)}>
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ animation: 'fadeSlideUp 0.45s ease-out' }}>
      <div className="page-toolbar" style={{ marginBottom: 16 }}>
        <span className="page-toolbar-title">缓存监控</span>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
      </div>

      {/* Redis 基本信息 */}
      <div className="server-overview">
        <Card className="server-card" title="内存使用" size="small">
          <div className="server-progress-wrap">
            <Progress
              type="dashboard"
              percent={memUsage}
              strokeColor={percentColor(memUsage)}
              size={120}
            />
          </div>
          <div className="server-desc">
            <span>已用 {info.usedMemory || 'N/A'}</span>
            <span>最大 {info.maxMemory || '无限制'}</span>
          </div>
        </Card>

        <Card className="server-card" title="基本信息" size="small">
          <div className="server-info-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="server-info-item"><label>Redis 版本</label><span>{info.version}</span></div>
            <div className="server-info-item"><label>运行模式</label><span>{info.mode}</span></div>
            <div className="server-info-item"><label>运行时长</label><span>{info.uptime}</span></div>
            <div className="server-info-item"><label>连接数</label><span>{info.connectedClients}</span></div>
          </div>
        </Card>

        <Card className="server-card" title="统计信息" size="small">
          <div className="server-info-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="server-info-item"><label>Key 数量</label><span>{info.dbSize}</span></div>
            <div className="server-info-item"><label>命令处理总数</label><span>{info.totalCommandsProcessed}</span></div>
            <div className="server-info-item"><label>每秒操作数</label><span>{info.instantaneousOpsPerSec}</span></div>
            <div className="server-info-item"><label>端口</label><span>{info.tcpPort}</span></div>
          </div>
        </Card>
      </div>

      {/* 缓存Key列表 */}
      <Card
        title="缓存列表"
        size="small"
        extra={
          <Space>
            {CACHE_PREFIXES.map(p => (
              <Button
                key={p.value}
                type={activePrefix === p.value ? 'primary' : 'default'}
                size="small"
                onClick={() => handlePrefixChange(p.value)}
              >
                {p.label}
              </Button>
            ))}
            {activePrefix && hasPermission('system:cache:delete') && (
              <Popconfirm title={`确定清空 "${activePrefix}*" 的所有缓存？`} onConfirm={() => handleClearPrefix(activePrefix)}>
                <Button danger size="small" icon={<ClearOutlined />}>清空当前</Button>
              </Popconfirm>
            )}
          </Space>
        }
      >
        <Table
          columns={keyColumns}
          dataSource={keys}
          rowKey="key"
          loading={keysLoading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      <Modal
        title={`缓存值 - ${currentKey}`}
        open={valueModalOpen}
        onCancel={() => setValueModalOpen(false)}
        footer={null}
        width={640}
      >
        <Input.TextArea
          value={currentValue}
          readOnly
          rows={12}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Modal>
    </div>
  );
};

export default CachePage;
