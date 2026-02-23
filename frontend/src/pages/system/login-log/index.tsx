import React, { useState, useEffect } from 'react';
import { Space, Table, Button, Input, Form, Select, Tag, message, Popconfirm, DatePicker } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { SearchOutlined, ReloadOutlined, DeleteOutlined, ClearOutlined, DownloadOutlined } from '@ant-design/icons';
import { getLoginLogPage, deleteLoginLog, batchDeleteLoginLogs, cleanLoginLog, exportLoginLogs } from '../../../api/loginLog';
import { useAuth } from '../../../store/AuthContext';

interface LoginLogData {
  id: number;
  username: string;
  status: number;
  ip: string;
  message: string;
  userAgent: string;
  createTime: string;
}

const LoginLogPage: React.FC = () => {
  const [data, setData] = useState<LoginLogData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchForm] = Form.useForm();
  const { hasPermission } = useAuth();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1, pageSize: 10, total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const loadData = async (params?: Record<string, number>) => {
    setLoading(true);
    try {
      const formValues = { ...searchForm.getFieldsValue() };
      // 处理日期范围
      if (formValues.dateRange && formValues.dateRange.length === 2) {
        formValues.beginTime = formValues.dateRange[0].format('YYYY-MM-DD');
        formValues.endTime = formValues.dateRange[1].format('YYYY-MM-DD');
      }
      delete formValues.dateRange;
      const res: any = await getLoginLogPage({
        current: params?.current || pagination.current as number,
        size: params?.pageSize || pagination.pageSize as number,
        ...formValues,
      });
      setData(res.data.records);
      setPagination({
        ...pagination,
        current: res.data.current,
        pageSize: res.data.size,
        total: res.data.total,
      });
      setSelectedRowKeys([]);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: ColumnsType<LoginLogData> = [
    { title: '登录用户', dataIndex: 'username', key: 'username', width: 120 },
    {
      title: '登录状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: number) => (
        <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '成功' : '失败'}</Tag>
      ),
    },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 140 },
    { title: '提示消息', dataIndex: 'message', key: 'message', ellipsis: true },
    {
      title: '浏览器', dataIndex: 'userAgent', key: 'userAgent', width: 200, ellipsis: true,
      render: (ua: string) => {
        if (!ua) return '-';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return ua.substring(0, 30) + '...';
      },
    },
    { title: '登录时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作', key: 'action', width: 80,
      render: (_, record) => (
        hasPermission('system:loginLog:delete') ? (
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        ) : null
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      await deleteLoginLog(id);
      message.success('删除成功');
      loadData();
    } catch {
      // handled by interceptor
    }
  };

  const handleBatchDelete = async () => {
    try {
      await batchDeleteLoginLogs(selectedRowKeys as number[]);
      message.success(`成功删除 ${selectedRowKeys.length} 条日志`);
      loadData();
    } catch {
      // handled by interceptor
    }
  };

  const handleClean = async () => {
    try {
      await cleanLoginLog();
      message.success('日志已清空');
      loadData();
    } catch {
      // handled by interceptor
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    loadData({ current: 1 });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPagination({ ...pagination, current: 1 });
    loadData({ current: 1 });
  };

  const handleTableChange = (pag: TablePaginationConfig) => {
    loadData({ current: pag.current as number, pageSize: pag.pageSize as number });
  };

  return (
    <div style={{ animation: 'fadeSlideUp 0.45s ease-out' }}>
      <div className="page-search">
        <Form form={searchForm} layout="inline">
          <Form.Item label="登录用户" name="username">
            <Input placeholder="请输入用户名" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="登录状态" name="status">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Select.Option value={1}>成功</Select.Option>
              <Select.Option value={0}>失败</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="登录时间" name="dateRange">
            <DatePicker.RangePicker style={{ width: 240 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="page-toolbar">
        <Space>
          <span className="page-toolbar-title">登录日志</span>
          {selectedRowKeys.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              已选 <b>{selectedRowKeys.length}</b> 项
            </span>
          )}
        </Space>
        <Space>
          {hasPermission('system:loginLog:delete') && selectedRowKeys.length > 0 && (
            <Popconfirm title={`确定删除选中的 ${selectedRowKeys.length} 条日志吗？`} onConfirm={handleBatchDelete}>
              <Button danger icon={<DeleteOutlined />}>批量删除</Button>
            </Popconfirm>
          )}
          {hasPermission('system:loginLog:delete') && (
            <Popconfirm title="确定清空所有登录日志吗？此操作不可恢复！" onConfirm={handleClean}>
              <Button danger icon={<ClearOutlined />}>清空日志</Button>
            </Popconfirm>
          )}
          <Button icon={<DownloadOutlined />} onClick={() => {
            const vals = searchForm.getFieldsValue();
            const params: Record<string, unknown> = { username: vals.username, status: vals.status };
            if (vals.dateRange && vals.dateRange.length === 2) {
              params.beginTime = vals.dateRange[0].format('YYYY-MM-DD');
              params.endTime = vals.dateRange[1].format('YYYY-MM-DD');
            }
            exportLoginLogs(params);
          }}>导出</Button>
        </Space>
      </div>

      <div className="page-table-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
        />
      </div>
    </div>
  );
};

export default LoginLogPage;
