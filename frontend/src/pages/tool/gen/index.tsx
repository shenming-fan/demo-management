import React, { useState, useEffect } from 'react';
import {
  Space, Table, Button, Input, Form, Modal, Select, message, Popconfirm,
  Tabs, Checkbox, Drawer,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined,
  DownloadOutlined, DeleteOutlined, SettingOutlined,
} from '@ant-design/icons';
import {
  getGenTablePage, getDbTableList, importTables, getGenTableById,
  updateGenTable, deleteGenTable, previewCode, downloadCode,
} from '../../../api/gen';

interface GenTableData {
  id: number;
  tableName: string;
  tableComment: string;
  className: string;
  packageName: string;
  moduleName: string;
  businessName: string;
  functionName: string;
  author: string;
  createTime: string;
}

interface GenColumnData {
  id: number;
  tableId: number;
  columnName: string;
  columnComment: string;
  columnType: string;
  javaType: string;
  javaField: string;
  tsType: string;
  isPk: number;
  isRequired: number;
  isList: number;
  isQuery: number;
  queryType: string;
  isEdit: number;
  htmlType: string;
  dictType: string;
  sort: number;
}

interface DbTable {
  tableName: string;
  tableComment: string;
  createTime: string;
}

const javaTypeOptions = ['String', 'Integer', 'Long', 'Boolean', 'BigDecimal', 'Float', 'Double', 'LocalDateTime', 'LocalDate'];
const htmlTypeOptions = [
  { label: '文本框', value: 'input' },
  { label: '文本域', value: 'textarea' },
  { label: '下拉框', value: 'select' },
  { label: '单选框', value: 'radio' },
  { label: '日期控件', value: 'datetime' },
];
const queryTypeOptions = ['EQ', 'LIKE', 'BETWEEN', 'GT', 'LT', 'GE', 'LE'];

