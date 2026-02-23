import React, { useState, useEffect, useMemo } from 'react';
import { Space, Table, Button, Input, Form, Tag, message, Popconfirm, Select, Tooltip, Modal, DatePicker } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { SearchOutlined, ReloadOutlined, DeleteOutlined, ClearOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, SwapOutlined } from '@ant-design/icons';
import { getLogPage, deleteLog, batchDeleteLogs, cleanLog, exportLogs } from '../../../api/log';
import { useAuth } from '../../../store/AuthContext';

interface LogData {
  id: number;
  username: string;
  operation: string;
  method: string;
  params: string;
  time: number;
  ip: string;
  status: number;
  errorMsg: string;
  responseBody: string;
  oldValue: string;
  newValue: string;
  createTime: string;
}

/** 计算两个JSON对象的变更差异 */
function computeDiff(oldJson: string, newJson: string): { field: string; oldVal: string; newVal: string }[] {
  try {
    const oldObj = JSON.parse(oldJson);
    const newObj = JSON.parse(newJson);
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    const diffs: { field: string; oldVal: string; newVal: string }[] = [];
    // 跳过系统字段
    const skipFields = new Set(['createTime', 'updateTime', 'deleted', 'serialVersionUID']);
    for (const key of allKeys) {
      if (skipFields.has(key)) continue;
      const ov = oldObj[key] ?? '';
      const nv = newObj[key] ?? '';
      if (String(ov) !== String(nv)) {
        diffs.push({ field: key, oldVal: String(ov), newVal: String(nv) });
      }
    }
    return diffs;
  } catch {
    return [];
  }
}

const fieldNameMap: Record<string, string> = {
  id: 'ID', username: '用户名', nickName: '昵称', email: '邮箱', phone: '手机号',
  status: '状态', remark: '备注', sort: '排序', name: '名称', title: '标题',
  type: '类型', content: '内容', path: '路径', component: '组件', permission: '权限标识',
  icon: '图标', visible: '是否可见', isFrame: '是否外链', isCache: '是否缓存',
  postCode: '岗位编码', postName: '岗位名称', configName: '参数名', configKey: '参数键',
  configValue: '参数值', configType: '参数类型', password: '密码',
  jobName: '任务名称', cronExpression: 'Cron表达式', beanName: 'Bean名称',
  methodName: '方法名', parentId: '上级ID', deptId: '部门ID',
};

