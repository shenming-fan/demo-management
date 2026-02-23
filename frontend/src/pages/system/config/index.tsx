import React, { useState, useEffect } from 'react';
import { Space, Table, Button, Input, Form, Select, Tag, message, Popconfirm, Modal } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import { getConfigPage, createConfig, updateConfig, deleteConfig, batchDeleteConfigs, refreshConfigCache } from '../../../api/config';
import { useAuth } from '../../../store/AuthContext';

interface ConfigData {
  id: number;
  configName: string;
  configKey: string;
  configValue: string;
  configType: number;
  remark: string;
  createTime: string;
}

const ConfigPage: React.FC = () => {
  const [data, setData] = useState<ConfigData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const { hasPermission } = useAuth();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1, pageSize: 10, total: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ConfigData | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadData = async (params?: Record<string, number>) => {
    setLoading(true);
    try {
      const res: any = await getConfigPage({
        current: params?.current || pagination.current as number,
        size: params?.pageSize || pagination.pageSize as number,
        ...searchForm.getFieldsValue(),
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

  const columns: ColumnsType<ConfigData> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '参数名称', dataIndex: 'configName', key: 'configName', ellipsis: true },
    {
      title: '参数键名', dataIndex: 'configKey', key: 'configKey', width: 240,
      render: (val: string) => <code style={{ fontSize: 12, padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: 4 }}>{val}</code>,
    },
    { title: '参数值', dataIndex: 'configValue', key: 'configValue', width: 140, ellipsis: true },
    {
      title: '类型', dataIndex: 'configType', key: 'configType', width: 100,
      render: (val: number) => (
        <Tag color={val === 0 ? 'blue' : 'green'}>{val === 0 ? '系统内置' : '自定义'}</Tag>
      ),
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true, width: 180 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作', key: 'action', width: 150,
      render: (_, record) => (
        <Space>
          {hasPermission('system:config:edit') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {hasPermission('system:config:delete') && (
            <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleEdit = (record: ConfigData) => {
    setEditingRecord(record);
    editForm.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    editForm.resetFields();
    editForm.setFieldsValue({ configType: 1 });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteConfig(id);
      message.success('删除成功');
      loadData();
    } catch {
      // handled by interceptor
    }
  };

  const handleBatchDelete = async () => {
    try {
      await batchDeleteConfigs(selectedRowKeys as number[]);
      message.success(`成功删除 ${selectedRowKeys.length} 个参数`);
      loadData();
    } catch {
      // handled by interceptor
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await editForm.validateFields();
      setSubmitLoading(true);
      try {
        if (editingRecord) {
          await updateConfig({ ...values, id: editingRecord.id });
          message.success('修改成功');
        } else {
          await createConfig(values);
          message.success('新增成功');
        }
        setModalOpen(false);
        loadData();
      } finally {
        setSubmitLoading(false);
      }
    } catch {
      // validation failed or api error
    }
  };

  const handleRefreshCache = async () => {
    try {
      await refreshConfigCache();
      message.success('缓存刷新成功');
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
          <Form.Item label="参数名称" name="configName">
            <Input placeholder="请输入参数名称" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="参数键名" name="configKey">
            <Input placeholder="请输入参数键名" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="类型" name="configType">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Select.Option value={0}>系统内置</Select.Option>
              <Select.Option value={1}>自定义</Select.Option>
            </Select>
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
          <span className="page-toolbar-title">参数配置</span>
          {selectedRowKeys.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              已选 <b>{selectedRowKeys.length}</b> 项
            </span>
          )}
        </Space>
        <Space>
          {hasPermission('system:config:delete') && selectedRowKeys.length > 0 && (
            <Popconfirm title={`确定删除选中的 ${selectedRowKeys.length} 个参数吗？`} onConfirm={handleBatchDelete}>
              <Button danger icon={<DeleteOutlined />}>批量删除</Button>
            </Popconfirm>
          )}
          {hasPermission('system:config:edit') && (
            <Button icon={<SyncOutlined />} onClick={handleRefreshCache}>刷新缓存</Button>
          )}
          {hasPermission('system:config:add') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
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

      <Modal
        title={editingRecord ? '编辑参数' : '新增参数'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={560}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="参数名称" name="configName" rules={[{ required: true, message: '请输入参数名称' }]}>
            <Input placeholder="请输入参数名称" />
          </Form.Item>
          <Form.Item label="参数键名" name="configKey" rules={[{ required: true, message: '请输入参数键名' }]}>
            <Input placeholder="请输入参数键名" />
          </Form.Item>
          <Form.Item label="参数值" name="configValue" rules={[{ required: true, message: '请输入参数值' }]}>
            <Input placeholder="请输入参数值" />
          </Form.Item>
          <Form.Item label="类型" name="configType" rules={[{ required: true, message: '请选择类型' }]}>
            <Select>
              <Select.Option value={0}>系统内置</Select.Option>
              <Select.Option value={1}>自定义</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigPage;
