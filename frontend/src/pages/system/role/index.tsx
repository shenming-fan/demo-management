import React, { useState, useEffect } from 'react';
import { Space, Table, Button, Input, Form, Modal, Select, message, Popconfirm, Switch, Tree, InputNumber, Tabs } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { getRolePage, createRole, updateRole, deleteRole, batchDeleteRoles, getRoleMenus, exportRoles } from '../../../api/role';
import { getMenuTree } from '../../../api/menu';
import { useAuth } from '../../../store/AuthContext';

interface DataType {
  id: number;
  name: string;
  code: string;
  sort: number;
  status: number;
  remark: string;
  createTime: string;
}

interface MenuNode {
  id: number;
  name: string;
  parentId: number;
  children?: MenuNode[];
}

const Role: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [menuTree, setMenuTree] = useState<MenuNode[]>([]);
  const [checkedMenuKeys, setCheckedMenuKeys] = useState<number[]>([]);
  const [halfCheckedKeys, setHalfCheckedKeys] = useState<number[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const { hasPermission } = useAuth();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const loadData = async (params?: any) => {
    setLoading(true);
    try {
      const res: any = await getRolePage({
        current: params?.current || pagination.current,
        size: params?.pageSize || pagination.pageSize,
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
    } catch (error) {
      console.error('加载角色列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuTree = async () => {
    try {
      const res: any = await getMenuTree();
      setMenuTree(res.data || []);
    } catch (error) {
      console.error('加载菜单树失败:', error);
    }
  };

  useEffect(() => {
    loadData();
    loadMenuTree();
  }, []);

  const columns: ColumnsType<DataType> = [
    {
      title: '角色ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
    },
    {
      title: '状态',
      key: 'status',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => (
        <Switch
          checked={record.status === 1}
          onChange={(checked) => handleStatusChange(record, checked ? 1 : 0)}
          disabled={!hasPermission('system:role:edit')}
          checkedChildren="正常"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          {hasPermission('system:role:edit') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              修改
            </Button>
          )}
          {hasPermission('system:role:delete') && (
            <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleStatusChange = async (record: DataType, status: number) => {
    try {
      await updateRole({ id: record.id, status });
      message.success('状态修改成功');
      loadData();
    } catch (error) {
      console.error('修改状态失败:', error);
    }
  };

  const handleEdit = async (record: DataType) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    // 加载角色已分配的菜单
    try {
      const res: any = await getRoleMenus(record.id);
      const menuIds: number[] = res.data || [];
      // 需要过滤掉父节点，只保留叶子节点作为 checked，否则 Tree 会自动全选子节点
      const leafKeys = getLeafKeys(menuTree, menuIds);
      setCheckedMenuKeys(leafKeys);
      setHalfCheckedKeys([]);
    } catch (error) {
      setCheckedMenuKeys([]);
      setHalfCheckedKeys([]);
    }
    setIsModalOpen(true);
  };

  /**
   * 从菜单树中提取叶子节点ID（Tree 组件的 checked 只应设置叶子节点）
   */
  const getLeafKeys = (tree: MenuNode[], selectedIds: number[]): number[] => {
    const leafKeys: number[] = [];
    const traverse = (nodes: MenuNode[]) => {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        } else {
          if (selectedIds.includes(node.id)) {
            leafKeys.push(node.id);
          }
        }
      }
    };
    traverse(tree);
    return leafKeys;
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleBatchDelete = async () => {
    try {
      await batchDeleteRoles(selectedRowKeys as number[]);
      message.success(`成功删除 ${selectedRowKeys.length} 个角色`);
      loadData();
    } catch (error) {
      console.error('批量删除失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setCheckedMenuKeys([]);
    setHalfCheckedKeys([]);
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      // 合并 checked 和 halfChecked 作为完整的菜单ID列表
      const allMenuIds = [...checkedMenuKeys, ...halfCheckedKeys];
      if (editingId) {
        await updateRole({ id: editingId, ...values }, allMenuIds);
        message.success('修改成功');
      } else {
        await createRole(values, allMenuIds);
        message.success('新增成功');
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSubmitLoading(false);
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

  const onMenuCheck = (checked: any, info: any) => {
    setCheckedMenuKeys(checked as number[]);
    setHalfCheckedKeys(info.halfCheckedKeys as number[]);
  };

  const convertToTreeData = (nodes: MenuNode[]): any[] => {
    return nodes.map((node) => ({
      title: node.name,
      key: node.id,
      children: node.children ? convertToTreeData(node.children) : [],
    }));
  };

  return (
    <div style={{ animation: 'fadeSlideUp 0.45s ease-out' }}>
      {/* Search Area */}
      <div className="page-search">
        <Form form={searchForm} layout="inline">
          <Form.Item label="角色名称" name="name">
            <Input placeholder="请输入角色名称" allowClear style={{ width: 180 }} />
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

      {/* Toolbar */}
      <div className="page-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="page-toolbar-title">角色列表</span>
          {selectedRowKeys.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              已选 <b style={{ color: 'var(--color-primary)' }}>{selectedRowKeys.length}</b> 项
            </span>
          )}
        </div>
        <Space>
          {selectedRowKeys.length > 0 && hasPermission('system:role:delete') && (
            <Popconfirm title={`确定批量删除 ${selectedRowKeys.length} 个角色?`} onConfirm={handleBatchDelete}>
              <Button danger size="small" icon={<DeleteOutlined />}>批量删除</Button>
            </Popconfirm>
          )}
          {hasPermission('system:role:add') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增角色
            </Button>
          )}
          <Button icon={<DownloadOutlined />} onClick={() => exportRoles(searchForm.getFieldsValue())}>
            导出
          </Button>
        </Space>
      </div>

      {/* Table */}
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

      {/* Add/Edit Modal */}
      <Modal
        title={editingId ? '修改角色' : '添加角色'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitLoading}
        width={600}
        destroyOnClose
      >
        <Tabs
          defaultActiveKey="basic"
          items={[
            {
              key: 'basic',
              label: '基本信息',
              children: (
                <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
                  <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
                    <Input placeholder="请输入角色名称" />
                  </Form.Item>
                  <Form.Item name="code" label="角色编码" rules={[{ required: true, message: '请输入角色编码' }]}>
                    <Input placeholder="请输入角色编码" disabled={!!editingId} />
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
                  <Form.Item name="remark" label="备注">
                    <Input.TextArea rows={3} placeholder="请输入备注" />
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'menu',
              label: '菜单权限',
              children: (
                <div style={{ maxHeight: 400, overflow: 'auto', marginTop: 12 }}>
                  <Tree
                    checkable
                    defaultExpandAll
                    checkedKeys={checkedMenuKeys}
                    onCheck={onMenuCheck}
                    treeData={convertToTreeData(menuTree)}
                  />
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default Role;
