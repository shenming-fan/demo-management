import React, { useState, useEffect } from 'react';
import { Space, Table, Button, Input, Form, Select, Tag, message, Popconfirm, Modal } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { getNoticePage, addNotice, updateNotice, deleteNotice, batchDeleteNotices } from '../../../api/notice';
import { useAuth } from '../../../store/AuthContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface NoticeData {
  id: number;
  title: string;
  type: number;
  content: string;
  status: number;
  createBy: string;
  createTime: string;
}

const typeMap: Record<number, { text: string; color: string }> = {
  1: { text: '通知', color: 'blue' },
  2: { text: '公告', color: 'green' },
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean'],
  ],
};

const NoticePage: React.FC = () => {
  const [data, setData] = useState<NoticeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const { hasPermission } = useAuth();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1, pageSize: 10, total: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<NoticeData | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editorContent, setEditorContent] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<NoticeData | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadData = async (params?: Record<string, number>) => {
    setLoading(true);
    try {
      const res: any = await getNoticePage({
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

  const columns: ColumnsType<NoticeData> = [
    { title: '公告标题', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '公告类型', dataIndex: 'type', key: 'type', width: 100,
      render: (val: number) => {
        const info = typeMap[val];
        return info ? <Tag color={info.color}>{info.text}</Tag> : val;
      },
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: number) => (
        <Tag color={s === 1 ? 'green' : 'default'}>{s === 1 ? '正常' : '关闭'}</Tag>
      ),
    },
    { title: '创建人', dataIndex: 'createBy', key: 'createBy', width: 100 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>
            查看
          </Button>
          {hasPermission('system:notice:edit') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {hasPermission('system:notice:delete') && (
            <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handlePreview = (record: NoticeData) => {
    setPreviewRecord(record);
    setPreviewOpen(true);
  };

  const handleEdit = (record: NoticeData) => {
    setEditingRecord(record);
    editForm.setFieldsValue({ title: record.title, type: record.type, status: record.status });
    setEditorContent(record.content || '');
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    editForm.resetFields();
    editForm.setFieldsValue({ type: 1, status: 1 });
    setEditorContent('');
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotice(id);
      message.success('删除成功');
      loadData();
    } catch {
      // handled by interceptor
    }
  };

  const handleBatchDelete = async () => {
    try {
      await batchDeleteNotices(selectedRowKeys as number[]);
      message.success(`成功删除 ${selectedRowKeys.length} 条公告`);
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
        const submitData = { ...values, content: editorContent };
        if (editingRecord) {
          await updateNotice({ ...submitData, id: editingRecord.id });
          message.success('修改成功');
        } else {
          await addNotice(submitData);
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
          <Form.Item label="公告标题" name="title">
            <Input placeholder="请输入标题" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="公告类型" name="type">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Select.Option value={1}>通知</Select.Option>
              <Select.Option value={2}>公告</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Select.Option value={1}>正常</Select.Option>
              <Select.Option value={0}>关闭</Select.Option>
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
          <span className="page-toolbar-title">通知公告</span>
          {selectedRowKeys.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              已选 <b>{selectedRowKeys.length}</b> 项
            </span>
          )}
        </Space>
        <Space>
          {hasPermission('system:notice:delete') && selectedRowKeys.length > 0 && (
            <Popconfirm title={`确定删除选中的 ${selectedRowKeys.length} 条公告吗？`} onConfirm={handleBatchDelete}>
              <Button danger icon={<DeleteOutlined />}>批量删除</Button>
            </Popconfirm>
          )}
          {hasPermission('system:notice:add') && (
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

      {/* 编辑/新增弹窗 */}
      <Modal
        title={editingRecord ? '编辑公告' : '新增公告'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={800}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="公告标题" name="title" rules={[{ required: true, message: '请输入公告标题' }]}>
            <Input placeholder="请输入公告标题" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="公告类型" name="type" rules={[{ required: true, message: '请选择公告类型' }]}>
              <Select>
                <Select.Option value={1}>通知</Select.Option>
                <Select.Option value={2}>公告</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
              <Select>
                <Select.Option value={1}>正常</Select.Option>
                <Select.Option value={0}>关闭</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item label="内容">
            <ReactQuill
              theme="snow"
              value={editorContent}
              onChange={setEditorContent}
              modules={quillModules}
              placeholder="请输入公告内容..."
              style={{ height: 250, marginBottom: 42 }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 预览弹窗 */}
      <Modal
        title={previewRecord?.title || '公告详情'}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={700}
      >
        {previewRecord && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={typeMap[previewRecord.type]?.color}>{typeMap[previewRecord.type]?.text}</Tag>
              <Tag color={previewRecord.status === 1 ? 'green' : 'default'}>
                {previewRecord.status === 1 ? '正常' : '关闭'}
              </Tag>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {previewRecord.createBy} | {previewRecord.createTime}
              </span>
            </Space>
            <div
              className="ql-editor"
              style={{
                padding: '16px',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                minHeight: 120,
              }}
              dangerouslySetInnerHTML={{ __html: previewRecord.content || '<p style="color: var(--text-secondary)">暂无内容</p>' }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NoticePage;
