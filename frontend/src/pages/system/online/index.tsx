import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Form, Space, Tag, message, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, ReloadOutlined, LogoutOutlined } from '@ant-design/icons';
import { getOnlineList, forceLogout } from '../../../api/online';
import { useAuth } from '../../../store/AuthContext';

interface OnlineUser {
  tokenKey: string;
  userId: number;
  username: string;
  nickname: string;
  browser: string;
  os: string;
  ip: string;
  loginTime: number;
  expireTime: number;
}

const OnlinePage: React.FC = () => {
  const [data, setData] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchForm] = Form.useForm();
  const { hasPermission } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await getOnlineList(searchForm.getFieldsValue());
      setData(res.data || []);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleForceLogout = async (tokenKey: string) => {
    try {
      await forceLogout(tokenKey);
      message.success('已强制下线');
      loadData();
    } catch {
      // handled by interceptor
    }
  };

  const formatExpireTime = (seconds: number): string => {
    if (seconds < 0) return '已过期';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}小时${m}分钟`;
    return `${m}分钟`;
  };

  const columns: ColumnsType<OnlineUser> = [
    { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 80 },
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 120 },
    { title: '浏览器', dataIndex: 'browser', key: 'browser', width: 100 },
    { title: '操作系统', dataIndex: 'os', key: 'os', width: 100 },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130 },
    {
      title: '登录时间', key: 'loginTime', width: 170,
      render: (_, record) => record.loginTime ? new Date(record.loginTime).toLocaleString('zh-CN') : '-',
    },
    {
      title: '剩余有效期',
      dataIndex: 'expireTime',
      key: 'expireTime',
      width: 140,
      render: (seconds: number) => (
        <Tag color={seconds > 3600 ? 'green' : seconds > 600 ? 'orange' : 'red'}>
          {formatExpireTime(seconds)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) =>
        hasPermission('system:online:forceLogout') ? (
          <Popconfirm title={`确定强制下线用户 ${record.username} 吗？`} onConfirm={() => handleForceLogout(record.tokenKey)}>
            <Button type="link" danger size="small" icon={<LogoutOutlined />}>强制下线</Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <div style={{ animation: 'fadeSlideUp 0.45s ease-out' }}>
      <div className="page-search">
        <Form form={searchForm} layout="inline">
          <Form.Item label="用户名" name="username">
            <Input placeholder="请输入用户名" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>搜索</Button>
              <Button icon={<ReloadOutlined />} onClick={() => { searchForm.resetFields(); loadData(); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="page-toolbar">
        <span className="page-toolbar-title">在线用户</span>
        <Tag color="blue">{data.length} 人在线</Tag>
      </div>

      <div className="page-table-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="tokenKey"
          loading={loading}
          pagination={false}
        />
      </div>
    </div>
  );
};

export default OnlinePage;
