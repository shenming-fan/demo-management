import React, { useState, useEffect } from 'react';
import { Space, Table, Button, Input, Form, Select, Tag, message, Popconfirm, Modal, InputNumber } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, HolderOutlined, DownloadOutlined } from '@ant-design/icons';
import { getPostPage, createPost, updatePost, deletePost, batchDeletePosts, updatePostSort, exportPosts } from '../../../api/post';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent } from '@dnd-kit/core';
import { useAuth } from '../../../store/AuthContext';

interface PostData {
  id: number;
  postCode: string;
  postName: string;
  sort: number;
  status: number;
  remark: string;
  createTime: string;
}

/** 可拖拽的行组件 */
const DraggableRow: React.FC<any> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-row-key'],
  });
  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
    transition,
    cursor: 'move',
    ...(isDragging ? { position: 'relative', zIndex: 999, opacity: 0.8 } : {}),
  };
  return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />;
};

const PostPage: React.FC = () => {
  const [data, setData] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const { hasPermission } = useAuth();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1, pageSize: 10, total: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PostData | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = data.findIndex((item) => item.id === active.id);
    const newIndex = data.findIndex((item) => item.id === over.id);
    const newData = arrayMove(data, oldIndex, newIndex);
    setData(newData);
    const sortList = newData.map((item, index) => ({ id: item.id, sort: index }));
    try {
      await updatePostSort(sortList);
      message.success('排序已更新');
    } catch {
      loadData(); // revert on failure
    }
  };

  const loadData = async (params?: Record<string, number>) => {
    setLoading(true);
    try {
      const res: any = await getPostPage({
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

  const columns: ColumnsType<PostData> = [
    {
      title: '', key: 'drag', width: 40, align: 'center',
      render: () => <HolderOutlined style={{ cursor: 'grab', color: '#999' }} />,
    },
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '岗位编码', dataIndex: 'postCode', key: 'postCode', width: 140 },
    { title: '岗位名称', dataIndex: 'postName', key: 'postName', ellipsis: true },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: number) => (
        <Tag color={s === 1 ? 'green' : 'default'}>{s === 1 ? '正常' : '禁用'}</Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作', key: 'action', width: 150,
      render: (_, record) => (
        <Space>
          {hasPermission('system:post:edit') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {hasPermission('system:post:delete') && (
            <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleEdit = (record: PostData) => {
    setEditingRecord(record);
    editForm.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    editForm.resetFields();
    editForm.setFieldsValue({ sort: 0, status: 1 });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePost(id);
      message.success('删除成功');
      loadData();
    } catch {
      // handled by interceptor
    }
  };

  const handleBatchDelete = async () => {
    try {
      await batchDeletePosts(selectedRowKeys as number[]);
      message.success(`成功删除 ${selectedRowKeys.length} 个岗位`);
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
          await updatePost({ ...values, id: editingRecord.id });
          message.success('修改成功');
        } else {
          await createPost(values);
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
          <Form.Item label="岗位名称" name="postName">
            <Input placeholder="请输入岗位名称" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="岗位编码" name="postCode">
            <Input placeholder="请输入岗位编码" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Select.Option value={1}>正常</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
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
          <span className="page-toolbar-title">岗位管理</span>
          {selectedRowKeys.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              已选 <b>{selectedRowKeys.length}</b> 项
            </span>
          )}
        </Space>
        <Space>
          {hasPermission('system:post:delete') && selectedRowKeys.length > 0 && (
            <Popconfirm title={`确定删除选中的 ${selectedRowKeys.length} 个岗位吗？`} onConfirm={handleBatchDelete}>
              <Button danger icon={<DeleteOutlined />}>批量删除</Button>
            </Popconfirm>
          )}
          {hasPermission('system:post:add') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
          )}
          <Button icon={<DownloadOutlined />} onClick={() => exportPosts(searchForm.getFieldsValue())}>导出</Button>
        </Space>
      </div>

      <div className="page-table-card">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={data.map((d) => d.id)} strategy={verticalListSortingStrategy}>
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
              components={{ body: { row: DraggableRow } }}
            />
          </SortableContext>
        </DndContext>
      </div>

      <Modal
        title={editingRecord ? '编辑岗位' : '新增岗位'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        width={520}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="岗位名称" name="postName" rules={[{ required: true, message: '请输入岗位名称' }]}>
            <Input placeholder="请输入岗位名称" />
          </Form.Item>
          <Form.Item label="岗位编码" name="postCode" rules={[{ required: true, message: '请输入岗位编码' }]}>
            <Input placeholder="请输入岗位编码" />
          </Form.Item>
          <Form.Item label="排序" name="sort" rules={[{ required: true, message: '请输入排序' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select>
              <Select.Option value={1}>正常</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
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

export default PostPage;
