import React, { useState, useEffect } from 'react';
import { Space, Table, Button, Input, Form, Select, Tag, message, Popconfirm, Modal, Tabs } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, PauseCircleOutlined, PlayCircleOutlined,
  ThunderboltOutlined, ClearOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import {
  getJobPage, addJob, updateJob, deleteJob,
  pauseJob, resumeJob, runJob, batchDeleteJobs,
  getJobLogPage, deleteJobLog, cleanJobLog, batchDeleteJobLogs,
} from '../../../api/job';
import { useAuth } from '../../../store/AuthContext';

interface JobData {
  id: number;
  jobName: string;
  jobGroup: string;
  cronExpression: string;
  beanName: string;
  methodName: string;
  params: string;
  status: number;
  remark: string;
  createTime: string;
}

interface JobLogData {
  id: number;
  jobId: number;
  jobName: string;
  beanName: string;
  methodName: string;
  params: string;
  status: number;
  message: string;
  duration: number;
  createTime: string;
}

const JobPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('job');
  const [data, setData] = useState<JobData[]>([]);
  const [logData, setLogData] = useState<JobLogData[]>([]);
  const [loading, setLoading] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [searchForm] = Form.useForm();
  const [logSearchForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const { hasPermission } = useAuth();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1, pageSize: 10, total: 0,
  });
  const [logPagination, setLogPagination] = useState<TablePaginationConfig>({
    current: 1, pageSize: 10, total: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<JobData | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedLogKeys, setSelectedLogKeys] = useState<React.Key[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadData = async (params?: Record<string, number>) => {
    setLoading(true);
    try {
      const res: any = await getJobPage({
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
      // handled
    } finally {
      setLoading(false);
    }
  };

  const loadLogData = async (params?: Record<string, number>) => {
    setLogLoading(true);
    try {
      const res: any = await getJobLogPage({
        current: params?.current || logPagination.current as number,
        size: params?.pageSize || logPagination.pageSize as number,
        ...logSearchForm.getFieldsValue(),
      });
      setLogData(res.data.records);
      setLogPagination({
        ...logPagination,
        current: res.data.current,
        pageSize: res.data.size,
        total: res.data.total,
      });
      setSelectedLogKeys([]);
    } catch {
      // handled
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'log') {
      loadLogData();
    }
  };

  // ---- Job columns ----
  const jobColumns: ColumnsType<JobData> = [
    { title: '任务名称', dataIndex: 'jobName', key: 'jobName', width: 140, ellipsis: true },
    { title: '任务组', dataIndex: 'jobGroup', key: 'jobGroup', width: 100 },
    { title: 'Cron表达式', dataIndex: 'cronExpression', key: 'cronExpression', width: 140 },
    {
      title: '调用目标', key: 'target', width: 200, ellipsis: true,
      render: (_, r) => `${r.beanName}.${r.methodName}(${r.params || ''})`,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: number) => (
        <Tag color={s === 1 ? 'green' : 'default'}>{s === 1 ? '运行' : '暂停'}</Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作', key: 'action', width: 260, fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          {hasPermission('system:job:edit') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {hasPermission('system:job:edit') && record.status === 1 && (
            <Button type="link" size="small" icon={<PauseCircleOutlined />} onClick={() => handlePause(record.id)}>
              暂停
            </Button>
          )}
          {hasPermission('system:job:edit') && record.status === 0 && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleResume(record.id)}>
              恢复
            </Button>
          )}
          {hasPermission('system:job:edit') && (
            <Popconfirm title="确定立即执行一次吗？" onConfirm={() => handleRun(record.id)}>
              <Button type="link" size="small" icon={<ThunderboltOutlined />}>执行</Button>
            </Popconfirm>
          )}
          {hasPermission('system:job:delete') && (
            <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // ---- Log columns ----
  const logColumns: ColumnsType<JobLogData> = [
    { title: '任务名称', dataIndex: 'jobName', key: 'jobName', width: 140 },
    {
      title: '调用目标', key: 'target', width: 200, ellipsis: true,
      render: (_, r) => `${r.beanName}.${r.methodName}(${r.params || ''})`,
    },
    {
      title: '执行状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: number) => (
        <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '成功' : '失败'}</Tag>
      ),
    },
    { title: '执行信息', dataIndex: 'message', key: 'message', ellipsis: true },
    {
      title: '耗时(ms)', dataIndex: 'duration', key: 'duration', width: 100,
      render: (v: number) => <Tag>{v}</Tag>,
    },
    { title: '执行时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作', key: 'action', width: 80,
      render: (_, record) => (
        hasPermission('system:job:delete') ? (
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDeleteLog(record.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        ) : null
      ),
    },
  ];

  const handleEdit = (record: JobData) => {
    setEditingRecord(record);
    editForm.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    editForm.resetFields();
    editForm.setFieldsValue({ jobGroup: 'DEFAULT', status: 0 });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteJob(id);
      message.success('删除成功');
      loadData();
    } catch { /* handled */ }
  };

  const handleBatchDeleteJobs = async () => {
    try {
      await batchDeleteJobs(selectedRowKeys as number[]);
      message.success(`成功删除 ${selectedRowKeys.length} 个任务`);
      loadData();
    } catch { /* handled */ }
  };

  const handleBatchDeleteLogs = async () => {
    try {
      await batchDeleteJobLogs(selectedLogKeys as number[]);
      message.success(`成功删除 ${selectedLogKeys.length} 条日志`);
      loadLogData();
    } catch { /* handled */ }
  };

  const handlePause = async (id: number) => {
    try {
      await pauseJob(id);
      message.success('已暂停');
      loadData();
    } catch { /* handled */ }
  };

  const handleResume = async (id: number) => {
    try {
      await resumeJob(id);
      message.success('已恢复');
      loadData();
    } catch { /* handled */ }
  };

  const handleRun = async (id: number) => {
    try {
      await runJob(id);
      message.success('已触发执行');
    } catch { /* handled */ }
  };

  const handleModalOk = async () => {
    try {
      const values = await editForm.validateFields();
      setSubmitLoading(true);
      try {
        if (editingRecord) {
          await updateJob({ ...values, id: editingRecord.id });
          message.success('修改成功');
        } else {
          await addJob(values);
          message.success('新增成功');
        }
        setModalOpen(false);
        loadData();
      } finally {
        setSubmitLoading(false);
      }
    } catch { /* validation */ }
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

  const handleLogSearch = () => {
    setLogPagination({ ...logPagination, current: 1 });
    loadLogData({ current: 1 });
  };

  const handleLogReset = () => {
    logSearchForm.resetFields();
    setLogPagination({ ...logPagination, current: 1 });
    loadLogData({ current: 1 });
  };

  const handleDeleteLog = async (id: number) => {
    try {
      await deleteJobLog(id);
      message.success('删除成功');
      loadLogData();
    } catch { /* handled */ }
  };

  const handleCleanLog = async () => {
    try {
      await cleanJobLog();
      message.success('日志已清空');
      loadLogData();
    } catch { /* handled */ }
  };

  const handleTableChange = (pag: TablePaginationConfig) => {
    loadData({ current: pag.current as number, pageSize: pag.pageSize as number });
  };

  const handleLogTableChange = (pag: TablePaginationConfig) => {
    loadLogData({ current: pag.current as number, pageSize: pag.pageSize as number });
  };

  return (
    <div style={{ animation: 'fadeSlideUp 0.45s ease-out' }}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'job',
            label: '任务管理',
            icon: <PlayCircleOutlined />,
            children: (
              <>
                <div className="page-search">
                  <Form form={searchForm} layout="inline">
                    <Form.Item label="任务名称" name="jobName">
                      <Input placeholder="请输入" allowClear style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item label="状态" name="status">
                      <Select placeholder="请选择" style={{ width: 120 }} allowClear>
                        <Select.Option value={1}>运行</Select.Option>
                        <Select.Option value={0}>暂停</Select.Option>
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
                    <span className="page-toolbar-title">定时任务</span>
                    {selectedRowKeys.length > 0 && (
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        已选 <b>{selectedRowKeys.length}</b> 项
                      </span>
                    )}
                  </Space>
                  <Space>
                    {hasPermission('system:job:delete') && selectedRowKeys.length > 0 && (
                      <Popconfirm title={`确定删除选中的 ${selectedRowKeys.length} 个任务吗？`} onConfirm={handleBatchDeleteJobs}>
                        <Button danger icon={<DeleteOutlined />}>批量删除</Button>
                      </Popconfirm>
                    )}
                    {hasPermission('system:job:add') && (
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
                    )}
                  </Space>
                </div>
                <div className="page-table-card">
                  <Table
                    columns={jobColumns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    scroll={{ x: 1100 }}
                    rowSelection={{
                      selectedRowKeys,
                      onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                  />
                </div>
              </>
            ),
          },
          {
            key: 'log',
            label: '执行日志',
            icon: <UnorderedListOutlined />,
            children: (
              <>
                <div className="page-search">
                  <Form form={logSearchForm} layout="inline">
                    <Form.Item label="任务名称" name="jobName">
                      <Input placeholder="请输入" allowClear style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item label="执行状态" name="status">
                      <Select placeholder="请选择" style={{ width: 120 }} allowClear>
                        <Select.Option value={1}>成功</Select.Option>
                        <Select.Option value={0}>失败</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" icon={<SearchOutlined />} onClick={handleLogSearch}>搜索</Button>
                        <Button icon={<ReloadOutlined />} onClick={handleLogReset}>重置</Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </div>
                <div className="page-toolbar">
                  <Space>
                    <span className="page-toolbar-title">执行日志</span>
                    {selectedLogKeys.length > 0 && (
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        已选 <b>{selectedLogKeys.length}</b> 项
                      </span>
                    )}
                  </Space>
                  <Space>
                    {hasPermission('system:job:delete') && selectedLogKeys.length > 0 && (
                      <Popconfirm title={`确定删除选中的 ${selectedLogKeys.length} 条日志吗？`} onConfirm={handleBatchDeleteLogs}>
                        <Button danger icon={<DeleteOutlined />}>批量删除</Button>
                      </Popconfirm>
                    )}
                    {hasPermission('system:job:delete') && (
                      <Popconfirm title="确定清空所有任务日志吗？" onConfirm={handleCleanLog}>
                        <Button danger icon={<ClearOutlined />}>清空日志</Button>
                      </Popconfirm>
                    )}
                  </Space>
                </div>
                <div className="page-table-card">
                  <Table
                    columns={logColumns}
                    dataSource={logData}
                    rowKey="id"
                    loading={logLoading}
                    pagination={logPagination}
                    onChange={handleLogTableChange}
                    rowSelection={{
                      selectedRowKeys: selectedLogKeys,
                      onChange: (keys) => setSelectedLogKeys(keys),
                    }}
                  />
                </div>
              </>
            ),
          },
        ]}
      />

      <Modal
        title={editingRecord ? '编辑任务' : '新增任务'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={640}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="任务名称" name="jobName" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item label="任务组名" name="jobGroup">
            <Input placeholder="DEFAULT" />
          </Form.Item>
          <Form.Item label="Cron表达式" name="cronExpression" rules={[{ required: true, message: '请输入Cron表达式' }]}>
            <Input placeholder="例如: 0 0/5 * * * ?" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="Bean名称" name="beanName" rules={[{ required: true, message: '请输入Bean名称' }]}>
              <Input placeholder="例如: demoTask" />
            </Form.Item>
            <Form.Item label="方法名称" name="methodName" rules={[{ required: true, message: '请输入方法名称' }]}>
              <Input placeholder="例如: noParams" />
            </Form.Item>
          </div>
          <Form.Item label="方法参数" name="params">
            <Input placeholder="可选参数" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true }]}>
            <Select>
              <Select.Option value={0}>暂停</Select.Option>
              <Select.Option value={1}>运行</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default JobPage;
