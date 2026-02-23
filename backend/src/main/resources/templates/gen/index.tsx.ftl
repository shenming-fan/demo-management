import React, { useState, useEffect } from 'react';
import { Space, Table, Button, Input, Form, Modal, Select, message, Popconfirm } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { get${className}Page, create${className}, update${className}, delete${className} } from '../../../api/${businessName}';

interface DataType {
<#list listColumns as col>
  ${col.javaField}: ${col.tsType};
</#list>
}

const ${className}Page: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const loadData = async (params?: any) => {
    setLoading(true);
    try {
      const res: any = await get${className}Page({
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
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: ColumnsType<DataType> = [
<#list listColumns as col>
    {
      title: '${col.columnComment}',
      dataIndex: '${col.javaField}',
      key: '${col.javaField}',
    },
</#list>
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            修改
          </Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.<#if pkColumn??>${pkColumn.javaField}<#else>id</#if>)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: DataType) => {
    setEditingId(record.<#if pkColumn??>${pkColumn.javaField}<#else>id</#if>);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await delete${className}(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await update${className}({ <#if pkColumn??>${pkColumn.javaField}<#else>id</#if>: editingId, ...values });
        message.success('修改成功');
      } else {
        await create${className}(values);
        message.success('新增成功');
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
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
      {/* 搜索区域 */}
<#if (queryColumns?size > 0)>
      <div className="page-search">
        <Form form={searchForm} layout="inline">
  <#list queryColumns as col>
          <Form.Item label="${col.columnComment}" name="${col.javaField}">
    <#if col.htmlType == 'select'>
            <Select placeholder="请选择" style={{ width: 150 }} allowClear />
    <#else>
            <Input placeholder="请输入${col.columnComment}" allowClear style={{ width: 180 }} />
    </#if>
          </Form.Item>
  </#list>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
</#if>

      {/* 工具栏 */}
      <div className="page-toolbar">
        <span className="page-toolbar-title">${functionName}列表</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增${functionName}
        </Button>
      </div>

      {/* 表格 */}
      <div className="page-table-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="<#if pkColumn??>${pkColumn.javaField}<#else>id</#if>"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </div>

      {/* 新增/修改弹窗 */}
      <Modal
        title={editingId ? '修改${functionName}' : '新增${functionName}'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
<#list editColumns as col>
          <Form.Item
            name="${col.javaField}"
            label="${col.columnComment}"
  <#if col.isRequired == 1>
            rules={[{ required: true, message: '请输入${col.columnComment}' }]}
  </#if>
          >
  <#if col.htmlType == 'textarea'>
            <Input.TextArea rows={3} placeholder="请输入${col.columnComment}" />
  <#elseif col.htmlType == 'select'>
            <Select placeholder="请选择${col.columnComment}" />
  <#elseif col.htmlType == 'radio'>
            <Select placeholder="请选择${col.columnComment}" />
  <#elseif col.htmlType == 'datetime'>
            <Input placeholder="请输入${col.columnComment}" />
  <#else>
            <Input placeholder="请输入${col.columnComment}" />
  </#if>
          </Form.Item>
</#list>
        </Form>
      </Modal>
    </div>
  );
};

export default ${className}Page;
