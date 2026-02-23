import React, { useState, useEffect } from 'react';
import { Space, Table, Button, Input, Form, Modal, Select, message, Popconfirm, Switch, Avatar, Tag, TreeSelect, Upload } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import { getUserPage, createUser, updateUser, deleteUser, updateUserStatus, resetPassword, getUserRoles, getUserPosts, exportUsers, batchDeleteUsers, batchUpdateUserStatus, downloadImportTemplate, importUsers } from '../../../api/user';
import { getRoleList } from '../../../api/role';
import { getPostAll } from '../../../api/post';
import { getDeptTree } from '../../../api/dept';
import { useAuth } from '../../../store/AuthContext';
import ColumnSettings from '../../../components/ColumnSettings';
import PasswordStrength from '../../../components/PasswordStrength';

interface DataType {
  id: number;
  username: string;
  nickname: string;
  phone: string;
  email: string;
  avatar: string;
  gender: number;
  status: number;
  deptId: number;
  deptName: string;
  roleNames: string;
  postNames: string;
  createTime: string;
}

interface RoleType {
  id: number;
  name: string;
  code: string;
}

interface PostType {
  id: number;
  postCode: string;
  postName: string;
}

interface DeptType {
  id: number;
  name: string;
  children?: DeptType[];
}

const buildTreeData = (list: DeptType[]): any[] =>
  list.map((d) => ({
    title: d.name,
    value: d.id,
    children: d.children ? buildTreeData(d.children) : [],
  }));

