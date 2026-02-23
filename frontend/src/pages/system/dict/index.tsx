import React, { useState, useEffect } from 'react';
import {
  Space, Table, Button, Input, Form, Modal, Select, InputNumber,
  message, Popconfirm, Tag,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  EditOutlined, DeleteOutlined, BookOutlined, DownloadOutlined,
} from '@ant-design/icons';
import {
  getDictTypePage, createDictType, updateDictType, deleteDictType, batchDeleteDictTypes, exportDictTypes,
  getDictDataPage, createDictData, updateDictData, deleteDictData,
} from '../../../api/dict';
import { useAuth } from '../../../store/AuthContext';

// ========= 类型定义 =========
interface DictTypeData {
  id: number;
  name: string;
  type: string;
  status: number;
  remark: string;
  createTime: string;
}

interface DictDataItem {
  id: number;
  dictType: string;
  label: string;
  value: string;
  sort: number;
  status: number;
  remark: string;
  createTime: string;
}

const DictPage: React.FC = () => {
  const { hasPermission } = useAuth();

  // ========= 字典类型状态 =========
  const [typeData, setTypeData] = useState<DictTypeData[]>([]);
  const [typeLoading, setTypeLoading] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeForm] = Form.useForm();
  const [typeSearchForm] = Form.useForm();
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [typePagination, setTypePagination] = useState<TablePaginationConfig>({
    current: 1, pageSize: 10, total: 0,
  });
  const [selectedTypeKeys, setSelectedTypeKeys] = useState<React.Key[]>([]);

  // ========= 字典数据状态 =========
  const [selectedType, setSelectedType] = useState<DictTypeData | null>(null);
  const [dataList, setDataList] = useState<DictDataItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [dataForm] = Form.useForm();
  const [editingDataId, setEditingDataId] = useState<number | null>(null);
  const [typeSubmitLoading, setTypeSubmitLoading] = useState(false);
  const [dataSubmitLoading, setDataSubmitLoading] = useState(false);
  const [dataPagination, setDataPagination] = useState<TablePaginationConfig>({
    current: 1, pageSize: 10, total: 0,
  });

  // ========= 字典类型操作 =========
  const loadTypes = async (params?: any) => {
    setTypeLoading(true);
    try {
      const res: any = await getDictTypePage({
        current: params?.current || typePagination.current,
        size: params?.pageSize || typePagination.pageSize,
        ...typeSearchForm.getFieldsValue(),
      });
      setTypeData(res.data.records);
      setTypePagination({
        ...typePagination,
        current: res.data.current,
        pageSize: res.data.size,
        total: res.data.total,
      });
      setSelectedTypeKeys([]);
    } catch (error) {
      console.error('加载字典类型失败:', error);
    } finally {
      setTypeLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const typeColumns: ColumnsType<DictTypeData> = [
    { title: '字典名称', dataIndex: 'name', key: 'name', width: 140 },
    {
      title: '字典类型',
      dataIndex: 'type',
      key: 'type',
      width: 160,
      render: (text: string, record: DictTypeData) => (
        <a onClick={() => handleSelectType(record)} style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {text}
        </a>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80, align: 'center',
      render: (s: number) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '正常' : '禁用'}</Tag>,
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作', key: 'action', width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<BookOutlined />}
            onClick={() => handleSelectType(record)}>
            数据
          </Button>
          {hasPermission('system:dict:edit') && (
            <Button type="link" size="small" icon={<EditOutlined />}
              onClick={() => handleEditType(record)}>
              修改
            </Button>
          )}
          {hasPermission('system:dict:delete') && (
            <Popconfirm title="删除类型会同时删除其下所有字典数据，确定？"
              onConfirm={() => handleDeleteType(record.id)}>
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleSelectType = (record: DictTypeData) => {
    setSelectedType(record);
    setDataPagination({ ...dataPagination, current: 1 });
    loadDataList(record.type, { current: 1 });
  };

  const handleAddType = () => {
    setEditingTypeId(null);
    typeForm.resetFields();
    typeForm.setFieldsValue({ status: 1 });
    setTypeModalOpen(true);
  };

  const handleEditType = (record: DictTypeData) => {
    setEditingTypeId(record.id);
    typeForm.setFieldsValue(record);
    setTypeModalOpen(true);
  };

  const handleDeleteType = async (id: number) => {
    try {
      await deleteDictType(id);
      message.success('删除成功');
      if (selectedType?.id === id) {
        setSelectedType(null);
        setDataList([]);
      }
      loadTypes();
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleBatchDeleteTypes = async () => {
    try {
      await batchDeleteDictTypes(selectedTypeKeys as number[]);
      message.success(`成功删除 ${selectedTypeKeys.length} 个字典类型`);
      setSelectedType(null);
      setDataList([]);
      loadTypes();
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleTypeOk = async () => {
    try {
      const values = await typeForm.validateFields();
      setTypeSubmitLoading(true);
      if (editingTypeId) {
        await updateDictType({ id: editingTypeId, ...values });
        message.success('修改成功');
      } else {
        await createDictType(values);
        message.success('新增成功');
      }
      setTypeModalOpen(false);
      loadTypes();
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setTypeSubmitLoading(false);
    }
  };

  const handleTypeSearch = () => {
    setTypePagination({ ...typePagination, current: 1 });
    loadTypes({ current: 1 });
  };

  const handleTypeReset = () => {
    typeSearchForm.resetFields();
    setTypePagination({ ...typePagination, current: 1 });
    loadTypes({ current: 1 });
  };

  const handleTypeTableChange = (pag: TablePaginationConfig) => {
    loadTypes({ current: pag.current, pageSize: pag.pageSize });
  };

  // ========= 字典数据操作 =========
  const loadDataList = async (dictType: string, params?: any) => {
    setDataLoading(true);
    try {
      const res: any = await getDictDataPage({
        current: params?.current || dataPagination.current,
        size: params?.pageSize || dataPagination.pageSize,
        dictType,
      });
      setDataList(res.data.records);
      setDataPagination({
        ...dataPagination,
        current: res.data.current,
        pageSize: res.data.size,
        total: res.data.total,
      });
    } catch (error) {
      console.error('加载字典数据失败:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const dataColumns: ColumnsType<DictDataItem> = [
    { title: '字典标签', dataIndex: 'label', key: 'label', width: 140 },
    {
      title: '字典值', dataIndex: 'value', key: 'value', width: 120,
      render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code>,
    },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 70, align: 'center' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80, align: 'center',
      render: (s: number) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '正常' : '禁用'}</Tag>,
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: '操作', key: 'action', width: 140,
      render: (_, record) => (
        <Space size="small">
          {hasPermission('system:dict:edit') && (
            <Button type="link" size="small" icon={<EditOutlined />}
              onClick={() => handleEditData(record)}>
              修改
            </Button>
          )}
          {hasPermission('system:dict:delete') && (
            <Popconfirm title="确定删除吗？" onConfirm={() => handleDeleteData(record.id)}>
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleAddData = () => {
    if (!selectedType) return;
    setEditingDataId(null);
    dataForm.resetFields();
    dataForm.setFieldsValue({ dictType: selectedType.type, sort: 0, status: 1 });
    setDataModalOpen(true);
  };

  const handleEditData = (record: DictDataItem) => {
    setEditingDataId(record.id);
    dataForm.setFieldsValue(record);
    setDataModalOpen(true);
  };

  const handleDeleteData = async (id: number) => {
    try {
      await deleteDictData(id);
      message.success('删除成功');
      if (selectedType) loadDataList(selectedType.type);
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleDataOk = async () => {
    try {
      const values = await dataForm.validateFields();
      setDataSubmitLoading(true);
      if (editingDataId) {
        await updateDictData({ id: editingDataId, ...values });
        message.success('修改成功');
      } else {
        await createDictData(values);
        message.success('新增成功');
      }
      setDataModalOpen(false);
      if (selectedType) loadDataList(selectedType.type);
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setDataSubmitLoading(false);
    }
  };

  const handleDataTableChange = (pag: TablePaginationConfig) => {
    if (selectedType) {
      loadDataList(selectedType.type, { current: pag.current, pageSize: pag.pageSize });
    }
  };

  return (
    <div style={{ animation: 'fadeSlideUp 0.45s ease-out' }}>
      {/* 搜索区域 */}
      <div className="page-search">
        <Form form={typeSearchForm} layout="inline">
          <Form.Item label="字典名称" name="name">
            <Input placeholder="请输入字典名称" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="字典类型" name="type">
            <Input placeholder="请输入字典类型" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select placeholder="请选择" style={{ width: 100 }} allowClear>
              <Select.Option value={1}>正常</Select.Option>
              <Select.Option value={0}>禁用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleTypeSearch}>搜索</Button>
              <Button icon={<ReloadOutlined />} onClick={handleTypeReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      {/* 字典类型 */}
      <div className="page-toolbar">
        <Space>
          <span className="page-toolbar-title">字典类型</span>
          {selectedTypeKeys.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              已选 <b>{selectedTypeKeys.length}</b> 项
            </span>
          )}
        </Space>
        <Space>
          {hasPermission('system:dict:delete') && selectedTypeKeys.length > 0 && (
            <Popconfirm title={`确定删除选中的 ${selectedTypeKeys.length} 个字典类型吗？关联数据将同时删除！`} onConfirm={handleBatchDeleteTypes}>
              <Button danger icon={<DeleteOutlined />}>批量删除</Button>
            </Popconfirm>
          )}
          {hasPermission('system:dict:add') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddType}>
              新增类型
            </Button>
          )}
          <Button icon={<DownloadOutlined />} onClick={() => exportDictTypes(typeSearchForm.getFieldsValue())}>导出</Button>
        </Space>
      </div>
      <div className="page-table-card">
        <Table
          columns={typeColumns}
          dataSource={typeData}
          rowKey="id"
          loading={typeLoading}
          pagination={typePagination}
          onChange={handleTypeTableChange}
          rowSelection={{
            selectedRowKeys: selectedTypeKeys,
            onChange: (keys) => setSelectedTypeKeys(keys),
          }}
          onRow={(record) => ({
            onClick: () => handleSelectType(record),
            style: { cursor: 'pointer', background: selectedType?.id === record.id ? 'var(--color-primary-light)' : undefined },
          })}
        />
      </div>

      {/* 字典数据 */}
      {selectedType && (
        <>
          <div className="page-toolbar" style={{ marginTop: 20 }}>
            <span className="page-toolbar-title">
              字典数据 — {selectedType.name}
              <Tag color="blue" style={{ marginLeft: 8 }}>{selectedType.type}</Tag>
            </span>
            {hasPermission('system:dict:add') && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddData}>
                新增数据
              </Button>
            )}
          </div>
          <div className="page-table-card">
            <Table
              columns={dataColumns}
              dataSource={dataList}
              rowKey="id"
              loading={dataLoading}
              pagination={dataPagination}
              onChange={handleDataTableChange}
            />
          </div>
        </>
      )}

      {/* 字典类型弹窗 */}
      <Modal
        title={editingTypeId ? '修改字典类型' : '新增字典类型'}
        open={typeModalOpen}
        onOk={handleTypeOk}
        onCancel={() => setTypeModalOpen(false)}
        confirmLoading={typeSubmitLoading}
        width={500}
        destroyOnClose
      >
        <Form form={typeForm} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="name" label="字典名称" rules={[{ required: true, message: '请输入字典名称' }]}>
            <Input placeholder="如：用户性别" />
          </Form.Item>
          <Form.Item name="type" label="字典类型" rules={[{ required: true, message: '请输入字典类型' }]}>
            <Input placeholder="如：sys_user_gender" disabled={!!editingTypeId} />
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
      </Modal>

      {/* 字典数据弹窗 */}
      <Modal
        title={editingDataId ? '修改字典数据' : '新增字典数据'}
        open={dataModalOpen}
        onOk={handleDataOk}
        onCancel={() => setDataModalOpen(false)}
        confirmLoading={dataSubmitLoading}
        width={500}
        destroyOnClose
      >
        <Form form={dataForm} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="dictType" label="字典类型" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="label" label="字典标签" rules={[{ required: true, message: '请输入字典标签' }]}>
            <Input placeholder="如：男" />
          </Form.Item>
          <Form.Item name="value" label="字典值" rules={[{ required: true, message: '请输入字典值' }]}>
            <Input placeholder="如：1" />
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
      </Modal>
    </div>
  );
};

export default DictPage;