const Gen: React.FC = () => {
  const [data, setData] = useState<GenTableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchForm] = Form.useForm();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1, pageSize: 10, total: 0,
  });

  // 导入弹窗
  const [importVisible, setImportVisible] = useState(false);
  const [dbTables, setDbTables] = useState<DbTable[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [selectedTableNames, setSelectedTableNames] = useState<string[]>([]);
  const [dbSearchName, setDbSearchName] = useState('');

  // 预览弹窗
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  // 配置抽屉
  const [configVisible, setConfigVisible] = useState(false);
  const [configTable, setConfigTable] = useState<GenTableData | null>(null);
  const [configColumns, setConfigColumns] = useState<GenColumnData[]>([]);
  const [configForm] = Form.useForm();

  const loadData = async (params?: any) => {
    setLoading(true);
    try {
      const res: any = await getGenTablePage({
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

  const columns: ColumnsType<GenTableData> = [
    { title: '表名称', dataIndex: 'tableName', key: 'tableName', width: 180 },
    { title: '表描述', dataIndex: 'tableComment', key: 'tableComment', width: 160 },
    {
      title: '实体类',
      dataIndex: 'className',
      key: 'className',
      width: 150,
      render: (text: string) => <code style={{ fontSize: 12 }}>{text}</code>,
    },
    { title: '模块', dataIndex: 'moduleName', key: 'moduleName', width: 100 },
    { title: '业务名', dataIndex: 'businessName', key: 'businessName', width: 100 },
    { title: '功能名称', dataIndex: 'functionName', key: 'functionName', width: 120 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record.id)}>
            预览
          </Button>
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handleConfig(record.id)}>
            配置
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record.id)}>
            生成
          </Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ========= 导入功能 =========
  const handleOpenImport = async () => {
    setImportVisible(true);
    setSelectedTableNames([]);
    setDbSearchName('');
    loadDbTables('');
  };

  const loadDbTables = async (name: string) => {
    setDbLoading(true);
    try {
      const res: any = await getDbTableList({ tableName: name || undefined });
      setDbTables(res.data || []);
    } catch (error) {
      console.error('加载数据库表失败:', error);
    } finally {
      setDbLoading(false);
    }
  };

  const handleImport = async () => {
    if (selectedTableNames.length === 0) {
      message.warning('请选择要导入的表');
      return;
    }
    try {
      await importTables(selectedTableNames);
      message.success(`成功导入 ${selectedTableNames.length} 张表`);
      setImportVisible(false);
      loadData();
    } catch (error) {
      console.error('导入失败:', error);
    }
  };

  // ========= 预览功能 =========
  const handlePreview = async (id: number) => {
    setPreviewVisible(true);
    try {
      const res: any = await previewCode(id);
      setPreviewData(res.data || {});
    } catch (error) {
      console.error('预览失败:', error);
    }
  };

  // ========= 配置功能 =========
  const handleConfig = async (id: number) => {
    setConfigVisible(true);
    try {
      const res: any = await getGenTableById(id);
      const table = res.data;
      setConfigTable(table);
      setConfigColumns(table.columns || []);
      configForm.setFieldsValue({
        className: table.className,
        packageName: table.packageName,
        moduleName: table.moduleName,
        businessName: table.businessName,
        functionName: table.functionName,
        author: table.author,
      });
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const values = await configForm.validateFields();
      await updateGenTable({
        id: configTable?.id,
        ...values,
        columns: configColumns,
      });
      message.success('配置已保存');
      setConfigVisible(false);
      loadData();
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  };

  const updateColumn = (index: number, field: string, value: any) => {
    const newCols = [...configColumns];
    (newCols[index] as any)[field] = value;
    setConfigColumns(newCols);
  };

  // ========= 下载功能 =========
  const handleDownload = async (id: number) => {
    try {
      const res: any = await downloadCode(id);
      const blob = new Blob([res], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-code.zip';
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('代码已下载');
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  // ========= 删除功能 =========
  const handleDelete = async (id: number) => {
    try {
      await deleteGenTable(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
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
    loadData({ current: pag.current, pageSize: pag.pageSize });
  };

  // 数据库表选择列
  const dbTableColumns: ColumnsType<DbTable> = [
    { title: '表名称', dataIndex: 'tableName', key: 'tableName' },
    { title: '表描述', dataIndex: 'tableComment', key: 'tableComment' },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  ];

  // 列配置表格列
  const columnConfigCols: ColumnsType<GenColumnData> = [
    { title: '列名', dataIndex: 'columnName', key: 'columnName', width: 130, fixed: 'left' },
    { title: '描述', dataIndex: 'columnComment', key: 'columnComment', width: 100,
      render: (_, record, idx) => (
        <Input size="small" value={record.columnComment}
          onChange={(e) => updateColumn(idx, 'columnComment', e.target.value)} />
      ),
    },
    { title: '列类型', dataIndex: 'columnType', key: 'columnType', width: 110 },
    { title: 'Java类型', dataIndex: 'javaType', key: 'javaType', width: 130,
      render: (_, record, idx) => (
        <Select size="small" value={record.javaType} style={{ width: '100%' }}
          onChange={(v) => updateColumn(idx, 'javaType', v)}>
          {javaTypeOptions.map((t) => <Select.Option key={t} value={t}>{t}</Select.Option>)}
        </Select>
      ),
    },
    { title: 'Java字段', dataIndex: 'javaField', key: 'javaField', width: 120,
      render: (_, record, idx) => (
        <Input size="small" value={record.javaField}
          onChange={(e) => updateColumn(idx, 'javaField', e.target.value)} />
      ),
    },
    { title: '列表', dataIndex: 'isList', key: 'isList', width: 50, align: 'center',
      render: (_, record, idx) => (
        <Checkbox checked={record.isList === 1}
          onChange={(e) => updateColumn(idx, 'isList', e.target.checked ? 1 : 0)} />
      ),
    },
    { title: '查询', dataIndex: 'isQuery', key: 'isQuery', width: 50, align: 'center',
      render: (_, record, idx) => (
        <Checkbox checked={record.isQuery === 1}
          onChange={(e) => updateColumn(idx, 'isQuery', e.target.checked ? 1 : 0)} />
      ),
    },
    { title: '查询方式', dataIndex: 'queryType', key: 'queryType', width: 100,
      render: (_, record, idx) => (
        <Select size="small" value={record.queryType} style={{ width: '100%' }}
          onChange={(v) => updateColumn(idx, 'queryType', v)}>
          {queryTypeOptions.map((t) => <Select.Option key={t} value={t}>{t}</Select.Option>)}
        </Select>
      ),
    },
    { title: '编辑', dataIndex: 'isEdit', key: 'isEdit', width: 50, align: 'center',
      render: (_, record, idx) => (
        <Checkbox checked={record.isEdit === 1}
          onChange={(e) => updateColumn(idx, 'isEdit', e.target.checked ? 1 : 0)} />
      ),
    },
    { title: '必填', dataIndex: 'isRequired', key: 'isRequired', width: 50, align: 'center',
      render: (_, record, idx) => (
        <Checkbox checked={record.isRequired === 1}
          onChange={(e) => updateColumn(idx, 'isRequired', e.target.checked ? 1 : 0)} />
      ),
    },
    { title: '表单组件', dataIndex: 'htmlType', key: 'htmlType', width: 110,
      render: (_, record, idx) => (
        <Select size="small" value={record.htmlType} style={{ width: '100%' }}
          onChange={(v) => updateColumn(idx, 'htmlType', v)}>
          {htmlTypeOptions.map((o) => <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>)}
        </Select>
      ),
    },
  ];

  return (
    <div style={{ animation: 'fadeSlideUp 0.45s ease-out' }}>
      {/* 搜索区域 */}
      <div className="page-search">
        <Form form={searchForm} layout="inline">
          <Form.Item label="表名称" name="tableName">
            <Input placeholder="请输入表名称" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      {/* 工具栏 */}
      <div className="page-toolbar">
        <span className="page-toolbar-title">代码生成</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenImport}>
          导入表
        </Button>
      </div>

      {/* 表格 */}
      <div className="page-table-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </div>

      {/* 导入表弹窗 */}
      <Modal
        title="导入数据库表"
        open={importVisible}
        onOk={handleImport}
        onCancel={() => setImportVisible(false)}
        width={700}
        okText={`导入 (${selectedTableNames.length})`}
      >
        <div style={{ marginBottom: 12 }}>
          <Space>
            <Input
              placeholder="搜索表名"
              value={dbSearchName}
              onChange={(e) => setDbSearchName(e.target.value)}
              allowClear
              style={{ width: 240 }}
            />
            <Button type="primary" size="small" icon={<SearchOutlined />}
              onClick={() => loadDbTables(dbSearchName)}>
              搜索
            </Button>
          </Space>
        </div>
        <Table
          columns={dbTableColumns}
          dataSource={dbTables}
          rowKey="tableName"
          loading={dbLoading}
          pagination={false}
          size="small"
          scroll={{ y: 360 }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedTableNames,
            onChange: (keys) => setSelectedTableNames(keys as string[]),
          }}
        />
      </Modal>

      {/* 预览代码弹窗 */}
      <Modal
        title="代码预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={900}
        styles={{ body: { padding: 0 } }}
      >
        <Tabs
          tabPosition="left"
          style={{ minHeight: 480 }}
          items={Object.entries(previewData).map(([fileName, code]) => ({
            key: fileName,
            label: <span style={{ fontSize: 12 }}>{fileName}</span>,
            children: (
              <pre style={{
                background: '#1C1F26',
                color: '#E8E2DA',
                padding: 16,
                borderRadius: 6,
                overflow: 'auto',
                maxHeight: 480,
                fontSize: 12,
                lineHeight: 1.6,
                margin: 0,
              }}>
                <code>{code}</code>
              </pre>
            ),
          }))}
        />
      </Modal>

      {/* 配置抽屉 */}
      <Drawer
        title="生成配置"
        placement="right"
        width={960}
        open={configVisible}
        onClose={() => setConfigVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setConfigVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSaveConfig}>保存配置</Button>
          </Space>
        }
      >
        <Tabs
          defaultActiveKey="basic"
          items={[
            {
              key: 'basic',
              label: '基本信息',
              children: (
                <Form form={configForm} layout="vertical" style={{ maxWidth: 520 }}>
                  <Form.Item name="className" label="实体类名" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="packageName" label="包路径" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="moduleName" label="模块名" rules={[{ required: true }]}>
                    <Input placeholder="如 system" />
                  </Form.Item>
                  <Form.Item name="businessName" label="业务名" rules={[{ required: true }]}>
                    <Input placeholder="如 user" />
                  </Form.Item>
                  <Form.Item name="functionName" label="功能名称" rules={[{ required: true }]}>
                    <Input placeholder="如 用户管理" />
                  </Form.Item>
                  <Form.Item name="author" label="作者">
                    <Input />
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'columns',
              label: '列配置',
              children: (
                <Table
                  columns={columnConfigCols}
                  dataSource={configColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: 1100, y: 500 }}
                />
              ),
            },
          ]}
        />
      </Drawer>
    </div>
  );
};

export default Gen;
