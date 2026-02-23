import React, { useState, useEffect } from 'react';
import { Space, Table, Button, Input, Form, Modal, Select, InputNumber, Radio, TreeSelect, Tag, message, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { getMenuList, createMenu, updateMenu, deleteMenu, updateMenuSort } from '../../../api/menu';
import { useAuth } from '../../../store/AuthContext';
import { getIcon, iconOptions } from '../../../utils/iconMap';

interface MenuData {
  id: number;
  parentId: number;
  name: string;
  type: number;
  path: string;
  component: string;
  permission: string;
  icon: string;
  sort: number;
  visible: number;
  status: number;
  isFrame: number;
  isCache: number;
  createTime: string;
  children?: MenuData[];
}

/** Build tree from flat menu list */
function buildTree(list: MenuData[]): MenuData[] {
  const map = new Map<number, MenuData>();
  const roots: MenuData[] = [];

  list.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  map.forEach((item) => {
    const parent = map.get(item.parentId);
    if (parent) {
      parent.children!.push(item);
    } else {
      roots.push(item);
    }
  });

  // Remove empty children arrays for leaf nodes
  const clean = (nodes: MenuData[]) => {
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

/** Convert menu tree to TreeSelect data */
function toTreeSelectData(nodes: MenuData[]): any[] {
  return nodes.map((n) => ({
    title: n.name,
    value: n.id,
    children: n.children ? toTreeSelectData(n.children) : [],
  }));
}

const typeLabels: Record<number, { text: string; color: string }> = {
  1: { text: '目录', color: 'blue' },
  2: { text: '菜单', color: 'green' },
  3: { text: '按钮', color: 'orange' },
};

const MenuPage: React.FC = () => {
  const [data, setData] = useState<MenuData[]>([]);
  const [flatData, setFlatData] = useState<MenuData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [menuType, setMenuType] = useState<number>(1);
  const { hasPermission } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await getMenuList(searchForm.getFieldsValue());
      const list: MenuData[] = res.data || [];
      setFlatData(list);
      setData(buildTree(list));
    } catch (error) {
      console.error('加载菜单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /** 获取同级菜单列表（排序用） */
  const getSiblings = (record: MenuData): MenuData[] => {
    const findSiblings = (nodes: MenuData[], parentId: number): MenuData[] => {
      if (parentId === 0) return nodes;
      for (const node of nodes) {
        if (node.id === parentId) return node.children || [];
        if (node.children) {
          const found = findSiblings(node.children, parentId);
          if (found.length > 0) return found;
        }
      }
      return [];
    };
    return findSiblings(data, record.parentId);
  };

  const handleMoveUp = async (record: MenuData) => {
    const siblings = getSiblings(record);
    const index = siblings.findIndex((s) => s.id === record.id);
    if (index <= 0) return;
    const sortList = siblings.map((s, i) => ({ id: s.id, sort: i }));
    // Swap current with previous
    const temp = sortList[index].sort;
    sortList[index].sort = sortList[index - 1].sort;
    sortList[index - 1].sort = temp;
    try {
      await updateMenuSort(sortList);
      message.success('排序已更新');
      loadData();
    } catch { /* handled */ }
  };

  const handleMoveDown = async (record: MenuData) => {
    const siblings = getSiblings(record);
    const index = siblings.findIndex((s) => s.id === record.id);
    if (index < 0 || index >= siblings.length - 1) return;
    const sortList = siblings.map((s, i) => ({ id: s.id, sort: i }));
    // Swap current with next
    const temp = sortList[index].sort;
    sortList[index].sort = sortList[index + 1].sort;
    sortList[index + 1].sort = temp;
    try {
      await updateMenuSort(sortList);
      message.success('排序已更新');
      loadData();
    } catch { /* handled */ }
  };

  const columns: ColumnsType<MenuData> = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 60,
      align: 'center',
      render: (icon: string) => (icon ? getIcon(icon) : '-'),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      align: 'center',
      render: (type: number) => {
        const info = typeLabels[type];
        return info ? <Tag color={info.color}>{info.text}</Tag> : '-';
      },
    },
    {
      title: '权限标识',
      dataIndex: 'permission',
      key: 'permission',
      width: 180,
      render: (text: string) => text ? <code style={{ fontSize: 12 }}>{text}</code> : '-',
    },
    {
      title: '路由路径',
      dataIndex: 'path',
      key: 'path',
      width: 180,
      render: (text: string) => text || '-',
    },
    {
      title: '组件路径',
      dataIndex: 'component',
      key: 'component',
      width: 180,
      render: (text: string) => text || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 70,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>{status === 1 ? '正常' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          {hasPermission('system:menu:edit') && (
            <>
              <Button type="link" size="small" icon={<ArrowUpOutlined />} onClick={() => handleMoveUp(record)} title="上移" />
              <Button type="link" size="small" icon={<ArrowDownOutlined />} onClick={() => handleMoveDown(record)} title="下移" />
            </>
          )}
          {hasPermission('system:menu:add') && record.type !== 3 && (
            <Button type="link" size="small" onClick={() => handleAddChild(record.id)}>
              新增
            </Button>
          )}
          {hasPermission('system:menu:edit') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              修改
            </Button>
          )}
          {hasPermission('system:menu:delete') && (
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
    form.setFieldsValue({ parentId, type: 1, sort: 0, visible: 1, status: 1, isFrame: 0, isCache: 1 });
    setMenuType(1);
    setIsModalOpen(true);
  };

  const handleEdit = (record: MenuData) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setMenuType(record.type);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMenu(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      // Error message already shown by response interceptor
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ parentId: 0, type: 1, sort: 0, visible: 1, status: 1, isFrame: 0, isCache: 1 });
    setMenuType(1);
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      try {
        if (editingId) {
          await updateMenu({ id: editingId, ...values });
          message.success('修改成功');
        } else {
          await createMenu(values);
          message.success('新增成功');
        }
        setIsModalOpen(false);
        loadData();
      } finally {
        setSubmitLoading(false);
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const handleReset = () => {
    searchForm.resetFields();
    loadData();
  };

  const handleTypeChange = (type: number) => {
    setMenuType(type);
    // Clear irrelevant fields when switching types
    if (type === 3) {
      form.setFieldsValue({ path: undefined, component: undefined, icon: undefined, isFrame: 0, isCache: 1 });
    } else if (type === 1) {
      form.setFieldsValue({ component: undefined, permission: undefined });
    }
  };

  // TreeSelect data: add a root option
  const treeSelectData = [
    { title: '根目录', value: 0, children: toTreeSelectData(buildTree(flatData.filter((m) => m.type !== 3))) },
  ];

  return (
    <div style={{ animation: 'fadeSlideUp 0.45s ease-out' }}>
      {/* Search Area */}
      <div className="page-search">
        <Form form={searchForm} layout="inline">
          <Form.Item label="菜单名称" name="name">
            <Input placeholder="请输入菜单名称" allowClear style={{ width: 180 }} />
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
        <span className="page-toolbar-title">菜单列表</span>
        {hasPermission('system:menu:add') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增菜单
          </Button>
        )}
      </div>

      {/* Table */}
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

      {/* Add/Edit Modal */}
      <Modal
        title={editingId ? '修改菜单' : '添加菜单'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitLoading}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="parentId" label="上级菜单" rules={[{ required: true, message: '请选择上级菜单' }]}>
            <TreeSelect
              treeData={treeSelectData}
              placeholder="请选择上级菜单"
              treeDefaultExpandAll
              allowClear
            />
          </Form.Item>

          <Form.Item name="type" label="菜单类型" rules={[{ required: true }]}>
            <Radio.Group onChange={(e) => handleTypeChange(e.target.value)}>
              <Radio.Button value={1}>目录</Radio.Button>
              <Radio.Button value={2}>菜单</Radio.Button>
              <Radio.Button value={3}>按钮</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="name" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
            <Input placeholder="请输入菜单名称" />
          </Form.Item>

          {menuType !== 3 && (
            <Form.Item name="icon" label="图标">
              <Select
                placeholder="请选择图标"
                allowClear
                showSearch
                optionFilterProp="label"
              >
                {iconOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value} label={opt.label}>
                    <Space>
                      {opt.icon}
                      <span>{opt.label}</span>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {menuType !== 3 && (
            <Form.Item name="path" label="路由路径" rules={[{ required: menuType !== 3, message: '请输入路由路径' }]}>
              <Input placeholder="如 /system/user" />
            </Form.Item>
          )}

          {menuType === 2 && (
            <Form.Item name="component" label="组件路径">
              <Input placeholder="如 system/user/index" />
            </Form.Item>
          )}

          {(menuType === 2 || menuType === 3) && (
            <Form.Item name="permission" label="权限标识">
              <Input placeholder="如 system:user:list" />
            </Form.Item>
          )}

          <Form.Item name="sort" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          {menuType !== 3 && (
            <Form.Item name="visible" label="是否显示" initialValue={1}>
              <Radio.Group>
                <Radio value={1}>显示</Radio>
                <Radio value={0}>隐藏</Radio>
              </Radio.Group>
            </Form.Item>
          )}

          <Form.Item name="status" label="状态" initialValue={1}>
            <Radio.Group>
              <Radio value={1}>正常</Radio>
              <Radio value={0}>禁用</Radio>
            </Radio.Group>
          </Form.Item>

          {menuType === 2 && (
            <>
              <Form.Item name="isFrame" label="是否外链" initialValue={0}>
                <Radio.Group>
                  <Radio value={0}>否</Radio>
                  <Radio value={1}>是</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="isCache" label="是否缓存" initialValue={1}>
                <Radio.Group>
                  <Radio value={1}>是</Radio>
                  <Radio value={0}>否</Radio>
                </Radio.Group>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default MenuPage;
