import React, { useState, useEffect } from 'react';
import { Space, Table, Button, Input, Form, Modal, Select, InputNumber, TreeSelect, Tag, message, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getDeptList, createDept, updateDept, deleteDept } from '../../../api/dept';
import { useAuth } from '../../../store/AuthContext';

interface DeptData {
  id: number;
  parentId: number;
  name: string;
  sort: number;
  leader: string;
  phone: string;
  status: number;
  createTime: string;
  children?: DeptData[];
}

/** Build tree from flat dept list */
function buildTree(list: DeptData[]): DeptData[] {
  const map = new Map<number, DeptData>();
  const roots: DeptData[] = [];
  list.forEach((item) => map.set(item.id, { ...item, children: [] }));
  map.forEach((item) => {
    const parent = map.get(item.parentId);
    if (parent) {
      parent.children!.push(item);
    } else {
      roots.push(item);
    }
  });
  // remove empty children arrays
  const clean = (nodes: DeptData[]) => {
    nodes.forEach((n) => {
      if (n.children && n.children.length === 0) {
        n.children = undefined;
      } else if (n.children) {
        clean(n.children);
      }
    });
  };
  clean(roots);
  return roots;
}

/** Flatten tree for TreeSelect */
function buildTreeSelectData(list: DeptData[]): { title: string; value: number; children?: any[] }[] {
  return [
    { title: '顶级部门', value: 0 },
    ...list.map((d) => ({
      title: d.name,
      value: d.id,
      children: d.children ? buildTreeSelectData(d.children) : undefined,
    })),
  ];
}

const DeptPage: React.FC = () => {
  const [data, setData] = useState<DeptData[]>([]);
  const [flatData, setFlatData] = useState<DeptData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const { hasPermission } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await getDeptList(searchForm.getFieldsValue());
      const list = res.data || [];
      setFlatData(list);
      setData(buildTree(list));
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: ColumnsType<DeptData> = [
    { title: '部门名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80, align: 'center' },
    { title: '负责人', dataIndex: 'leader', key: 'leader', width: 120, render: (t: string) => t || '-' },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 140, render: (t: string) => t || '-' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: number) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '正常' : '禁用'}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, record) => (
        <Space size="small">
          {hasPermission('system:dept:add') && (
            <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => handleAddChild(record.id)}>
              新增
            </Button>
          )}
          {hasPermission('system:dept:edit') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              修改
            </Button>
          )}
          {hasPermission('system:dept:delete') && (
            <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleAddChild = (parentId: number) => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ parentId, status: 1, sort: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (record: DeptData) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDept(id);
      message.success('删除成功');
      loadData();
    } catch {
      // handled by interceptor
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ parentId: 0, status: 1, sort: 0 });
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      try {
        if (editingId) {
          await updateDept({ id: editingId, ...values });
          message.success('修改成功');
        } else {
          await createDept(values);
          message.success('新增成功');
        }
        setIsModalOpen(false);
        loadData();
      } finally {
        setSubmitLoading(false);
      }
    } catch {
      // validation or api error
    }
  };

  const handleSearch = () => loadData();
  const handleReset = () => { searchForm.resetFields(); loadData(); };

  const treeData = buildTreeSelectData(buildTree(flatData));

  return (
    <div style={{ animation: 'fadeSlideUp 0.45s ease-out' }}>
      <div className="page-search">
        <Form form={searchForm} layout="inline">
          <Form.Item label="部门名称" name="name">
            <Input placeholder="请输入部门名称" allowClear style={{ width: 180 }} />
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
        <span className="page-toolbar-title">部门列表</span>
        {hasPermission('system:dept:add') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增部门</Button>
        )}
      </div>

      <div className="page-table-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
          defaultExpandAllRows
        />
      </div>

      <Modal
        title={editingId ? '修改部门' : '新增部门'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitLoading}
        width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="parentId" label="上级部门" rules={[{ required: true, message: '请选择上级部门' }]}>
            <TreeSelect
              treeData={treeData}
              placeholder="请选择上级部门"
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item name="name" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }]}>
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item name="leader" label="负责人">
            <Input placeholder="请输入负责人" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Select.Option value={1}>正常</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DeptPage;