const User: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [deptTree, setDeptTree] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [hiddenColKeys, setHiddenColKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('col_settings_user');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const { hasPermission } = useAuth();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadData = async (params?: any) => {
    setLoading(true);
    try {
      const res: any = await getUserPage({
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
      console.error('加载用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const res: any = await getRoleList();
      setRoles(res.data || []);
    } catch (error) {
      console.error('加载角色列表失败:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const res: any = await getPostAll();
      setPosts(res.data || []);
    } catch (error) {
      console.error('加载岗位列表失败:', error);
    }
  };

  const loadDeptTree = async () => {
    try {
      const res: any = await getDeptTree();
      setDeptTree(buildTreeData(res.data || []));
    } catch (error) {
      console.error('加载部门树失败:', error);
    }
  };

  useEffect(() => {
    loadData();
    loadRoles();
    loadPosts();
    loadDeptTree();
  }, []);

  const columns: ColumnsType<DataType> = [
    {
      title: '用户', key: 'user', width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={36}
            src={record.avatar ? `/api/static/${record.avatar}` : undefined}
            icon={!record.avatar ? <UserOutlined /> : undefined}
            style={{ background: record.avatar ? undefined : 'var(--color-primary)', flexShrink: 0 }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.nickname || record.username}</div>
            <div style={{ fontSize: 12, opacity: 0.55 }}>{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: '部门', dataIndex: 'deptName', key: 'deptName', width: 120,
      render: (text: string) => text || <span style={{ opacity: 0.35 }}>-</span>,
    },
    {
      title: '角色', dataIndex: 'roleNames', key: 'roleNames', width: 140, ellipsis: true,
      render: (text: string) => text ? (
        <span>{text.split(',').map((r, i) => <Tag key={i} style={{ marginBottom: 2 }}>{r}</Tag>)}</span>
      ) : '-',
    },
    {
      title: '岗位', dataIndex: 'postNames', key: 'postNames', width: 140, ellipsis: true,
      render: (text: string) => text ? (
        <span>{text.split(',').map((p, i) => <Tag key={i} color="orange" style={{ marginBottom: 2 }}>{p}</Tag>)}</span>
      ) : <span style={{ opacity: 0.35 }}>-</span>,
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
    {
      title: '状态', key: 'status', dataIndex: 'status', width: 100,
      render: (_, record) => (
        <Switch
          checked={record.status === 1}
          onChange={(checked) => handleStatusChange(record.id, checked ? 1 : 0)}
          disabled={!hasPermission('system:user:edit')}
          checkedChildren="正常"
          unCheckedChildren="禁用"
        />
      ),
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作', key: 'action', width: 220,
      render: (_, record) => (
        <Space size="small">
          {hasPermission('system:user:edit') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              修改
            </Button>
          )}
          {hasPermission('system:user:resetPwd') && (
            <Popconfirm title="确定重置密码为123456?" onConfirm={() => handleResetPassword(record.id)}>
              <Button type="link" size="small">重置密码</Button>
            </Popconfirm>
          )}
          {hasPermission('system:user:delete') && (
            <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleStatusChange = async (id: number, status: number) => {
    try {
      await updateUserStatus(id, status);
      message.success('状态修改成功');
      loadData();
    } catch (error) {
      console.error('修改状态失败:', error);
    }
  };

  const handleResetPassword = async (id: number) => {
    try {
      await resetPassword(id, '123456');
      message.success('密码已重置为 123456');
    } catch (error) {
      console.error('重置密码失败:', error);
    }
  };

  const handleEdit = async (record: DataType) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    try {
      const [rolesRes, postsRes]: any[] = await Promise.all([
        getUserRoles(record.id),
        getUserPosts(record.id),
      ]);
      form.setFieldsValue({
        roleIds: rolesRes.data || [],
        postIds: postsRes.data || [],
      });
    } catch (error) {
      console.error('加载用户角色/岗位失败:', error);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleBatchDelete = async () => {
    try {
      await batchDeleteUsers(selectedRowKeys as number[]);
      message.success(`成功删除 ${selectedRowKeys.length} 个用户`);
      loadData();
    } catch (error) {
      console.error('批量删除失败:', error);
    }
  };

  const handleBatchStatus = async (status: number) => {
    try {
      await batchUpdateUserStatus(selectedRowKeys as number[], status);
      message.success(`成功${status === 1 ? '启用' : '禁用'} ${selectedRowKeys.length} 个用户`);
      loadData();
    } catch (error) {
      console.error('批量修改状态失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setNewPassword('');
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      try {
        const { roleIds, postIds, ...userData } = values;
        if (editingId) {
          await updateUser({ id: editingId, ...userData }, roleIds, postIds);
          message.success('修改成功');
        } else {
          await createUser(userData, roleIds, postIds);
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

  const handleImport = async (file: File) => {
    try {
      const res: any = await importUsers(file);
      message.success(res.data || '导入完成');
      setImportModalOpen(false);
      loadData();
    } catch (error) {
      console.error('导入失败:', error);
    }
    return false;
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
      {/* Search Area */}
      <div className="page-search">
        <Form form={searchForm} layout="inline">
          <Form.Item label="用户名" name="username">
            <Input placeholder="请输入用户名" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input placeholder="请输入手机号" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select placeholder="请选择" style={{ width: 100 }} allowClear>
              <Select.Option value={1}>正常</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="角色" name="roleId">
            <Select
              placeholder="请选择角色"
              style={{ width: 150 }}
              allowClear
              optionFilterProp="label"
              options={roles.map((r) => ({ label: r.name, value: r.id }))}
            />
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
          <span className="page-toolbar-title">用户列表</span>
          {selectedRowKeys.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              已选 <b style={{ color: 'var(--color-primary)' }}>{selectedRowKeys.length}</b> 项
            </span>
          )}
        </div>
        <Space>
          {selectedRowKeys.length > 0 && (
            <>
              {hasPermission('system:user:edit') && (
                <Popconfirm title={`确定批量启用 ${selectedRowKeys.length} 个用户?`} onConfirm={() => handleBatchStatus(1)}>
                  <Button size="small">批量启用</Button>
                </Popconfirm>
              )}
              {hasPermission('system:user:edit') && (
                <Popconfirm title={`确定批量禁用 ${selectedRowKeys.length} 个用户?`} onConfirm={() => handleBatchStatus(0)}>
                  <Button size="small">批量禁用</Button>
                </Popconfirm>
              )}
              {hasPermission('system:user:delete') && (
                <Popconfirm title={`确定批量删除 ${selectedRowKeys.length} 个用户?`} onConfirm={handleBatchDelete}>
                  <Button danger size="small" icon={<DeleteOutlined />}>批量删除</Button>
                </Popconfirm>
              )}
            </>
          )}
          {hasPermission('system:user:list') && (
            <Button icon={<DownloadOutlined />} onClick={() => exportUsers(searchForm.getFieldsValue())}>
              导出
            </Button>
          )}
          {hasPermission('system:user:add') && (
            <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>
              导入
            </Button>
          )}
          {hasPermission('system:user:add') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增用户
            </Button>
          )}
          <ColumnSettings columns={columns} storageKey="user" onChange={(_visible, hidden) => setHiddenColKeys(hidden)} />
        </Space>
      </div>

      {/* Table */}
      <div className="page-table-card">
        <Table
          columns={hiddenColKeys.length > 0 ? columns.filter((c: any) => !hiddenColKeys.includes(c.key || c.dataIndex)) : columns}
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
        title={editingId ? '修改用户' : '添加用户'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitLoading}
        width={540}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input disabled={!!editingId} />
          </Form.Item>
          {!editingId && (
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
              <Input.Password onChange={(e) => setNewPassword(e.target.value)} />
              <PasswordStrength password={newPassword} />
            </Form.Item>
          )}
          <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="phone" label="手机号">
              <Input />
            </Form.Item>
            <Form.Item name="email" label="邮箱">
              <Input />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="gender" label="性别" initialValue={0}>
              <Select>
                <Select.Option value={0}>未知</Select.Option>
                <Select.Option value={1}>男</Select.Option>
                <Select.Option value={2}>女</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="deptId" label="部门">
              <TreeSelect
                treeData={deptTree}
                placeholder="请选择部门"
                allowClear
                treeDefaultExpandAll
              />
            </Form.Item>
          </div>
          <Form.Item name="roleIds" label="角色" rules={[{ required: true, message: '请至少选择一个角色' }]}>
            <Select
              mode="multiple"
              placeholder="请选择角色"
              allowClear
              optionFilterProp="label"
              options={roles.map((r) => ({ label: r.name, value: r.id }))}
            />
          </Form.Item>
          <Form.Item name="postIds" label="岗位">
            <Select
              mode="multiple"
              placeholder="请选择岗位"
              allowClear
              optionFilterProp="label"
              options={posts.map((p) => ({ label: p.postName, value: p.id }))}
            />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Select.Option value={1}>正常</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Import Modal */}
      <Modal
        title="导入用户"
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        footer={null}
        width={460}
      >
        <div style={{ padding: '16px 0' }}>
          <p style={{ marginBottom: 16, color: 'var(--color-text-secondary)', fontSize: 13 }}>
            请先下载模板，按格式填写后上传 Excel 文件。
          </p>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => downloadImportTemplate()}
            style={{ padding: 0, marginBottom: 16 }}
          >
            下载导入模板
          </Button>
          <Upload.Dragger
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={(file) => {
              handleImport(file);
              return false;
            }}
          >
            <p style={{ fontSize: 32, color: 'var(--color-primary)', marginBottom: 8 }}>
              <UploadOutlined />
            </p>
            <p style={{ fontSize: 14 }}>点击或拖拽文件到此处上传</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>支持 .xlsx, .xls 格式</p>
          </Upload.Dragger>
        </div>
      </Modal>
    </div>
  );
};

export default User;