const LogPage: React.FC = () => {
  const [data, setData] = useState<LogData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchForm] = Form.useForm();
  const { hasPermission } = useAuth();
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<LogData | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1, pageSize: 10, total: 0,
  });

  const loadData = async (params?: any) => {
    setLoading(true);
    try {
      const formValues = { ...searchForm.getFieldsValue() };
      // 处理日期范围
      if (formValues.dateRange && formValues.dateRange.length === 2) {
        formValues.beginTime = formValues.dateRange[0].format('YYYY-MM-DD');
        formValues.endTime = formValues.dateRange[1].format('YYYY-MM-DD');
      }
      delete formValues.dateRange;
      const res: any = await getLogPage({
        current: params?.current || pagination.current,
        size: params?.pageSize || pagination.pageSize,
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
    } catch (error) {
      console.error('加载日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const diffs = useMemo(() => {
    if (!detailRecord?.oldValue || !detailRecord?.newValue) return [];
    return computeDiff(detailRecord.oldValue, detailRecord.newValue);
  }, [detailRecord]);

  const columns: ColumnsType<LogData> = [
    { title: '操作用户', dataIndex: 'username', key: 'username', width: 110 },
    {
      title: '操作描述', dataIndex: 'operation', key: 'operation', width: 140,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '请求方法', dataIndex: 'method', key: 'method', ellipsis: true,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{text}</span>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center',
      render: (status: number, record) => (
        status === 0 ? (
          <Tooltip title={record.errorMsg || '操作失败'}>
            <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>
          </Tooltip>
        ) : (
          <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>
        )
      ),
    },
    {
      title: '变更', key: 'change', width: 60, align: 'center',
      render: (_, record) =>
        record.oldValue ? <Tag color="orange"><SwapOutlined /></Tag> : <span style={{ color: '#ccc' }}>-</span>,
    },
    {
      title: '耗时', dataIndex: 'time', key: 'time', width: 90, align: 'center',
      render: (ms: number) => (
        <Tag color={ms > 1000 ? 'red' : ms > 300 ? 'orange' : 'green'}>{ms}ms</Tag>
      ),
    },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130 },
    { title: '操作时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setDetailRecord(record); setDetailVisible(true); }}>详情</Button>
          {hasPermission('system:log:delete') && (
            <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      await deleteLog(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleBatchDelete = async () => {
    try {
      await batchDeleteLogs(selectedRowKeys as number[]);
      message.success(`成功删除 ${selectedRowKeys.length} 条日志`);
      loadData();
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleClean = async () => {
    try {
      await cleanLog();
      message.success('日志已清空');
      loadData();
    } catch (error) {
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
    loadData({ current: pag.current, pageSize: pag.pageSize });
  };

  return (
    <div style={{ animation: 'fadeSlideUp 0.45s ease-out' }}>
      <div className="page-search">
        <Form form={searchForm} layout="inline">
          <Form.Item label="操作用户" name="username">
            <Input placeholder="请输入用户名" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="操作描述" name="operation">
            <Input placeholder="请输入操作描述" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select placeholder="请选择" style={{ width: 100 }} allowClear>
              <Select.Option value={1}>成功</Select.Option>
              <Select.Option value={0}>失败</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="操作时间" name="dateRange">
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="page-toolbar-title">操作日志</span>
          {selectedRowKeys.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              已选 <b style={{ color: 'var(--color-primary)' }}>{selectedRowKeys.length}</b> 项
            </span>
          )}
        </div>
        <Space>
          {selectedRowKeys.length > 0 && hasPermission('system:log:delete') && (
            <Popconfirm title={`确定批量删除 ${selectedRowKeys.length} 条日志?`} onConfirm={handleBatchDelete}>
              <Button danger size="small" icon={<DeleteOutlined />}>批量删除</Button>
            </Popconfirm>
          )}
          <Button icon={<DownloadOutlined />} onClick={() => exportLogs(searchForm.getFieldsValue())}>
            导出
          </Button>
          {hasPermission('system:log:delete') && (
            <Popconfirm title="确定清空所有日志吗？此操作不可恢复！" onConfirm={handleClean}>
              <Button danger icon={<ClearOutlined />}>清空日志</Button>
            </Popconfirm>
          )}
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

      {/* 详情弹窗 */}
      <Modal
        title="日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={720}
      >
        {detailRecord && (
          <div style={{ padding: '12px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px 16px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>操作用户</span>
              <span>{detailRecord.username}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>操作描述</span>
              <span><Tag color="blue">{detailRecord.operation}</Tag></span>
              <span style={{ color: 'var(--color-text-secondary)' }}>请求方法</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{detailRecord.method}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>请求参数</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all', maxHeight: 200, overflow: 'auto' }}>{detailRecord.params || '-'}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>操作状态</span>
              <span>
                {detailRecord.status === 0
                  ? <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>
                  : <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>
                }
              </span>
              {detailRecord.status === 0 && detailRecord.errorMsg && (
                <>
                  <span style={{ color: 'var(--color-text-secondary)' }}>错误信息</span>
                  <span style={{ color: 'var(--color-danger)', fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{detailRecord.errorMsg}</span>
                </>
              )}
              {detailRecord.responseBody && (
                <>
                  <span style={{ color: 'var(--color-text-secondary)' }}>响应结果</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all', maxHeight: 200, overflow: 'auto' }}>{detailRecord.responseBody}</span>
                </>
              )}
              <span style={{ color: 'var(--color-text-secondary)' }}>耗时</span>
              <span><Tag color={detailRecord.time > 1000 ? 'red' : detailRecord.time > 300 ? 'orange' : 'green'}>{detailRecord.time}ms</Tag></span>
              <span style={{ color: 'var(--color-text-secondary)' }}>IP地址</span>
              <span>{detailRecord.ip}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>操作时间</span>
              <span>{detailRecord.createTime}</span>
            </div>

            {/* 变更对比 */}
            {diffs.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SwapOutlined style={{ color: 'var(--color-primary)' }} />
                  数据变更对比
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', width: 140 }}>字段</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>变更前</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>变更后</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffs.map((d) => (
                      <tr key={d.field}>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', fontWeight: 500 }}>
                          {fieldNameMap[d.field] || d.field}
                        </td>
                        <td style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid var(--border-color)',
                          background: 'rgba(255,77,79,0.06)',
                          color: '#cf1322',
                          fontFamily: 'monospace',
                          fontSize: 12,
                          wordBreak: 'break-all',
                        }}>
                          {d.oldVal || <span style={{ color: '#999' }}>-</span>}
                        </td>
                        <td style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid var(--border-color)',
                          background: 'rgba(82,196,26,0.06)',
                          color: '#389e0d',
                          fontFamily: 'monospace',
                          fontSize: 12,
                          wordBreak: 'break-all',
                        }}>
                          {d.newVal || <span style={{ color: '#999' }}>-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LogPage;
